# POAR Voice Trainer

Voice-based AI training assistant for learning to explain **P**rosthetics,
**O**rthotics, and **A**ssistive **R**obotics clearly and professionally — with
patient-communication practice.

> **Status:** MVP skeleton (milestone 1). The voice → transcribe → feedback →
> save flow is wired end-to-end, but the AI/persistence logic is stubbed.

## What it does

You pick a practice mode, record yourself answering a prompt out loud, and the
app transcribes your speech, returns AI feedback, and saves the session so you
can track your progress.

### MVP modes

| Mode | Purpose |
| --- | --- |
| **Explain Term** | Define a POAR concept clearly for a non-expert. |
| **Patient Communication** | Explain a device/fitting to a patient with empathy. |
| **Interview Practice** | Answer common interview / case questions. |

### Success metric

> A user can record their voice, transcribe it, receive AI feedback, and save
> the session.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase** — auth + Postgres persistence
- **OpenAI Whisper** — speech-to-text
- **Claude or OpenAI** — feedback generation
- No TTS, no Python in the MVP.

## Project structure

```
src/
  app/
    layout.tsx                 # Shell: header / footer
    page.tsx                   # Landing page
    modes/page.tsx             # Mode selection UI
    session/[mode]/page.tsx    # Session page skeleton
    api/
      transcribe/route.ts      # POST audio -> transcript   (STUB)
      feedback/route.ts        # POST transcript -> feedback (STUB)
      sessions/route.ts        # POST session -> save        (STUB)
  components/
    ModeCard.tsx
    VoiceRecorder.tsx          # MediaRecorder + flow orchestration
  lib/
    modes.ts                   # Shared mode definitions
    supabase/{client,server}.ts
supabase/
  schema.sql                   # Proposed DB schema + RLS
.env.example
```

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   then fill in Supabase + OpenAI/Anthropic keys

# 3. Apply the database schema
#   Paste supabase/schema.sql into the Supabase SQL editor and run it.

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

> The app runs without API keys: the stubbed routes return placeholder
> transcript/feedback so you can exercise the full UI flow.

## Roadmap (next milestones)

- [ ] Implement `/api/transcribe` with OpenAI Whisper.
- [ ] Implement `/api/feedback` with per-mode prompts (Claude/OpenAI).
- [x] Implement transcription (Whisper) + feedback (OpenAI).
- [x] Persist sessions to Supabase.
- [x] Question bank (mode × area) + generator with semantic dedup.
- [x] Structured scoring (clarity, accuracy, professionalism) + progress view.
- [ ] Auth + per-user history (scopes `/progress` to the signed-in user).
- [ ] Session detail view (transcript + feedback).
- [ ] Optional audio retention in Supabase Storage.

## Environment variables

See [`.env.example`](.env.example) for the full list. Summary:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes / reads (secret) |
| `OPENAI_API_KEY` | Whisper transcription + feedback (secret) |
| `FEEDBACK_MODEL` | Optional chat model for feedback (default `gpt-4o-mini`) |

## Deploy (Vercel)

1. Push to GitHub (done: `advien/poar-voice-trainer`).
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
   Framework is auto-detected as Next.js — no config needed.
3. Add the environment variables above under **Settings → Environment
   Variables** (use freshly-rotated keys, never commit them).
4. **Deploy.** The AI routes run on the Node runtime with `maxDuration = 60`.

> The `Supabase keep-alive` GitHub Action is independent of Vercel and keeps
> the free-tier database from pausing. Set its `SUPABASE_URL` /
> `SUPABASE_ANON_KEY` repo secrets separately.
