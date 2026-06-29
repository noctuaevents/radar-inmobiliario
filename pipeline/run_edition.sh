#!/usr/bin/env bash
# run_edition.sh — Orquestador de la actualización mensual.
#
# Uso completo (con precios nuevos):
#   bash pipeline/run_edition.sh pipeline/input/precios_junio_2026.csv
#
# Solo noticias (sin actualizar precios):
#   bash pipeline/run_edition.sh --only-news

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ONLY_NEWS=false
CSV_FILE=""

if [[ "${1:-}" == "--only-news" ]]; then
    ONLY_NEWS=true
elif [[ -n "${1:-}" ]]; then
    CSV_FILE="$1"
fi

echo "════════════════════════════════════════════════════"
echo " Radar Inmobiliario — Actualización de edición"
echo "════════════════════════════════════════════════════"
date

# ── Paso 1: Precios (opcional) ────────────────────────────────────────────────
if [[ "$ONLY_NEWS" == false ]]; then
    if [[ -z "$CSV_FILE" ]]; then
        # Buscar CSV más reciente en pipeline/input/
        CSV_FILE=$(ls -t pipeline/input/*.csv 2>/dev/null | head -1 || true)
    fi
    if [[ -n "$CSV_FILE" && -f "$CSV_FILE" ]]; then
        echo ""
        echo "▶ Paso 1/4: Actualizar precios desde $CSV_FILE"
        python3 pipeline/parse_prices.py "$CSV_FILE"
    else
        echo ""
        echo "▶ Paso 1/4: Sin CSV de precios — manteniendo datos actuales"
        echo "   (Para actualizar precios: coloca el CSV en pipeline/input/ y vuelve a ejecutar)"
    fi
else
    echo ""
    echo "▶ Paso 1/4: Saltado (--only-news)"
fi

# ── Paso 2: Ingesta de noticias ───────────────────────────────────────────────
echo ""
echo "▶ Paso 2/4: Ingesta de noticias (RSS → candidates.json)"
python3 pipeline/fetch_news.py

# ── Paso 3: Triaje con Ollama ─────────────────────────────────────────────────
echo ""
echo "▶ Paso 3/4: Triaje con Ollama → cola Obsidian"
python3 pipeline/triage_ollama.py

# ── Pausa para revisión editorial ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo " ✋ PAUSA — REVISIÓN EDITORIAL"
echo ""
echo " Abre Obsidian y ve a:"
echo " Contenido/Noticias/_cola/"
echo ""
echo " Para cada noticia que quieras publicar:"
echo "   Cambia 'publicar: false' → 'publicar: true'"
echo ""
echo " Cuando hayas terminado, pulsa ENTER para continuar."
echo "════════════════════════════════════════════════════"
read -r

# ── Paso 4: Pulido con Claude ─────────────────────────────────────────────────
echo ""
echo "▶ Paso 4/4: Pulido editorial con Claude → news.js"
bash pipeline/polish_claude.sh

# ── Build final ───────────────────────────────────────────────────────────────
echo ""
echo "▶ Build: re-empaquetando HTML…"
python3 pipeline/build.py

echo ""
echo "════════════════════════════════════════════════════"
echo " ✓ Edición lista: Radar Inmobiliario Madrid.html"
echo ""
echo " Para publicar en Cloudflare Pages:"
echo "   git add 'Radar Inmobiliario Madrid.html' sitemap.xml"
echo "   git commit -m 'edicion: actualización $(date +%Y-%m-%d)'"
echo "   git push  ← Cloudflare Pages redeploya automáticamente"
echo "════════════════════════════════════════════════════"
