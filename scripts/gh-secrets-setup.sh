#!/usr/bin/env bash
# ============================================================
# Configura os secrets do GitHub Actions usados pelos workflows
# FIPE (fipe-sync, fipe-full-import, fipe-historical), lendo do
# .env.local — os valores nunca são exibidos.
#
#   bash scripts/gh-secrets-setup.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
set -a; source .env.local; set +a

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SECRET_KEY:-}" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar no .env.local" >&2
  exit 1
fi

printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | gh secret set SUPABASE_URL
printf '%s' "$SUPABASE_SECRET_KEY" | gh secret set SUPABASE_SECRET_KEY
echo "✓ SUPABASE_URL e SUPABASE_SECRET_KEY configurados no repo"
