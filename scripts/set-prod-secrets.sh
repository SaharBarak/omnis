#!/usr/bin/env bash
# Push production secrets to Cloudflare Worker + GitHub Actions.
# Fill ./.prod.vars first (gitignored). Never commit real values.
#
#   cp .prod.vars.example .prod.vars   # then fill it in
#   ./scripts/set-prod-secrets.sh
#
# Idempotent: re-run anytime values change. Generates the internal randoms
# (AUTH0_SECRET, CRON_SECRET, UNSUBSCRIBE_SECRET) if they're blank in .prod.vars.
set -euo pipefail
cd "$(dirname "$0")/.."

VARS_FILE=".prod.vars"
[ -f "$VARS_FILE" ] || { echo "❌ $VARS_FILE not found. Copy .prod.vars.example → .prod.vars and fill it."; exit 1; }
set -a; . "./$VARS_FILE"; set +a

gen() { openssl rand -hex 32; }
: "${AUTH0_SECRET:=$(gen)}"
: "${CRON_SECRET:=$(gen)}"
: "${UNSUBSCRIBE_SECRET:=$(gen)}"
: "${NEXT_PUBLIC_SITE_URL:=https://pleiad.io}"
: "${APP_BASE_URL:=https://pleiad.io}"
: "${BILLING_PROVIDER:=revenuecat}"
: "${NEXT_PUBLIC_POSTHOG_DEV:=false}"

# --- Cloudflare Worker runtime secrets (server-only) ---
CF_SECRETS=(
  APP_BASE_URL AUTH0_DOMAIN AUTH0_CLIENT_ID AUTH0_CLIENT_SECRET AUTH0_SECRET
  DATABASE_URL DATABASE_URL_DIRECT CRON_SECRET UNSUBSCRIBE_SECRET
  RESEND_API_KEY LLM_PROVIDER GROQ_API_KEY GEMINI_API_KEY TURNSTILE_SECRET_KEY
  BILLING_PROVIDER REVENUECAT_SECRET_KEY REVENUECAT_WEBHOOK_SECRET
  STORE_PRODUCT_COMPLETE STORE_PRODUCT_PRACTITIONER STORE_PRODUCT_EXPLORER STORE_PRODUCT_LIFETIME
  NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
)
echo "→ Cloudflare Worker secrets (omnisx)…"
for k in "${CF_SECRETS[@]}"; do
  v="${!k:-}"
  [ -z "$v" ] && { echo "   ⚠ skip $k (empty in .prod.vars)"; continue; }
  printf '%s' "$v" | npx wrangler secret put "$k" >/dev/null && echo "   ✓ $k"
done

# Cron worker needs the site URL + cron auth
echo "→ Cron worker secrets…"
printf '%s' "$NEXT_PUBLIC_SITE_URL" | npx wrangler secret put SITE_URL --config workers/cron/wrangler.jsonc >/dev/null && echo "   ✓ SITE_URL"
printf '%s' "$CRON_SECRET" | npx wrangler secret put CRON_SECRET --config workers/cron/wrangler.jsonc >/dev/null && echo "   ✓ CRON_SECRET"

# --- GitHub Actions secrets (build-time public + deploy) ---
GH_SECRETS=(
  NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_POSTHOG_KEY NEXT_PUBLIC_POSTHOG_HOST NEXT_PUBLIC_POSTHOG_DEV
  NEXT_PUBLIC_APP_STORE_URL NEXT_PUBLIC_PLAY_STORE_URL NEXT_PUBLIC_CF_BEACON_TOKEN
  NEXT_PUBLIC_TURNSTILE_SITE_KEY
  CLOUDFLARE_API_TOKEN
)
if command -v gh >/dev/null 2>&1; then
  echo "→ GitHub Actions secrets…"
  for k in "${GH_SECRETS[@]}"; do
    v="${!k:-}"
    [ -z "$v" ] && { echo "   ⚠ skip $k (empty)"; continue; }
    printf '%s' "$v" | gh secret set "$k" >/dev/null && echo "   ✓ $k"
  done
else
  echo "⚠ gh not found — skipping GitHub secrets."
fi

echo "✅ Done. Next: flip URL vars to pleiad.io, run migrations, deploy, smoke-test (see docs/playbooks/production-cutover.md)."
