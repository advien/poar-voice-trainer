# Privacy checklist

Everything the privacy notice touches, and how to check it is still true.
Re-run this whenever the data flow changes — a policy that has drifted from
the code is worse than no policy, because it is a promise that is no longer
kept.

The wording lives in one place, `src/lib/privacy.ts`, so the short notice, the
results line and the full page cannot disagree with each other.

---

## Where the notice appears

| Place | What it says | File |
|---|---|---|
| Before the first recording | Short notice + checkbox, links to the full page | `src/components/ConsentGate.tsx` |
| Under the results | Nothing was saved, closing the page ends it | `src/components/VoiceRecorder.tsx` |
| Footer, every page | Link to the notice | `src/app/layout.tsx` |
| `/privacy` | The full notice | `src/app/privacy/page.tsx` |
| `/progress` | Why there is no history, and where it will live | `src/app/progress/page.tsx` |
| When the free attempt is gone | The gate dialog, with the contact address | `src/components/AccessDialog.tsx` |

---

## Claims, and how to verify each one

### "The recording is not stored"

- [ ] `src/app/api/transcribe/route.ts` passes the file to OpenAI and writes it
      nowhere: no Supabase call, no bucket, no filesystem.
- [ ] No `sessions` table write anywhere: `grep -rn "from(\"sessions\")" src`
      returns nothing.
- [ ] `POST /api/sessions` does not exist: it should 404.

### "No transcript, feedback or scores are kept"

- [ ] `VoiceRecorder` holds the result in component state and posts it nowhere.
- [ ] `grep -rn "transcript" src/app/api` shows it only as a request body and a
      response, never as something written.

### "Only these counters are stored"

- [ ] `free_usage` — visitor hash, attempts, timestamps. `supabase/free_usage.sql`
- [ ] `consent_log` — visitor hash, policy version, date. `supabase/consent_log.sql`
- [ ] `usage_log` — endpoint, model, counts, date. `supabase/usage_log.sql`
- [ ] No table has a column holding content or a raw address.
- [ ] All have RLS enabled with no policies, so only the service-role key
      reaches them.

### "Usage rows describe the service, not the visitor"

- [ ] `usage_log` has no visitor column: `supabase/usage_log.sql` lists
      endpoint, model, counts and a timestamp — nothing else.
- [ ] `recordUsage()` in `src/lib/usage.ts` is never passed a hash, a
      transcript or a request object.
- [ ] `/usage` is behind the access code and carries `robots: noindex`.

### "The IP address itself is never written down"

- [ ] `visitorHash()` in `src/lib/access.ts` hashes `salt:ip` with SHA-256 and
      returns hex; the raw value never leaves the function.
- [ ] `grep -rn "visitorIp\|clientIp" src` shows the address used only for
      hashing and for the in-memory rate limiter.
- [ ] `ACCESS_SALT` is a worker secret, not a literal in the repo.

### "Only functional cookies, and only when you act"

- [ ] `grep -rn "cookies.set" src` shows two sources and no more: the access
      code (`src/app/api/access/route.ts`) and the Supabase session refresh
      (`src/middleware.ts`).
- [ ] An anonymous visit sets none of them.
- [ ] Consent is remembered in `localStorage`, not a cookie.

### "An account holds an email and nothing else yet"

- [ ] No table stores anything against `user_id`: `grep -rn "user_id" src`
      returns nothing.
- [ ] `/account` reads only the signed-in user and the usage summary.

### "No analytics or tracking"

- [ ] No analytics script in `src/app/layout.tsx`.
- [ ] No third-party script tags anywhere: `grep -rn "<script" src`.

---

## When the policy changes

1. Edit `src/app/privacy/page.tsx` and, if the summary changes, the strings in
   `src/lib/privacy.ts`.
2. Bump `POLICY_VERSION` in `src/lib/privacy.ts`.
3. That alone re-asks everyone: the browser copy no longer matches, so the
   checkbox comes back, and consent rows record the new version separately.

---

## Before saved history ships

Sign-in exists; storing practice against it does not, and that is the line the
notice currently draws. Before the first session is saved:

- [ ] The notice says what an account stores (email, saved sessions) and for
      how long — updated *before* the first write, not after.
- [ ] Sessions are written with `user_id` set and read through the anon key
      under RLS — never the service-role key, which bypasses it.
- [ ] A person can delete their account and their sessions themselves, or the
      notice says how to ask.
- [ ] The site's project page stops saying the trial keeps nothing, if that
      ceases to be true.
