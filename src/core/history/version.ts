declare const __WORDLIST_VERSION__: string;

/**
 * Short content hash of the bundled word lists, injected at build time by vite.config.ts.
 * Changes whenever any word list changes, so history entries from older lists can be flagged.
 */
export const WORDLIST_VERSION: string =
  typeof __WORDLIST_VERSION__ === 'string' ? __WORDLIST_VERSION__ : 'dev';
