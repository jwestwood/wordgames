import type { SoundRegistry } from './manager';

/** Shared sound names: every game uses these so the whole site sounds consistent. */
export type SoundName =
  | 'tap'
  | 'button'
  | 'error'
  | 'success'
  | 'star'
  | 'perfect'
  | 'shuffle'
  | 'delete'
  | 'clear'
  | 'word-land'
  | 'already-found'
  | 'copy'
  | 'dice'
  | 'open'
  | 'close';

const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const s = (name: string, volume = 1, vary = 0) => ({
  src: [`${base}sounds/${name}.ogg`, `${base}sounds/${name}.mp3`],
  volume,
  vary,
});

/** Files live in public/sounds (see CREDITS.md). Volumes balance clicks against jingles. */
export const SOUNDS: SoundRegistry<SoundName> = {
  tap: s('tap', 0.45, 0.08),
  button: s('button', 0.4, 0.05),
  error: s('error', 0.45),
  success: s('success', 0.55),
  star: s('star', 0.7),
  perfect: s('perfect', 0.75),
  shuffle: s('shuffle', 0.5, 0.05),
  delete: s('delete', 0.4, 0.05),
  clear: s('clear', 0.4),
  'word-land': s('word-land', 0.5, 0.06),
  'already-found': s('already-found', 0.45),
  copy: s('copy', 0.45),
  dice: s('dice', 0.5, 0.05),
  open: s('open', 0.35),
  close: s('close', 0.35),
};
