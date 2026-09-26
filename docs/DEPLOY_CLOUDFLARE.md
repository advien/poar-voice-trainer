# Deploying POAR Voice Trainer to Cloudflare Workers

The app runs on Cloudflare Workers through `@opennextjs/cloudflare`, the same
way `research.advien.tech` does, and answers at **`voice-trainer.advien.tech`**.

(`DEPLOY.md` describes the older Vercel route. Pick one — this is the current
one, because the rest of advien.tech already lives on Cloudflare.)

---

## 0. Prerequisites

- [ ] Supabase project with `schema.sql`, `seed.sql`, `keepalive.sql` **and
      `free_usage.sql`** run in the SQL editor. The last one backs the access
      gate; without it the gate falls back to a weaker in-memory count.
- [ ] Keys on hand:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public
  - `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` — secret
  - `ACCESS_SALT` — any long random string; changing it resets everyone's
    free-attempt count
  - `ACCESS_CODE` — the code that bypasses the gate for demos
- [ ] `npx wrangler login` done once on this machine.

---

## 1. Where each value belongs

| Value | Build (`.env.local`) | Worker |
|---|---|---|
| `NEXT_PUBLIC_*` | **yes** — inlined into the client bundle | plaintext var |
| `SUPABASE_SERVICE_ROLE_KEY` | dev only | **secret** |
| `OPENAI_API_KEY` | dev only | **secret** |
| `ACCESS_SALT`, `ACCESS_CODE` | dev only | **secret** |
| `FREE_ATTEMPTS` | optional | plaintext var (default 1) |

`npm run cf:build` deliberately blanks the secret values before building, so
they never land in the bundle (`scripts/cf-build.mjs` explains why). At
runtime the worker's own vars and secrets are written to `process.env` first,
and baked values only fill what is still unset — so the worker's copy always
wins.

---

## 2. First deploy

```bash
npm run cf:build
npm run cf:deploy
```

The first deploy creates the worker and gives it a `*.workers.dev` address.
Open it and check the app renders and a run works end to end before pointing
the real domain at it.

Set the secrets (once per worker):

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ACCESS_SALT
npx wrangler secret put ACCESS_CODE
```

Set the public vars in the dashboard (Workers → poar-voice-trainer → Settings
→ Variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`FREE_ATTEMPTS` if it should differ from 1. `keep_vars = true` in
`wrangler.toml` stops the next deploy from wiping them.

---

## 3. Custom domain

Workers → the worker → Settings → Domains & Routes → Add → Custom Domain →
`voice-trainer.advien.tech`. Cloudflare creates the DNS record itself, since
the zone is already there.

Once the domain answers, consider turning the service address off so the app
is reachable at one URL only — add to `wrangler.toml`:

```toml
workers_dev = false
```

---

## 4. Supabase auth

Sign-in is by one-time link, and accounts are invitation-only:

- Authentication → Providers → Email: sign-ups **off**. The app also passes
  `shouldCreateUser: false`, so a stray link cannot create an account.
- Authentication → Users → add your own address by hand.
- Authentication → URL Configuration → Redirect URLs must include
  `https://voice-trainer.advien.tech/auth/callback` (and the local address
  while testing). Without it Supabase refuses to send the link.

---

## 5. Access gate

One free run per visitor, then a 402 that the UI turns into a dialog. See
`src/lib/access.ts`.

To hand someone a demo, give them the code and have them redeem it:

```bash
curl -X POST https://voice-trainer.advien.tech/api/access \
  -H 'Content-Type: application/json' \
  -d '{"code":"<ACCESS_CODE>"}' -c cookies.txt
```

In a browser there is a form: the locked `/usage` page and the gate dialog
both take the code and set the cookie for 30 days.

To reset everyone's allowance, rotate `ACCESS_SALT` — every visitor hashes to
a new key and starts fresh.

---

## 6. Afterwards

- [ ] `demo:` link added to the project page on advien.tech
- [ ] the MedTech board badge flipped from `demo pending` to `live`
