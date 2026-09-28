import { describe, expect, it } from "vitest";
import { tallyAxes, type AttemptRow } from "@/lib/attempts";

const row = (
  clarity: AttemptRow["axes"]["clarity"]["level"],
  accuracy: AttemptRow["axes"]["accuracy"]["level"],
): AttemptRow => ({
  id: "x",
  created_at: "2026-09-28T00:00:00Z",
  mode: "explain-term",
  prompt: null,
  transcript: null,
  summary: null,
  next_step: null,
  axes: {
    clarity: { level: clarity, note: null },
    accuracy: { level: accuracy, note: null },
    professionalism: { level: "solid", note: null },
  },
});

describe("tallyAxes", () => {
  it("counts each level per axis", () => {
    const tally = tallyAxes([
      row("needs work", "solid"),
      row("needs work", "solid"),
      row("solid", "missing"),
    ]);

    const clarity = tally.find(t => t.axis === "clarity")!;
    expect(clarity).toEqual({
      axis: "clarity",
      solid: 1,
      needsWork: 2,
      missing: 0,
    });

    const accuracy = tally.find(t => t.axis === "accuracy")!;
    expect(accuracy.solid).toBe(2);
    expect(accuracy.missing).toBe(1);
  });

  it("ignores an attempt whose level never arrived", () => {
    // A row saved before a level existed, or one the model mangled.
    const tally = tallyAxes([row(null, null)]);
    for (const t of tally) {
      if (t.axis === "professionalism") continue;
      expect(t.solid + t.needsWork + t.missing).toBe(0);
    }
  });

  it("returns every axis even with no attempts", () => {
    expect(tallyAxes([]).map(t => t.axis)).toEqual([
      "clarity",
      "accuracy",
      "professionalism",
    ]);
  });
});
