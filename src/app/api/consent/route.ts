import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { visitorHash } from "@/lib/access";
import { POLICY_VERSION } from "@/lib/privacy";

export const runtime = "nodejs";

/**
 * POST /api/consent
 *
 * Records that this visitor accepted the privacy notice, and which version.
 * The browser remembers it too, but local storage is the visitor's to clear —
 * this row is the durable copy, should the question ever be asked.
 *
 * It holds a salted hash, a version and a date. No content, no address, no
 * identifier that points back at a person.
 */
export async function POST(request: Request) {
  const { version } = (await request.json().catch(() => ({}))) as {
    version?: string;
  };

  // Only the version this build actually serves can be consented to.
  if (version !== POLICY_VERSION) {
    return NextResponse.json({ error: "Unknown policy version." }, { status: 400 });
  }

  if (!hasSupabaseAdmin()) {
    // No database configured (local runs): the browser copy still applies.
    return NextResponse.json({ ok: true, logged: false });
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from("consent_log")
      .upsert(
        {
          visitor_hash: await visitorHash(request),
          policy_version: POLICY_VERSION,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "visitor_hash,policy_version" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true, logged: true });
  } catch (err) {
    // Never block the person over bookkeeping: they said yes either way.
    console.warn("consent: could not record acceptance", err);
    return NextResponse.json({ ok: true, logged: false });
  }
}
