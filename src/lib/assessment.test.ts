import { describe, expect, it } from "vitest";
import { AXES, parseAssessment } from "@/lib/assessment";

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
