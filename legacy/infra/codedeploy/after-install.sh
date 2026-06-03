#!/bin/bash
set -e

echo "=== AfterInstall: Configurando aplicacao ==="

cd /home/ec2-user/app/backend

# Carregar variaveis de ambiente
source /home/ec2-user/app/load-env.sh

# Criar arquivo .env para PM2
cat > .env << EOF
NODE_ENV=production
PORT=3000
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
EOF

chmod 600 .env

echo "=== AfterInstall concluido ==="
