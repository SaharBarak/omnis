/**
 * A short, stable digest of a string, for the stamps a printed unit carries.
 * The sandbox has no crypto, and a stamp only has to change when its text
 * does, so this is cyrb53 (public domain): two 32-bit lanes folded to 53 bits.
 */

/** cyrb53's lane seeds and multipliers. */
const SEEDS = [0xdeadbeef, 0x41c6ce57] as const;
const MIX = [2654435761, 1597334677] as const;
const FOLD = [2246822507, 3266489909] as const;
/** 2^32: the high lane's place above the low lane's 32 bits. */
const HIGH = 0x1_0000_0000;
/** The high lane keeps 21 bits, so the digest fits a double's 53. */
const HIGH_MASK = 0x1f_ffff;
/** Hex digits of 53 bits. */
const DIGITS = 14;

export function digestOf(text: string): string {
  let h1: number = SEEDS[0];
  let h2: number = SEEDS[1];
  for (let at = 0; at < text.length; at += 1) {
    const code = text.charCodeAt(at);
    h1 = Math.imul(h1 ^ code, MIX[0]);
    h2 = Math.imul(h2 ^ code, MIX[1]);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), FOLD[0]);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), FOLD[1]);
  h2 = Math.imul(h2 ^ (h2 >>> 16), FOLD[0]);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), FOLD[1]);
  return (HIGH * (HIGH_MASK & h2) + (h1 >>> 0)).toString(16).padStart(DIGITS, '0');
}
