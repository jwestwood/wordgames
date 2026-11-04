import { useCallback, useEffect, useRef, useState } from 'react';
import { loadJSON, saveJSON } from './storage';
import { loadSeedState, saveSeedState } from './progress';

/** useState persisted to localStorage under a namespaced key. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => loadJSON(key, initial));
  useEffect(() => saveJSON(key, value), [key, value]);
  return [value, setValue] as const;
}

/** Countdown timer. Returns remaining ms and controls. */
export function useCountdown(totalMs: number, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(totalMs);
  const [running, setRunning] = useState(false);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (!running) return;
    const end = Date.now() + remaining;
    const id = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        expire.current?.();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(totalMs);
  }, [totalMs]);
  return { remaining, running, start, pause, reset };
}

export type GamePhase = 'idle' | 'playing' | 'won' | 'lost';

/** Generic game state: phase, score, persistent best score. */
export function useGameState(gameId: string) {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistentState<number>(`${gameId}:best`, 0);

  const addScore = useCallback((n: number) => setScore((s) => s + n), []);
  const start = useCallback(() => {
    setScore(0);
    setPhase('playing');
  }, []);
  const end = useCallback(
    (result: 'won' | 'lost') => {
      setPhase(result);
      setScore((s) => {
        setBest((b) => Math.max(b, s));
        return s;
      });
    },
    [setBest],
  );
  return { phase, score, best, addScore, start, end };
}

/** State persisted per game+seed; reloads when the seed changes. */
export function useSeedState<T>(gameId: string, seed: string, initial: T) {
  const [state, setState] = useState(() => ({ seed, value: loadSeedState(gameId, seed, initial) }));
  const current =
    state.seed === seed ? state : { seed, value: loadSeedState(gameId, seed, initial) };
  if (current !== state) setState(current);
  const setValue = useCallback(
    (update: T | ((prev: T) => T)) =>
      setState((s) => {
        const value = typeof update === 'function' ? (update as (p: T) => T)(s.value) : update;
        saveSeedState(gameId, s.seed, value);
        return { seed: s.seed, value };
      }),
    [gameId],
  );
  return [current.value, setValue] as const;
}
