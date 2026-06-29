#!/usr/bin/env python3
"""
extract.py — De-bundle Radar Inmobiliario Madrid.html
Extrae todos los recursos del manifest gzip+base64 a src/ para poder editarlos.
Genera src/manifest.map.json con el mapeo uuid -> {path, mime, compressed}.

Uso: python3 pipeline/extract.py
"""
import base64
import gzip
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
HTML_FILE = ROOT / "Radar Inmobiliario Madrid.html"
SRC_DIR = ROOT / "src"
MAP_FILE = SRC_DIR / "manifest.map.json"

# Rutas fijas para los dos ficheros de datos (identificados por cabecera)
DATA_HEADERS = {
    "// Shared real data extracted from /data/distritos": "data/distritos.js",
    "// Enriched news data for the redesigned": "data/news.js",
    "// Stylized cartogram of Madrid": "components/cartogram.js",
    "// N2 — Noticias estilo": "components/noticias-n2.js",
    "// Variation D": "components/home-variation-d.js",
    "// D2 — Distritos": "components/distritos-d2.js",
    "// Detalle de noticia": "components/noticia-detalle.js",
    "/**\n * <image-slot>": "components/image-slot.js",
    "/**\n * @license React\n * react.development": "vendor/react.development.js",
    "/**\n * @license React\n * react-dom.development": "vendor/react-dom.development.js",
    "!function(e,t)": "vendor/tailwind.js",
    "window.MADRID_GEOJSON": "data/madrid-geojson.js",
}

def decode_entry(entry: dict) -> bytes:
    raw = base64.b64decode(entry["data"])
    if entry.get("compressed"):
        raw = gzip.decompress(raw)
    return raw


def sniff_path(content: bytes, uuid: str, mime: str) -> str:
    """Guess a stable filename from content or mime type."""
    if mime == "application/javascript":
        text = content[:120].decode("utf-8", errors="ignore")
        for prefix, path in DATA_HEADERS.items():
            if text.startswith(prefix) or text.lstrip().startswith(prefix):
                return path
        # fallback: use uuid
        return f"unknown/{uuid}.js"
    elif mime in ("font/woff2", "font/woff", "application/font-woff2"):
        return f"fonts/{uuid}.woff2"
    else:
        ext = mime.split("/")[-1].split(";")[0]
        return f"assets/{uuid}.{ext}"


def main():
    html = HTML_FILE.read_text(encoding="utf-8")

    # Find the manifest <script> block
    m = re.search(r'<script\b[^>]*type="__bundler/manifest"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        sys.exit("ERROR: no se encontró <script type=\"__bundler/manifest\"> en el HTML")

    manifest: dict = json.loads(m.group(1))
    print(f"Manifest encontrado: {len(manifest)} recursos")

    manifest_map = {}  # uuid -> {path, mime, compressed}

    for uuid, entry in manifest.items():
        content = decode_entry(entry)
        mime = entry.get("mime", "application/octet-stream")
        compressed = entry.get("compressed", False)
        path = sniff_path(content, uuid, mime)

        out = SRC_DIR / path
        out.parent.mkdir(parents=True, exist_ok=True)

        if mime == "application/javascript":
            out.write_text(content.decode("utf-8"), encoding="utf-8")
        else:
            out.write_bytes(content)

        manifest_map[uuid] = {"path": str(Path(path)), "mime": mime, "compressed": compressed}
        print(f"  {uuid[:8]}…  →  src/{path}  ({len(content):,} bytes)")

    MAP_FILE.write_text(json.dumps(manifest_map, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nManifest map guardado en {MAP_FILE.relative_to(ROOT)}")
    print("De-bundle completo. Edita src/data/distritos.js y src/data/news.js")


if __name__ == "__main__":
    main()
