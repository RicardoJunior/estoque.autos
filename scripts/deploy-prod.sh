#!/usr/bin/env bash
# ============================================================
# Deploy de produção do estoque.autos (Cloudflare Workers).
#
#   bash scripts/deploy-prod.sh
#
# 1. Lê os segredos do .env.local e os configura no Worker
#    (wrangler secret put) — nada de segredo em vars/bundle.
# 2. Gera NEXT_SERVER_ACTIONS_ENCRYPTION_KEY se ainda não houver.
# 3. Builda com NEXT_PUBLIC_APP_URL de produção (sobrepõe o
#    .env.local, que aponta pra localhost) e faz o deploy.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

APP_URL="https://estoque.autos"

# shellcheck disable=SC1091
set -a; source .env.local; set +a

# webhook de produção: cria no Stripe se ainda não houver secret
if [ -z "${STRIPE_WEBHOOK_SECRET:-}" ]; then
  echo "── webhook Stripe (criando) ──"
  out="$(npx tsx scripts/stripe-webhook-setup.ts "$APP_URL")"
  echo "$out"
  STRIPE_WEBHOOK_SECRET="$(echo "$out" | grep -oE 'whsec_[A-Za-z0-9]+' | head -1 || true)"
  if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    printf '\nSTRIPE_WEBHOOK_SECRET="%s"\n' "$STRIPE_WEBHOOK_SECRET" >> .env.local
    echo "  ✓ STRIPE_WEBHOOK_SECRET salvo no .env.local"
  else
    echo "  − webhook já existia sem expor o secret — siga sem ele (configure depois)"
  fi
fi

SECRETS=(
  SUPABASE_SECRET_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_BASICO_MENSAL
  STRIPE_PRICE_BASICO_ANUAL
  STRIPE_PRICE_PRO_MENSAL
  STRIPE_PRICE_PRO_ANUAL
)

echo "── secrets no Worker ──"
for name in "${SECRETS[@]}"; do
  value="${!name:-}"
  if [ -n "$value" ]; then
    printf '%s' "$value" | npx wrangler secret put "$name" >/dev/null
    echo "  ✓ $name"
  else
    echo "  − $name (vazio no .env.local — pulado)"
  fi
done

# chave estável de Server Actions (gera uma se não existir no env)
if [ -z "${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:-}" ]; then
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"
  echo "  ✓ NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (gerada agora)"
fi
printf '%s' "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" | npx wrangler secret put NEXT_SERVER_ACTIONS_ENCRYPTION_KEY >/dev/null

echo "── build + deploy ──"
NEXT_PUBLIC_APP_URL="$APP_URL" \
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
  npm run deploy

echo
echo "Deploy concluído → $APP_URL"
