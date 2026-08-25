#!/usr/bin/env bash
# Renderiza a foto de perfil e a capa da página do Facebook "estoque.autos".
#   bash scripts/gen-fb-page.sh
#
# Fontes: marketing/artes/fontes/fb-{perfil,capa}.html
# Saída:  marketing/brand/facebook/
#
# Recortes que o Facebook aplica (por isso as safe-zones nas fontes):
#   perfil → círculo; a marca fica na safe-zone central (~62%), igual ao ícone maskable
#   capa   → desktop mostra 820x312 inteiro; mobile recorta 16:9, sobrando só a faixa
#            central de ~68% da largura. A foto de perfil ainda sobrepõe o canto
#            inferior esquerdo no desktop — nada essencial ali.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="marketing/artes/fontes"
OUT="marketing/brand/facebook"
mkdir -p "$OUT"

render() { # fonte largura altura saída
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="$2,$3" \
    --virtual-time-budget=8000 --screenshot="$PWD/$4" \
    "file://$PWD/$SRC/$1" >/dev/null 2>&1
  echo "  ✓ $4"
}

render fb-perfil.html 540 540 "$OUT/perfil-1080x1080.png"
render fb-capa.html   820 312 "$OUT/capa-1640x624.png"
echo "Subir no Meta Business Suite → Página → editar foto de perfil / capa."
