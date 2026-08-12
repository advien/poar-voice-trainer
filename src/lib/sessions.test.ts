import { describe, it, expect } from "vitest";
import {
  overallScore,
  averageScores,
  modeAverages,
  weakestMode,
  type SessionRow,
} from "@/lib/sessions";

function row(p: Partial<SessionRow>): SessionRow {
  return {
    id: "x",
    mode: "interview",
    areas: null,
    prompt: null,
    clarity_score: null,
    accuracy_score: null,
    professionalism_score: null,
    created_at: "2026-01-01T00:00:00Z",
    ...p,
  };
}

describe("overallScore", () => {
  it("averages the three sub-scores", () => {
    expect(
      overallScore(
        row({ clarity_score: 80, accuracy_score: 70, professionalism_score: 90 }),
      ),
    ).toBe(80);
  });

  it("is null when any sub-score is missing", () => {
    expect(
      overallScore(row({ clarity_score: 80, accuracy_score: 70 })),
    ).toBeNull();
  });
});

describe("averageScores", () => {
  it("returns null when nothing is scored", () => {
    expect(averageScores([row({})])).toBeNull();
  });

  it("averages scored sessions only and counts them", () => {
    const rows = [
      row({ clarity_score: 90, accuracy_score: 90, professionalism_score: 90 }),
      row({ clarity_score: 70, accuracy_score: 70, professionalism_score: 70 }),
      row({}), // unscored → ignored
    ];
    const a = averageScores(rows)!;
    expect(a.scored).toBe(2);
    expect(a.overall).toBe(80);
    expect(a.clarity).toBe(80);
  });
});

describe("modeAverages / weakestMode", () => {
  it("ranks modes ascending and flags the weakest", () => {
    const rows = [
      row({
        mode: "interview",
        clarity_score: 90,
        accuracy_score: 90,
        professionalism_score: 90,
      }),
      row({
        mode: "patient-communication",
        clarity_score: 60,
        accuracy_score: 60,
        professionalism_score: 60,
      }),
      row({
        mode: "patient-communication",
        clarity_score: 70,
        accuracy_score: 70,
        professionalism_score: 70,
      }),
    ];
    const ranked = modeAverages(rows);
    expect(ranked[0].mode).toBe("patient-communication");
    expect(ranked[0].overall).toBe(65);
    expect(ranked[0].count).toBe(2);
    expect(weakestMode(rows)?.mode).toBe("patient-communication");
  });

  it("returns null weakest when nothing is scored", () => {
    expect(weakestMode([row({})])).toBeNull();
  });
});
