/**
 * Small, dependency-free text-similarity helpers used by the question-bank
 * generator's semantic dedup. Kept pure so they're trivial to unit-test.
 */

/** Lowercase, strip non-alphanumerics, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cosine similarity of two embedding vectors. OpenAI embeddings are already
 * unit-normalized, so this reduces to their dot product. Assumes equal length.
 */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/**
 * Highest cosine similarity between `v` and any vector in `others`.
 * Returns 0 for an empty set (matching the dedup threshold's lower bound).
 */
export function maxCosine(v: number[], others: number[][]): number {
  let max = 0;
  for (const o of others) {
    const c = cosine(v, o);
    if (c > max) max = c;
  }
  return max;
}
