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
# Supabase de PRODUÇÃO — inlined no bundle do client durante o build.
# Sobrepõe o .env.local: se ele apontar para o Supabase local
# (127.0.0.1, setup de dev), o deploy publicaria um site quebrado.
PROD_SUPABASE_URL="https://jjznatvyvrmcjcyxzkif.supabase.co"
PROD_SUPABASE_ANON_KEY="sb_publishable_a1FtUddMUeB3aLIXNm_3zA_BEdiZZC6"

# shellcheck disable=SC1091
set -a; source .env.local; set +a

# Tokens account-owned (cfat_) não têm contexto de usuário: o wrangler
# falha em /memberships a menos que a conta venha explícita no ambiente.
export CLOUDFLARE_ACCOUNT_ID="72a91b2baaad8894362c2fea41b93a6d"

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

# chave estável de Server Actions (gera uma se não existir no env)
if [ -z "${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:-}" ]; then
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"
fi

# 1) deploy primeiro: `secret put` exige que o script exista (o 1º deploy
#    de todos falharia se os secrets viessem antes)
echo "── build + deploy ──"
NEXT_PUBLIC_APP_URL="$APP_URL" \
NEXT_PUBLIC_SUPABASE_URL="$PROD_SUPABASE_URL" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="$PROD_SUPABASE_ANON_KEY" \
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
  npm run deploy

# 2) secrets (cada put cria uma nova versão já com o secret ativo)
SECRETS=(
  SUPABASE_SECRET_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_BASICO_MENSAL
  STRIPE_PRICE_BASICO_ANUAL
  STRIPE_PRICE_PRO_MENSAL
  STRIPE_PRICE_PRO_ANUAL
  STRIPE_PORTAL_CONFIGURATION_ID
  RESEND_API_KEY
  # token da API FIPE (grátis em https://fipe.api.br) — sem ele o
  # Worker divide a cota anônima por IP com outros apps e vive em 429
  FIPE_API_TOKEN
  # integração Cloudflare for SaaS (domínio próprio) — token zone-scoped
  # SEM filtro de IP (o Worker chama a API da CF em runtime)
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ZONE_ID
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
printf '%s' "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" | npx wrangler secret put NEXT_SERVER_ACTIONS_ENCRYPTION_KEY >/dev/null
echo "  ✓ NEXT_SERVER_ACTIONS_ENCRYPTION_KEY"

# 3) blog (Astro, estático) — Worker próprio na rota estoque.autos/blog*
echo "── blog ──"
(
  cd blog
  [ -d node_modules ] || npm install --no-audit --no-fund >/dev/null
  npm run build >/dev/null
  rm -rf .cloudflare
  mkdir -p .cloudflare/assets/blog
  cp -R dist/. .cloudflare/assets/blog/
)
npx wrangler deploy --config blog/wrangler.jsonc
echo "  ✓ blog → $APP_URL/blog"

echo
echo "Deploy concluído → $APP_URL"
