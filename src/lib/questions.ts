import { createClient } from "@/lib/supabase/server";
import type { AreaId, ModeId } from "@/lib/modes";

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
