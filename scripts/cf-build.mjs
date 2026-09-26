/**
 * Cloudflare build wrapper.
 *
 * OpenNext bakes whatever `.env.local` holds into the bundle
 * (`.open-next/cloudflare/next-env.mjs`), which would ship real secrets
 * inside the artifact. At runtime the worker's own vars and secrets are
 * written to process.env first and the baked values only fill what is still
 * unset, so blanking the secrets here changes nothing about a correctly
 * configured deploy — it just keeps them out of the build.
 *
 * NEXT_PUBLIC_* values stay: they are inlined into the client bundle at build
 * time and are public by definition.
 *
 * Consequence worth knowing: a deploy that forgets `wrangler secret put` now
 * fails loudly on a missing key instead of quietly using a baked one.
 */
import { spawnSync } from "node:child_process";

const SECRETS = [
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ACCESS_CODE",
  "ACCESS_SALT",
];

const env = { ...process.env };
for (const key of SECRETS) env[key] = "";

const result = spawnSync(
  "npx",
  ["@opennextjs/cloudflare@latest", "build"],
  { stdio: "inherit", env, shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
