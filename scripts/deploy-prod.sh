#!/usr/bin/env bash
# Production deploy for Pleiad. Bakes the LIVE NEXT_PUBLIC_* values from
# .prod.vars into the client bundle at build time, then deploys via
# opennextjs-cloudflare. Run after ./scripts/set-prod-secrets.sh.
#
# Why this wrapper: `npm run deploy` builds locally and inlines NEXT_PUBLIC_*
# from the shell env. Without this, the build would pick up .env.local's
# dev values (localhost URLs, unset store links) and ship them to production.
set -euo pipefail
cd "$(dirname "$0")/.."

VARS_FILE=".prod.vars"
[ -f "$VARS_FILE" ] || { echo "❌ $VARS_FILE not found."; exit 1; }

# Export only NEXT_PUBLIC_* + the two URL vars (build-time). Server secrets
# come from the Worker at runtime, not the build, so we don't need them here.
set -a
# shellcheck disable=SC1090
while IFS='=' read -r key val; do
  case "$key" in
    NEXT_PUBLIC_*|APP_BASE_URL|NEXT_PUBLIC_SITE_URL)
      [ -n "$val" ] && export "$key=$val" ;;
  esac
done < <(grep -E '^[A-Za-z0-9_]+=' "$VARS_FILE")
set +a

: "${NEXT_PUBLIC_SITE_URL:=https://pleiad.io}"
: "${APP_BASE_URL:=https://pleiad.io}"

echo "→ Building with live client vars:"
echo "   NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"
echo "   NEXT_PUBLIC_APP_STORE_URL=${NEXT_PUBLIC_APP_STORE_URL:-<unset>}"
echo "   NEXT_PUBLIC_PLAY_STORE_URL=${NEXT_PUBLIC_PLAY_STORE_URL:-<unset>}"
echo "   NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY:0:8}…"

npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy

echo "✅ Deployed to $NEXT_PUBLIC_SITE_URL"
