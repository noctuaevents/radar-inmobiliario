#!/usr/bin/env python3
"""
triage_ollama.py — Triaje de candidatos con Ollama (qwen2.5:7b, local, gratis).
Lee pipeline/work/candidates.json.
Escribe notas markdown en ~/Documents/Radar Inmobiliario/Contenido/Noticias/_cola/.
Cada nota tiene publicar: false — tú las revisas en Obsidian y cambias a true las que apruebas.

Uso: python3 pipeline/triage_ollama.py
"""
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CANDIDATES_FILE = ROOT / "pipeline" / "work" / "candidates.json"
COLA_DIR = Path.home() / "Documents" / "Radar Inmobiliario" / "Contenido" / "Noticias" / "_cola"
COLA_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_MODEL = "qwen2.5:7b"

CATEGORIAS = ["Infraestructura", "Urbanismo", "Regulación", "Movilidad", "Fiscalidad", "Demanda", "Obras"]
DISTRITOS_VALIDOS = [
    "Centro", "Arganzuela", "Retiro", "Salamanca", "Chamartín", "Tetuán", "Chamberí",
    "Fuencarral-El Pardo", "Moncloa-Aravaca", "Latina", "Carabanchel", "Usera",
    "Puente de Vallecas", "Moratalaz", "Ciudad Lineal", "Hortaleza", "Villaverde",
    "Villa de Vallecas", "Vicálvaro", "San Blas-Canillejas", "Barajas",
]
TAGS_VALIDOS = ["emerald", "amber", "rose", "sky", "violet"]


TRIAGE_PROMPT = """\
Eres el editor de Radar Inmobiliario Madrid. Analiza esta noticia del mercado inmobiliario de Madrid.

NOTICIA:
Título: {titulo}
Fuente: {fuente}
Resumen: {resumen_raw}

Devuelve SOLO un JSON con estos campos (sin texto extra):
{{
  "relevante": true/false,          // ¿Es relevante para el mercado inmobiliario de Madrid?
  "categoria": "...",               // Una de: {categorias}
  "distrito": "..." o null,         // Distrito de Madrid afectado, o null si es toda la ciudad
  "tag": "...",                     // Color: {tags} (emerald=positivo, rose=negativo, amber=neutro, sky=info, violet=fiscal)
  "direccion_impacto": "sube"/"baja"/"neutro",
  "resumen_borrador": "...",        // 1-2 frases directas con datos concretos. Máx 200 chars.
  "impacto_borrador": "...",        // Solo el número/dato clave (ej: "+6,2%", "2.800 €/m²"). Máx 20 chars.
  "impacto_label_borrador": "..."   // Descripción muy corta del dato (ej: "sobre precio distrito"). Máx 35 chars.
}}
"""


def ask_ollama(prompt: str) -> str:
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("response", "")


def extract_json(text: str):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def slugify(titulo: str) -> str:
    slug = titulo.lower()
    for ch in "áàä": slug = slug.replace(ch, "a")
    for ch in "éèë": slug = slug.replace(ch, "e")
    for ch in "íìï": slug = slug.replace(ch, "i")
    for ch in "óòö": slug = slug.replace(ch, "o")
    for ch in "úùü": slug = slug.replace(ch, "u")
    slug = slug.replace("ñ", "n")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug[:60].strip("-")


def write_note(article: dict, triage: dict, idx: int):
    slug = slugify(article["titulo"])
    fecha_file = datetime.now().strftime("%Y%m%d")
    filename = f"{fecha_file}-{idx:02d}-{slug}.md"
    filepath = COLA_DIR / filename

    distrito_raw = triage.get("distrito") or ""
    # Validar distrito
    distrito = None
    if distrito_raw:
        for d in DISTRITOS_VALIDOS:
            if d.lower() in distrito_raw.lower() or distrito_raw.lower() in d.lower():
                distrito = d
                break
        if not distrito:
            distrito = distrito_raw  # keep raw if not matched

    categoria = triage.get("categoria", "Demanda")
    if categoria not in CATEGORIAS:
        categoria = "Demanda"

    tag = triage.get("tag", "sky")
    if tag not in TAGS_VALIDOS:
        tag = "sky"

    content = f"""---
publicar: false
fecha: '{article["fecha"]}'
hora: '{article["hora"]}'
categoria: '{categoria}'
distrito: {json.dumps(distrito, ensure_ascii=False)}
fuente: '{article["fuente"].replace("'", "")}'
tag: '{tag}'
url: '{article["url"]}'
score_ingesta: {article["score"]}
direccion_impacto: '{triage.get("direccion_impacto", "neutro")}'
impacto: '{triage.get("impacto_borrador", "")}'
impactoLabel: '{triage.get("impacto_label_borrador", "")}'
---

# {article["titulo"]}

**Fuente:** {article["fuente"]}
**URL:** {article["url"]}

## Resumen (borrador Ollama — editar antes de publicar)

{triage.get("resumen_borrador", article["resumen_raw"][:200])}

## Resumen raw (fuente)

{article["resumen_raw"][:400]}
"""
    filepath.write_text(content, encoding="utf-8")
    return filename


def main():
    if not CANDIDATES_FILE.exists():
        sys.exit(f"ERROR: no existe {CANDIDATES_FILE}. Ejecuta primero fetch_news.py")

    candidates: list[dict] = json.loads(CANDIDATES_FILE.read_text(encoding="utf-8"))
    print(f"{len(candidates)} candidatos a triar con Ollama ({OLLAMA_MODEL})…\n")

    written = 0
    skipped = 0

    for i, article in enumerate(candidates, 1):
        print(f"[{i:2d}/{len(candidates)}] {article['titulo'][:70]}…")

        prompt = TRIAGE_PROMPT.format(
            titulo=article["titulo"],
            fuente=article["fuente"],
            resumen_raw=article["resumen_raw"][:400],
            categorias=", ".join(CATEGORIAS),
            tags=", ".join(TAGS_VALIDOS),
        )

        raw = ask_ollama(prompt)
        triage = extract_json(raw)

        if not triage:
            print(f"  ⚠ JSON no parseable, se descarta")
            skipped += 1
            continue

        if not triage.get("relevante", True):
            print(f"  → No relevante, descartado")
            skipped += 1
            continue

        filename = write_note(article, triage, i)
        print(f"  → {filename}  [{triage.get('categoria')} | {triage.get('tag')} | {triage.get('direccion_impacto')}]")
        written += 1

    print(f"\n{written} notas escritas en {COLA_DIR}")
    print(f"{skipped} descartadas")
    print(f"\nPróximo paso: revisa la carpeta '_cola' en Obsidian y cambia 'publicar: true' en las que quieras publicar.")
    print("Luego ejecuta: bash pipeline/polish_claude.sh")


if __name__ == "__main__":
    main()
