import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/sessions
 * Body: { mode, area?, questionId?, prompt?, transcript, feedback }
 * Returns: { id: string, persisted: boolean }
 *
 * MVP has no auth, so writes go through the service-role key (server-side)
 * and user_id is left null. If Supabase isn't configured yet, we return a
 * generated id with persisted=false so the UI flow still works.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    mode?: string;
    areas?: string[] | null;
    questionId?: string | null;
    prompt?: string | null;
    transcript?: string;
    feedback?: string;
  };

  if (!body.mode || !body.transcript) {
    return NextResponse.json(
      { error: "Missing mode or transcript." },
      { status: 400 },
    );
  }

  if (!hasSupabaseAdmin()) {
    // Supabase not configured — keep the flow working without persistence.
    return NextResponse.json({ id: crypto.randomUUID(), persisted: false });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("sessions")
      .insert({
        mode: body.mode,
        areas: body.areas ?? null,
        question_id: body.questionId ?? null,
        prompt: body.prompt ?? null,
        transcript: body.transcript,
        feedback: body.feedback ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, persisted: true });
  } catch (err) {
    console.error("Saving session failed:", err);
    return NextResponse.json({ error: "Saving session failed." }, { status: 502 });
  }
}
