/**
 * Access gate: one free attempt per visitor, then a hard stop.
 *
 * Why not count in memory: on Cloudflare Workers the app runs as many
 * short-lived isolates, so an in-memory counter would hand out a free attempt
 * per isolate. The count lives in Supabase (`public.free_usage`) so every
 * isolate sees the same number. The in-memory map below is only the fallback
 * for local runs with no Supabase configured.
 *
 * Visitors are identified by a salted hash of their IP — the raw address is
 * never stored. That is enough to stop casual repeat use; it is not meant to
 * defeat someone who changes networks, and it does not need to be.
 *
 * `ACCESS_CODE` is the escape hatch: a request carrying it (cookie or header)
 * skips the gate entirely, so a demo can be handed out without a redeploy.
 */
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";

export const FREE_ATTEMPTS = Number(process.env.FREE_ATTEMPTS ?? 1);

/** Cookie the client stores after redeeming an access code. */
export const ACCESS_COOKIE = "vt_access";

export interface AccessResult {
  /** The caller may proceed. */
  allowed: boolean;
  /** Attempts used after this call (unlimited holders report 0). */
  used: number;
  /** True when the caller holds a valid access code. */
  unlimited: boolean;
}

// -----------------------------------------------------------------------------
// Visitor identity
// -----------------------------------------------------------------------------

/**
 * Best-effort client IP. `cf-connecting-ip` is the one Cloudflare sets and the
 * only one a client cannot spoof through the edge; the rest are fallbacks for
 * other hosts and local runs.
 */
export function visitorIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Salted SHA-256 of the IP, hex-encoded. Web Crypto works in both runtimes. */
export async function visitorHash(request: Request): Promise<string> {
  const salt = process.env.ACCESS_SALT ?? "poar-voice-trainer";
  const data = new TextEncoder().encode(`${salt}:${visitorIp(request)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True when the request carries the access code, as a cookie or a header. */
export function hasAccessCode(request: Request): boolean {
  const code = process.env.ACCESS_CODE;
  if (!code) return false;

  if (request.headers.get("x-access-code") === code) return true;

  const cookie = request.headers.get("cookie") ?? "";
  return cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c === `${ACCESS_COOKIE}=${code}`);
}

// -----------------------------------------------------------------------------
// Counting
// -----------------------------------------------------------------------------

/** Fallback store for local runs without Supabase. Not used in production. */
const localCounts = new Map<string, number>();

async function readCount(hash: string): Promise<number> {
  if (!hasSupabaseAdmin()) return localCounts.get(hash) ?? 0;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("free_usage")
      .select("attempts")
      .eq("visitor_hash", hash)
      .maybeSingle();

    if (error) throw error;
    return (data?.attempts as number | undefined) ?? 0;
  } catch (err) {
    // Degrade, never open. A missing table or an unreachable database must
    // not turn the gate off — fall back to the in-memory count, which is
    // weaker across isolates but still refuses an obvious repeat.
    console.warn("access: falling back to in-memory count", err);
    return localCounts.get(hash) ?? 0;
  }
}

async function writeCount(hash: string, attempts: number): Promise<void> {
  // Always keep the local copy: it is what the fallback path reads.
  localCounts.set(hash, attempts);
  if (!hasSupabaseAdmin()) return;

  try {
    const { error } = await getSupabaseAdmin()
      .from("free_usage")
      .upsert(
        { visitor_hash: hash, attempts, last_seen: new Date().toISOString() },
        { onConflict: "visitor_hash" },
      );
    if (error) throw error;
  } catch (err) {
    console.warn("access: could not persist the attempt count", err);
  }
}

/**
 * Read the caller's standing without spending anything. Use on routes that
 * belong to an attempt already counted elsewhere, so one practice run costs
 * one attempt rather than one per endpoint.
 */
export async function checkAccess(request: Request): Promise<AccessResult> {
  if (hasAccessCode(request)) return { allowed: true, used: 0, unlimited: true };

  const used = await readCount(await visitorHash(request));
  return { allowed: used <= FREE_ATTEMPTS, used, unlimited: false };
}

/**
 * Count one attempt against the caller and say whether it was allowed. Call
 * this once per practice run, on the first expensive step.
 */
export async function consumeAttempt(request: Request): Promise<AccessResult> {
  if (hasAccessCode(request)) return { allowed: true, used: 0, unlimited: true };

  const hash = await visitorHash(request);
  const used = (await readCount(hash)) + 1;
  await writeCount(hash, used);

  return { allowed: used <= FREE_ATTEMPTS, used, unlimited: false };
}

// -----------------------------------------------------------------------------
// Response
// -----------------------------------------------------------------------------

export const GATE_MESSAGE =
  "This is a paid service. You've used your free attempt — for a full demo or access, write to adsnufkin@gmail.com";

/** 402 the client turns into the access dialog. */
export function paymentRequired(): Response {
  return new Response(
    JSON.stringify({ error: GATE_MESSAGE, gate: true }),
    { status: 402, headers: { "Content-Type": "application/json" } },
  );
}
