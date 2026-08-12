import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "@/lib/ratelimit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks with a positive retry-after", () => {
    const key = `k-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks buckets independently per key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true); // b is unaffected
  });

  it("resets once the window elapses", async () => {
    const key = `w-${Math.random()}`;
    expect(rateLimit(key, 1, 40).ok).toBe(true);
    expect(rateLimit(key, 1, 40).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(rateLimit(key, 1, 40).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(
      clientIp(new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } })),
    ).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
