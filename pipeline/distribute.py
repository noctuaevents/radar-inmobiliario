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
  dist/noticia/[slug]/index.html ← páginas estáticas por artículo (OG tags para bots)
  dist/news-sitemap.xml        ← News Sitemap para Google News

Uso: python3 pipeline/distribute.py
"""
import base64, gzip, json, re, sys, urllib.request
from datetime import date
from pathlib import Path

ROOT     = Path(__file__).parent.parent
HTML_IN  = ROOT / "Radar Inmobiliario Madrid.html"
DIST     = ROOT / "dist"
MAP_FILE = ROOT / "src" / "manifest.map.json"
NEWS_JS  = ROOT / "src" / "data" / "news.js"

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


# ── SEO helpers ────────────────────────────────────────────────────────────────

def extract_news_articles() -> list:
    """Parse src/data/news.js and return list of article dicts from items[]."""
    if not NEWS_JS.exists():
        return []
    text = NEWS_JS.read_text(encoding="utf-8")

    items_m  = re.search(r'\bitems:\s*\[', text)
    fuentes_m = re.search(r'\],\s*\n\s*fuentes:', text)
    if not items_m or not fuentes_m:
        return []

    items_text = text[items_m.end():fuentes_m.start()]
    articles = []

    for m in re.finditer(r'"slug":\s*"([^"]+)"', items_text):
        slug = m.group(1)
        ctx  = items_text[m.start():m.start() + 2500]

        t  = re.search(r'"titulo":\s*"([^"]+)"',   ctx)
        r_ = re.search(r'"resumen":\s*"([^"]+)"',   ctx)
        f  = re.search(r'"fechaISO":\s*"([^"]+)"',  ctx)
        h  = re.search(r'"hora":\s*"([^"]+)"',      ctx)
        i  = re.search(r'"imagen":\s*"([^"]+)"',    ctx)

        articles.append({
            'slug':     slug,
            'titulo':   t.group(1)  if t  else '',
            'resumen':  r_.group(1) if r_ else '',
            'fechaISO': f.group(1)  if f  else '',
            'hora':     h.group(1)  if h  else '00:00',
            'imagen':   i.group(1)  if i  else '/og-image.png',
        })

    return articles


def gen_article_pages(articles: list, index_html: str) -> None:
    """Generate static HTML per article in dist/noticia/[slug]/index.html for social bots."""
    import html as _html

    noticia_dir = DIST / "noticia"
    noticia_dir.mkdir(exist_ok=True)

    for art in articles:
        slug       = art['slug']
        titulo_raw = art['titulo']
        resumen_raw = (art.get('resumen') or '')[:160]
        canonical  = f"https://radarinmobiliario.com/noticia/{slug}"
        imagen_src = art.get('imagen', '/og-image.png')
        og_image   = imagen_src if imagen_src.startswith('http') else f"https://radarinmobiliario.com{imagen_src}"
        full_title  = _html.escape(titulo_raw) + " | Radar Inmobiliario Madrid"
        resumen_esc = _html.escape(resumen_raw)

        art_html = index_html
        art_html = re.sub(r'<title>[^<]+</title>',
                          f'<title>{full_title}</title>', art_html)
        art_html = re.sub(r'(<meta name="description" content=")[^"]*(")',
                          rf'\g<1>{resumen_esc}\2', art_html)
        art_html = re.sub(r'(<link rel="canonical" href=")[^"]*(")',
                          rf'\g<1>{canonical}\2', art_html)
        art_html = re.sub(r'(<link rel="alternate" hreflang="es" href=")[^"]*(")',
                          rf'\g<1>{canonical}\2', art_html)
        art_html = re.sub(r'(<link rel="alternate" hreflang="x-default" href=")[^"]*(")',
                          rf'\g<1>{canonical}\2', art_html)
        art_html = re.sub(r'(<meta property="og:type" content=")[^"]*(")',
                          r'\g<1>article\2', art_html)
        art_html = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                          rf'\g<1>{canonical}\2', art_html)
        art_html = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                          rf'\g<1>{full_title}\2', art_html)
        art_html = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                          rf'\g<1>{resumen_esc}\2', art_html)
        art_html = re.sub(r'(<meta property="og:image" content=")[^"]*(")',
                          rf'\g<1>{og_image}\2', art_html)
        art_html = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")',
                          rf'\g<1>{full_title}\2', art_html)
        art_html = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")',
                          rf'\g<1>{resumen_esc}\2', art_html)
        art_html = re.sub(r'(<meta name="twitter:image" content=")[^"]*(")',
                          rf'\g<1>{og_image}\2', art_html)

        article_dir = noticia_dir / slug
        article_dir.mkdir(exist_ok=True)
        (article_dir / "index.html").write_text(art_html, encoding="utf-8")

    print(f"✓ {len(articles)} páginas estáticas en dist/noticia/")


def gen_news_sitemap(articles: list) -> None:
    """Generate dist/news-sitemap.xml for Google News."""
    import html as _html

    entries = []
    for art in articles:
        slug    = art['slug']
        fecha   = art.get('fechaISO', '')
        hora    = art.get('hora', '00:00')
        titulo  = _html.escape(art.get('titulo', ''))
        if not fecha:
            continue
        pub_date = f"{fecha}T{hora}:00+02:00"
        entries.append(
            f"  <url>\n"
            f"    <loc>https://radarinmobiliario.com/noticia/{slug}</loc>\n"
            f"    <news:news>\n"
            f"      <news:publication>\n"
            f"        <news:name>Radar Inmobiliario Madrid</news:name>\n"
            f"        <news:language>es</news:language>\n"
            f"      </news:publication>\n"
            f"      <news:publication_date>{pub_date}</news:publication_date>\n"
            f"      <news:title>{titulo}</news:title>\n"
            f"    </news:news>\n"
            f"  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'
        + "\n".join(entries) + "\n"
        '</urlset>\n'
    )
    (DIST / "news-sitemap.xml").write_text(xml, encoding="utf-8")
    print(f"✓ dist/news-sitemap.xml ({len(entries)} artículos)")


def update_sitemap(articles: list) -> None:
    """Add/refresh article URLs in dist/sitemap.xml."""
    sitemap = DIST / "sitemap.xml"
    if not sitemap.exists():
        return

    content = sitemap.read_text(encoding="utf-8")
    # Remove previous article block if present
    content = re.sub(r'\s*<!-- News articles -->.*?<!-- /News articles -->', '',
                     content, flags=re.S)

    today = date.today().isoformat()
    entries_xml = "\n".join(
        f"  <url>\n"
        f"    <loc>https://radarinmobiliario.com/noticia/{art['slug']}</loc>\n"
        f"    <lastmod>{art.get('fechaISO', today)}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.7</priority>\n"
        f"  </url>"
        for art in articles if art.get('slug')
    )
    new_content = content.replace(
        '</urlset>',
        f'\n  <!-- News articles -->\n{entries_xml}\n  <!-- /News articles -->\n\n</urlset>'
    )
    sitemap.write_text(new_content, encoding="utf-8")
    print(f"✓ dist/sitemap.xml (+{len(articles)} artículos)")


def update_robots() -> None:
    """Add news-sitemap to robots.txt if not already present."""
    robots = DIST / "robots.txt"
    content = robots.read_text(encoding="utf-8") if robots.exists() else ""
    line = "Sitemap: https://radarinmobiliario.com/news-sitemap.xml"
    if line not in content:
        robots.write_text(content.rstrip() + f"\n{line}\n", encoding="utf-8")
        print("✓ dist/robots.txt actualizado (news-sitemap)")


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

    # Extract AdSense script from head — inject before </body> to unblock render
    adsense_m = re.search(
        r'\s*<!-- Google AdSense -->\s*<script[\s\S]*?googlesyndication[\s\S]*?</script>',
        head_clean
    )
    adsense_tag = adsense_m.group(0).strip() if adsense_m else ""
    if adsense_m:
        head_clean = head_clean[:adsense_m.start()] + head_clean[adsense_m.end():]

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
    adsense_body = f"\n  {adsense_tag}" if adsense_tag else ""
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
{component_scripts_html}{adsense_body}
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

    # ── 11. SEO: páginas de artículo + news sitemap ───────────────────────────
    print("\nGenerando assets SEO…")
    articles = extract_news_articles()
    if articles:
        gen_article_pages(articles, index_html)
        gen_news_sitemap(articles)
        update_sitemap(articles)
        update_robots()
    else:
        print("  (no se encontraron artículos en news.js)")


if __name__ == "__main__":
    main()
