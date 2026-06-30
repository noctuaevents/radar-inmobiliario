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

# ── 3. Pulir artículos uno a uno con Claude y generar news.js ────────────────
echo ""
echo "Puliendo $COUNT noticia(s) con Claude (una a una)…"

python3 - "$NEWS_JS" "$APPROVED_JSON" "$TODAY" "$FECHA_CORTA" "$COUNT" <<'PYEOF'
import sys, json, re, subprocess, unicodedata, urllib.request, os, time
from pathlib import Path

news_file = Path(sys.argv[1])
approved_path = Path(sys.argv[2])
today = sys.argv[3]
fecha_corta = sys.argv[4]
count = int(sys.argv[5])

articles = json.loads(approved_path.read_text())

def extract_json(text):
    m = re.search(r'\{.*\}', text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None

def call_claude(prompt, max_retries=2):
    for attempt in range(max_retries):
        try:
            result = subprocess.run(
                ['claude', '-p', prompt],
                capture_output=True, text=True, timeout=120,
                env={**os.environ}
            )
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            print(f"  WARN: timeout en intento {attempt+1}")
    return ""

def slugify_fallback(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')[:70]

def polish_article(art, idx, total):
    art_json = json.dumps(art, indent=2, ensure_ascii=False)
    prompt = f"""Eres el editor de Radar Inmobiliario Madrid. Hoy es {today}.

Tienes esta noticia. Tu tarea:
- 'titulo': titular directo con datos. Máx 100 chars.
- 'resumen': 1-2 frases periodísticas con datos concretos. Máx 200 chars.
- 'impacto': dato clave de impacto (ej: '+6,2 %', '2.800 €/m²'). Máx 20 chars.
- 'impactoLabel': descripción muy corta (ej: 'sobre precio distrito'). Máx 35 chars.
- 'slug': kebab-case sin acentos ni caracteres especiales. Máx 70 chars.
- 'fechaISO': YYYY-MM-DD en 2026.
- 'body': array de exactamente 4 bloques: primero con dropcap:true, dos párrafos normales, uno pullquote. ~250 palabras. Sin markdown.

Devuelve SOLO este JSON (sin texto extra ni bloques de código):
{{"titulo":"...","resumen":"...","impacto":"...","impactoLabel":"...","slug":"...","fechaISO":"2026-MM-DD","body":[{{"type":"p","dropcap":true,"text":"..."}},{{"type":"p","text":"..."}},{{"type":"pullquote","text":"..."}},{{"type":"p","text":"..."}}]}}

Noticia:
{art_json}"""

    borrador = art.get('resumen_borrador', '')[:60]
    print(f"  [{idx}/{total}] {borrador}...")
    output = call_claude(prompt)
    data = extract_json(output)

    if not data:
        print(f"  WARN: fallback para artículo {idx}")
        borrador_full = art.get('resumen_borrador', f'Noticia {idx}')
        data = {
            "titulo": borrador_full[:100],
            "resumen": borrador_full[:200],
            "impacto": art.get('impacto_borrador', ''),
            "impactoLabel": art.get('impactoLabel_borrador', ''),
            "slug": slugify_fallback(borrador_full),
            "fechaISO": "2026-06-30",
            "body": [{"type": "p", "dropcap": True, "text": borrador_full}]
        }

    return {
        "fecha": art["fecha"],
        "hora": art["hora"],
        "categoria": art["categoria"],
        "distrito": art["distrito"],
        "fuente": art["fuente"],
        "tag": art["tag"],
        "url": art.get("url", ""),
        "imagen": art["imagen"],
        **data
    }

polished = []
for i, art in enumerate(articles, 1):
    item = polish_article(art, i, count)
    polished.append(item)
    time.sleep(0.5)

# ── Seleccionar destacada ─────────────────────────────────────────────────────
print("\n  Seleccionando destacada...")
candidates = json.dumps([
    {"idx": i, "titulo": a.get("titulo", ""), "categoria": a.get("categoria", ""), "impacto": a.get("impacto", "")}
    for i, a in enumerate(polished)
], ensure_ascii=False)

dest_prompt = f"""De estas {count} noticias de Radar Inmobiliario Madrid del {today}, elige la MÁS impactante como destacada.
Devuelve SOLO este JSON (sin texto extra):
{{"idx":<número 0-based>,"titulo":"...(max 100 chars con datos)","resumen":"...(2-3 frases con contexto, max 400 chars)","metricas":[{{"label":"...","valor":"...","delta":"...","up":true}},{{"label":"...","valor":"...","delta":"...","up":true}},{{"label":"...","valor":"...","delta":"...","up":false}}]}}

Noticias: {candidates}"""

dest_out = call_claude(dest_prompt)
dest_data = extract_json(dest_out)

if dest_data and "idx" in dest_data:
    idx = int(dest_data["idx"])
    destacada = {**polished[idx], **{k: v for k, v in dest_data.items() if k != "idx"}}
else:
    destacada = {**polished[0], "metricas": [
        {"label": "Noticias hoy", "valor": str(count), "delta": f"+{count}", "up": True},
        {"label": "Distritos", "valor": "2", "delta": "+2", "up": True},
        {"label": "Tendencia", "valor": "Alza", "delta": "+6,2 %", "up": True},
    ]}

distritos = len(set(a.get("distrito") for a in polished if a.get("distrito")))
semana_resumen = {"publicadas": count, "distritosCubiertos": distritos or 1, "movimientoMedio": "+6,2 %"}

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
        print(f"  WARN: imagen no descargable: {e}")
    time.sleep(0.3)

localise_imagen(destacada)
for item in polished:
    localise_imagen(item)

# ── Escribir news.js ──────────────────────────────────────────────────────────
js_items = json.dumps(polished, indent=2, ensure_ascii=False)
js_destacada = json.dumps(destacada, indent=2, ensure_ascii=False)
js_semana = json.dumps(semana_resumen, indent=2, ensure_ascii=False)

content = f"""// Enriched news data for the redesigned "noticias" section.
// Each item carries: fecha, hora, categoria, distrito, fuente, titulo, resumen,
// impactoPrecio (estimated bps for the affected zone), tag (color hint).
// Generated by pipeline/polish_claude.sh

window.NEWS_DATA = {{
  actualizado: '{fecha_corta}',
  semanaResumen: {js_semana},

  // Featured "hero" piece — the lead story
  destacada: {js_destacada},

  items: {js_items},
}};
"""
news_file.write_text(content, encoding="utf-8")
print(f"\n✓ {news_file} actualizado con {len(polished)} noticias + destacada")
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
