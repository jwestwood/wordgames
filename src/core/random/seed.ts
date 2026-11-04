/** Human-friendly seeds: 6-char Crockford-style base32 codes (no I, L, O, U), e.g. "K7Q2MX". */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const SEED_LENGTH = 6;

/** Fresh random seed. Uses crypto (seed *generation* is the only place true randomness is allowed). */
export function generateSeed(length = SEED_LENGTH): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

/** Normalise user-typed seeds: trim, uppercase, map look-alikes (O->0, I/L->1). Any other string is kept as-is. */
export function normaliseSeed(seed: string): string {
  const s = seed.trim().toUpperCase();
  if (!/^[0-9A-Z]+$/.test(s)) return seed.trim();
  return s.replace(/O/g, '0').replace(/[IL]/g, '1');
}

/** Today's date seed (YYYY-MM-DD, local time) for "daily puzzle" modes. */
export function dailySeed(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
