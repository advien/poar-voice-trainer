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
- Record in the browser → transcribe with Whisper → coaching in seconds.
- A question bank of 300+ prompts tagged by mode × POAR area, generated with an
  LLM pipeline that drops near-duplicates by embedding similarity.
- **Nothing is stored**: no audio, no transcript, no scores. Results live in the
  open tab and end with it.
- One free run per visitor, then a hard stop, so a public voice app cannot drain
  the API budget.
- Sign-in by one-time link (invitation-only), and a private page showing what
  the service costs to run.

Two decisions in v1 are worth explaining, because both were reversals.

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

### v2 — next

**Make the feedback honest, then let it accumulate.**

1. **Replace the 0–100 scores.** They are the weakest thing in v1: three numbers
   with no stated basis, which nobody can reproduce and everybody reads as a
   grade. They become three named levels per axis (*solid / needs work /
   missing*) plus one concrete instruction for the next attempt. Three levels
   are something a model applies consistently; a hundred gradations are not. It
   also changes what the tool feels like — a coach pointing at the next move
   rather than an examiner handing back a mark.

2. **History in the account.** Attempts are saved against the signed-in user —
   question, date, per-axis level, the instruction — read through the anon key
   under RLS, never the service-role key that caused the v1 leak.

3. **Transcripts expire after two days.** Long enough to re-read yesterday's
   answer, short enough that the app is not a library of recorded speech. A
   scheduled job deletes them; the verdicts stay. The privacy notice is updated
   *before* the first row is written, not after.

4. **Trends worth reading.** Not an average score over time, but counts: how
   often each axis needed work, and whether that is falling. A number you can
   act on beats a number you can only feel bad about.

5. **Gap analysis against reference answers** — the point of the whole thing,
   and deliberately last. Each question gets a checklist of the elements a good
   answer covers; the model reports *covered / partial / missing* per element;
   the account shows the pattern: "you skip the follow-up plan in 7 answers out
   of 9." It comes last because it depends on everything above — on the stored
   attempts of step 2, and on checklists that have to be researched and written
   rather than invented. Questions without a checklist keep working as they do
   now and simply sit out of the statistics.

Each checklist will carry its source and a status saying whether a clinician has
reviewed it. Without that provenance the tool would be asserting clinical
standards on no authority, which is not something to do quietly in a medical
domain.

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
`keepalive.sql`, then `free_usage.sql`, `consent_log.sql` and `usage_log.sql`.

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
    progress/page.tsx           # Why there is no history yet
    login/page.tsx              # Magic-link sign-in
    account/page.tsx            # Signed-in area
    usage/page.tsx              # Running cost (access code)
    api/{transcribe,feedback,consent,access}/route.ts
  components/{VoiceRecorder,ConsentGate,AccessDialog,AccessCodeForm,…}.tsx
  lib/
    modes.ts  questions.ts  access.ts  usage.ts  privacy.ts
    ratelimit.ts  openai.ts  supabase/{client,server,admin}.ts
  middleware.ts                 # Session refresh + /account guard
supabase/
  schema.sql  seed.sql  keepalive.sql
  free_usage.sql  consent_log.sql  usage_log.sql
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
