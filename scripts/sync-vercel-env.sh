#!/usr/bin/env bash
# Copies the settings the secure-link (magic link) flow needs from .env.local to the
# Vercel Production environment of the linked project, then redeploys production.
#
# Run from the project folder in Git Bash:   bash scripts/sync-vercel-env.sh
#
# Values are piped straight to the Vercel CLI and are never printed. Production-only
# overrides: APP_ENV=production, APP_URL=the live domain, MAGIC_LINK_DEMO_MODE=false.

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
PROD_URL="https://root-ai-updated.vercel.app"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

get() {
  grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | sed -E 's/\r$//; s/^"(.*)"$/\1/'
}

set_var() { # name value type
  local name="$1" value="$2" type="$3"
  if [ -z "$value" ]; then
    echo "SKIP  $name (empty in $ENV_FILE)"
    return
  fi
  printf '%s' "$value" | vercel env add "$name" production --force --type "$type" --yes >/dev/null
  echo "SET   $name"
}

# Secrets (stored encrypted, hidden in the dashboard).
for name in SUPABASE_SERVICE_ROLE_KEY SMTP_USER SMTP_PASSWORD AUDIT_HMAC_SECRET; do
  set_var "$name" "$(get "$name")" secret
done

# Non-secret configuration.
for name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SMTP_HOST SMTP_PORT EMAIL_FROM MAGIC_LINK_EXPIRY_MINUTES; do
  set_var "$name" "$(get "$name")" config
done

# Production overrides.
set_var APP_ENV production config
set_var APP_URL "$PROD_URL" config
set_var MAGIC_LINK_DEMO_MODE false config

echo
echo "Redeploying production so the new values take effect..."
vercel --prod --yes
