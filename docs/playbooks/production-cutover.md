# Production Cutover — Pleiad (dev/sandbox → production)

> Everything is currently **dev/sandbox**: Auth0 dev tenant
> (`dev-kaipd4klyg48p0ai.us`), Paddle **sandbox**, Supabase dev, PostHog dev key.
> The domain `pleiad.io` is live and attached to the `omnisx` Worker; the Auth0
> **dev** app already whitelists `pleiad.io`. This runbook takes the stack to
> **production** across every platform and wires all env vars into **Cloudflare**
> (Worker secrets) and **GitHub** (Actions secrets).
>
> **Money/identity gate:** Paddle production requires business verification and
> can take days. Start that first. Nothing here charges real cards until Paddle
> live is approved and `PADDLE_ENV=production` is deployed.

Legend — **Who**: 🧑 you (create account/fetch key), 🤖 me (generate/wire).
**Dest**: `CF` = Worker runtime secret (`wrangler secret put`), `CFvar` = build-time
public var, `GH` = GitHub Actions secret.

## Full env matrix

| Var | Platform | Prod action | Who | Dest |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | — | → `https://pleiad.io` | 🤖 | CFvar |
| `APP_BASE_URL` | — | → `https://pleiad.io` | 🤖 | CF |
| `AUTH0_DOMAIN` | Auth0 | prod tenant domain | 🧑→🤖 | CF |
| `AUTH0_CLIENT_ID` | Auth0 | prod app | 🧑→🤖 | CF |
| `AUTH0_CLIENT_SECRET` | Auth0 | prod app | 🧑→🤖 | CF |
| `AUTH0_SECRET` | — | random 32-byte | 🤖 | CF |
| `DATABASE_URL` | Supabase | prod project pooled URL | 🧑→🤖 | CF |
| `DATABASE_URL_DIRECT` | Supabase | prod project direct URL | 🧑→🤖 | CF |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | prod project URL | 🧑→🤖 | CFvar/GH |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | prod anon key | 🧑→🤖 | CFvar/GH |
| `CRON_SECRET` | — | random | 🤖 | CF |
| `UNSUBSCRIBE_SECRET` | — | random | 🤖 | CF |
| `RESEND_API_KEY` | Resend | prod key + verify `pleiad.io` domain | 🧑→🤖 | CF |
| `GEMINI_API_KEY` | Google AI Studio | prod key | 🧑→🤖 | CF |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog | prod project key | 🧑→🤖 | CFvar/GH |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog | region host | 🧑→🤖 | CFvar/GH |
| `NEXT_PUBLIC_POSTHOG_DEV` | — | `false` in prod | 🤖 | CFvar |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | Cloudflare | Web Analytics beacon | 🧑→🤖 | CFvar |
| `PADDLE_ENV` | Paddle | `production` | 🤖 (gated) | CF |
| `PADDLE_API_KEY` | Paddle | **live** API key | 🧑→🤖 | CF |
| `PADDLE_WEBHOOK_SECRET` | Paddle | live webhook dest → `https://pleiad.io/api/billing/webhook` | 🧑→🤖 | CF |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle | live client token | 🧑→🤖 | CFvar |
| `PADDLE_PRICE_COMPLETE` | Paddle | live price id | 🧑→🤖 | CF |
| `PADDLE_PRICE_PRACTITIONER` | Paddle | live price id | 🧑→🤖 | CF |
| `PADDLE_PRICE_EXPLORER` | Paddle | live price id | 🧑→🤖 | CF |
| `PADDLE_PRICE_LIFETIME` | Paddle | live price id (Founding Lifetime $79) | 🧑→🤖 | CF |

## Your credential shopping list (🧑)

Fetch these into a local **`.prod.vars`** file (gitignored — never commit):

1. **Paddle (production)** — verify the business, switch to live. Get: live
   `PADDLE_API_KEY`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`; recreate the 4 products in
   the live catalog → 4 `PADDLE_PRICE_*` ids; add a live webhook destination
   pointing to `https://pleiad.io/api/billing/webhook` → `PADDLE_WEBHOOK_SECRET`.
2. **Auth0 (production)** — create a prod tenant (or a prod Regular Web App).
   Set its Allowed Callback = `https://pleiad.io/auth/callback`, Logout =
   `https://pleiad.io`, Web Origins = `https://pleiad.io`. Get: `AUTH0_DOMAIN`,
   `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.
3. **Supabase (production)** — prod project (or confirm current = prod). Get:
   `DATABASE_URL` (pooled), `DATABASE_URL_DIRECT`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Run migrations against it.
4. **Resend** — prod API key; add + verify the `pleiad.io` domain (this emits
   SPF/DKIM/DMARC DNS records → I add them to Cloudflare, closing task #5).
5. **Google AI Studio** — prod `GEMINI_API_KEY`.
6. **PostHog** — prod project `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`.
7. **Cloudflare Web Analytics** — beacon token for `pleiad.io` →
   `NEXT_PUBLIC_CF_BEACON_TOKEN`.

I generate `AUTH0_SECRET`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, and set
`NEXT_PUBLIC_SITE_URL`/`APP_BASE_URL`/`PADDLE_ENV`/`NEXT_PUBLIC_POSTHOG_DEV`.

## Runbook (ordered — avoids breaking anything live)

1. 🧑 Start **Paddle production verification** (slowest — do first).
2. 🧑 Create prod **Auth0**, **Supabase**, **Resend/Gemini/PostHog** keys → fill `.prod.vars`.
3. 🤖 Run `scripts/set-prod-secrets.sh` → generates randoms, pushes all secrets to
   the Worker (`wrangler secret put`) and GitHub (`gh secret set`).
4. 🤖 Flip build-time URL vars to `https://pleiad.io` (wrangler.jsonc `vars`,
   `package.json` deploy script, cron `SITE_URL`).
5. 🤖 Run Supabase migrations against the prod DB.
6. 🧑/🤖 Add Resend's SPF/DKIM/DMARC records to Cloudflare DNS (task #5).
7. 🤖 Deploy the renamed (OmnisX→Pleiad) build to the Worker.
8. 🤖 Smoke-test on `https://pleiad.io`: signup/login (prod Auth0), a live Paddle
   checkout (real card, refundable), cron auth, email send/deliverability.
9. 🤖 Point Paddle live webhook at `https://pleiad.io/...`; confirm subscription sync.
10. Only after green: announce. Keep `omnisx.workers.dev` as a fallback until stable.

## Notes / guardrails

- Keep the Worker **name** `omnisx` and R2 bucket as-is (deploy identity) — only
  values change. Renaming those is a separate, unnecessary migration.
- Keep Paddle `customData` keys `omnis_user_id`/`omnis_plan` unchanged — live
  subscription sync depends on them.
- `AUTH0_SECRET` rotation logs out all existing sessions — expected at cutover.
- Do the Paddle webhook switch **after** the app is deployed at `pleiad.io`, or
  events will 404.
