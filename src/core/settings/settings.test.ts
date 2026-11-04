import { describe, expect, it } from 'vitest';
import {
  defaultsFor,
  defineSettings,
  isValidValue,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  settingsKey,
  validateDefinitions,
  type SettingDefinition,
} from './schema';

const defs = defineSettings([
  { key: 'autoScroll', label: 'Scroll', type: 'toggle', default: true },
  {
    key: 'theme',
    label: 'Theme',
    type: 'select',
    options: [
      { value: 'paper', label: 'Paper' },
      { value: 'slate', label: 'Slate' },
    ],
    default: 'paper',
  },
  { key: 'speed', label: 'Speed', type: 'range', min: 0, max: 2, step: 0.5, default: 1 },
] as const);

function mem() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    m,
  };
}

describe('settings schema', () => {
  it('builds defaults', () => {
    expect(defaultsFor(defs)).toEqual({ autoScroll: true, theme: 'paper', speed: 1 });
  });
  it('validates values per type', () => {
    expect(isValidValue(defs[0], false)).toBe(true);
    expect(isValidValue(defs[0], 'yes')).toBe(false);
    expect(isValidValue(defs[1], 'slate')).toBe(true);
    expect(isValidValue(defs[1], 'neon')).toBe(false);
    expect(isValidValue(defs[2], 1.5)).toBe(true);
    expect(isValidValue(defs[2], 1.2)).toBe(false);
    expect(isValidValue(defs[2], 3)).toBe(false);
    expect(isValidValue(defs[2], NaN)).toBe(false);
  });
  it('rejects malformed definitions', () => {
    const dup: SettingDefinition[] = [
      { key: 'a', label: 'A', type: 'toggle', default: true },
      { key: 'a', label: 'A', type: 'toggle', default: false },
    ];
    expect(() => validateDefinitions(dup)).toThrow(/Duplicate/);
    expect(() =>
      validateDefinitions([{ key: 'r', label: 'R', type: 'range', min: 0, max: 5, default: 9 }]),
    ).toThrow(/default/);
    expect(() =>
      validateDefinitions([{ key: 's', label: 'S', type: 'select', options: [], default: 'x' }]),
    ).toThrow();
  });
  it('sanitises: unknown keys ignored, invalid values fall back', () => {
    expect(
      sanitizeSettings(defs, { autoScroll: false, theme: 'neon', speed: 99, extra: 1 }),
    ).toEqual({ autoScroll: false, theme: 'paper', speed: 1 });
    expect(sanitizeSettings(defs, null)).toEqual(defaultsFor(defs));
    expect(sanitizeSettings(defs, [1, 2])).toEqual(defaultsFor(defs));
    expect(sanitizeSettings(defs, 'junk')).toEqual(defaultsFor(defs));
  });
});

describe('settings persistence', () => {
  it('round-trips per game under wordgames:settings:<id>', () => {
    const s = mem();
    saveSettings('g1', defs, { autoScroll: false, theme: 'slate', speed: 1 }, s);
    expect(settingsKey('g1')).toBe('wordgames:settings:g1');
    expect(JSON.parse(s.m.get('wordgames:settings:g1')!)).toEqual({
      autoScroll: false,
      theme: 'slate',
    });
    expect(loadSettings('g1', defs, s)).toEqual({ autoScroll: false, theme: 'slate', speed: 1 });
    expect(loadSettings('g2', defs, s)).toEqual(defaultsFor(defs));
  });
  it('tolerates corrupt JSON and missing storage', () => {
    const s = mem();
    s.setItem('wordgames:settings:g1', '{not json');
    expect(loadSettings('g1', defs, s)).toEqual(defaultsFor(defs));
    expect(loadSettings('g1', defs, undefined)).toEqual(defaultsFor(defs));
    expect(() => saveSettings('g1', defs, {}, undefined)).not.toThrow();
  });
  it('does not persist invalid values', () => {
    const s = mem();
    saveSettings('g1', defs, { speed: 7, bogus: true }, s);
    expect(JSON.parse(s.m.get('wordgames:settings:g1')!)).toEqual({});
  });
});
