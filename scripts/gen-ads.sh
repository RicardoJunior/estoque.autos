#!/usr/bin/env bash
# Renderiza as artes de anúncio a partir das fontes HTML.
#   bash scripts/gen-ads.sh            # todas
#   bash scripts/gen-ads.sh f06 s03    # só as chaves passadas
#
# Saída: marketing/artes/<nome>@2x.png (arquivo de trabalho)
#      + public/ads/<slug>.png        (URL pública que o MCP da Meta consome)
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="marketing/artes/fontes"

# chave | fonte.html | largura | altura | nome em marketing/artes | slug em public/ads
ARTES=(
  "f01|a1-hero-feed.html|1080|1080|feed-01-hero-1080x1080|feed-01-hero"
  "f01b|f01b-hero-45.html|1080|1350|feed-01b-hero-1080x1350|feed-01b-hero"
  "f02|a2-dor-feed.html|1080|1080|feed-02-dor-portal-1080x1080|feed-02-dor-portal"
  "f03|f03-preco.html|1080|1080|feed-03-preco-1080x1080|feed-03-preco"
  "f04|f04-google.html|1080|1080|feed-04-google-1080x1080|feed-04-google"
  "f05|f05-agencia.html|1080|1080|feed-05-agencia-1080x1080|feed-05-agencia"
  "f06|f06-pequeno.html|1080|1080|feed-06-pequeno-1080x1080|feed-06-pequeno"
  "f06b|f06b-pequeno-45.html|1080|1350|feed-06b-pequeno-1080x1350|feed-06b-pequeno"
  "f07|f07-status.html|1080|1080|feed-07-status-1080x1080|feed-07-status"
  "s01|a3-story.html|1080|1920|story-01-3-passos-1080x1920|story-01-3-passos"
  "s02|s02-preco.html|1080|1920|story-02-preco-1080x1920|story-02-preco"
  "s03|s03-pequeno.html|1080|1920|story-03-pequeno-1080x1920|story-03-pequeno"
  "c1|a4-carrossel-1.html|1080|1080|carrossel-c1-preco-1080x1080|carrossel-c1"
  "c2|a5-carrossel-2.html|1080|1080|carrossel-c2-templates-1080x1080|carrossel-c2"
  "c3|a6-carrossel-3.html|1080|1080|carrossel-c3-whatsapp-1080x1080|carrossel-c3"
  "r01|r01-anual.html|1080|1080|rmkt-01-anual-1080x1080|rmkt-01-anual"
  "r02|r02-garantia.html|1080|1080|rmkt-02-garantia-1080x1080|rmkt-02-garantia"
  "r03|r03-demo.html|1080|1080|rmkt-03-demo-1080x1080|rmkt-03-demo"
)

mkdir -p public/ads
n=0
for linha in "${ARTES[@]}"; do
  IFS='|' read -r chave arquivo w h nome slug <<< "$linha"
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$chave"; then continue; fi
  [ -f "$SRC/$arquivo" ] || { echo "  ⚠ fonte ausente: $arquivo — pulando"; continue; }
  out="marketing/artes/${nome}@2x.png"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="$w,$h" \
    --virtual-time-budget=8000 --screenshot="$PWD/$out" \
    "file://$PWD/$SRC/$arquivo" >/dev/null 2>&1
  cp "$out" "public/ads/${slug}.png"
  echo "  ✓ $chave → $out + public/ads/${slug}.png"
  n=$((n+1))
done
echo "$n arte(s) geradas. As de public/ads ficam em https://estoque.autos/ads/<slug>.png após o deploy."
