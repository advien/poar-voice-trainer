import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/access";

export const runtime = "nodejs";

/**
 * POST /api/access  { code: string }
 *
 * Redeems an access code: on a match the caller gets a cookie that the gate
 * honours, so a demo can be handed out without a redeploy. Wrong codes are
 * refused without saying which part was wrong, and the response is never
 * cached.
 */
export async function POST(request: Request) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    return NextResponse.json(
      { error: "Access codes are not configured." },
      { status: 404 },
    );
  }

  const { code } = (await request.json().catch(() => ({}))) as {
    code?: string;
  };

  if (!code || code !== expected) {
    return NextResponse.json({ error: "Invalid code." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
