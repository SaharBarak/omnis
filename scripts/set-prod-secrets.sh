#!/usr/bin/env bash
# Push production secrets to Cloudflare Worker + GitHub Actions.
# Fill ./.prod.vars first (gitignored). Never commit real values.
#
#   cp .prod.vars.example .prod.vars   # then fill it in
#   ./scripts/set-prod-secrets.sh
#
# Idempotent: re-run anytime values change. Generates the internal randoms
# (CRON_SECRET, UNSUBSCRIBE_SECRET) if they're blank in .prod.vars.
set -euo pipefail
cd "$(dirname "$0")/.."

VARS_FILE=".prod.vars"
[ -f "$VARS_FILE" ] || { echo "❌ $VARS_FILE not found. Copy .prod.vars.example → .prod.vars and fill it."; exit 1; }
set -a; . "./$VARS_FILE"; set +a

gen() { openssl rand -hex 32; }

# Write `k=v` back into .prod.vars, replacing the line if the key is already
# there (including when it's present but empty). Rewrites through the original
# file so its inode and permissions survive — this file holds secrets.
persist_var() {
  local k="$1" v="$2" tmp
  tmp="$(mktemp)"
  if grep -qE "^${k}=" "$VARS_FILE"; then
    awk -v k="$k" -v v="$v" 'index($0, k "=") == 1 { print k "=" v; next } { print }' \
      "$VARS_FILE" >"$tmp"
  else
    cat "$VARS_FILE" >"$tmp"
    printf '%s=%s\n' "$k" "$v" >>"$tmp"
  fi
  cat "$tmp" >"$VARS_FILE"
  rm -f "$tmp"
}

# Generate an internal random ONLY if it has no value yet, and persist it back
# to .prod.vars in the same breath.
#
# This write-back is load-bearing, not a convenience. `: "${K:=$(gen)}"` fires
# when K is unset *or empty*, so with a blank `K=` line in .prod.vars every run
# minted a fresh value and pushed it — silently invalidating every unsubscribe
# link already delivered (CAN-SPAM requires opt-out to keep working for 30 days
# after a send) and rotating AUTH0_SECRET out from under live sessions. The
# header below promises idempotence; this is what makes it true.
#
# Note the one case this cannot fix: Cloudflare never discloses a secret's
# value, so if a *previous* run already pushed one and .prod.vars is blank, this
# run mints a different value and overwrites it — rotating once, loudly, before
# the write-back makes every later run stable. If live mail is already out
# there, paste the real UNSUBSCRIBE_SECRET into .prod.vars before running.
ensure_generated() {
  local k="$1" v
  if [ -z "${!k:-}" ]; then
    v="$(gen)"
    export "$k=$v"
    persist_var "$k" "$v"
    echo "   + generated a NEW $k → saved to $VARS_FILE and reused from now on."
    echo "     ⚠ If $k was already deployed, this REPLACES it. Ctrl-C now and"
    echo "       paste the existing value into $VARS_FILE if that matters."
  fi
}
ensure_generated CRON_SECRET
ensure_generated UNSUBSCRIBE_SECRET

: "${NEXT_PUBLIC_SITE_URL:=https://pleiad.io}"
: "${APP_BASE_URL:=https://pleiad.io}"
: "${BILLING_PROVIDER:=revenuecat}"
: "${NEXT_PUBLIC_POSTHOG_DEV:=false}"

# --- Cloudflare Worker runtime secrets (server-only) ---
# Web auth is Supabase; the worker reads no AUTH0_* (mobile uses separate
# EXPO_PUBLIC_AUTH0_* build vars) and no PADDLE_* (billing is RevenueCat/IAP).
# Both were deleted from the worker 2026-07-19 — do not re-add them here.
CF_SECRETS=(
  APP_BASE_URL
  DATABASE_URL DATABASE_URL_DIRECT CRON_SECRET UNSUBSCRIBE_SECRET
  RESEND_API_KEY RESEND_AUDIENCE_ID EMAIL_FROM EMAIL_FROM_MARKETING EMAIL_POSTAL_ADDRESS
  LLM_PROVIDER GROQ_API_KEY GEMINI_API_KEY TURNSTILE_SECRET_KEY
  BILLING_PROVIDER REVENUECAT_SECRET_KEY REVENUECAT_WEBHOOK_SECRET
  STORE_PRODUCT_COMPLETE STORE_PRODUCT_PRACTITIONER STORE_PRODUCT_EXPLORER STORE_PRODUCT_LIFETIME
  NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
  CLOUDFLARE_API_TOKEN CLOUDFLARE_ZONE_ID BRIEFING_EMAIL ALERT_EMAIL
  GSC_SA_EMAIL GSC_SA_PRIVATE_KEY GSC_SITE_URL SEO_BACKLINKS_API_KEY
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
