import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';
import { isolateDialog, lockBodyScroll } from './dialog';
import { ensureInScrollContainer, popOverElement } from './motion';

afterEach(() => vi.unstubAllGlobals());

describe('BottomSheet single content tree', () => {
  const render = (enabled: boolean, open: boolean) =>
    renderToStaticMarkup(
      createElement(BottomSheet, {
        enabled,
        open,
        onClose() {},
        title: 'Words',
        id: 'words',
        children: createElement('div', { 'data-word': 'abide' }, 'ABIDE'),
      }),
    );
  it('keeps closed content mounted but hidden and not a competing dialog/keyboard target', () => {
    const html = render(true, false);
    expect(html).toContain('hidden=""');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('aria-modal="true"');
    expect(html.match(/data-word="abide"/g)).toHaveLength(1);
  });
  it('open sheet has a labelled modal, close control, and internal scroll surface', () => {
    const html = render(true, true);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('Close words tray');
    expect(html).toContain('bottom-sheet__scroll');
    expect(html.match(/data-word="abide"/g)).toHaveLength(1);
  });
  it('renders heading actions beside Close, at the same 40px control height', () => {
    const html = renderToStaticMarkup(
      createElement(BottomSheet, {
        enabled: true,
        open: true,
        onClose() {},
        title: 'Words · 2/6',
        actions: createElement(
          'button',
          { className: 'btn btn--secondary lw__clue', type: 'button' },
          'Clue',
        ),
        children: createElement('div', null, 'list'),
      }),
    );
    expect(html).toContain('bottom-sheet__actions');
    expect(html.indexOf('Clue')).toBeLessThan(html.indexOf('Close words tray'));
    expect(html).toContain('Words · 2/6');
  });
  it('desktop is just inline content without a dialog or hidden duplicate list', () => {
    const html = render(false, false);
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('hidden=');
    expect(html).not.toContain('bottom-sheet__scroll');
    expect(html.match(/data-word="abide"/g)).toHaveLength(1);
  });
});

describe('document scroll lock', () => {
  it('restores styles only after the last nested lock releases; release is idempotent', () => {
    const body = { style: { overflow: 'auto' } };
    const html = { style: { overflow: '' } };
    vi.stubGlobal('document', { body, documentElement: html });
    const a = lockBodyScroll();
    const b = lockBodyScroll();
    expect(body.style.overflow).toBe('hidden');
    a();
    a();
    expect(body.style.overflow).toBe('hidden');
    b();
    expect(body.style.overflow).toBe('auto');
    expect(html.style.overflow).toBe('');
  });
  it('isolates outside content and restores pre-existing inert values', () => {
    class FakeElement {
      inert = false;
      parentElement: FakeElement | null = null;
      children: FakeElement[] = [];
      add(...els: FakeElement[]) {
        this.children.push(...els);
        els.forEach((el) => {
          el.parentElement = this;
        });
      }
    }
    vi.stubGlobal('HTMLElement', FakeElement);
    const body = new FakeElement(),
      app = new FakeElement(),
      sheet = new FakeElement();
    const wheel = new FakeElement(),
      alreadyInert = new FakeElement();
    alreadyInert.inert = true;
    app.add(wheel, sheet);
    body.add(app, alreadyInert);
    vi.stubGlobal('document', { body });
    const restore = isolateDialog(sheet as unknown as HTMLElement);
    expect(wheel.inert).toBe(true);
    expect(sheet.inert).toBe(false);
    expect(app.inert).toBe(false);
    restore();
    expect(wheel.inert).toBe(false);
    expect(alreadyInert.inert).toBe(true);
  });
});

describe('sheet-only reveal', () => {
  it('reveals an offscreen row through the internal scroller, never scrollIntoView on ancestors', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      cb();
      return 1;
    });
    const scrollBy = vi.fn();
    const scrollIntoView = vi.fn();
    const el = {
      getBoundingClientRect: () => ({ top: 600, bottom: 620, height: 20 }),
      scrollIntoView,
    };
    const scroller = {
      getBoundingClientRect: () => ({ top: 100, bottom: 400, height: 300 }),
      scrollBy,
    };
    await ensureInScrollContainer(el as unknown as Element, scroller as unknown as HTMLElement);
    expect(scrollBy).toHaveBeenCalledWith({ top: 360, behavior: 'smooth' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('closed-destination feedback', () => {
  it('measures styled content independently, then pops over the wheel without measuring a hidden list', async () => {
    const created: Array<{
      style: Record<string, string>;
      remove: ReturnType<typeof vi.fn>;
      animate: ReturnType<typeof vi.fn>;
    }> = [];
    const createElement = () => {
      const el = {
        style: {},
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        remove: vi.fn(),
        animate: vi.fn(() => ({ finished: Promise.resolve() })),
      };
      created.push(el);
      return el;
    };
    vi.stubGlobal('document', { createElement, body: { appendChild: vi.fn() } });
    const content = { style: {}, getBoundingClientRect: () => ({ width: 60, height: 20 }) };
    const wheel = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 200 }) };
    await popOverElement(wheel as unknown as Element, content as unknown as HTMLElement, {
      className: 'fly-word',
    });
    expect(created).toHaveLength(2); // measure wrapper, then visible overlay
    expect(created[0].remove).toHaveBeenCalledOnce();
    expect(created[1].style).toMatchObject({
      left: '80px',
      top: '110px',
      width: '60px',
      height: '20px',
    });
    expect(content.style).toMatchObject({ transform: 'scale(2.6)', transformOrigin: 'center' });
    expect(created[1].remove).toHaveBeenCalledOnce();
  });
});
