#!/bin/bash
set -e

echo "=== ValidateService: Verificando saude da aplicacao ==="

# Aguardar a aplicacao iniciar
sleep 5

# Verificar se o processo esta rodando
pm2 pid backend > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERRO: Backend nao esta rodando!"
  pm2 logs backend --lines 20
  exit 1
fi

# Testar endpoint de saude
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
  echo "=== Aplicacao saudavel (HTTP 200) ==="
  exit 0
else
  echo "ERRO: Health check falhou (HTTP $RESPONSE)"
  pm2 logs backend --lines 30
  exit 1
fi
