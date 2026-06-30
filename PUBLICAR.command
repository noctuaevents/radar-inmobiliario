#!/bin/bash
# PUBLICAR.command — Doble clic en Finder para publicar Radar Inmobiliario.
# Flujo: polish_claude.sh → build.py → git push → Vercel despliega sólo.

set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "════════════════════════════════════════════"
echo "  RADAR INMOBILIARIO — Publicar edición"
echo "════════════════════════════════════════════"
echo ""

# ── 1. Pulir noticias aprobadas (si las hay) ──────────────────────────────────
COLA_DIR="$HOME/Documents/Radar Inmobiliario/Contenido/Noticias/_cola"
APPROVED_COUNT=0
if [ -d "$COLA_DIR" ]; then
    APPROVED_COUNT=$(grep -rl "^publicar: true" "$COLA_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ') || APPROVED_COUNT=0
fi

if [ "$APPROVED_COUNT" -gt 0 ]; then
    echo "Encontradas $APPROVED_COUNT noticia(s) aprobada(s). Ejecutando pipeline editorial…"
    echo ""
    bash pipeline/polish_claude.sh
    echo ""
else
    echo "No hay noticias nuevas aprobadas. Usando news.js existente."
    echo ""
fi

# ── 2. Rebuild + distribute ───────────────────────────────────────────────────
echo "Reconstruyendo dist/…"
python3 pipeline/build.py
echo ""

# ── 3. Git commit + push → Vercel despliega automáticamente ──────────────────
GIT_STATUS=$(git status --porcelain)
if [ -z "$GIT_STATUS" ]; then
    echo "Sin cambios en git — no se genera commit."
else
    FECHA=$(date "+%d %b %Y, %H:%M")
    git add -A
    git commit -m "edición: $FECHA"
    echo ""
    echo "Pushing a origin/main…"
    git push origin main
    echo ""
    echo "✓ Vercel desplegará en ~30 segundos."
    echo "  https://www.radarinmobiliario.com"
fi

echo ""
echo "════════════════════════════════════════════"
echo "  Listo."
echo "════════════════════════════════════════════"
echo ""
read -p "Pulsa Enter para cerrar…"
