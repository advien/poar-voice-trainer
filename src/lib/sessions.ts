import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import type { AreaId, ModeId } from "@/lib/modes";

export interface SessionRow {
  id: string;
  mode: ModeId;
  areas: AreaId[] | null;
  prompt: string | null;
  clarity_score: number | null;
  accuracy_score: number | null;
  professionalism_score: number | null;
  created_at: string;
}

/**
 * Read recent sessions (newest first) via the service-role key.
 *
 * NOTE: the MVP has no auth, so this returns ALL sessions — effectively the
 * single user's history. When auth lands, scope this to auth.uid() and read
 * with the user's own client so RLS applies.
 */
export async function getRecentSessions(limit = 50): Promise<SessionRow[]> {
  if (!hasSupabaseAdmin()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("sessions")
      .select(
        "id, mode, areas, prompt, clarity_score, accuracy_score, professionalism_score, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as SessionRow[];
  } catch {
    return [];
  }
}

/** Overall score = mean of the three sub-scores, or null if unscored. */
export function overallScore(s: SessionRow): number | null {
  const parts = [s.clarity_score, s.accuracy_score, s.professionalism_score];
  if (parts.some((p) => p == null)) return null;
  return Math.round((parts as number[]).reduce((a, b) => a + b, 0) / 3);
}

export interface ScoreAverages {
  clarity: number;
  accuracy: number;
  professionalism: number;
  overall: number;
  scored: number;
}

/** Average each sub-score across sessions that were scored. */
export function averageScores(rows: SessionRow[]): ScoreAverages | null {
  const scored = rows.filter((r) => overallScore(r) != null);
  if (scored.length === 0) return null;
  const mean = (pick: (r: SessionRow) => number) =>
    Math.round(scored.reduce((a, r) => a + pick(r), 0) / scored.length);
  return {
    clarity: mean((r) => r.clarity_score!),
    accuracy: mean((r) => r.accuracy_score!),
    professionalism: mean((r) => r.professionalism_score!),
    overall: Math.round(
      scored.reduce((a, r) => a + (overallScore(r) as number), 0) /
        scored.length,
    ),
    scored: scored.length,
  };
}
