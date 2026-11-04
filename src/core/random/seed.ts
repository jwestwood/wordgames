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

/** Pattern for a canonical seed: exactly SEED_LENGTH chars from the seed alphabet. */
export const SEED_PATTERN = new RegExp(`^[${ALPHABET}]{${SEED_LENGTH}}$`);

/** True if `seed` (after normalisation) is a valid canonical seed code. */
export function isValidSeed(seed: string): boolean {
  return SEED_PATTERN.test(normaliseSeed(seed));
}

/** Normalise as the user types: uppercase, map look-alikes, drop spaces/symbols, cap length. */
export function normaliseSeedInput(raw: string, length = SEED_LENGTH): string {
  return raw
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, length);
}
