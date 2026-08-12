# 🎙️ POAR Voice Trainer

**Practice explaining prosthetics, orthotics & assistive robotics — out loud — and get instant AI coaching.**

[![CI](https://github.com/advien/poar-voice-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/advien/poar-voice-trainer/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

> **Live demo:** _deploying — link coming soon_ · Clinicians and students in the
> prosthetics/orthotics/assistive-robotics (POAR) field must explain complex
> devices clearly to patients, peers, and interviewers. This app turns that soft
> skill into deliberate practice: **speak an answer, get it transcribed, scored,
> and coached — then track your progress over time.**

<!-- Screenshots live in docs/ and are embedded once captured. -->

## Why I built it

Explaining a myoelectric prosthesis to an anxious patient, or defending a
clinical decision in an interview, is a *spoken* skill — but there's nowhere to
rehearse it with feedback. POAR Voice Trainer is a focused tool for that: it
listens, transcribes, and gives structured, mode-specific coaching, so a learner
can measurably improve clarity, accuracy, and professionalism.

## Features

- **Three practice modes** — *Explain Term*, *Patient Communication*, *Interview
  Practice*, each with a tailored coaching rubric.
- **Voice → transcript → feedback loop** — record in the browser, transcribe with
  OpenAI Whisper, and get AI coaching in seconds.
- **Structured scoring** — every answer is rated 0–100 on **clarity, accuracy,
  and professionalism**, persisted for trend tracking.
- **Progress tracking** — averages, an over-time trend, and an automatic
  **weakest-area callout** that nudges you toward your lowest-scoring mode.
- **Session history & detail** — revisit any past answer's transcript, feedback,
  and scores, and **repeat the exact question** to try again.
- **Question bank (300+)** tagged by **mode × POAR area** (prosthetics /
  orthotics / robotics), including cross-cutting questions, generated with an
  LLM pipeline that uses **embedding-based semantic dedup**.
- **Review before submit** — recording timer, listen-back, and re-record.

## How it works

```
 ┌── record (MediaRecorder) ──┐
 │                            ▼
 │              POST /api/transcribe  →  OpenAI Whisper  →  transcript
 │                            │
 │                            ▼
 │              POST /api/feedback    →  OpenAI (JSON)   →  coaching + scores
 │                            │
 │                            ▼
 └──────────────  POST /api/sessions  →  Supabase (Postgres + RLS)
                              │
                              ▼
                      /progress  (trends, weak-spot, history)
```

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 14** (App Router, RSC) + **TypeScript** (strict) |
| Styling | **Tailwind CSS** |
| Database | **Supabase** (Postgres + Row-Level Security) |
| Speech-to-text | **OpenAI Whisper** |
| Feedback + scoring | **OpenAI** chat (JSON mode) |
| Hosting | **Vercel** (Node serverless functions) |
| CI | **GitHub Actions** — lint, typecheck, build |

## Notable engineering decisions

- **Lazy API clients** — OpenAI/Supabase clients are constructed per-request, so
  `next build` and CI never need real secrets.
- **Rate limiting + input caps** — per-IP fixed-window limiter on every route,
  plus audio-size (15 MB) and transcript-length caps, to protect API spend on a
  public, unauthenticated demo.
- **RLS by default** — questions are world-readable (active only); sessions are
  locked down; server writes use the service-role key.
- **`no-store` Supabase fetches** — session reads opt out of Next.js's fetch
  Data Cache so `/progress` always reflects the latest rows.
- **Semantic dedup** — the question generator embeds candidates and drops
  near-duplicates by cosine similarity, not just exact-text matches.
- **Free-tier keep-alive** — a daily GitHub Action performs a real DB write via
  a locked-down RPC so the Supabase project never pauses.
- **No auth, by design (MVP)** — this is a single-user tool; `/progress` reads
  all sessions server-side. Auth + per-user scoping is the documented next step.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in Supabase + OpenAI keys

# 3. Apply the database schema (Supabase SQL editor)
#    Run supabase/schema.sql, then supabase/seed.sql, then supabase/keepalive.sql

# 4. Run
npm run dev                  # http://localhost:3000
```

Optional — grow the question bank:

```bash
npm run gen:questions -- --dry-run   # preview generation (no writes)
npm run gen:questions                # generate + insert (needs service_role)
```

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side reads/writes (secret) |
| `OPENAI_API_KEY` | Whisper + feedback (secret) |
| `FEEDBACK_MODEL` | Optional feedback model (default `gpt-4o-mini`) |

## Project structure

```
src/
  app/
    page.tsx                    # Landing
    modes/page.tsx              # Mode selection
    session/[mode]/page.tsx     # Practice session (?q= repeats a question)
    progress/page.tsx           # Trends, weak-spot, history
    progress/[id]/page.tsx      # Session detail
    api/{transcribe,feedback,sessions}/route.ts
  components/{VoiceRecorder,SessionExperience,ModeCard}.tsx
  lib/
    modes.ts  questions.ts  sessions.ts  ratelimit.ts  openai.ts
    supabase/{client,server,admin}.ts
scripts/
  concepts.ts  generate-questions.ts    # LLM question generator + dedup
supabase/
  schema.sql  seed.sql  keepalive.sql    # DDL + RLS, seed, keep-alive RPC
```

## Deploy (Vercel)

1. Import the repo on [vercel.com](https://vercel.com) — Next.js is auto-detected.
2. Add the environment variables above under **Settings → Environment Variables**.
3. Deploy. AI routes run on the Node runtime with `maxDuration = 60`.

The **Supabase keep-alive** GitHub Action is independent of Vercel; set its
`SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets separately.

## Roadmap

- [x] Whisper transcription + OpenAI feedback
- [x] Supabase persistence, question bank (mode × area) with semantic dedup
- [x] Structured scoring + progress view, session detail, question repeat
- [x] Rate limiting, CI, keep-alive, branch protection
- [ ] Auth + per-user history (scope `/progress` to the signed-in user)
- [ ] Unit tests for scoring / rate-limit / dedup
- [ ] Optional audio retention in Supabase Storage

## License

[MIT](LICENSE) © advien
