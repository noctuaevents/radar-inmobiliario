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


def decode_entry(data_b64: str, compressed: bool) -> bytes:
    raw = base64.b64decode(data_b64)
    return gzip.decompress(raw) if compressed else raw


def serialize_template(template_html: str) -> str:
    """Re-serialize the page template string back into the exact byte format of
    the original __bundler/template block: JSON string with all non-ASCII escaped
    (ensure_ascii=True), `</script` neutralized as `<\\/script` so the HTML parser
    doesn't terminate the script block early (this is why extract.py/distribute.py
    regexes can find the real closing tag), wrapped in the original `\\n…\\n`."""
    body = json.dumps(template_html, ensure_ascii=True).replace("</script", "<\\/script")
    return "\n" + body + "\n"


def main():
    if not MAP_FILE.exists():
        sys.exit(f"ERROR: no se encuentra {MAP_FILE}. Ejecuta primero pipeline/extract.py")

    manifest_map: dict = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    html = HTML_FILE.read_text(encoding="utf-8")

    # Parse current manifest from HTML
    m = re.search(r'(<script\b[^>]*type="__bundler/manifest"[^>]*>)(.*?)(</script>)', html, re.S)
    if not m:
        sys.exit('ERROR: no se encontró <script type="__bundler/manifest"> en el HTML')

    manifest: dict = json.loads(m.group(2))

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

        if uuid in manifest:
            # Idempotente: comparar el contenido DECODIFICADO, no el base64.
            # gzip no es determinista (mtime/OS byte), así que re-comprimir da
            # base64 distinto aun sin cambios reales — comparar bytes decodificados
            # evita reescribir el manifest en cada build (round-trip limpio).
            try:
                existing = decode_entry(manifest[uuid]["data"], manifest[uuid].get("compressed", compressed))
            except Exception:
                existing = None
            if existing == content:
                continue
            manifest[uuid]["mime"] = mime
            manifest[uuid]["compressed"] = compressed
            manifest[uuid]["data"] = encode_entry(content, compressed)
            changed += 1
            print(f"  actualizado: src/{info['path']}  ({len(content):,} bytes)")
        else:
            # Entrada nueva (p.ej. un componente añadido en src/manifest.map.json):
            # crear la entrada completa {mime, compressed, data}.
            manifest[uuid] = {
                "mime": mime,
                "compressed": compressed,
                "data": encode_entry(content, compressed),
            }
            changed += 1
            print(f"  NUEVO: src/{info['path']}  → uuid {uuid[:8]}…  ({len(content):,} bytes)")

    # ── Template: src/template.html → bloque __bundler/template ───────────────
    t = re.search(r'(<script\b[^>]*type="__bundler/template"[^>]*>)(.*?)(</script>)', html, re.S)
    template_file = SRC_DIR / "template.html"
    template_changed = False
    new_template_block = None
    if t and template_file.exists():
        current_template = json.loads(t.group(2))
        src_template = template_file.read_text(encoding="utf-8")
        if src_template != current_template:
            new_template_block = serialize_template(src_template)
            template_changed = True
            print(f"  actualizado: src/template.html  ({len(src_template):,} bytes)")
    elif t and not template_file.exists():
        print("  AVISO: src/template.html no existe — template del HTML sin tocar (ejecuta extract.py)")

    if changed == 0 and not template_changed:
        print("Sin cambios detectados en src/ — HTML no modificado.")
        return

    # Aplicar reemplazos por spans, de mayor offset a menor, para no invalidar
    # los offsets del bloque anterior. Solo se reescribe el manifest si cambió,
    # para preservarlo byte a byte cuando solo cambia el template (y viceversa).
    repls = []
    if changed > 0:
        new_manifest_str = json.dumps(manifest, separators=(",", ":"), ensure_ascii=False)
        repls.append((m.start(2), m.end(2), new_manifest_str))
    if template_changed:
        repls.append((t.start(2), t.end(2), new_template_block))
    repls.sort(key=lambda r: r[0], reverse=True)

    new_html = html
    for start, end, text in repls:
        new_html = new_html[:start] + text + new_html[end:]
    HTML_FILE.write_text(new_html, encoding="utf-8")

    old_kb = len(html.encode("utf-8")) / 1024
    new_kb = len(new_html.encode("utf-8")) / 1024
    parts = []
    if changed:
        parts.append(f"{changed} recurso(s)")
    if template_changed:
        parts.append("template")
    print(f"\nBuild completo. Actualizado: {', '.join(parts)}.")
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
