import { describe, expect, it } from 'vitest';
import { applyClue, clueLetters, clueLevel, parseProgress, pruneClues } from './clues';

describe('clues', () => {
  it('first clue reveals the last letter, second the 2nd-to-last as well', () => {
    expect(clueLetters('plant', 0)).toEqual([null, null, null, null, null]);
    expect(clueLetters('plant', 1)).toEqual([null, null, null, null, 't']);
    expect(clueLetters('plant', 2)).toEqual([null, null, null, 'n', 't']);
    expect(clueLetters('alert', 1)).toEqual([null, null, null, null, 't']);
    expect(clueLetters('alert', 2)).toEqual([null, null, null, 'r', 't']);
    expect(clueLetters('a', 1)).toEqual(['a']);
    expect(clueLetters('a', 2)).toEqual(['a']);
    expect(clueLetters('ab', 1)).toEqual([null, 'b']);
    expect(clueLetters('ab', 2)).toEqual(['a', 'b']);
  });

  it('applyClue advances 0→1→2 and ignores found / already-clued words', () => {
    let clues = {};
    clues = applyClue(clues, 'plant', new Set());
    expect(clueLevel(clues, 'plant')).toBe(1);
    clues = applyClue(clues, 'plant', new Set());
    expect(clueLevel(clues, 'plant')).toBe(2);
    expect(applyClue(clues, 'plant', new Set())).toBe(clues);
    expect(applyClue({}, 'plant', new Set(['plant']))).toEqual({});
  });

  it('parseProgress accepts legacy found arrays and progress objects', () => {
    expect(parseProgress(['able', 'bake'])).toEqual({
      found: ['able', 'bake'],
      clues: {},
      bonus: [],
    });
    expect(parseProgress({ found: ['able'], clues: { plant: 1, x: 9 } })).toEqual({
      found: ['able'],
      clues: { plant: 1 },
      bonus: [],
    });
    expect(parseProgress({ found: ['able'], clues: {}, bonus: ['color', 3, 'gray'] })).toEqual({
      found: ['able'],
      clues: {},
      bonus: ['color', 'gray'],
    });
    expect(parseProgress(null)).toEqual({ found: [], clues: {}, bonus: [] });
  });

  it('pruneClues drops entries for found words', () => {
    const clues = { plant: 1 as const, able: 2 as const };
    expect(pruneClues(clues, new Set(['able']))).toEqual({ plant: 1 });
    expect(pruneClues(clues, new Set())).toBe(clues);
  });
});
