import type { SoundRegistry } from './manager';

/**
 * Sound *slots*: every game plays these names; the active sound theme (themes.ts) decides which
 * actual file each slot uses. Games never reference files or themes.
 */
export type SoundName =
  | 'tap'
  | 'button'
  | 'error'
  | 'success'
  | 'success-big'
  | 'success-epic'
  | 'star'
  | 'letter-complete'
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
/** `dir` = '' for the classic files in public/sounds, else a theme folder (public/sounds/<dir>). */
export const soundFile = (dir: string, name: string, volume = 1, vary = 0) => {
  const path = `${base}sounds/${dir ? `${dir}/` : ''}${name}`;
  return { src: [`${path}.ogg`, `${path}.mp3`], volume, vary };
};
const s = (name: string, volume = 1, vary = 0) => soundFile('', name, volume, vary);

/** Classic theme. Files live in public/sounds (see CREDITS.md). Volumes balance clicks vs jingles. */
export const SOUNDS: SoundRegistry<SoundName> = {
  tap: s('tap', 0.45, 0.08),
  button: s('button', 0.4, 0.05),
  error: s('error', 0.45),
  success: s('success', 0.55),
  'success-big': s('success-big', 0.6),
  'success-epic': s('success-epic', 0.7),
  star: s('star', 0.7),
  // Alias: same files as star so themes need no new assets.
  'letter-complete': s('star', 0.65),
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
