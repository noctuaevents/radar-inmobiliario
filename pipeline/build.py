#!/usr/bin/env python3
"""
build.py — Re-bundle src/ → Radar Inmobiliario Madrid.html
Lee src/manifest.map.json, re-codifica cada fichero (gzip+base64 si compressed=true)
y reemplaza el bloque <script type="__bundler/manifest"> en el HTML.

Uso: python3 pipeline/build.py
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


def encode_entry(content: bytes, compressed: bool) -> str:
    if compressed:
        content = gzip.compress(content, compresslevel=9)
    return base64.b64encode(content).decode("ascii")


def main():
    if not MAP_FILE.exists():
        sys.exit(f"ERROR: no se encuentra {MAP_FILE}. Ejecuta primero pipeline/extract.py")

    manifest_map: dict = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    html = HTML_FILE.read_text(encoding="utf-8")

    # Parse current manifest from HTML
    m = re.search(r'(<script\b[^>]*type="__bundler/manifest"[^>]*>)(.*?)(</script>)', html, re.S)
    if not m:
        sys.exit('ERROR: no se encontró <script type="__bundler/manifest"> en el HTML')

    open_tag, manifest_json_str, close_tag = m.group(1), m.group(2), m.group(3)
    manifest: dict = json.loads(manifest_json_str)

    changed = 0
    for uuid, info in manifest_map.items():
        path = SRC_DIR / info["path"]
        if not path.exists():
            print(f"  AVISO: {path} no existe, se mantiene el original para {uuid[:8]}…")
            continue

        mime = info["mime"]
        compressed = info["compressed"]

        if mime == "application/javascript":
            content = path.read_text(encoding="utf-8").encode("utf-8")
        else:
            content = path.read_bytes()

        new_data = encode_entry(content, compressed)
        if manifest[uuid]["data"] != new_data:
            manifest[uuid]["data"] = new_data
            changed += 1
            print(f"  actualizado: src/{info['path']}  ({len(content):,} bytes)")

    if changed == 0:
        print("Sin cambios detectados en src/ — HTML no modificado.")
        return

    # Serialize manifest compactly (no indent to keep file size down)
    new_manifest_str = json.dumps(manifest, separators=(",", ":"), ensure_ascii=False)

    new_html = html[: m.start()] + open_tag + new_manifest_str + close_tag + html[m.end() :]
    HTML_FILE.write_text(new_html, encoding="utf-8")

    old_kb = len(html.encode("utf-8")) / 1024
    new_kb = len(new_html.encode("utf-8")) / 1024
    print(f"\nBuild completo. {changed} recurso(s) actualizado(s).")
    print(f"HTML: {old_kb:.0f} KB → {new_kb:.0f} KB")


def distribute():
    """Call distribute.py to extract assets and regenerate dist/index.html."""
    import subprocess
    dist_script = Path(__file__).parent / "distribute.py"
    if dist_script.exists():
        print("\nActualizando dist/ con distribute.py…")
        subprocess.run([sys.executable, str(dist_script)], check=False)
    else:
        print(f"AVISO: {dist_script} no encontrado")


if __name__ == "__main__":
    main()
    distribute()
