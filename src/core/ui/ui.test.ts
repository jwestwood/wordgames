import { describe, expect, it } from 'vitest';
import { evaluateGuess, formatScore, gridNavigate, tileLabel, trapFocusIndex } from './logic';

describe('tileLabel', () => {
  it('labels letters and states', () => {
    expect(tileLabel('a')).toBe('A');
    expect(tileLabel('a', 'correct')).toBe('A, correct');
    expect(tileLabel(' ', 'absent')).toBe('blank, not in word');
    expect(tileLabel('a', 'error')).toBe('A, incorrect');
  });
});

describe('evaluateGuess', () => {
  it('marks correct/present/absent', () => {
    expect(evaluateGuess('crane', 'react')).toEqual([
      'present',
      'present',
      'correct',
      'absent',
      'present',
    ]);
  });
  it('handles repeated letters', () => {
    expect(evaluateGuess('allee', 'apple')).toEqual([
      'correct',
      'present',
      'absent',
      'absent',
      'correct',
    ]);
  });
});

describe('formatScore', () => {
  it('formats', () => {
    expect(formatScore(1234)).toBe('1,234');
    expect(formatScore(5, true)).toBe('+5');
    expect(formatScore(-5)).toBe('−5');
    expect(formatScore(0, true)).toBe('0');
  });
});

describe('gridNavigate', () => {
  it('moves within bounds', () => {
    expect(gridNavigate(0, 'ArrowRight', 3, 9)).toBe(1);
    expect(gridNavigate(0, 'ArrowDown', 3, 9)).toBe(3);
    expect(gridNavigate(0, 'ArrowUp', 3, 9)).toBe(0);
    expect(gridNavigate(8, 'ArrowRight', 3, 9)).toBe(8);
    expect(gridNavigate(4, 'End', 3, 9)).toBe(8);
    expect(gridNavigate(4, 'x', 3, 9)).toBe(4);
  });
});

describe('trapFocusIndex', () => {
  it('wraps', () => {
    expect(trapFocusIndex(2, 3, false)).toBe(0);
    expect(trapFocusIndex(0, 3, true)).toBe(2);
    expect(trapFocusIndex(0, 0, false)).toBe(-1);
  });
});
