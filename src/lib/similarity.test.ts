import { describe, it, expect } from "vitest";
import { normalize, cosine, maxCosine } from "@/lib/similarity";

describe("normalize", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalize("  Explain the AFO's role!!  ")).toBe(
      "explain the afos role",
    );
  });

  it("makes punctuation/spacing-only variants equal (exact-dup detection)", () => {
    expect(normalize("A myoelectric prosthesis.")).toBe(
      normalize("a  myoelectric   prosthesis"),
    );
  });

  it("keeps genuinely different text distinct", () => {
    expect(normalize("transtibial prosthesis")).not.toBe(
      normalize("transfemoral prosthesis"),
    );
  });
});

describe("cosine (unit vectors → dot product)", () => {
  it("is 1 for identical vectors", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("is -1 for opposite vectors", () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe("maxCosine", () => {
  it("returns 0 when there are no other vectors", () => {
    expect(maxCosine([1, 0], [])).toBe(0);
  });

  it("returns the closest match among candidates", () => {
    // [0.6,0.8] is a unit vector; its dot with [1,0] is 0.6 (the max here).
    expect(maxCosine([1, 0], [[0, 1], [0.6, 0.8], [-1, 0]])).toBeCloseTo(0.6);
  });

  it("crosses a dedup threshold only for near-duplicates", () => {
    const threshold = 0.85;
    const nearDup = maxCosine([1, 0], [[0.99, Math.sqrt(1 - 0.99 * 0.99)]]);
    const distinct = maxCosine([1, 0], [[0.5, Math.sqrt(1 - 0.25)]]);
    expect(nearDup).toBeGreaterThanOrEqual(threshold);
    expect(distinct).toBeLessThan(threshold);
  });
});
