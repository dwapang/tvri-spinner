/**
 * Cryptographically strong, bias-free random number generation
 * using crypto.getRandomValues and rejection sampling.
 */

export function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;

  const MAX_UINT32 = 0xffffffff; // 4294967295
  // The largest multiple of maxExclusive <= MAX_UINT32 + 1
  const limit = MAX_UINT32 - (MAX_UINT32 % maxExclusive);
  const buffer = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buffer);
    const val = buffer[0];
    if (val < limit) {
      return val % maxExclusive;
    }
  }
}

/**
 * Returns a cryptographically random float in [0, 1).
 */
export function getRandomFraction(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 4294967296;
}

/**
 * Selects a random integer within [min, max] inclusive.
 */
export function getRandomRange(min: number, max: number): number {
  if (max <= min) return min;
  const count = max - min + 1;
  return min + getRandomInt(count);
}
