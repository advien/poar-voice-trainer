> **Superseded.** The app runs on Cloudflare Workers — see
> [DEPLOY_CLOUDFLARE.md](DEPLOY_CLOUDFLARE.md). This guide is kept because the
> Vercel route still works if it is ever needed, but nothing here is current:
> the domain, the environment variables and the gate have all moved on.

# Deploying POAR Voice Trainer to Vercel

Step-by-step guide to put the app live at **`poar.advien.tech`**.

---

## 0. Prerequisites

- [ ] Supabase project created, with `schema.sql`, `seed.sql`, and
      `keepalive.sql` already run in the SQL editor.
- [ ] Keys on hand (ideally **freshly rotated**):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - `SUPABASE_SERVICE_ROLE_KEY` (secret)
  - `OPENAI_API_KEY` (secret)
- [ ] The repo is on GitHub: `advien/poar-voice-trainer`.

---

## 1. Import the project

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → select `advien/poar-voice-trainer`.
3. Vercel auto-detects **Next.js** — leave Build & Output settings at defaults
   (`npm run build`, output handled by the Next adapter). Don't override them.

---

## 2. Environment variables

Add these under **Project → Settings → Environment Variables**. Apply each to
**Production** and **Preview** (so PR/`develop` preview deploys work too).

| Name | Value | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (secret) | Production + Preview |
| `OPENAI_API_KEY` | OpenAI key (secret) | Production + Preview |
| `FEEDBACK_MODEL` | `gpt-4o-mini` (optional) | Production + Preview |

> Never commit these. `.env.local` stays local; Vercel injects them at build
> and runtime.

---

## 3. Region (latency)

Supabase runs in the EU, so keep the serverless functions nearby:

- **Settings → Functions → Function Region → `fra1` (Frankfurt)**.

Not required, but it noticeably cuts round-trip time to the database.

---

## 4. Deploy

Click **Deploy**. First build takes ~1–2 minutes. The AI routes
(`/api/transcribe`, `/api/feedback`) run on the Node runtime with
`maxDuration = 60`, so Whisper/feedback won't hit the default timeout.

**Production branch:** Settings → Git → set the **Production Branch** to `main`.
That matches the repo's flow — `main` deploys to production; `develop` and PRs
get preview URLs automatically.

---

## 5. Custom domain — `poar.advien.tech`

1. **Vercel → Project → Settings → Domains → Add** → enter `poar.advien.tech`.
2. Vercel shows a DNS record to create — a **CNAME**:

   ```
   Type:  CNAME
   Name:  poar          (the subdomain part, on advien.tech)
   Value: cname.vercel-dns.com
   ```

3. Add that CNAME at your DNS provider for `advien.tech` (same place the
   `research` subdomain is configured).
4. Back in Vercel, the domain flips to **Valid** once DNS propagates (minutes to
   an hour). HTTPS is provisioned automatically.

Result: the app is live at `https://poar.advien.tech`.

---

## 6. Post-deploy checklist

Open `https://poar.advien.tech` and verify:

- [ ] Landing page renders; **Practice modes** and **Progress** nav work.
- [ ] `/modes` shows the three modes.
- [ ] A session page shows a **question from the bank** (area chips + tag) —
      confirms Supabase reads work in production.
- [ ] Record a short answer → transcript + **feedback with scores** appear —
      confirms Whisper + OpenAI work with the prod keys.
- [ ] `/progress` shows the new session, averages, and the **Focus area**
      callout — confirms the service-role write path.
- [ ] Click a session → detail page with transcript/feedback + **Practice
      again**.

Mic note: browsers only allow `getUserMedia` on **HTTPS** — Vercel serves HTTPS,
so recording works in production (unlike plain-HTTP hosts).

---

## 7. Keep-alive (separate from Vercel)

The `Supabase keep-alive` GitHub Action keeps the free-tier DB from pausing. It
needs its own repo secrets (**Settings → Secrets and variables → Actions**):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`

It runs daily and is independent of the Vercel deployment.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Build fails on env access | A referenced env var is missing in Vercel — clients are lazy, but double-check names match exactly. |
| `500` on `/api/feedback` or `/api/transcribe` | `OPENAI_API_KEY` missing/invalid in Vercel. |
| Session saves return `persisted: false` | `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel. |
| `/progress` empty despite saved sessions | Service-role key wrong, or RLS blocking — check the key and that `schema.sql` ran. |
| Function timeout on long recordings | Already mitigated (`maxDuration = 60`); keep answers under ~5 min (client auto-stops). |
| Mic blocked | Ensure you're on the `https://` URL, not a preview opened over http. |
