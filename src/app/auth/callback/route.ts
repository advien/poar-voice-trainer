import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Magic-link callback.
 *
 * Three outcomes: the code exchanges for a session and the person lands in
 * their account; the exchange fails but a valid session already exists (a
 * duplicate click on the same link), which is not worth an error page; or
 * there is no session at all, which sends them back to ask for a fresh link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return NextResponse.redirect(`${origin}${next}`);

  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
