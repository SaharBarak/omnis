# OmnisX — Setup & Deploy (Supabase + Auth0 + Paddle + Cloudflare)

Everything below needs secrets I can't safely pull from the browser. Fill
`.env.local` (git-ignored) from `.env.example`, then run the commands. All
tiers used are free.

## 1. Supabase Postgres (project ref `vgqncswfgetxwujrfavb`)

Dashboard → Project Settings → Database → Connection string.

- `DATABASE_URL` — the **Transaction pooler** URI (Supavisor, port `6543`).
  The app runtime uses this (`prepare:false`, per-request client on
  Workers so a connection never crosses requests in a reused isolate).
- `DATABASE_URL_DIRECT` — the **Direct** URI (port `5432`), migrations only.

Apply the schema (creates all 21 tables + enables pgvector):

```bash
# reads DATABASE_URL_DIRECT (falls back to DATABASE_URL) via drizzle.config.ts
npx drizzle-kit migrate
```

`drizzle/0000_*.sql` starts with `CREATE EXTENSION IF NOT EXISTS vector;` —
Supabase ships pgvector, this just turns it on.

Knowledge search needs content ingested into `content_chunks` with 384-dim
`@cf/baai/bge-small-en-v1.5` embeddings (empty table just returns no results —
not an error).

## 2. Auth0 (create a **Regular Web Application**)

Dashboard → Applications → Create → Regular Web App. Then Settings:

- Allowed Callback URLs: `http://localhost:3000/auth/callback` and
  `https://<prod-domain>/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`, `https://<prod-domain>`
- Enable the **Google** social connection (Authentication → Social) so the
  "Sign in with Google" button works. (Apple optional — the button exists but
  the login page only renders Google + email today.)

Env:

- `AUTH0_DOMAIN` — e.g. `your-tenant.us.auth0.com`
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` — from the app Settings
- `AUTH0_SECRET` — `openssl rand -hex 32`
- `APP_BASE_URL` — `http://localhost:3000` locally, prod origin in prod

The SDK auto-mounts `/auth/login`, `/auth/logout`, `/auth/callback`,
`/auth/profile` via `src/middleware.ts` (must live under src/, not repo root).

## 3. Paddle (Sandbox first)

sandbox-vendors.paddle.com → Developer Tools.

- `PADDLE_ENV=sandbox`
- `PADDLE_API_KEY` — Authentication → API keys (server key)
- `PADDLE_WEBHOOK_SECRET` — Notifications → new destination →
  `https://<prod-domain>/api/billing/webhook` → signing secret
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` — client-side token (overlay checkout)
- Create two Prices (Catalog → Products) and set:
  - `PADDLE_PRICE_COMPLETE` — `pri_...` for the Complete plan
  - `PADDLE_PRICE_PRACTITIONER` — `pri_...` for the Practitioner plan

Billing code already reads these; no code change needed. Go live later after
business verification (needs the deployed site).

## 4. Other required env (unchanged from before)

- `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` (`openssl rand -hex 32`),
  `RESEND_API_KEY`, `GEMINI_API_KEY`.

## 5. Local run

```bash
cp .env.example .env.local   # then fill values
npm run dev                  # http://localhost:3000
```

## 6. Deploy — Cloudflare Workers (free tier)

```bash
wrangler login                      # already logged in as sahar.h.barak@gmail.com
wrangler r2 bucket create omnisx-next-cache

# push each secret (repeat per key; never commit them)
wrangler secret put DATABASE_URL
wrangler secret put AUTH0_DOMAIN
wrangler secret put AUTH0_CLIENT_ID
wrangler secret put AUTH0_CLIENT_SECRET
wrangler secret put AUTH0_SECRET
wrangler secret put APP_BASE_URL
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK_SECRET
wrangler secret put NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
wrangler secret put PADDLE_PRICE_COMPLETE
wrangler secret put PADDLE_PRICE_PRACTITIONER
wrangler secret put CRON_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put GEMINI_API_KEY

npm run build          # OpenNext build (.open-next/)
wrangler deploy        # main app (worker: omnisx)
wrangler deploy --config workers/cron/wrangler.jsonc   # cron worker
```

After deploy, update Auth0 callback/logout URLs and the Paddle webhook
destination to the deployed origin, and set `APP_BASE_URL` /
`NEXT_PUBLIC_SITE_URL` secrets to it.

Free-tier note: Workers = 100k req/day, R2 = 10 GB, Supabase = 500 MB /
2 projects, Auth0 = 25k MAU, Paddle = per-transaction fee only.
