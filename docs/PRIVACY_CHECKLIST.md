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

### "Only two counters are stored"

- [ ] `free_usage` — visitor hash, attempts, timestamps. `supabase/free_usage.sql`
- [ ] `consent_log` — visitor hash, policy version, date. `supabase/consent_log.sql`
- [ ] Neither table has a column holding content or a raw address.
- [ ] Both have RLS enabled with no policies, so only the service-role key
      reaches them.

### "The IP address itself is never written down"

- [ ] `visitorHash()` in `src/lib/access.ts` hashes `salt:ip` with SHA-256 and
      returns hex; the raw value never leaves the function.
- [ ] `grep -rn "visitorIp\|clientIp" src` shows the address used only for
      hashing and for the in-memory rate limiter.
- [ ] `ACCESS_SALT` is a worker secret, not a literal in the repo.

### "One cookie, and only with an access code"

- [ ] The only `cookies.set` is in `src/app/api/access/route.ts`.
- [ ] Consent is remembered in `localStorage`, not a cookie.

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

## Before accounts ship

Accounts change every answer above. Before the first account exists:

- [ ] The notice says what an account stores (email, saved sessions) and for
      how long.
- [ ] Sessions are written with `user_id` set and read through the anon key
      under RLS — never the service-role key, which bypasses it.
- [ ] A person can delete their account and their sessions themselves, or the
      notice says how to ask.
