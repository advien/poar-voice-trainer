import { describe, expect, it } from "vitest";
import { tallyAxes, tallyChecklist, type AttemptRow } from "@/lib/attempts";
import type { ChecklistVerdict } from "@/lib/assessment";

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
  checklist: null,
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

const withChecklist = (checklist: ChecklistVerdict[] | null): AttemptRow => ({
  ...row("solid", "solid"),
  checklist,
});

const v = (
  key: string,
  status: ChecklistVerdict["status"],
  label = key,
): ChecklistVerdict => ({ key, label, status });

describe("tallyChecklist", () => {
  it("counts partial and missing as gaps, per item", () => {
    const tally = tallyChecklist([
      withChecklist([v("plan", "missing"), v("pain", "covered")]),
      withChecklist([v("plan", "partial"), v("pain", "covered")]),
      withChecklist([v("plan", "covered")]),
    ]);
    const plan = tally.find(t => t.key === "plan")!;
    expect(plan).toMatchObject({ judged: 3, covered: 1, partial: 1, missing: 1 });
    expect(tally.find(t => t.key === "pain")!.judged).toBe(2);
  });

  it("ignores attempts without a checklist", () => {
    expect(tallyChecklist([withChecklist(null), row("solid", "solid")])).toEqual([]);
  });

  it("puts the most-missed item first", () => {
    const tally = tallyChecklist([
      withChecklist([v("a", "covered"), v("b", "missing")]),
      withChecklist([v("a", "covered"), v("b", "missing")]),
    ]);
    expect(tally.map(t => t.key)).toEqual(["b", "a"]);
  });

  it("uses the label from the newest attempt", () => {
    const tally = tallyChecklist([
      withChecklist([v("a", "covered", "New wording")]),
      withChecklist([v("a", "covered", "Old wording")]),
    ]);
    expect(tally[0].label).toBe("New wording");
  });
});
