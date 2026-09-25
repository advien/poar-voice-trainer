// =============================================================================
// @opennextjs/cloudflare configuration
//
// Build:   `npm run cf:build`    — produces a Cloudflare Worker bundle
// Preview: `npm run cf:preview`  — runs that bundle locally via Wrangler
// Deploy:  `npm run cf:deploy`   — ships it to Cloudflare
//
// Deliberately empty: the app needs no Cloudflare bindings today. R2 for the
// incremental cache or KV for the tag cache can be wired in here later without
// touching the app itself.
// =============================================================================

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
