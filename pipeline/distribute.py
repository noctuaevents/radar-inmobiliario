#!/usr/bin/env python3
"""
distribute.py — Descompone el bundle monolítico en assets separados y genera dist/index.html.

ENTRADA:  Radar Inmobiliario Madrid.html (manifest gzip+base64, ~1.8 MB)
SALIDA:
  dist/index.html              ← HTML shell (~150 KB raw / ~50 KB gzip)
  dist/assets/react.min.js     ← React 18 producción (~45 KB)
  dist/assets/react-dom.min.js ← ReactDOM 18 producción (~130 KB)
  dist/assets/babel.min.js     ← Babel standalone (~3 MB, 640 KB gzip — necesario para JSX)
  dist/assets/geojson.js       ← GeoJSON Madrid (~355 KB, 60 KB gzip)
  dist/assets/image-slot.js    ← web component (~30 KB)
  dist/assets/fonts/*.woff2    ← fuentes Inter
  dist/data/news.js            ← noticias (cambia en cada edición)
  dist/data/distritos.js       ← distritos (casi estático)

Uso: python3 pipeline/distribute.py
"""
import base64, gzip, json, re, sys, urllib.request, time
from pathlib import Path

ROOT     = Path(__file__).parent.parent
HTML_IN  = ROOT / "Radar Inmobiliario Madrid.html"
DIST     = ROOT / "dist"
MAP_FILE = ROOT / "src" / "manifest.map.json"

REACT_VER    = "18.3.1"
REACT_URL    = f"https://cdn.jsdelivr.net/npm/react@{REACT_VER}/umd/react.production.min.js"
REACTDOM_URL = f"https://cdn.jsdelivr.net/npm/react-dom@{REACT_VER}/umd/react-dom.production.min.js"


# ── helpers ────────────────────────────────────────────────────────────────────

def decode_asset(entry: dict) -> bytes:
    raw = base64.b64decode(entry["data"])
    return gzip.decompress(raw) if entry.get("compressed") else raw


def download(url: str, dest: Path, label: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "RadarBot/1.0"})
    print(f"  Descargando {label}…")
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    dest.write_bytes(data)
    print(f"    {dest.name}  {len(data)//1024} KB")


