# Handoff — Auth swapped to Supabase + deployed (2026-07-16)

Read `omnis-redesign-state` memory + `CONNECTION_ATLAS.md` first. This doc covers
only what THIS session changed. A parallel session shares the branch and owns
`packages/mobile` + the email-template + daily-kin work — **commit by explicit
path only, never `git add -A`.**

## TL;DR

Web auth left Auth0 for **Supabase Auth** and is **LIVE on pleiad.io** (worker
`c7b1613f`). Login is email+password + Google on the white "Two Circles Studios"
card. The 9 prod users were migrated off Auth0 ids. One thing built this session
is committed+pushed but **NOT yet deployed**: the Resend error-alerting (it was
blocked behind the parallel session's daily-kin WIP, which is now fixed — tree is
green, so a plain `./scripts/deploy-prod.sh` ships it).

## What shipped (all pushed on `redesign/knowledge-experience`)

Auth commits `eb94e0c`→`e6decc3`, hardening `3727bfd`, alerts `bfc1ba4`:

- **Auth0 → Supabase.** `@auth0/nextjs-auth0` removed; `auth0.ts`,
  `auth-connections.ts`, `bearer-auth.ts` deleted. `auth-server.ts` kept its
  exact API (`getSession`/`requireUserId`/`UnauthorizedError`) so **no route or
  repo changed** — the seam did its job. Cookies for web, `Bearer` for native,
  both yield the Supabase user id.
- **Why we left Auth0:** the shared tenant's split made an empty `pleiad-users`
  connection no existing account was in → login impossible; buying out cost more
  for less. Details in `[[auth0-tenant-shared]]`.
- **Login = email+password + Google.** Magic-link was tried then dropped; the
  user reverted "detach from OAuth" (Google was needed). Page restyled to the
  white Two Circles card (`src/app/login/page.tsx`).
- **Perf:** tokens are ES256 → `auth-server.ts` + `middleware.ts` verify LOCALLY
  with `getClaims()`, not a network `getUser()` (that added ~400ms/req). The
  remaining slowness is the DB being in **Sydney** (ap-southeast-2), ~400ms/req
  from Israel — region move needs a NEW project (Supabase can't relocate;
  free-project cap=2 already hit), so it's PARKED.
- **Hardening (pre-deploy readiness playbook, gates 2/5/6):** added `error.tsx`,
  `global-error.tsx`, `not-found.tsx` (there were none); applied the existing
  `authenticatedApi` rate limiter to people/relationships write routes;
  `otp_expiry` 3600→1800 (30-min links).
- **Alerting (gate 8) — `src/lib/alerts.ts` + `respond.ts`:** `handleApiError`'s
  500 branch now emails `ALERT_EMAIL` (default `hi@saharbarak.dev`) via the
  existing Resend sender, throttled 1/key/10min, fire-and-forget. **Proven
  deliverable** (real send returned a Resend id) but **only runs on the deployed
  worker — needs a deploy to be live on prod.**

## Supabase project facts

- Project `vgqncswfgetxwujrfavb` (the SAME one that hosts the Postgres DB), org
  `aobzlunjxjfmrloqwzhr`, region Sydney. CLI is linked.
- Config in `supabase/config.toml`. `supabase config push` applies auth then
  **errors on an unrelated Storage schema bug** (`databasePoolMode`) — auth still
  lands ("Remote Auth config is up to date"), ignore the storage error.
- Redirect allow-list needs `**` wildcards or the app's `?redirectTo=` query
  breaks the match and gotrue falls back to site_url.
- Google: reused the OLD Supabase project's Google OAuth client, added
  `vgqncswfgetxwujrfavb.supabase.co/auth/v1/callback`. Enabled in dashboard.
- Worker secrets set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (via `scripts/set-prod-secrets.sh`). `DATABASE_URL`
  was already there.

## Migration (DONE)

`scripts/migrate-auth0-to-supabase.mjs --apply` ran. 7 Auth0 subs → Supabase
UUIDs keyed by email (incl. real user `lita`'s 4 people). Snapshot at
`scratchpad/pre-migration-snapshot.json`. Cleaned my own test pollution first
(13→10 users + 2 stray "Alice Secret" rows). **2 empty-email rows LEFT** (5
people, no email to key on) — a human decision: attach or drop.

## OPEN / NEXT

1. **Deploy the alert commit** — tree is green now, `./scripts/deploy-prod.sh`
   (user-gated). Until then, prod 500s don't email anyone.
2. **Existing users reset password once** — Auth0 hashes can't export. Or Google.
3. **Google real-click on prod** — authorize leg verified; the consent click
   needs a human.
4. **2 empty-email orphan rows** — decide attach vs drop.
5. **DB region move to EU** — parked on the free-project cap; folds into a future
   project migration.

## Guardrails (auto-mode)

Secret-store writes, DB migration `--apply`, and production deploy are all
classifier-blocked in auto mode — the user runs them via `!`. Everything else
(reads, builds, code) is fine.

## Also this session (not Pleiad code)

Transcribed IG reel DYSOYhQtDBX locally (yt-dlp + faster-whisper), built
`playbooks/pre-deploy-readiness.md` + the transcript in
**SaharBarak/skills-and-workflows** (pushed as SaharBarak).
