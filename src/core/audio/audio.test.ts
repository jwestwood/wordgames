import { describe, expect, it } from 'vitest';
import { createSoundManager, jitter, MUTE_KEY, pickSource, readMuted } from './manager';
import { SOUNDS } from './sounds';

const mem = (init: Record<string, string> = {}) => {
  const d = { ...init };
  return {
    d,
    getItem: (k: string) => d[k] ?? null,
    setItem: (k: string, v: string) => void (d[k] = v),
  };
};

function fakeCtx() {
  const started: Array<{ rate: number; gain: number; when: number }> = [];
  const ctx = {
    state: 'suspended',
    currentTime: 10,
    destination: {},
    resumed: 0,
    async resume() {
      ctx.state = 'running';
      ctx.resumed++;
    },
    async suspend() {
      ctx.state = 'suspended';
    },
    decodeAudioData: async (b: ArrayBuffer) => ({ len: b.byteLength }),
    createBufferSource() {
      const src = {
        buffer: null as unknown,
        playbackRate: { value: 1 },
        connect: (g: { gain: { value: number } }) => ((src as { g?: unknown }).g = g),
        start(when = 0) {
          started.push({
            rate: src.playbackRate.value,
            gain: (src as { g?: { gain: { value: number } } }).g?.gain.value ?? -1,
            when,
          });
        },
      };
      return src;
    },
    createGain: () => ({ gain: { value: 1 }, connect: () => undefined }),
  };
  return { ctx, started };
}

const reg = { a: { src: ['a.ogg', 'a.mp3'], volume: 0.5, vary: 0.1 }, b: { src: ['b.mp3'] } };

describe('sound manager', () => {
  it('no-ops when AudioContext is unavailable', async () => {
    const m = createSoundManager({ sounds: reg });
    expect(m.available).toBe(false);
    await expect(m.unlock()).resolves.toBeUndefined();
    expect(m.play('a')).toBe(false);
  });

  it('tolerates a throwing context constructor', () => {
    const m = createSoundManager({
      sounds: reg,
      createContext: () => {
        throw new Error('no');
      },
    });
    expect(m.play('a')).toBe(false);
  });

  it('unlock resumes, preloads all and then plays with gain and delay', async () => {
    const { ctx, started } = fakeCtx();
    const loaded: string[] = [];
    const m = createSoundManager({
      sounds: reg,
      createContext: () => ctx,
      canPlay: (u) => u.endsWith('.mp3'),
      load: async (u) => (loaded.push(u), new ArrayBuffer(4)),
      volume: 0.8,
    });
    expect(m.play('a')).toBe(false); // not decoded yet
    await m.unlock();
    expect(ctx.state).toBe('running');
    expect(loaded.sort()).toEqual(['a.mp3', 'b.mp3']);
    expect(m.play('a', { delay: 0.5 })).toBe(true);
    expect(started[0].gain).toBeCloseTo(0.4);
    expect(started[0].when).toBeCloseTo(10.5);
    expect(m.play('b', { rate: 1.2 })).toBe(true);
    expect(started[1].rate).toBe(1.2);
  });

  it('pitch variation is deterministic and bounded', async () => {
    const run = async () => {
      const { ctx, started } = fakeCtx();
      const m = createSoundManager({
        sounds: reg,
        createContext: () => ctx,
        load: async () => new ArrayBuffer(1),
      });
      await m.unlock();
      for (let i = 0; i < 5; i++) m.play('a');
      return started.map((s) => s.rate);
    };
    const r1 = await run();
    expect(await run()).toEqual(r1);
    expect(new Set(r1).size).toBeGreaterThan(1);
    r1.forEach((r) => expect(Math.abs(r - 1)).toBeLessThanOrEqual(0.1));
    for (let i = 0; i < 100; i++) expect(Math.abs(jitter(i))).toBeLessThanOrEqual(1);
  });

  it('persists mute and notifies subscribers; muted play is silent', async () => {
    const st = mem();
    const { ctx, started } = fakeCtx();
    const m = createSoundManager({
      sounds: reg,
      storage: st,
      createContext: () => ctx,
      load: async () => new ArrayBuffer(1),
    });
    await m.unlock();
    let n = 0;
    const off = m.subscribe(() => n++);
    m.toggleMuted();
    expect(st.d[MUTE_KEY]).toBe('1');
    expect(n).toBe(1);
    expect(m.play('a')).toBe(false);
    expect(started).toHaveLength(0);
    off();
    m.setMuted(false);
    expect(n).toBe(1);
    expect(createSoundManager({ sounds: reg, storage: mem({ [MUTE_KEY]: '1' }) }).muted).toBe(true);
    expect(
      readMuted({
        getItem: () => {
          throw new Error('x');
        },
        setItem: () => undefined,
      }),
    ).toBe(false);
  });

  it('respects page visibility', async () => {
    let hidden = false;
    const { ctx } = fakeCtx();
    const m = createSoundManager({
      sounds: reg,
      createContext: () => ctx,
      load: async () => new ArrayBuffer(1),
      isHidden: () => hidden,
    });
    await m.unlock();
    hidden = true;
    m.onVisibility();
    await Promise.resolve();
    expect(ctx.state).toBe('suspended');
    expect(m.play('a')).toBe(false);
    hidden = false;
    m.onVisibility();
    await Promise.resolve();
    expect(ctx.state).toBe('running');
  });

  it('pickSource prefers playable, falls back to first', () => {
    expect(pickSource(['x.ogg', 'x.mp3'], (u) => u.endsWith('mp3'))).toBe('x.mp3');
    expect(pickSource(['x.ogg'], () => false)).toBe('x.ogg');
  });

  it('core registry covers the shared names with ogg + mp3', () => {
    for (const n of ['tap', 'button', 'error', 'success', 'star', 'perfect', 'shuffle'] as const) {
      expect(SOUNDS[n].src.map((s) => s.split('.').pop())).toEqual(['ogg', 'mp3']);
    }
  });
});
