import { describe, expect, it } from "vitest";
import {
  AXES,
  checklistFormat,
  parseAssessment,
  parseChecklist,
  parseChecklistItems,
  parseStoredChecklist,
} from "@/lib/assessment";

/**
 * The model is asked for a strict shape but is not obliged to obey. These
 * cover what happens when it does not: the learner must still get a usable
 * answer rather than a thrown error.
 */
describe("parseAssessment", () => {
  it("keeps a well-formed assessment intact", () => {
    const parsed = parseAssessment({
      summary: "  Clear opening, thin on the fitting itself.  ",
      axes: {
        clarity: { level: "solid", note: "Defined 'socket' before using it." },
        accuracy: { level: "needs work", note: "K-level never mentioned." },
        professionalism: { level: "solid", note: "Measured and unhurried." },
      },
      next: "Name the K-level and say what it implies for the foot choice.",
    });

    expect(parsed.summary).toBe("Clear opening, thin on the fitting itself.");
    expect(parsed.axes.clarity.level).toBe("solid");
    expect(parsed.axes.accuracy.note).toBe("K-level never mentioned.");
    expect(parsed.next).toMatch(/^Name the K-level/);
  });

  it("falls back to 'missing' for a level it does not recognise", () => {
    const parsed = parseAssessment({
      axes: {
        clarity: { level: 87, note: "n/a" },
        accuracy: { level: "excellent", note: "" },
      },
    });

    // A number is exactly what this rewrite removed: it must not survive.
    expect(parsed.axes.clarity.level).toBe("missing");
    expect(parsed.axes.accuracy.level).toBe("missing");
  });

  it("returns every axis even when the model omits them", () => {
    const parsed = parseAssessment({ summary: "Short answer." });

    for (const axis of AXES) {
      expect(parsed.axes[axis]).toEqual({ level: "missing", note: "" });
    }
    expect(parsed.next).toBe("");
  });

  it("survives junk", () => {
    for (const junk of [null, undefined, "", 42, []]) {
      const parsed = parseAssessment(junk);
      expect(parsed.axes.professionalism.level).toBe("missing");
      expect(parsed.summary).toBe("");
    }
  });
});

const ITEMS = [
  { key: "follow_up", label: "A follow-up plan" },
  { key: "skin_check", label: "Checking the skin" },
  { key: "pain", label: "Asking about pain" },
];

describe("parseChecklistItems", () => {
  it("keeps usable items and drops the rest", () => {
    expect(
      parseChecklistItems([
        { key: "a", label: "A" },
        { key: "a", label: "duplicate key" },
        { key: "", label: "empty key" },
        { key: "b" },
        "junk",
        null,
        { key: "c", label: "C" },
      ]),
    ).toEqual([
      { key: "a", label: "A" },
      { key: "c", label: "C" },
    ]);
  });

  it("returns nothing for a value that is not an array", () => {
    for (const bad of [null, undefined, "", 42, {}]) {
      expect(parseChecklistItems(bad)).toEqual([]);
    }
  });
});

describe("parseChecklist", () => {
  it("returns one verdict per item, in the checklist's order", () => {
    const verdicts = parseChecklist(
      [
        { key: "pain", status: "partial" },
        { key: "follow_up", status: "covered" },
        { key: "skin_check", status: "missing" },
      ],
      ITEMS,
    );
    expect(verdicts).toEqual([
      { key: "follow_up", label: "A follow-up plan", status: "covered" },
      { key: "skin_check", label: "Checking the skin", status: "missing" },
      { key: "pain", label: "Asking about pain", status: "partial" },
    ]);
  });

  it("drops keys the model invented", () => {
    const verdicts = parseChecklist(
      [{ key: "made_up", status: "covered" }],
      ITEMS,
    );
    expect(verdicts.map(v => v.key)).toEqual(["follow_up", "skin_check", "pain"]);
  });

  it("counts a skipped or mislabelled item as missing, never covered", () => {
    const verdicts = parseChecklist(
      [
        { key: "follow_up", status: "great" },
        { key: "skin_check" },
      ],
      ITEMS,
    );
    expect(verdicts.every(v => v.status === "missing")).toBe(true);
  });

  it("takes the first verdict when a key repeats", () => {
    const verdicts = parseChecklist(
      [
        { key: "pain", status: "missing" },
        { key: "pain", status: "covered" },
      ],
      ITEMS,
    );
    expect(verdicts.find(v => v.key === "pain")!.status).toBe("missing");
  });

  it("survives junk", () => {
    for (const bad of [null, undefined, "", 42, {}, [null, 1, "x"]]) {
      expect(parseChecklist(bad, ITEMS)).toHaveLength(ITEMS.length);
    }
  });
});

describe("parseAssessment with a checklist", () => {
  it("adds a checklist only when the question has one", () => {
    const raw = { checklist: [{ key: "pain", status: "covered" }] };
    expect(parseAssessment(raw).checklist).toBeUndefined();
    expect(parseAssessment(raw, []).checklist).toBeUndefined();
    expect(parseAssessment(raw, ITEMS).checklist).toHaveLength(3);
  });

  it("still returns a checklist, all missing, when the model omitted it", () => {
    const parsed = parseAssessment({}, ITEMS);
    expect(parsed.checklist!.every(v => v.status === "missing")).toBe(true);
  });
});

describe("parseStoredChecklist", () => {
  it("keeps well-formed verdicts and drops the rest", () => {
    expect(
      parseStoredChecklist([
        { key: "a", label: "A", status: "covered" },
        { key: "b", label: "B", status: "great" },
        { key: "c", status: "missing" },
        null,
      ]),
    ).toEqual([{ key: "a", label: "A", status: "covered" }]);
  });

  it("is null when nothing usable is left", () => {
    for (const bad of [null, undefined, [], {}, "x", [{ key: "a" }]]) {
      expect(parseStoredChecklist(bad)).toBeNull();
    }
  });
});

describe("checklistFormat", () => {
  it("lists every key and label for the model", () => {
    const text = checklistFormat(ITEMS);
    for (const { key, label } of ITEMS) expect(text).toContain(`- ${key}: ${label}`);
  });
});
