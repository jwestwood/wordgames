import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';

const css = postcss.parse(readFileSync(new URL('./letter-wheel.css', import.meta.url), 'utf8'));
function declarations(selector: string) {
  const values: Record<string, string> = {};
  css.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      values[decl.prop] = decl.value;
    });
  });
  return values;
}

describe('mobile layout contracts (visual checks still required)', () => {
  it('bounds the game to the dynamic viewport and gives the wheel the remaining space', () => {
    expect(declarations('.app--letter-wheel')).toMatchObject({
      position: 'fixed',
      height: '100dvh',
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
  it('scopes the redesign below 860px only', () => {
    css.walkRules((rule) => {
      if (rule.selector.startsWith('.app--letter-wheel')) {
        expect(rule.parent?.type).toBe('atrule');
        expect((rule.parent as postcss.AtRule).params).toBe('(max-width: 859px)');
      }
    });
  });
});
