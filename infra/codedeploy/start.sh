#!/bin/bash
set -e

echo "=== ApplicationStart: Iniciando backend ==="

cd /home/ec2-user/app/backend

# Iniciar com PM2
pm2 start dist/index.js \
  --name backend \
  --env production \
  --max-memory-restart 512M \
  --log-date-format "YYYY-MM-DD HH:mm:ss" \
  --merge-logs

# Salvar lista de processos para restart automatico
pm2 save

echo "=== Aplicacao iniciada ==="
pm2 list
