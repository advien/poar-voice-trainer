# 🎙️ POAR Voice Trainer

**Practice explaining prosthetics, orthotics & assistive robotics — out loud — and get structured coaching back.**

[![CI](https://github.com/advien/poar-voice-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/advien/poar-voice-trainer/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

**Live:** [voice-trainer.advien.tech](https://voice-trainer.advien.tech) — one free run per visitor, no sign-up.

Clinicians and students in the prosthetics / orthotics / assistive-robotics
(POAR) field have to explain complex devices clearly to patients, peers and
interviewers. That is a *spoken* skill, and there is nowhere to rehearse it with
feedback. This app is that place: speak an answer, get it transcribed and
coached against a rubric, try again.

---

## Versions

The project ships in stages. What follows is what each stage does and **why it
is drawn that way** — the reasoning matters more than the feature list.

### v1 — shipped

**The loop works, and it keeps nothing.**

- Three practice modes — *Explain Term*, *Patient Communication*, *Interview
  Practice* — each with its own coaching rubric.
- Record in the browser → transcribe with Whisper → coaching in seconds:
  each axis comes back as *solid / needs work / missing* with a sentence naming
  what was said, plus one instruction for the next attempt.
- A question bank of 300+ prompts tagged by mode × POAR area, generated with an
  LLM pipeline that drops near-duplicates by embedding similarity.
- **The open trial stores nothing**: no audio, no transcript, no result; they
  live in the open tab and end with it. Signed in, the coaching is saved to
  your history and the transcript is deleted after two days.
- One free run per visitor, then a hard stop, so a public voice app cannot drain
  the API budget.
- Sign-in by one-time link (invitation-only), and a private page showing what
  the service costs to run.

Three decisions in v1 are worth explaining, because all three were reversals.

**Why nothing is stored.** Sessions used to be saved. They were written with the
service-role key — which bypasses row-level security — and read back without a
filter, so the progress page showed every visitor the transcripts of what other
people had said out loud. The fix was not to scope the query. It was to stop
keeping the data: a trial that stores nothing cannot leak anything, and the
privacy notice can then say something simple and true.

**Why the gate lives in the API, not the interface.** A dialog saying "you have
used your free run" is theatre — the endpoints are reachable directly. The count
is enforced in the route handlers and stored in the database, because an
in-memory counter on Cloudflare hands out one free run *per edge isolate*.

**Why there are no scores.** The axes used to come back as numbers from 0 to
100. Nothing justified that precision — a model will not reproduce 71 against
76 on the same answer — and a learner reads any number as a grade, which is the
dynamic a practice tool should avoid. Three named levels are something a model
applies consistently, and the criterion each axis is judged on is shown to the
learner rather than living only in the prompt.

### v2 — next

**Let the feedback accumulate, then measure what is missing.**

1. ~~**History in the account.**~~ Done. Attempts are saved against the
   signed-in user — question, date, per-axis level, the instruction — read
   through the anon key under RLS, never the service-role key that caused the
   v1 leak.

2. ~~**Transcripts expire after two days.**~~ Done. Long enough to re-read
   yesterday's answer, short enough that the app is not a library of recorded
   speech. A scheduled job empties the column and leaves the row; the privacy
   notice was updated before the first one was written.

3. ~~**Trends worth reading.**~~ Done. Not an average over time but a count:
   how often each axis needed work. A number you can act on beats a number you
   can only feel bad about.

4. **Gap analysis against reference answers** — the point of the whole thing,
   and deliberately last. Each question gets a checklist of the elements a good
   answer covers; the model reports *covered / partial / missing* per element;
   the account shows the pattern: "you skip the follow-up plan in 7 answers out
   of 9." It comes last because it depends on everything above — on the stored
   attempts of step 1, and on checklists that have to be researched and written
   rather than invented. Questions without a checklist keep working as they do
   now and simply sit out of the statistics.

Each checklist will carry its source and a status saying whether a clinician has
reviewed it. Without that provenance the tool would be asserting clinical
standards on no authority, which is not something to do quietly in a medical
domain.

5. **Interview questions from employers, not examiners.** The bank was
   generated from a prompt asking what "an examiner might ask", which shows:
   the questions read like a viva rather than a job interview. Rewriting that
   means sourcing real questions, so it waits alongside the checklists above.

---

## How it works

```
 ┌── record (MediaRecorder) ───┐
 │                             ▼
 │      POST /api/transcribe  →  gate (one free run)  →  OpenAI Whisper
 │                             │
 │                             ▼
 │      POST /api/feedback    →  gate check  →  OpenAI (JSON)  →  coaching
 │                             │
 └─────────────────────────────┘
                               │
                               ▼
                     shown in the page, then gone
```

Supabase holds three small tables and no user content: attempts against the free
allowance, acceptance of the privacy notice, and per-call OpenAI consumption.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router, RSC) + **TypeScript** (strict) |
| Styling | **Tailwind CSS** |
| Database | **Supabase** (Postgres + Row-Level Security) |
| Auth | Supabase magic link, sign-up disabled |
| Speech-to-text | **OpenAI Whisper** |
| Coaching | **OpenAI** chat (JSON mode) |
| Hosting | **Cloudflare Workers** via `@opennextjs/cloudflare` |
| CI | **GitHub Actions** — lint, typecheck, build |

## Notable engineering decisions

- **The gate degrades, never opens.** If the counter table is missing or the
  database is unreachable, the limiter falls back to an in-memory count rather
  than letting everyone through. A forgotten migration must not silently disable
  a spend control.
- **Visitors are a salted hash.** The free-run counter is keyed by
  `sha256(salt + IP)`; the address itself is never written down. The salt is a
  worker secret, and rotating it resets everyone's allowance.
- **Secrets stay out of the bundle.** OpenNext bakes `.env.local` into the build
  output, which would ship the OpenAI and service-role keys inside the artifact.
  `npm run cf:build` blanks them first, so a misconfigured deploy fails loudly
  instead of quietly running on a baked key.
- **One source of wording for the privacy notice.** The short notice, the line
  under the results and the full page all read from `src/lib/privacy.ts`, and
  consent rows record the policy version they were given against. Bumping the
  version re-asks everyone.
- **Metering describes the service, not the user.** Each paid call records its
  model and counts; no hash, no transcript, nothing tying a call to a person.
- **Rate limiting + input caps** — a per-IP limiter on every route, a 15 MB
  audio cap and a transcript-length cap.
- **Semantic dedup** — the question generator embeds candidates and drops
  near-duplicates by cosine similarity, not just exact matches.

## Getting started

```bash
npm install
cp .env.example .env.local        # Supabase + OpenAI keys, gate salt and code
npm run dev                       # http://localhost:3000
```

In the Supabase SQL editor run `supabase/schema.sql`, `seed.sql`,
`keepalive.sql`, then `free_usage.sql`, `consent_log.sql`, `usage_log.sql`,
`attempts.sql` (needs `pg_cron`) and `checklists.sql`. `checklist_seed.sql` goes
last, and again after every reseed of the questions.

Grow the question bank:

```bash
npm run gen:questions -- --dry-run   # preview (no writes)
npm run gen:questions                # generate + insert (needs service_role)
```

## Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes (secret) |
| `OPENAI_API_KEY` | Whisper + coaching (secret) |
| `FEEDBACK_MODEL` | Optional coaching model (default `gpt-4o-mini`) |
| `FREE_ATTEMPTS` | Free runs per visitor (default 1) |
| `ACCESS_SALT` | Salt for the visitor hash (secret) |
| `ACCESS_CODE` | Bypasses the gate for demos (secret) |

## Project structure

```
src/
  app/
    page.tsx                    # Landing
    modes/page.tsx              # Mode selection
    session/[mode]/page.tsx     # Practice session (?q= repeats a question)
    privacy/page.tsx            # The full notice
    progress/page.tsx           # Where progress lives (the account)
    login/page.tsx              # Magic-link sign-in
    account/page.tsx            # Signed-in area
    usage/page.tsx              # Running cost (access code)
    api/{transcribe,feedback,consent,access}/route.ts
  components/{VoiceRecorder,AttemptHistory,ConsentGate,AccessDialog,…}.tsx
  lib/
    modes.ts  questions.ts  access.ts  usage.ts  privacy.ts
    assessment.ts  attempts.ts
    ratelimit.ts  openai.ts  supabase/{client,server,admin}.ts
  middleware.ts                 # Session refresh + /account guard
supabase/
  schema.sql  seed.sql  keepalive.sql
  free_usage.sql  consent_log.sql  usage_log.sql
  attempts.sql  checklists.sql  checklist_seed.sql
docs/
  DEPLOY_CLOUDFLARE.md  PRIVACY_CHECKLIST.md
```

## Deploy

**[docs/DEPLOY_CLOUDFLARE.md](docs/DEPLOY_CLOUDFLARE.md)** — secrets, build
variables, custom domain, Supabase auth configuration.

```bash
npm run cf:build
npm run cf:deploy
```

## Privacy

The trial keeps nothing, and [docs/PRIVACY_CHECKLIST.md](docs/PRIVACY_CHECKLIST.md)
lists every claim in the notice with the command that verifies it. Run it
whenever the data flow changes: a policy that has drifted from the code is worse
than no policy, because it is a promise no longer kept.

## Acknowledgements

Practice questions are **AI-generated** and grounded in standard POAR
terminology catalogued by open professional glossaries — the
[AAOP Research Glossary](https://www.oandp.org/page/research-glossary),
[ISPO](https://www.ispoint.org/), and
[AOPA](https://aopanet.org/resources/glossary-of-terms/). Only factual term
names were used as generation seeds; all prompt text is original.

## License

[MIT](LICENSE) © Di Vien
