import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';

const css = postcss.parse(readFileSync(new URL('./letter-wheel.css', import.meta.url), 'utf8'));
function declarations(selector: string, media = '(max-width: 859px)') {
  const values: Record<string, string> = {};
  css.walkRules(selector, (rule) => {
    if (rule.parent?.type !== 'atrule' || (rule.parent as postcss.AtRule).params !== media) return;
    rule.walkDecls((decl) => {
      values[decl.prop] = decl.value;
    });
  });
  return values;
}

describe('mobile layout contracts (visual checks still required)', () => {
  it('bounds the game to the dynamic viewport and gives the wheel the remaining space', () => {
    expect(declarations('.app--letter-wheel')).toMatchObject({
      position: 'absolute',
      height: '100%',
      'min-height': '0',
      'grid-template-columns': 'minmax(0, 1fr)',
      overflow: 'hidden',
      'grid-template-rows': 'auto minmax(0, 1fr)',
    });
    expect(declarations('.app--letter-wheel .lw__play')['grid-template-rows']).toBe(
      'minmax(0, 1fr) 40px 40px 40px',
    );
    expect(declarations('.app--letter-wheel .lw__wheel')['container-type']).toBe('size');
    expect(declarations('.app--letter-wheel .lw__wheel .wheel').width).toBe('min(100cqw, 100cqh)');
  });
  it.each([
    [375, 667],
    [390, 844],
    [360, 740],
  ])('has a useful wheel budget at %ix%i without reducing 40px buttons', (width, height) => {
    // Conservative layout arithmetic, not rendered-browser measurements:
    // root padding incl 34px safe bottom, header, hints/seed, score, all gaps,
    // play padding, guess, controls and opener. The rest belongs only to the wheel.
    const reserved = 8 + 34 + 40 + 84 + 68 + 56 + 16 + 3 * 40;
    const wheel = Math.min(width - 34, height - reserved);
    expect(wheel).toBeGreaterThanOrEqual(200);
    expect(declarations('.app--letter-wheel .lw__controls .btn').height).toBe('40px');
  });
  it('removes min-content column overflow without changing fixed-height controls', () => {
    for (const selector of [
      '.app--letter-wheel',
      '.app--letter-wheel .lw',
      '.app--letter-wheel .lw__layout',
      '.app--letter-wheel .lw__play',
    ]) {
      expect(declarations(selector)['grid-template-columns']).toBe('minmax(0, 1fr)');
      expect(declarations(selector)['min-height']).toBe('0');
    }
    expect(declarations('.app--letter-wheel > .site-footer').display).toBe('none');
    expect(declarations('.app--letter-wheel .lw__play')['overflow-y']).toBe('auto');
    expect(css.toString()).not.toContain(':has(');
  });
  it('uses side-by-side wheel and controls for short landscape screens', () => {
    const media = '(min-width: 600px) and (max-width: 859px) and (max-height: 500px)';
    expect(declarations('.app--letter-wheel .lw__play', media)).toMatchObject({
      'grid-template-columns': 'minmax(0, 1fr) minmax(240px, 1fr)',
      'grid-template-rows': 'repeat(3, minmax(40px, 1fr))',
      'overflow-y': 'auto',
    });
    expect(declarations('.app--letter-wheel .lw__wheel', media)['grid-row']).toBe('1 / 4');
  });
  it('makes very-short portrait/keyboard overflow reachable inside play, not clipped offscreen', () => {
    const media = '(max-width: 599px) and (max-height: 500px)';
    expect(declarations('.app--letter-wheel .lw__play', media)).toMatchObject({
      'grid-template-rows': 'minmax(160px, 1fr) 40px 40px 40px',
      'overflow-y': 'auto',
      'overscroll-behavior': 'contain',
    });
  });
  it('scopes the redesign below 860px only', () => {
    css.walkRules((rule) => {
      if (rule.selector.startsWith('.app--letter-wheel')) {
        expect(rule.parent?.type).toBe('atrule');
        expect((rule.parent as postcss.AtRule).params).toMatch(/max-width: (859|599)px/);
      }
    });
  });
});
