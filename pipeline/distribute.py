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
import base64, gzip, json, re, shutil, sys, urllib.request
from datetime import date
from pathlib import Path

ROOT     = Path(__file__).parent.parent
HTML_IN  = ROOT / "Radar Inmobiliario Madrid.html"
DIST     = ROOT / "dist"
MAP_FILE = ROOT / "src" / "manifest.map.json"
NEWS_JS  = ROOT / "src" / "data" / "news.js"

BASE_URL = "https://www.radarinmobiliario.com"  # canonical domain (non-www → 308 redirect)

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

def smart_truncate(text: str, limit: int = 155) -> str:
    """Truncate `text` to at most `limit` chars, breaking on a word boundary.
    Appends '…' only if the text was actually truncated."""
    text = text or ''
    if len(text) <= limit:
        return text
    cut = text[:limit]
    last_space = cut.rfind(' ')
    if last_space > 0:
        cut = cut[:last_space]
    return cut.rstrip(' ,.;:') + '…'


def _split_top_level_objects(s: str) -> list:
    """Split the inner text of a JSON array (between '[' and ']') into a list
    of substrings, one per top-level `{...}` object, respecting braces that
    appear inside quoted strings."""
    objs = []
    depth = 0
    start = None
    in_str = False
    esc = False
    for i, c in enumerate(s):
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == '{':
            if depth == 0:
                start = i
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and start is not None:
                objs.append(s[start:i + 1])
                start = None
    return objs


def _regex_fallback_object(obj_str: str) -> dict:
    """Best-effort regex parse for a single item object when json.loads fails.
    Applied to the isolated object text (not a directional window), so field
    order inside the object no longer matters."""
    it = {}
    for key in ('slug', 'titulo', 'resumen', 'fechaISO', 'hora', 'imagen', 'categoria'):
        mm = re.search(rf'"{key}":\s*"([^"]*)"', obj_str)
        if mm:
            it[key] = mm.group(1)
    it['body'] = [
        {'type': 'p', 'text': t}
        for t in re.findall(r'"type":\s*"p"[^}]*?"text":\s*"((?:[^"\\]|\\.)*)"', obj_str)
    ]
    return it


def extract_news_articles() -> list:
    """Parse src/data/news.js and return list of article dicts from items[].

    Robusto frente al orden de claves: aísla el array `items: [...]` balanceando
    corchetes (respetando strings) y luego cada objeto de primer nivel con
    balanceo de llaves, parseando cada uno con json.loads. Si un objeto
    concreto no es JSON válido, cae a un parseo regex best-effort SOLO para
    ese objeto, para no romper el build completo.
    """
    if not NEWS_JS.exists():
        return []
    text = NEWS_JS.read_text(encoding="utf-8")

    items_m = re.search(r'\bitems:\s*\[', text)
    if not items_m:
        return []

    # Balancear corchetes desde el '[' de apertura para hallar el cierre real
    start = items_m.end() - 1
    depth = 0
    in_str = False
    esc = False
    end = None
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                end = i
                break
    items_text = text[start + 1:end] if end is not None else text[items_m.end():]

    articles = []
    for obj_str in _split_top_level_objects(items_text):
        try:
            it = json.loads(obj_str)
        except json.JSONDecodeError as e:
            print(f"  ⚠ objeto de news.js no parseable como JSON ({e}); usando fallback regex")
            it = _regex_fallback_object(obj_str)

        body_texts = [
            b.get('text', '') for b in it.get('body', [])
            if b.get('type') == 'p' and b.get('text')
        ]
        articles.append({
            'slug':      it.get('slug', ''),
            'titulo':    it.get('titulo', ''),
            'resumen':   it.get('resumen', ''),
            'fechaISO':  it.get('fechaISO', ''),
            'hora':      it.get('hora') or '00:00',
            'imagen':    it.get('imagen') or '/og-image.png',
            'categoria': it.get('categoria', ''),
            'body_texts': body_texts,
        })

    return articles


