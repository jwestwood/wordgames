import { WORDLIST_VERSION } from '@core/history';

/** Bump the prefix when puzzle generation changes; the hash tracks word-list changes. */
export const PUZZLE_VERSION = `lw1-${WORDLIST_VERSION}`;
