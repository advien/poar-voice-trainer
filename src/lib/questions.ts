import { createClient } from "@/lib/supabase/server";
import type { AreaId, ModeId } from "@/lib/modes";
import {
  parseChecklistItems,
  type ChecklistItem,
  type ChecklistReview,
} from "@/lib/assessment";

export interface Question {
  id: string;
  mode: ModeId;
  areas: AreaId[];
  prompt: string;
}

/**
 * Fetch active questions for a given mode from Supabase. Each question
 * carries one or more POAR area tags; filtering by selected areas happens
 * client-side (the pool per mode is small).
 *
 * Returns an empty array if Supabase isn't configured yet or the read
 * fails, so the session page can gracefully fall back to a static prompt.
 */
export async function getQuestionsForMode(mode: ModeId): Promise<Question[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id, mode, areas, prompt")
      .eq("mode", mode)
      .eq("is_active", true);

    if (error || !data) return [];
    return data as Question[];
  } catch {
    return [];
  }
}

export interface Checklist {
  items: ChecklistItem[];
  review: ChecklistReview;
}

export interface QuestionContext {
  id: string;
  prompt: string;
  /** Null for a question without a checklist, which then sits out of the statistics. */
  checklist: Checklist | null;
}

/**
 * A question as the server knows it, looked up by the id the client sent. The
 * feedback route uses this instead of trusting the client's own copy of the
 * prompt, and it is the only place a checklist comes from: items are never
 * accepted from a request.
 *
 * Null when the id is missing, malformed, unknown, or belongs to another mode —
 * the caller then coaches against the mode's generic prompt, as before.
 */
export async function getQuestionContext(
  questionId: string | undefined,
  mode: ModeId,
): Promise<QuestionContext | null> {
  if (!questionId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    const { data: question, error } = await supabase
      .from("questions")
      .select("id, prompt")
      .eq("id", questionId)
      .eq("mode", mode)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !question) return null;

    const { data: row } = await supabase
      .from("question_checklists")
      .select("items, review_status")
      .eq("question_id", question.id)
      .maybeSingle();

    const items = parseChecklistItems(row?.items);
    return {
      id: question.id as string,
      prompt: question.prompt as string,
      checklist:
        items.length > 0
          ? {
              items,
              review:
                row?.review_status === "clinician_reviewed"
                  ? "clinician_reviewed"
                  : "derived_from_source",
            }
          : null,
    };
  } catch {
    return null;
  }
}
