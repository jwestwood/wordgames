import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import postcss from 'postcss';
import { acquireFixedGameViewport } from './fixedViewport';
import { lockBodyScroll } from './dialog';

afterEach(() => vi.unstubAllGlobals());

class Attributes {
  attrs = new Map<string, string>();
  style = { overflow: 'auto' };
  getAttribute(key: string) {
    return this.attrs.get(key) ?? null;
  }
  setAttribute(key: string, value: string) {
    this.attrs.set(key, value);
  }
  removeAttribute(key: string) {
    this.attrs.delete(key);
  }
}
function page(content = 'width=device-width, initial-scale=1.0, viewport-fit=cover') {
  const root = new Attributes();
  const meta = new Attributes();
  meta.setAttribute('content', content);
  const body = { style: { overflow: '' } };
  const doc = { documentElement: root, body, querySelector: () => meta } as unknown as Document;
  return { root, meta, body, doc, content };
}

describe('route-owned fixed viewport lifecycle', () => {
  it('flags the route and opts its keyboard into content resizing, without restricting zoom', () => {
    const { root, meta, doc, content } = page();
    const release = acquireFixedGameViewport(doc);
    expect(root.getAttribute('data-fixed-game')).toBe('');
    expect(meta.getAttribute('content')).toBe(content + ', interactive-widget=resizes-content');
    expect(meta.getAttribute('content')).not.toMatch(/maximum-scale|user-scalable/);
    expect(root.style.overflow).toBe('auto'); // Never writes a competing inline lock.
    release();
    release();
    expect(root.getAttribute('data-fixed-game')).toBeNull();
    expect(meta.getAttribute('content')).toBe(content);
  });
  it('restores original viewport policy and pre-existing attribute exactly on route/desktop cleanup', () => {
    const { root, meta, doc, content } = page(
      'width=device-width, interactive-widget=overlays-content',
    );
    root.setAttribute('data-fixed-game', 'previous-owner');
    const release = acquireFixedGameViewport(doc);
    expect(meta.getAttribute('content')).not.toContain('overlays-content');
    release();
    expect(root.getAttribute('data-fixed-game')).toBe('previous-owner');
    expect(meta.getAttribute('content')).toBe(content);
  });
  it.each(['sheet-first', 'route-first'])(
    'does not restore stale inline overflow when cleanup is %s',
    (order) => {
      const { root, doc, body } = page();
      vi.stubGlobal('document', doc);
      const releaseRoute = acquireFixedGameViewport(doc);
      const releaseSheet = lockBodyScroll();
      expect(body.style.overflow).toBe('hidden');
      if (order === 'sheet-first') {
        releaseSheet();
        expect(root.getAttribute('data-fixed-game')).toBe('');
        expect(body.style.overflow).toBe(''); // CSS route lock remains, not a stale inline value.
        releaseRoute();
      } else {
        releaseRoute();
        expect(body.style.overflow).toBe('hidden'); // Existing sheet still owns its own lock.
        releaseSheet();
      }
      expect(root.getAttribute('data-fixed-game')).toBeNull();
      expect(root.style.overflow).toBe('auto');
      expect(body.style.overflow).toBe('');
    },
  );
  it('survives strict-mode style setup/cleanup/setup without retaining a route lock', () => {
    const { root, meta, doc, content } = page();
    acquireFixedGameViewport(doc)();
    const release = acquireFixedGameViewport(doc);
    release();
    expect(root.getAttribute('data-fixed-game')).toBeNull();
    expect(meta.getAttribute('content')).toBe(content);
  });
});

const css = postcss.parse(readFileSync(new URL('./theme/viewport.css', import.meta.url), 'utf8'));
describe('viewport CSS contracts (not rendered Firefox measurements)', () => {
  it('progressively falls back from dynamic to small to legacy viewport height', () => {
    const values: string[] = [];
    css.walkDecls('--game-viewport-height', (decl) => {
      values.push(decl.value);
    });
    expect(values).toEqual(['100vh', '100svh', '100dvh']);
  });
  it('fixes the body and bounds the whole html/body/root chain, scoped to a mobile route flag', () => {
    const all: Record<string, Record<string, string>> = {};
    css.walkRules((rule) => {
      expect(rule.selector).toMatch(/^html\[data-fixed-game\]/);
      let parent = rule.parent;
      while (
        parent?.parent &&
        parent.type !== 'root' &&
        !(parent.type === 'atrule' && (parent as postcss.AtRule).name === 'media')
      )
        parent = parent.parent;
      expect((parent as postcss.AtRule).params).toBe('(max-width: 859px)');
      const props = (all[rule.selector] ??= {});
      rule.walkDecls((decl) => {
        props[decl.prop] = decl.value;
      });
    });
    expect(all['html[data-fixed-game]']).toMatchObject({
      height: 'var(--game-viewport-height)',
      'min-height': '0',
      overflow: 'hidden',
    });
    expect(all['html[data-fixed-game] body']).toMatchObject({
      position: 'fixed',
      inset: '0 0 auto',
      height: 'var(--game-viewport-height)',
      'min-height': '0',
      padding: '0',
    });
    expect(all['html[data-fixed-game] #root']).toMatchObject({
      position: 'relative',
      height: '100%',
      'min-height': '0',
      overflow: 'hidden',
    });
    expect(css.toString()).not.toContain('touch-action: none');
  });
});
