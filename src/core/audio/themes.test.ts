import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSoundManager } from './manager';
import { SOUNDS } from './sounds';
import {
  DEFAULT_SOUND_THEME,
  findSoundTheme,
  readSoundTheme,
  SOUND_THEME_KEY,
  SOUND_THEMES,
} from './themes';

const PUBLIC = join(import.meta.dirname, '../../../public');
const slots = Object.keys(SOUNDS).sort();

describe('sound themes', () => {
  it('has at least 3 themes with unique ids', () => {
    expect(SOUND_THEMES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(SOUND_THEMES.map((t) => t.id)).size).toBe(SOUND_THEMES.length);
  });

  it.each(SOUND_THEMES.map((t) => [t.id, t] as const))('%s maps every slot to files', (_, t) => {
    expect(Object.keys(t.sounds).sort()).toEqual(slots);
    for (const def of Object.values(t.sounds))
      for (const src of def.src) expect(existsSync(join(PUBLIC, src)), src).toBe(true);
  });

  it('themes use distinct files', () => {
    const tap = SOUND_THEMES.map((t) => t.sounds.tap.src[0]);
    expect(new Set(tap).size).toBe(SOUND_THEMES.length);
  });

  it('reads the persisted theme, falling back to the default', () => {
    const st = (v: string | null) => ({
      getItem: (k: string) => (k === SOUND_THEME_KEY ? v : null),
    });
    expect(readSoundTheme(st('soft'))).toBe('soft');
    expect(readSoundTheme(st('nope'))).toBe(DEFAULT_SOUND_THEME);
    expect(readSoundTheme(null)).toBe(DEFAULT_SOUND_THEME);
    expect(findSoundTheme(undefined).id).toBe(DEFAULT_SOUND_THEME);
  });

  it('manager.setSounds swaps the registry and reloads buffers', async () => {
    const loaded: string[] = [];
    const ctx = {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: async () => {},
      suspend: async () => {},
      decodeAudioData: async () => ({}),
      createBufferSource: () => ({
        buffer: null,
        playbackRate: { value: 1 },
        connect: () => undefined,
        start: () => undefined,
      }),
      createGain: () => ({ gain: { value: 1 }, connect: () => undefined }),
    };
    const m = createSoundManager({
      sounds: findSoundTheme('classic').sounds,
      createContext: () => ctx,
      load: async (u) => (loaded.push(u), new ArrayBuffer(1)),
    });
    await m.unlock();
    expect(m.play('tap')).toBe(true);
    await m.setSounds(findSoundTheme('soft').sounds);
    expect(loaded.at(-1)).toContain('/sounds/soft/');
    expect(m.play('tap')).toBe(true);
  });
});