def gen_article_pages(articles: list, index_html: str) -> None:
    """Generate static HTML per article in dist/noticia/[slug]/index.html for social bots."""
    import html as _html

    noticia_dir = DIST / "noticia"
    noticia_dir.mkdir(exist_ok=True)

    # Ítem 2 — eliminar carpetas de artículos que ya no están vigentes en news.js
    # (index bloat / contenido duplicado con slug viejo).
    valid_slugs = {art['slug'] for art in articles if art.get('slug')}
    for existing in noticia_dir.iterdir():
        if existing.is_dir() and existing.name not in valid_slugs:
            shutil.rmtree(existing)
            print(f"  ✗ eliminada carpeta huérfana dist/noticia/{existing.name}")

    for art in articles:
        slug       = art['slug']
        titulo_raw = art['titulo']
        resumen_full = art.get('resumen') or ''
        # Ítem 4 — truncado en frontera de palabra para meta/OG/twitter;
        # el JSON-LD conserva el resumen completo.
        resumen_raw = smart_truncate(resumen_full, 155)
        canonical  = f"{BASE_URL}/noticia/{slug}"
        imagen_src = art.get('imagen', '/og-image.png')
        og_image   = imagen_src if imagen_src.startswith('http') else f"{BASE_URL}{imagen_src}"
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

        # Inject static NewsArticle JSON-LD into <head>
        fecha_pub = art.get('fechaISO', '')
        categoria = art.get('categoria', '')
        ld_author = {"@type": "Organization", "name": "Redacción Radar Inmobiliario Madrid",
                     "url": f"{BASE_URL}/sobre"}
        ld_pub    = {"@id": f"{BASE_URL}/#organization"}
        ld = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": titulo_raw,
            "description": resumen_full,
            "image": og_image,
            "datePublished": fecha_pub,
            "dateModified": fecha_pub,
            "url": canonical,
            "inLanguage": "es",
            "articleSection": categoria,
            "author": ld_author,
            "publisher": ld_pub,
            "mainEntityOfPage": canonical,
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE_URL + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Noticias", "item": BASE_URL + "/noticias"},
                    {"@type": "ListItem", "position": 3, "name": titulo_raw},
                ]
            }
        }
        ld_tag = f'\n  <script type="application/ld+json">\n  {json.dumps(ld, ensure_ascii=False, indent=2)}\n  </script>'
        art_html = art_html.replace('</head>', ld_tag + '\n</head>', 1)

        # Inject article body text as hidden element for crawlers (passage indexing)
        body_texts = art.get('body_texts', [])
        if body_texts:
            body_html_parts = [f'<p>{_html.escape(p)}</p>' for p in body_texts]
            hidden_body = (
                '\n  <div id="article-body" style="position:absolute;left:-9999px;top:-9999px;'
                'width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n    '
                + '\n    '.join(body_html_parts)
                + '\n  </div>'
            )
            art_html = art_html.replace('<div id="root">', hidden_body + '\n  <div id="root">', 1)

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
            f"    <loc>{BASE_URL}/noticia/{slug}</loc>\n"
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
        f"    <loc>{BASE_URL}/noticia/{art['slug']}</loc>\n"
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


def gen_llms_txt(articles: list) -> None:
    """Generate dist/llms.txt from live data (no hardcoded/volatile per-district
    figures — those go stale; link to /distritos instead)."""
    valid_articles = [a for a in articles if a.get('slug') and a.get('titulo')]

    lines = [
        "# Radar Inmobiliario Madrid",
        "> Publicación independiente de datos del mercado inmobiliario de Madrid: "
        "precio por m², rentabilidad bruta y variación interanual por distrito y barrio.",
        "",
        "## Descripción",
        "Radar Inmobiliario Madrid agrega y publica datos de precios de vivienda, "
        "rentabilidad de alquiler y variación interanual para los distritos de "
        "Madrid, con actualización periódica y cobertura de noticias del mercado "
        "inmobiliario. Los datos son orientativos y no constituyen asesoramiento "
        "financiero.",
        "",
        "## Enlaces clave",
        f"- [Inicio]({BASE_URL}/)",
        f"- [Distritos]({BASE_URL}/distritos)",
        f"- [Noticias]({BASE_URL}/noticias)",
        f"- [Sobre]({BASE_URL}/sobre)",
        f"- [Metodología]({BASE_URL}/metodologia)",
        "",
        "## Noticias recientes",
    ]

    for art in valid_articles:
        resumen_breve = smart_truncate(art.get('resumen') or '', 160)
        lines.append(f"- [{art['titulo']}]({BASE_URL}/noticia/{art['slug']}): {resumen_breve}")

    lines += [
        "",
        "## Fuentes",
        "Idealista, Fotocasa, Colegios Notariales, Ayuntamiento de Madrid.",
        "",
        "## Licencia",
        "Uso informativo con atribución a Radar Inmobiliario Madrid "
        "(radarinmobiliario.com). Licencia CC BY-NC 4.0.",
        "",
        "## Contacto",
        "radarinmobiliario.com",
        "",
    ]

    (DIST / "llms.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ dist/llms.txt ({len(valid_articles)} artículos)")


def update_robots() -> None:
    """Add news-sitemap to robots.txt if not already present."""
    robots = DIST / "robots.txt"
    content = robots.read_text(encoding="utf-8") if robots.exists() else ""
    line = f"Sitemap: {BASE_URL}/news-sitemap.xml"
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

    # Normalize all canonical URLs to www (non-www → 308, must be consistent)
    head_clean = head_clean.replace("https://radarinmobiliario.com", BASE_URL)
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
        gen_llms_txt(articles)
        print(f"  {len(list((DIST/'noticia').iterdir()))} páginas de artículo == {len(articles)} vigentes")
    else:
        print("  (no se encontraron artículos en news.js)")


if __name__ == "__main__":
    main()
