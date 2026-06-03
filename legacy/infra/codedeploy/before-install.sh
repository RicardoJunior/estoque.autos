#!/bin/bash
set -e

echo "=== BeforeInstall: Parando aplicacao atual ==="

# Parar PM2 se estiver rodando
pm2 stop backend 2>/dev/null || true
pm2 delete backend 2>/dev/null || true

# Limpar deploy anterior (manter node_modules para cache)
cd /home/ec2-user/app/backend
rm -rf dist/ codedeploy/ appspec.yml 2>/dev/null || true

echo "=== BeforeInstall concluido ==="
