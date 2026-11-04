/** Web Audio sound manager: lazy unlock, preload/decode, deterministic pitch variation, persisted mute. */

export interface SoundDef {
  /** Candidate URLs in preference order (e.g. ogg then mp3); first playable is used. */
  src: string[];
  /** 0..1 base gain (default 1). */
  volume?: number;
  /** Max +/- playback-rate variation, e.g. 0.06 = ±6% (default 0). */
  vary?: number;
}
export type SoundRegistry<N extends string = string> = Record<N, SoundDef>;

export interface PlayOptions {
  volume?: number;
  /** Explicit playback rate (overrides variation). */
  rate?: number;
  /** Seconds from now. */
  delay?: number;
}

/** Minimal slice of AudioContext we use (makes testing easy). */
export interface AudioCtxLike {
  state: string;
  currentTime: number;
  destination: unknown;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  decodeAudioData(data: ArrayBuffer): Promise<unknown>;
  createBufferSource(): {
    buffer: unknown;
    playbackRate: { value: number };
    connect(n: unknown): unknown;
    start(when?: number): void;
  };
  createGain(): { gain: { value: number }; connect(n: unknown): unknown };
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export interface SoundManagerOptions<N extends string> {
  sounds: SoundRegistry<N>;
  createContext?: () => AudioCtxLike | null;
  load?: (url: string) => Promise<ArrayBuffer>;
  canPlay?: (url: string) => boolean;
  storage?: StorageLike | null;
  storageKey?: string;
  isHidden?: () => boolean;
  volume?: number;
}

export const MUTE_KEY = 'wordgames:muted';
const GOLDEN = 0.6180339887;

/** Deterministic pseudo-jitter in [-1, 1) for the n-th play (golden-ratio sequence, no Math.random). */
export function jitter(n: number): number {
  return ((n * GOLDEN) % 1) * 2 - 1;
}

/** First URL whose extension the browser says it can play (falls back to the first). */
export function pickSource(src: string[], canPlay: (url: string) => boolean): string | undefined {
  return src.find(canPlay) ?? src[0];
}

export function readMuted(storage: StorageLike | null | undefined, key = MUTE_KEY): boolean {
  try {
    return storage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function createSoundManager<N extends string>(opts: SoundManagerOptions<N>) {
  const {
    sounds,
    createContext = () => null,
    load = (u) => fetch(u).then((r) => r.arrayBuffer()),
    canPlay = () => true,
    storage = null,
    storageKey = MUTE_KEY,
    isHidden = () => false,
  } = opts;
  let volume = opts.volume ?? 1;
  let muted = readMuted(storage, storageKey);
  let ctx: AudioCtxLike | null = null;
  let triedCtx = false;
  let counter = 0;
  const buffers = new Map<N, unknown>();
  const loading = new Map<N, Promise<void>>();
  const listeners = new Set<() => void>();

  const context = () => {
    if (!triedCtx) {
      triedCtx = true;
      try {
        ctx = createContext();
      } catch {
        ctx = null;
      }
    }
    return ctx;
  };

  const preload = (name: N): Promise<void> => {
    const c = context();
    if (!c) return Promise.resolve();
    let p = loading.get(name);
    if (!p) {
      const url = pickSource(sounds[name].src, canPlay);
      p = url
        ? load(url)
            .then((d) => c.decodeAudioData(d))
            .then((b) => void buffers.set(name, b))
            .catch(() => undefined)
        : Promise.resolve();
      loading.set(name, p);
    }
    return p;
  };

  const api = {
    names: Object.keys(sounds) as N[],
    get available() {
      return context() !== null;
    },
    /** Call from a user gesture: creates/resumes the context and preloads every sound. */
    unlock(): Promise<void> {
      const c = context();
      if (!c) return Promise.resolve();
      const r = c.state === 'suspended' && !isHidden() ? c.resume().catch(() => undefined) : null;
      return Promise.all([r, ...api.names.map(preload)]).then(() => undefined);
    },
    preload,
    isLoaded: (name: N) => buffers.has(name),
    /** Plays a sound; silently no-ops when muted, hidden, unavailable or not yet decoded. */
    play(name: N, o: PlayOptions = {}): boolean {
      const def = sounds[name];
      if (!def || muted || isHidden()) return false;
      const c = context();
      if (!c) return false;
      const buf = buffers.get(name);
      if (!buf) {
        void preload(name);
        return false;
      }
      if (c.state === 'suspended') void c.resume().catch(() => undefined);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = o.rate ?? 1 + (def.vary ?? 0) * jitter(++counter);
      const g = c.createGain();
      g.gain.value = Math.max(0, volume * (def.volume ?? 1) * (o.volume ?? 1));
      src.connect(g);
      g.connect(c.destination);
      src.start(c.currentTime + Math.max(0, o.delay ?? 0));
      return true;
    },
    get muted() {
      return muted;
    },
    setMuted(m: boolean) {
      if (m === muted) return;
      muted = m;
      try {
        storage?.setItem(storageKey, m ? '1' : '0');
      } catch {
        /* storage full/blocked: keep in-memory value */
      }
      listeners.forEach((l) => l());
    },
    toggleMuted() {
      api.setMuted(!muted);
      return muted;
    },
    get volume() {
      return volume;
    },
    setVolume(v: number) {
      volume = Math.min(1, Math.max(0, v));
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    /** Suspend on hidden tab, resume when visible (wire to visibilitychange). */
    onVisibility() {
      if (!ctx) return;
      if (isHidden()) void ctx.suspend().catch(() => undefined);
      else if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    },
  };
  return api;
}

export type SoundManager<N extends string = string> = ReturnType<typeof createSoundManager<N>>;
