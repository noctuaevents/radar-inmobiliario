#!/usr/bin/env bash
# polish_claude.sh — Pulido editorial con Claude para los artículos aprobados.
# Lee las notas con "publicar: true" en la cola de Obsidian.
# Usa `claude -p` (headless) para mejorar prosa, estimar impactos y redactar la destacada.
# Genera src/data/news.js listo para build.

set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COLA_DIR="$HOME/Documents/Radar Inmobiliario/Contenido/Noticias/_cola"
NEWS_JS="$ROOT/src/data/news.js"
WORK_DIR="$ROOT/pipeline/work"
APPROVED_JSON="$WORK_DIR/approved.json"

mkdir -p "$WORK_DIR"

# ── 1. Recoger notas aprobadas ────────────────────────────────────────────────
echo "Buscando notas con publicar: true en $COLA_DIR..."
APPROVED=()
for f in "$COLA_DIR"/*.md; do
    [ -f "$f" ] || continue
    if grep -q "^publicar: true" "$f" 2>/dev/null; then
        APPROVED+=("$f")
    fi
done

COUNT="${#APPROVED[@]}"
if [ "$COUNT" -eq 0 ]; then
    echo "No hay noticias aprobadas (publicar: true) en $COLA_DIR"
    echo "Marca al menos una noticia en Obsidian y vuelve a ejecutar este script."
    exit 0
fi

echo "$COUNT noticia(s) aprobada(s)."

# ── 2. Construir JSON de artículos aprobados para Claude ─────────────────────
python3 - "$APPROVED_JSON" "${APPROVED[@]}" <<'PYEOF'
import sys, json, re
from pathlib import Path

out_file = Path(sys.argv[1])
files = sys.argv[2:]

articles = []
for f in files:
    text = Path(f).read_text(encoding="utf-8")
    # Extract YAML frontmatter
    fm_match = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not fm_match:
        continue
    fm_raw = fm_match.group(1)
    def get(key):
        m = re.search(rf"^{key}:\s*(.+)$", fm_raw, re.M)
        return m.group(1).strip().strip("'\"") if m else ""
    # Body sections
    borrador = ""
    bm = re.search(r"## Resumen \(borrador.*?\)\n\n(.*?)(?=\n##|\Z)", text, re.S)
    if bm:
        borrador = bm.group(1).strip()

    articles.append({
        "fecha": get("fecha"),
        "hora": get("hora"),
        "categoria": get("categoria"),
        "distrito": get("distrito").strip("null").strip() or None,
        "fuente": get("fuente"),
        "tag": get("tag"),
        "url": get("url"),
        "imagen": get("imagen"),
        "impacto_borrador": get("impacto"),
        "impactoLabel_borrador": get("impactoLabel"),
        "resumen_borrador": borrador,
    })

out_file.write_text(json.dumps(articles, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"  {len(articles)} artículo(s) preparados para Claude")
PYEOF

# ── 3. Llamar a Claude para pulir y generar news.js ──────────────────────────
TODAY=$(date "+%d %b %Y")
FECHA_CORTA=$(date "+%-d %b")

ARTICLES_RAW=$(cat "$APPROVED_JSON")

PROMPT="Eres el editor de Radar Inmobiliario Madrid, una publicación de datos independiente sobre el mercado inmobiliario de Madrid. Tienes una voz directa, periodística y basada en datos. Hoy es $TODAY.

Se te dan $COUNT noticias aprobadas en formato JSON. Tu tarea:

1. Por cada noticia:
   - Reescribe 'resumen' en 1-2 frases directas, datos concretos, estilo periodístico sin adornos. Máx 200 chars.
   - Define 'impacto': el dato clave de impacto en precio (ej: '+6,2 %', '-14 min', '2.800 €/m²'). Máx 20 chars.
   - Define 'impactoLabel': descripción muy corta del dato (ej: 'sobre precio distrito', 'a Atocha'). Máx 35 chars.
   - Genera 'slug': kebab-case del titular, solo minúsculas, guiones, sin acentos ni caracteres especiales. Máx 70 chars. Ej: 'hipotecas-madrid-22-meses-alza-abril-2010'.
   - Genera 'fechaISO': fecha en formato ISO 8601 (YYYY-MM-DD). Año actual: 2026.
   - Genera 'body': array de 3-4 bloques de texto con el artículo completo (~300 palabras). Formato: [{\"type\":\"p\",\"dropcap\":true,\"text\":\"...\"},{\"type\":\"p\",\"text\":\"...\"},{\"type\":\"pullquote\",\"text\":\"cita destacada\"},{\"type\":\"p\",\"text\":\"...\"}]. El primer bloque lleva dropcap:true. Un bloque debe ser pullquote con la frase más impactante.
   - Mantén sin modificar: 'fecha', 'hora', 'categoria', 'distrito', 'fuente', 'tag', 'imagen' del input. 'distrito' puede ser null. 'imagen' puede ser cadena vacía.

2. Elige la noticia más impactante como 'destacada' y añádele:
   - 'titulo': titular directo con datos (máx 100 chars)
   - 'resumen': párrafo de 2-3 frases con contexto y datos. Máx 400 chars.
   - 'metricas': array de 3 objetos {label, valor, delta, up: true/false}

3. Genera 'semanaResumen': {publicadas: $COUNT, distritosCubiertos: <nº distritos únicos>, movimientoMedio: '<delta medio estimado>'}

Devuelve SOLO el JSON con esta estructura (sin texto extra):
{
  \"actualizado\": \"$FECHA_CORTA\",
  \"semanaResumen\": { \"publicadas\": $COUNT, \"distritosCubiertos\": <n>, \"movimientoMedio\": \"<±X,X %>\" },
  \"destacada\": {
    \"slug\": \"...\", \"fechaISO\": \"2026-MM-DD\", \"fecha\": \"...\", \"hora\": \"...\", \"categoria\": \"...\", \"distrito\": \"...\", \"fuente\": \"...\", \"imagen\": \"...\",
    \"titulo\": \"...\", \"resumen\": \"...\",
    \"metricas\": [{\"label\": \"...\", \"valor\": \"...\", \"delta\": \"...\", \"up\": true}]
  },
  \"items\": [
    {\"slug\":\"...\",\"fechaISO\":\"2026-MM-DD\",\"fecha\":\"...\",\"hora\":\"...\",\"categoria\":\"...\",\"tag\":\"...\",\"distrito\":\"...\",\"fuente\":\"...\",\"imagen\":\"...\",\"titulo\":\"...\",\"resumen\":\"...\",\"impacto\":\"...\",\"impactoLabel\":\"...\",\"body\":[{\"type\":\"p\",\"dropcap\":true,\"text\":\"...\"},{\"type\":\"p\",\"text\":\"...\"},{\"type\":\"pullquote\",\"text\":\"...\"},{\"type\":\"p\",\"text\":\"...\"}]}
  ]
}

Noticias aprobadas:
$ARTICLES_RAW"

echo ""
echo "Invocando claude -p para pulir $COUNT noticia(s)…"
CLAUDE_OUTPUT=$(claude -p "$PROMPT" 2>/dev/null)

# ── 4. Inyectar en news.js (+ descargar imágenes externas a dist/img/) ────────
python3 - "$NEWS_JS" "$CLAUDE_OUTPUT" <<'PYEOF'
import sys, json, re, unicodedata, urllib.request, os, time
from pathlib import Path

news_file = Path(sys.argv[1])
raw = sys.argv[2]

# Extract JSON from Claude output
m = re.search(r"\{.*\}", raw, re.S)
if not m:
    print("ERROR: Claude no devolvió un JSON válido.")
    print("Output recibido:")
    print(raw[:500])
    sys.exit(1)

try:
    data = json.loads(m.group(0))
except json.JSONDecodeError as e:
    print(f"ERROR parseando JSON de Claude: {e}")
    print("Output:")
    print(raw[:800])
    sys.exit(1)

# ── Descargar imágenes externas ───────────────────────────────────────────────
def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')[:80]

def download_img(url, dest):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r, open(dest, 'wb') as f:
        f.write(r.read())

dist_img = news_file.parent.parent / 'dist' / 'img'
dist_img.mkdir(parents=True, exist_ok=True)

def localise_imagen(art):
    url = art.get('imagen', '')
    if not url or not url.startswith('http'):
        return
    slug = art.get('slug') or slugify(art.get('titulo', 'noticia'))
    fname = slug + '.jpg'
    dest = dist_img / fname
    try:
        download_img(url, dest)
        art['imagen'] = '/img/' + fname
        print(f"  imagen: {fname} ({dest.stat().st_size // 1024} KB)")
    except Exception as e:
        print(f"  WARN: no se pudo descargar {url}: {e}")
    time.sleep(0.3)

localise_imagen(data.get('destacada', {}))
for item in data.get('items', []):
    localise_imagen(item)

# Build the JS file
js_items = json.dumps(data["items"], indent=2, ensure_ascii=False)
js_destacada = json.dumps(data["destacada"], indent=2, ensure_ascii=False)
js_semana = json.dumps(data["semanaResumen"], indent=2, ensure_ascii=False)
actualizado = data.get("actualizado", "")

content = f"""// Enriched news data for the redesigned "noticias" section.
// Each item carries: fecha, hora, categoria, distrito, fuente, titulo, resumen,
// impactoPrecio (estimated bps for the affected zone), tag (color hint).
// Generated by pipeline/polish_claude.sh

window.NEWS_DATA = {{
  actualizado: '{actualizado}',
  semanaResumen: {js_semana},

  // Featured "hero" piece — the lead story
  destacada: {js_destacada},

  items: {js_items},
}};
"""
news_file.write_text(content, encoding="utf-8")
print(f"✓ {news_file} actualizado con {len(data['items'])} noticias + destacada")
PYEOF

# ── 5. Mover notas aprobadas a "Publicado" ───────────────────────────────────
PUBLICADO_DIR="$HOME/Documents/Radar Inmobiliario/Contenido/Noticias/Publicado"
mkdir -p "$PUBLICADO_DIR"
for f in "${APPROVED[@]}"; do
    # Mark as published in frontmatter
    sed -i '' 's/^publicar: true/publicar: publicado/' "$f"
    mv "$f" "$PUBLICADO_DIR/"
    echo "  Archivada: $(basename "$f")"
done

echo ""
echo "✓ Paso de pulido completado."
echo "  Siguiente: python3 pipeline/build.py  (genera dist/ automáticamente)  →  git push"