def escape_script(src: str) -> str:
    """Escape </script> inside inline script content so the HTML parser doesn't break."""
    return src.replace("</script>", r"<\/script>")


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    html = HTML_IN.read_text(encoding="utf-8")
    manifest_map = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {}

    # ── 1. Parse bundle manifest ──────────────────────────────────────────────
    m = re.search(r'<script\b[^>]*type="__bundler/manifest"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        sys.exit("ERROR: __bundler/manifest no encontrado")
    manifest: dict = json.loads(m.group(1))

    # ── 2. Parse template ─────────────────────────────────────────────────────
    t = re.search(r'<script\b[^>]*type="__bundler/template"[^>]*>(.*?)</script>', html, re.S)
    if not t:
        sys.exit("ERROR: __bundler/template no encontrado")
    template: str = json.loads(t.group(1))

    # ── 3. Classify assets ───────────────────────────────────────────────────
    # role → (dest_path | None, url_path | None)
    def classify(uuid: str, content: bytes, mime: str) -> tuple:
        mapped = manifest_map.get(uuid, {}).get("path", "")
        text   = content[:250].decode("utf-8", errors="ignore")

        if "woff2" in mime or mapped.startswith("fonts/"):
            return ("font",       DIST/"assets"/"fonts"/f"{uuid}.woff2", f"/assets/fonts/{uuid}.woff2")
        if mapped == "data/news.js":
            return ("data_news",  DIST/"data"/"news.js",                  "/data/news.js")
        if mapped == "data/distritos.js":
            return ("data_dist",  DIST/"data"/"distritos.js",             "/data/distritos.js")
        if mapped == "data/madrid-geojson.js":
            return ("geojson",    DIST/"assets"/"geojson.js",             "/assets/geojson.js")
        if mapped.startswith("components/"):
            return ("component",  None,                                   None)  # will be inlined
        # Anonymous assets — identify by content
        if "react.development.js" in text:
            return ("react_dev",  None,                                   "/assets/react.min.js")
        if "react-dom.development.js" in text:
            return ("rdom_dev",   None,                                   "/assets/react-dom.min.js")
        if len(content) > 2_000_000:           # Babel standalone ≈ 3 MB
            return ("babel",      DIST/"assets"/"babel.min.js",          "/assets/babel.min.js")
        if "image-slot" in text.lower():
            return ("imgslot",    DIST/"assets"/"image-slot.js",         "/assets/image-slot.js")
        # fallback
        return ("other",          DIST/"assets"/f"{uuid}.js",            f"/assets/{uuid}.js")

    assets = {}
    for uuid, entry in manifest.items():
        content = decode_asset(entry)
        mime    = entry.get("mime", "")
        role, dest, url_path = classify(uuid, content, mime)
        assets[uuid] = {"role": role, "content": content, "dest": dest, "url": url_path}

    # ── 4. Write extracted assets ─────────────────────────────────────────────
    print("\nExtrayendo assets…")
    (DIST / "assets" / "fonts").mkdir(parents=True, exist_ok=True)
    (DIST / "data").mkdir(parents=True, exist_ok=True)

    for uuid, a in assets.items():
        if a["dest"] and a["role"] not in ("react_dev", "rdom_dev"):
            a["dest"].write_bytes(a["content"])
            kb = len(a["content"]) // 1024
            print(f"  {a['role']:12}  {a['dest'].relative_to(DIST)}  ({kb} KB)")

    # ── 5. Download React/ReactDOM production ─────────────────────────────────
    react_dest    = DIST / "assets" / "react.min.js"
    reactdom_dest = DIST / "assets" / "react-dom.min.js"
    print()
    if not react_dest.exists():
        download(REACT_URL, react_dest, "React production")
    else:
        print(f"  react.min.js ya existe ({react_dest.stat().st_size//1024} KB)")
    if not reactdom_dest.exists():
        download(REACTDOM_URL, reactdom_dest, "ReactDOM production")
    else:
        print(f"  react-dom.min.js ya existe ({reactdom_dest.stat().st_size//1024} KB)")

    # ── 6. Extract SEO <head> from main HTML ──────────────────────────────────
    head_m = re.search(r'<head>(.*?)</head>', html, re.S)
    head_raw = head_m.group(1)

    # Remove bundler-only elements
    head_clean = re.sub(r'\s*<script\b[^>]*type="__bundler[^"]*"[^>]*>.*?</script>', '', head_raw, flags=re.S)
    # Remove the async DOMContentLoaded loader script (identified by DecompressionStream)
    head_clean = re.sub(r'\s*<script>\s*document\.addEventListener\(\'DOMContentLoaded\',\s*async\b.*?</script>', '', head_clean, flags=re.S)
    # Remove the bundler-only <style> (contains #__bundler_loading / #__bundler_thumbnail)
    head_clean = re.sub(r'\s*<style>\s*\*\s*\{[^}]*\}.*?#__bundler.*?</style>', '', head_clean, flags=re.S)
    # Remove bundler noscript
    head_clean = re.sub(r'\s*<noscript>\s*<style>#__bundler_loading[^<]*</style>[^<]*<div[^<]*</div>\s*</noscript>', '', head_clean, flags=re.S)
    head_clean = head_clean.strip()

    # ── 7. Extract ALL <style> blocks from template head ─────────────────────
    template_head_end = template.find('</head>')
    all_styles = re.findall(r'<style>(.*?)</style>', template[:template_head_end], re.S)
    all_css = ""
    for css in all_styles:
        for uuid, a in assets.items():
            if a["role"] == "font":
                css = css.replace(f'url("{uuid}")', f'url("{a["url"]}")')
        all_css += css + "\n"
    font_css = f'<style>{all_css}</style>' if all_css else ""

    # ── 8. Build component inline scripts (from template body) ───────────────
    template_body_start = template.find('</head>') + 7
    template_body = template[template_body_start:]

    # Collect component UUIDs in DOM order
    component_scripts_html = ""
    for sm in re.finditer(r'<script\b[^>]*type="text/babel"[^>]*src="([0-9a-f-]{36})"[^>]*/?>(?:</script>)?', template_body):
        uuid = sm.group(1)
        if uuid in assets and assets[uuid]["role"] == "component":
            content = escape_script(assets[uuid]["content"].decode("utf-8"))
            component_scripts_html += f'\n<script type="text/babel">\n{content}\n</script>'

    # Inline router script (type="text/babel" without src)
    router_m = re.search(r'<script\s+type="text/babel"(?!\s*src)[^>]*>\s*(.*?)\s*</script>', template_body, re.S)
    if router_m:
        router = escape_script(router_m.group(1))
        component_scripts_html += f'\n<script type="text/babel">\n{router}\n</script>'

    # ── 9. Build body data/script tags in original DOM order ─────────────────
    uuid_to_url = {u: a["url"] for u, a in assets.items() if a["url"] and a["role"] not in ("component", "react_dev", "rdom_dev")}

    body_tags = []
    for sm in re.finditer(r'<script\b(?![^>]*type="text/babel")[^>]*src="([0-9a-f-]{36})"[^>]*/?>(?:</script>)?', template_body):
        uuid = sm.group(1)
        if uuid in uuid_to_url:
            body_tags.append(f'  <script src="{uuid_to_url[uuid]}"></script>')
    body_data_html = "\n".join(body_tags)

    # ── 10. Assemble dist/index.html ─────────────────────────────────────────
    index_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
{head_clean}

{font_css}

  <script src="/assets/react.min.js"></script>
  <script src="/assets/react-dom.min.js"></script>
  <script src="/assets/babel.min.js"></script>
</head>
<body class="bg-stone-100">
  <div id="root">
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#faf9f5;font:14px/1 -apple-system,BlinkMacSystemFont,sans-serif;color:#9ca3af;">
      Cargando…
    </div>
  </div>

{body_data_html}
{component_scripts_html}
</body>
</html>"""

    out = DIST / "index.html"
    out.write_text(index_html, encoding="utf-8")
    kb_new = len(index_html.encode("utf-8")) // 1024
    print(f"\n✓ dist/index.html  {kb_new} KB (antes: 1795 KB)")

    # Summary
    separados = sum(
        a["dest"].stat().st_size for a in assets.values()
        if a["dest"] and a["dest"].exists()
    )
    separados += react_dest.stat().st_size + reactdom_dest.stat().st_size
    print(f"  Assets separados en dist/: {separados//1024} KB total")
    print(f"  (se cargan en paralelo y se cachean en el navegador)")


if __name__ == "__main__":
    main()
