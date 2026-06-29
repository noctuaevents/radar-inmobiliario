#!/usr/bin/env python3
"""
triage_claude.py — Triaje de candidatos con Claude (claude -p headless).
Lee pipeline/work/candidates.json.
Escribe notas markdown en ~/Documents/Radar Inmobiliario/Contenido/Noticias/_cola/.
Cada nota tiene publicar: false — revisa en Obsidian y cambia a true las que quieras publicar.

Uso: python3 pipeline/triage_claude.py
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
CANDIDATES_FILE = ROOT / "pipeline" / "work" / "candidates.json"
COLA_DIR = Path.home() / "Documents" / "Radar Inmobiliario" / "Contenido" / "Noticias" / "_cola"
COLA_DIR.mkdir(parents=True, exist_ok=True)

CATEGORIAS = ["Infraestructura", "Urbanismo", "Regulación", "Movilidad", "Fiscalidad", "Demanda", "Obras"]
DISTRITOS_VALIDOS = [
    "Centro", "Arganzuela", "Retiro", "Salamanca", "Chamartín", "Tetuán", "Chamberí",
    "Fuencarral-El Pardo", "Moncloa-Aravaca", "Latina", "Carabanchel", "Usera",
    "Puente de Vallecas", "Moratalaz", "Ciudad Lineal", "Hortaleza", "Villaverde",
    "Villa de Vallecas", "Vicálvaro", "San Blas-Canillejas", "Barajas",
]
TAGS_VALIDOS = ["emerald", "amber", "rose", "sky", "violet"]


def ask_claude(prompt: str) -> str:
    env = os.environ.copy()
    env["PATH"] = f"{Path.home()}/.local/bin:{env.get('PATH', '')}"
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True, text=True, env=env, timeout=180
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude error (código {result.returncode}):\n{result.stderr[:400]}")
    return result.stdout


def extract_json_array(text: str):
    m = re.search(r"\[.*\]", text, re.S)
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
    distrito = None
    if distrito_raw:
        for d in DISTRITOS_VALIDOS:
            if d.lower() in distrito_raw.lower() or distrito_raw.lower() in d.lower():
                distrito = d
                break
        if not distrito:
            distrito = distrito_raw

    categoria = triage.get("categoria", "Demanda")
    if categoria not in CATEGORIAS:
        categoria = "Demanda"

    tag = triage.get("tag", "sky")
    if tag not in TAGS_VALIDOS:
        tag = "sky"

    imagen = article.get("imagen", "")

    content = f"""---
publicar: false
fecha: '{article["fecha"]}'
hora: '{article["hora"]}'
categoria: '{categoria}'
distrito: {json.dumps(distrito, ensure_ascii=False)}
fuente: '{article["fuente"].replace("'", "")}'
tag: '{tag}'
url: '{article["url"]}'
imagen: '{imagen}'
score_ingesta: {article["score"]}
direccion_impacto: '{triage.get("direccion_impacto", "neutro")}'
impacto: '{triage.get("impacto_borrador", "")}'
impactoLabel: '{triage.get("impacto_label_borrador", "")}'
---

# {article["titulo"]}

**Fuente:** {article["fuente"]}
**URL:** {article["url"]}

## Resumen (borrador Claude — editar antes de publicar)

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
    print(f"{len(candidates)} candidatos a triar con Claude…\n")

    candidatos_json = json.dumps([
        {
            "idx": i,
            "titulo": a["titulo"],
            "fuente": a["fuente"],
            "resumen_raw": a["resumen_raw"][:400],
        }
        for i, a in enumerate(candidates)
    ], indent=2, ensure_ascii=False)

    prompt = f"""Eres el editor de Radar Inmobiliario Madrid, una publicación de datos independiente sobre el mercado inmobiliario de Madrid.

Analiza estos {len(candidates)} candidatos de noticias y devuelve un array JSON con el triaje de cada uno.

CANDIDATOS:
{candidatos_json}

Para cada candidato devuelve un objeto con estos campos:
- "idx": el número de índice del input (campo "idx")
- "relevante": true/false — ¿es relevante para el mercado inmobiliario de Madrid?
- "categoria": una de {json.dumps(CATEGORIAS)}
- "distrito": nombre exacto del distrito de Madrid afectado, o null si aplica a toda la ciudad
- "tag": uno de ["emerald","amber","rose","sky","violet"] — emerald=positivo para el mercado/compradores, rose=negativo, amber=neutro, sky=informativo, violet=fiscal/regulatorio
- "direccion_impacto": "sube" / "baja" / "neutro"
- "resumen_borrador": 1-2 frases directas con datos concretos, estilo periodístico. Máx 200 chars.
- "impacto_borrador": solo el número/dato clave (ej: "+6,2%", "2.800 €/m²", "−14 min"). Máx 20 chars.
- "impacto_label_borrador": descripción muy corta del dato (ej: "sobre precio distrito", "a Atocha"). Máx 35 chars.

Devuelve SOLO el array JSON, sin texto extra ni bloques de código markdown."""

    print("Invocando claude -p para triar todos los candidatos…")
    try:
        raw = ask_claude(prompt)
    except RuntimeError as e:
        sys.exit(str(e))

    results = extract_json_array(raw)
    if not results:
        sys.exit(f"ERROR: Claude no devolvió un array JSON válido.\nOutput recibido:\n{raw[:600]}")

    by_idx = {r["idx"]: r for r in results if isinstance(r, dict) and "idx" in r}

    written = 0
    skipped = 0
    for i, article in enumerate(candidates):
        triage = by_idx.get(i)
        print(f"[{i+1:2d}/{len(candidates)}] {article['titulo'][:70]}…")
        if not triage:
            print(f"  ⚠ Sin resultado de Claude, se descarta")
            skipped += 1
            continue
        if not triage.get("relevante", True):
            print(f"  → No relevante, descartado")
            skipped += 1
            continue
        filename = write_note(article, triage, i + 1)
        print(f"  → {filename}  [{triage.get('categoria')} | {triage.get('tag')} | {triage.get('direccion_impacto')}]")
        written += 1

    print(f"\n{written} notas escritas en {COLA_DIR}")
    print(f"{skipped} descartadas")
    print(f"\nPróximo paso: revisa la carpeta '_cola' en Obsidian y cambia 'publicar: true' en las que quieras publicar.")
    print("Luego ejecuta: bash pipeline/polish_claude.sh")


if __name__ == "__main__":
    main()
