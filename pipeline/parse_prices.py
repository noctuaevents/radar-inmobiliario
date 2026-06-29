#!/usr/bin/env python3
"""
parse_prices.py — Actualiza src/data/distritos.js con nuevos precios.

Acepta un CSV manual con columnas: slug, nombre, precioMedio, alquilerM2, tx
Calcula: rent = (alquilerM2*12/precioMedio)*100, varAnual (vs datos anteriores), ranking.

Uso:
  python3 pipeline/parse_prices.py pipeline/input/precios_junio_2026.csv

Formato CSV (sep=,):
  slug,nombre,precioMedio,alquilerM2,tx
  centro,Centro,7800,27.5,2650
  arganzuela,Arganzuela,6500,22.3,1920
  ...

Los campos varAnual se calculan automáticamente comparando con los datos actuales en src/data/distritos.js.
Si no hay variación histórica disponible para un slug, se mantiene el valor existente.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
DISTRITOS_JS = ROOT / "src" / "data" / "distritos.js"
EDICION_NUEVA = "Edición Junio 2026"
NUMERO_NUEVO = "Nº 18"
FECHA_NUEVA = f"{datetime.now().day:02d} · {datetime.now().month:02d} · {datetime.now().year}"


def load_current_distritos() -> dict[str, dict]:
    """Extrae el objeto distritos actual de distritos.js como diccionario slug→data."""
    text = DISTRITOS_JS.read_text(encoding="utf-8")
    # Find distritos array
    m = re.search(r"distritos:\s*\[(.*?)\],", text, re.S)
    if not m:
        return {}
    current = {}
    for entry in re.finditer(
        r"\{\s*slug:\s*'([^']+)'.*?precioMedio:\s*(\d+).*?alquilerM2:\s*([\d.]+)"
        r".*?rent:\s*([\d.]+).*?varAnual:\s*([\d.]+).*?tx:\s*(\d+).*?ranking:\s*(\d+)\s*\}",
        m.group(1), re.S
    ):
        slug = entry.group(1)
        current[slug] = {
            "precioMedio": int(entry.group(2)),
            "alquilerM2": float(entry.group(3)),
            "rent": float(entry.group(4)),
            "varAnual": float(entry.group(5)),
            "tx": int(entry.group(6)),
            "ranking": int(entry.group(7)),
        }
    return current


def parse_csv(csv_path: Path) -> list[dict]:
    rows = []
    lines = csv_path.read_text(encoding="utf-8").strip().splitlines()
    header = [h.strip() for h in lines[0].split(",")]
    for line in lines[1:]:
        if not line.strip():
            continue
        vals = [v.strip() for v in line.split(",")]
        row = dict(zip(header, vals))
        rows.append(row)
    return rows


def generate_distritos_js(distritos: list[dict], meta: dict) -> str:
    lines = [
        "// Shared real data extracted from /data/distritos.json + /data/barrios-detalle.json",
        "// Used by all three home variations in mocks/home-variations.html",
        "",
        "window.HOME_DATA = {",
        "  // Madrid-wide aggregates",
        "  meta: {",
        f"    edicion: '{meta['edicion']}',",
        f"    numero: '{meta['numero']}',",
        f"    fecha: '{meta['fecha']}',",
        f"    precioMedio: {meta['precioMedio']},           // mean of distritos",
        f"    variacionMedia: {meta['variacionMedia']},        // mean",
        f"    distritos: {meta['distritos']},",
        f"    barrios: {meta['barrios']},",
        f"    transaccionesAnio: {meta['transaccionesAnio']},",
        "  },",
        "",
        "  // All 21 districts (slim)",
        "  distritos: [",
    ]
    for d in distritos:
        lines.append(
            f"    {{ slug: '{d['slug']}', nombre: '{d['nombre']}', "
            f"precioMedio: {d['precioMedio']}, alquilerM2: {d['alquilerM2']}, "
            f"rent: {d['rent']}, varAnual: {d['varAnual']}, "
            f"tx: {d['tx']}, ranking: {d['ranking']} }},"
        )
    lines.append("  ],")

    # Preserve the rest of the file after distritos array (barrios, etc.)
    original = DISTRITOS_JS.read_text(encoding="utf-8")
    # Find everything after the closing of distritos array
    m = re.search(r"distritos:\s*\[.*?\],\s*\n(.*)", original, re.S)
    rest = m.group(1).rstrip() if m else ""
    if rest:
        lines.append("")
        lines.append("  " + rest.lstrip())

    lines.append("};")
    return "\n".join(lines) + "\n"


def sanity_check(new_distritos: list[dict], old_distritos: dict[str, dict]):
    warnings = []
    for d in new_distritos:
        slug = d["slug"]
        if slug not in old_distritos:
            continue
        old_price = old_distritos[slug]["precioMedio"]
        new_price = d["precioMedio"]
        change_pct = abs(new_price - old_price) / old_price * 100
        if change_pct > 15:
            warnings.append(f"  ⚠ {d['nombre']}: precio cambia {change_pct:.1f}% ({old_price} → {new_price}) — verificar")
    return warnings


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        sys.exit(f"ERROR: no existe {csv_path}")

    print(f"Leyendo precios de {csv_path}…")
    rows = parse_csv(csv_path)
    old_distritos = load_current_distritos()

    new_distritos = []
    for row in rows:
        slug = row["slug"]
        precio = int(row["precioMedio"])
        alquiler = float(row["alquilerM2"])
        tx = int(row["tx"])
        nombre = row.get("nombre", slug.title())

        rent = round((alquiler * 12 / precio) * 100, 2)

        # Calcular varAnual vs precio anterior
        if slug in old_distritos:
            precio_anterior = old_distritos[slug]["precioMedio"]
            var_anual = round((precio - precio_anterior) / precio_anterior * 100, 2)
        else:
            var_anual = float(row.get("varAnual", 0))

        new_distritos.append({
            "slug": slug,
            "nombre": nombre,
            "precioMedio": precio,
            "alquilerM2": alquiler,
            "rent": rent,
            "varAnual": var_anual,
            "tx": tx,
        })

    # Calcular rankings (mayor precio = menor ranking número = más caro)
    sorted_by_price = sorted(new_distritos, key=lambda x: -x["precioMedio"])
    slug_to_ranking = {d["slug"]: i + 1 for i, d in enumerate(sorted_by_price)}
    for d in new_distritos:
        d["ranking"] = slug_to_ranking[d["slug"]]

    # Calcular meta
    precios = [d["precioMedio"] for d in new_distritos]
    vars_anuales = [d["varAnual"] for d in new_distritos]
    total_tx = sum(d["tx"] for d in new_distritos)

    # Load current meta for barrios count
    original_text = DISTRITOS_JS.read_text(encoding="utf-8")
    barrios_m = re.search(r"barrios:\s*(\d+)", original_text)
    barrios = int(barrios_m.group(1)) if barrios_m else 131

    meta = {
        "edicion": EDICION_NUEVA,
        "numero": NUMERO_NUEVO,
        "fecha": FECHA_NUEVA,
        "precioMedio": round(sum(precios) / len(precios)),
        "variacionMedia": round(sum(vars_anuales) / len(vars_anuales), 1),
        "distritos": len(new_distritos),
        "barrios": barrios,
        "transaccionesAnio": total_tx * 4,  # trim → anual estimado
    }

    # Sanity checks
    warnings = sanity_check(new_distritos, old_distritos)
    if warnings:
        print("\nADVERTENCIAS (verificar antes de publicar):")
        for w in warnings:
            print(w)
        resp = input("\n¿Continuar igualmente? (s/N): ").strip().lower()
        if resp != "s":
            sys.exit("Abortado.")

    # Mantener el orden original de distritos (slug order from current JS)
    original_order = list(old_distritos.keys())
    slug_map = {d["slug"]: d for d in new_distritos}
    ordered = [slug_map[s] for s in original_order if s in slug_map]
    # Añadir los nuevos que no estaban
    for d in new_distritos:
        if d["slug"] not in old_distritos:
            ordered.append(d)

    new_js = generate_distritos_js(ordered, meta)
    DISTRITOS_JS.write_text(new_js, encoding="utf-8")

    print(f"\n✓ src/data/distritos.js actualizado — {len(ordered)} distritos")
    print(f"  Edición: {meta['edicion']} / {meta['numero']}")
    print(f"  Precio medio Madrid: {meta['precioMedio']} €/m²")
    print(f"  Variación media anual: +{meta['variacionMedia']}%")
    print("\nPróximo paso: python3 pipeline/build.py")


if __name__ == "__main__":
    main()
