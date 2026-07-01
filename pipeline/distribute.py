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
DISTRITOS_JS = ROOT / "src" / "data" / "distritos.js"

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


def _balanced_array_text(text: str, array_key_regex: str) -> str:
    """Find `array_key_regex: [` in text and return the inner text between the
    balanced '[' ... ']' (respecting quoted strings)."""
    m = re.search(array_key_regex, text)
    if not m:
        return ""
    start = m.end() - 1
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
    return text[start + 1:end] if end is not None else text[m.end():]


def _regex_district_object(obj_str: str) -> dict:
    """Best-effort regex parse for a single district object (unquoted numeric
    values). Field order inside the object doesn't matter."""
    d = {}
    for key in ('slug', 'nombre'):
        mm = re.search(rf'"{key}":\s*\'([^\']*)\'|"{key}":\s*"([^"]*)"', obj_str)
        if mm:
            d[key] = mm.group(1) or mm.group(2)
    # single-quoted JS strings (source uses 'slug': 'centro', 'nombre': 'Centro')
    for key in ('slug', 'nombre'):
        if key not in d:
            mm = re.search(rf"{key}:\s*'([^']*)'", obj_str)
            if mm:
                d[key] = mm.group(1)
    for key in ('precioMedio', 'ranking'):
        mm = re.search(rf'{key}:\s*(-?\d+)', obj_str)
        if mm:
            d[key] = int(mm.group(1))
    for key in ('alquilerM2', 'rent', 'varAnual', 'tx'):
        mm = re.search(rf'{key}:\s*(-?\d+(?:\.\d+)?)', obj_str)
        if mm:
            val = mm.group(1)
            d[key] = int(val) if key == 'tx' else float(val)
    return d


def extract_districts() -> tuple:
    """Parse src/data/distritos.js (window.HOME_DATA) and return
    (distritos, meta):
      distritos: list of dicts with slug, nombre, precioMedio (int),
                 alquilerM2, rent, varAnual, tx, ranking
      meta: dict with edicion, fecha, precioMedio, variacionMedia
    Parseo robusto frente al orden de claves: balancea corchetes para aislar
    el array `distritos: [ ... ]`, luego cada objeto de primer nivel con
    balanceo de llaves y regex por clave (los valores numéricos no llevan
    comillas en el fichero fuente).
    """
    if not DISTRITOS_JS.exists():
        return [], {}
    text = DISTRITOS_JS.read_text(encoding="utf-8")

    # meta block (also unquoted numeric values, single-quoted strings)
    meta_block_m = re.search(r'\bmeta:\s*\{', text)
    meta = {}
    if meta_block_m:
        depth = 0
        start = meta_block_m.end() - 1
        end = None
        for i in range(start, len(text)):
            c = text[i]
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    end = i
                    break
        meta_str = text[start:end + 1] if end is not None else ""
        edicion_m = re.search(r"edicion:\s*'([^']*)'", meta_str)
        fecha_m = re.search(r"fecha:\s*'([^']*)'", meta_str)
        precio_m = re.search(r'precioMedio:\s*(-?\d+(?:\.\d+)?)', meta_str)
        var_m = re.search(r'variacionMedia:\s*(-?\d+(?:\.\d+)?)', meta_str)
        meta = {
            'edicion': edicion_m.group(1) if edicion_m else '',
            'fecha': fecha_m.group(1) if fecha_m else '',
            'precioMedio': int(float(precio_m.group(1))) if precio_m else 0,
            'variacionMedia': float(var_m.group(1)) if var_m else 0.0,
        }

    # distritos array — find the top-level `distritos: [` (not `window.HOME_DATA = {`)
    array_text = _balanced_array_text(text, r'\bdistritos:\s*\[')
    distritos = []
    for obj_str in _split_top_level_objects(array_text):
        d = _regex_district_object(obj_str)
        if d.get('slug') and d.get('nombre'):
            distritos.append({
                'slug': d.get('slug', ''),
                'nombre': d.get('nombre', ''),
                'precioMedio': int(d.get('precioMedio', 0)),
                'alquilerM2': d.get('alquilerM2', 0.0),
                'rent': d.get('rent', 0.0),
                'varAnual': d.get('varAnual', 0.0),
                'tx': int(d.get('tx', 0)),
                'ranking': int(d.get('ranking', 0)),
            })

    return distritos, meta


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

        # Ítem 4 — article:* meta tags (publish/modify time, section, author)
        hora = art.get('hora') or '00:00'
        published_time = f"{fecha_pub}T{hora}:00+02:00" if fecha_pub else ""
        article_meta_parts = []
        if published_time:
            article_meta_parts.append(
                f'<meta property="article:published_time" content="{published_time}">')
            article_meta_parts.append(
                f'<meta property="article:modified_time" content="{published_time}">')
        if categoria:
            article_meta_parts.append(
                f'<meta property="article:section" content="{_html.escape(categoria)}">')
        article_meta_parts.append(
            '<meta property="article:author" content="Redacción Radar Inmobiliario Madrid">')
        article_meta_tag = '\n  ' + '\n  '.join(article_meta_parts)
        art_html = art_html.replace('</head>', article_meta_tag + '\n</head>', 1)

        # Inject article body text as hidden element for crawlers (passage indexing)
        body_texts = art.get('body_texts', [])
        h1_html = f'<h1>{_html.escape(titulo_raw)}</h1>'
        if body_texts:
            body_html_parts = [f'<p>{_html.escape(p)}</p>' for p in body_texts]
            hidden_body = (
                '\n  <div id="article-body" style="position:absolute;left:-9999px;top:-9999px;'
                'width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n    '
                + h1_html + '\n    '
                + '\n    '.join(body_html_parts)
                + '\n  </div>'
            )
            art_html = art_html.replace('<div id="root">', hidden_body + '\n  <div id="root">', 1)
        else:
            # Still expose an <h1> for crawlers even without body text
            hidden_body = (
                '\n  <div id="article-body" style="position:absolute;left:-9999px;top:-9999px;'
                'width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n    '
                + h1_html
                + '\n  </div>'
            )
            art_html = art_html.replace('<div id="root">', hidden_body + '\n  <div id="root">', 1)

        article_dir = noticia_dir / slug
        article_dir.mkdir(exist_ok=True)
        (article_dir / "index.html").write_text(art_html, encoding="utf-8")

    print(f"✓ {len(articles)} páginas estáticas en dist/noticia/")


def _rewrite_head_meta(page_html: str, canonical: str, title: str, desc: str,
                        og_type: str = "website") -> str:
    """Rewrite title/description/canonical/hreflang/og/twitter tags in a page's
    <head>, following the exact regex pattern used by gen_article_pages."""
    import html as _html
    title_esc = _html.escape(title)
    desc_esc = _html.escape(desc)

    page_html = re.sub(r'<title>[^<]+</title>', f'<title>{title_esc}</title>', page_html)
    page_html = re.sub(r'(<meta name="description" content=")[^"]*(")',
                        rf'\g<1>{desc_esc}\2', page_html)
    page_html = re.sub(r'(<link rel="canonical" href=")[^"]*(")',
                        rf'\g<1>{canonical}\2', page_html)
    page_html = re.sub(r'(<link rel="alternate" hreflang="es" href=")[^"]*(")',
                        rf'\g<1>{canonical}\2', page_html)
    page_html = re.sub(r'(<link rel="alternate" hreflang="x-default" href=")[^"]*(")',
                        rf'\g<1>{canonical}\2', page_html)
    page_html = re.sub(r'(<meta property="og:type" content=")[^"]*(")',
                        rf'\g<1>{og_type}\2', page_html)
    page_html = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                        rf'\g<1>{canonical}\2', page_html)
    page_html = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                        rf'\g<1>{title_esc}\2', page_html)
    page_html = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                        rf'\g<1>{desc_esc}\2', page_html)
    page_html = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")',
                        rf'\g<1>{title_esc}\2', page_html)
    page_html = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")',
                        rf'\g<1>{desc_esc}\2', page_html)
    return page_html


def _inject_ld(page_html: str, ld: dict) -> str:
    ld_tag = f'\n  <script type="application/ld+json">\n  {json.dumps(ld, ensure_ascii=False, indent=2)}\n  </script>'
    return page_html.replace('</head>', ld_tag + '\n</head>', 1)


def _inject_hidden_block(page_html: str, block_id: str, inner_html: str) -> str:
    hidden = (
        f'\n  <div id="{block_id}" style="position:absolute;left:-9999px;top:-9999px;'
        'width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n    '
        + inner_html +
        '\n  </div>'
    )
    return page_html.replace('<div id="root">', hidden + '\n  <div id="root">', 1)


def gen_district_pages(distritos: list, meta: dict, index_html: str) -> None:
    """Generate dist/distritos/{slug}/index.html per district (Ítem 1) and the
    dist/distritos/index.html listing page (Ítem 2)."""
    import html as _html

    if not distritos:
        print("  (no se encontraron distritos en distritos.js)")
        return

    distritos_dir = DIST / "distritos"
    distritos_dir.mkdir(exist_ok=True)

    valid_slugs = {d['slug'] for d in distritos if d.get('slug')}
    for existing in distritos_dir.iterdir():
        if existing.is_dir() and existing.name not in valid_slugs:
            shutil.rmtree(existing)
            print(f"  ✗ eliminada carpeta huérfana dist/distritos/{existing.name}")

    edicion = meta.get('edicion', '')

    def fmt_price(n):
        return f"{int(n):,}".replace(",", ".")

    # ── per-district pages ────────────────────────────────────────────────
    for d in distritos:
        slug = d['slug']
        nombre = d['nombre']
        precio_fmt = fmt_price(d['precioMedio'])
        canonical = f"{BASE_URL}/distritos/{slug}"

        title = f"Precio vivienda en {nombre}: {precio_fmt} €/m² | Radar Inmobiliario"
        desc = (
            f"Precio medio {precio_fmt} €/m², rentabilidad bruta {d['rent']}% y variación "
            f"interanual +{d['varAnual']}% en {nombre}, Madrid. Datos {edicion}."
        )

        d_html = _rewrite_head_meta(index_html, canonical, title, desc, og_type="website")

        ld_breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE_URL + "/"},
                {"@type": "ListItem", "position": 2, "name": "Distritos", "item": BASE_URL + "/distritos"},
                {"@type": "ListItem", "position": 3, "name": nombre, "item": canonical},
            ]
        }
        ld_dataset = {
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": f"Precio de la vivienda en {nombre}, Madrid",
            "description": desc,
            "url": canonical,
            "spatialCoverage": {
                "@type": "Place",
                "name": f"{nombre}, Madrid"
            },
            "variableMeasured": [
                {"@type": "PropertyValue", "name": "Precio medio", "value": d['precioMedio'], "unitText": "EUR/m²"},
                {"@type": "PropertyValue", "name": "Rentabilidad bruta", "value": d['rent'], "unitText": "%"},
                {"@type": "PropertyValue", "name": "Variación interanual", "value": d['varAnual'], "unitText": "%"},
                {"@type": "PropertyValue", "name": "Transacciones", "value": d['tx'], "unitText": "unidades/año"},
            ]
        }
        d_html = _inject_ld(d_html, ld_breadcrumb)
        d_html = _inject_ld(d_html, ld_dataset)

        intro = (
            f"El precio medio de la vivienda en {nombre} es de {precio_fmt} €/m², con una "
            f"variación interanual de +{d['varAnual']}% y una rentabilidad bruta por alquiler "
            f"del {d['rent']}%. En el último año se registraron {d['tx']} transacciones. "
            f"{nombre} ocupa la posición {d['ranking']} de 21 distritos de Madrid por precio."
        )
        stats_html = (
            f"<li>Precio medio: {precio_fmt} €/m²</li>"
            f"<li>Alquiler medio: {d['alquilerM2']} €/m²</li>"
            f"<li>Rentabilidad bruta: {d['rent']}%</li>"
            f"<li>Variación interanual: +{d['varAnual']}%</li>"
            f"<li>Transacciones/año: {d['tx']}</li>"
            f"<li>Ranking: {d['ranking']} de 21 distritos</li>"
        )
        inner = (
            f'<h1>Precio de la vivienda en {_html.escape(nombre)}, Madrid</h1>\n'
            f'    <p>{_html.escape(intro)}</p>\n'
            f'    <ul>\n    {stats_html}\n    </ul>\n'
            f'    <nav>\n    '
            f'<a href="{BASE_URL}/distritos">Distritos</a>\n    '
            f'<a href="{BASE_URL}/">Inicio</a>\n    '
            f'<a href="{BASE_URL}/noticias">Noticias</a>\n    '
            f'</nav>'
        )
        d_html = _inject_hidden_block(d_html, "distrito-static", inner)

        district_dir = distritos_dir / slug
        district_dir.mkdir(exist_ok=True)
        (district_dir / "index.html").write_text(d_html, encoding="utf-8")

    print(f"✓ {len(distritos)} páginas estáticas en dist/distritos/")

    # ── listing page (Ítem 2) ────────────────────────────────────────────
    canonical = f"{BASE_URL}/distritos"
    title = "Distritos de Madrid: precio €/m² y rentabilidad | Radar Inmobiliario"
    desc = (
        "21 distritos de Madrid con precio medio €/m², rentabilidad bruta y variación "
        f"interanual. Datos {edicion}."
    )
    l_html = _rewrite_head_meta(index_html, canonical, title, desc, og_type="website")

    ld_itemlist = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Distritos de Madrid",
        "url": canonical,
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": d['nombre'],
                "url": f"{BASE_URL}/distritos/{d['slug']}",
            }
            for i, d in enumerate(sorted(distritos, key=lambda x: x['ranking']))
        ]
    }
    l_html = _inject_ld(l_html, ld_itemlist)

    intro = (
        "Consulta el precio medio por metro cuadrado, la rentabilidad bruta por alquiler y "
        "la variación interanual de los 21 distritos de Madrid."
    )
    li_items = "\n    ".join(
        f'<li><a href="{BASE_URL}/distritos/{d["slug"]}">{_html.escape(d["nombre"])}</a> — '
        f'{fmt_price(d["precioMedio"])} €/m², +{d["varAnual"]}%</li>'
        for d in distritos
    )
    inner = (
        '<h1>Distritos de Madrid: precio €/m² y rentabilidad</h1>\n'
        f'    <p>{_html.escape(intro)}</p>\n'
        f'    <ul>\n    {li_items}\n    </ul>'
    )
    l_html = _inject_hidden_block(l_html, "distritos-static", inner)

    (distritos_dir / "index.html").write_text(l_html, encoding="utf-8")
    print("✓ dist/distritos/index.html (listado de 21 distritos)")


def gen_section_pages(articles: list, index_html: str) -> None:
    """Generate static section/info pages: /noticias, /metodologia, /sobre, /legal
    (Ítem 3). Title/desc copied verbatim from the head's updatePageMeta()."""
    import html as _html

    valid_articles = [a for a in articles if a.get('slug') and a.get('titulo')]

    sections = [
        {
            'route': 'noticias',
            'title': 'Noticias del mercado inmobiliario de Madrid | Radar Inmobiliario',
            'desc': 'Últimas noticias sobre precios, hipotecas, urbanismo y regulación del mercado inmobiliario de Madrid.',
            'h1': 'Noticias del mercado inmobiliario de Madrid',
            'body': None,  # built below (list of articles)
        },
        {
            'route': 'metodologia',
            'title': 'Metodología de datos | Radar Inmobiliario Madrid',
            'desc': 'Cómo se calculan los precios €/m², rentabilidades y variaciones interanuales publicados en Radar Inmobiliario.',
            'h1': 'Metodología de datos',
            'body': (
                'Los datos de precio medio por metro cuadrado, rentabilidad bruta y variación '
                'interanual proceden de fuentes públicas y de mercado —Idealista, Fotocasa y los '
                'Colegios Notariales— y se actualizan periódicamente, con una edición mensual que '
                'recoge los cambios de precio, alquiler y transacciones por distrito y barrio de Madrid.'
            ),
        },
        {
            'route': 'sobre',
            'title': 'Sobre Radar Inmobiliario Madrid | Publicación independiente de datos',
            'desc': 'Quiénes somos. Publicación independiente de datos del mercado inmobiliario de Madrid.',
            'h1': 'Sobre Radar Inmobiliario Madrid',
            'body': (
                'Radar Inmobiliario Madrid es una publicación independiente que analiza el mercado '
                'inmobiliario de la ciudad: precios de vivienda, rentabilidad del alquiler y '
                'variación interanual por distrito y barrio, junto con noticias sobre el sector.'
            ),
        },
        {
            'route': 'legal',
            'title': 'Aviso Legal y Privacidad | Radar Inmobiliario Madrid',
            'desc': 'Aviso legal, política de privacidad y condiciones de uso de Radar Inmobiliario Madrid.',
            'h1': 'Aviso Legal y Privacidad',
            'body': (
                'Radar Inmobiliario Madrid publica datos de mercado con fines informativos. El uso '
                'del sitio implica la aceptación de estas condiciones; los datos son orientativos y '
                'no constituyen asesoramiento financiero, legal ni de inversión.'
            ),
        },
    ]

    for sec in sections:
        route = sec['route']
        canonical = f"{BASE_URL}/{route}"
        s_html = _rewrite_head_meta(index_html, canonical, sec['title'], sec['desc'], og_type="website")

        if route == 'noticias':
            li_items = "\n    ".join(
                f'<li><a href="{BASE_URL}/noticia/{a["slug"]}">{_html.escape(a["titulo"])}</a> — '
                f'{_html.escape(smart_truncate(a.get("resumen") or "", 155))}</li>'
                for a in valid_articles
            )
            inner = (
                f'<h1>{_html.escape(sec["h1"])}</h1>\n'
                f'    <ul>\n    {li_items}\n    </ul>'
            )
        else:
            inner = (
                f'<h1>{_html.escape(sec["h1"])}</h1>\n'
                f'    <p>{_html.escape(sec["body"])}</p>'
            )

        s_html = _inject_hidden_block(s_html, "static", inner)

        section_dir = DIST / route
        section_dir.mkdir(exist_ok=True)
        (section_dir / "index.html").write_text(s_html, encoding="utf-8")

    print(f"✓ {len(sections)} páginas estáticas de sección (noticias/metodologia/sobre/legal)")


def gen_home_static(articles: list) -> None:
    """Inject a static, crawlable block (H1 + intro + internal nav + latest news
    list) before <div id="root"> in dist/index.html, using the same off-screen
    aria-hidden pattern as gen_article_pages, so bots that don't run JS still
    see the home's H1 and internal links."""
    import html as _html

    index_path = DIST / "index.html"
    if not index_path.exists():
        return
    index_html = index_path.read_text(encoding="utf-8")

    titulo = "Radar Inmobiliario Madrid — precios de vivienda por distrito en Madrid"
    intro = (
        "Datos actualizados de precio €/m², rentabilidad y variación anual por "
        "distrito y barrio en Madrid. Análisis independiente del mercado inmobiliario."
    )

    nav_links = [
        (f"{BASE_URL}/distritos", "Distritos"),
        (f"{BASE_URL}/noticias", "Noticias"),
        (f"{BASE_URL}/sobre", "Sobre"),
        (f"{BASE_URL}/metodologia", "Metodología"),
    ]
    nav_html = "\n    ".join(
        f'<a href="{href}">{_html.escape(label)}</a>' for href, label in nav_links
    )

    valid_articles = [a for a in articles if a.get('slug') and a.get('titulo')]
    li_items = []
    for art in valid_articles:
        slug   = art['slug']
        titulo_art = _html.escape(art['titulo'])
        resumen = _html.escape(smart_truncate(art.get('resumen') or '', 155))
        li_items.append(
            f'<li><a href="{BASE_URL}/noticia/{slug}">{titulo_art}</a> — {resumen}</li>'
        )
    noticias_html = "\n    ".join(li_items)

    home_static = (
        '\n  <div id="home-static" style="position:absolute;left:-9999px;top:-9999px;'
        'width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n'
        f'    <h1>{_html.escape(titulo)}</h1>\n'
        f'    <p>{_html.escape(intro)}</p>\n'
        f'    <nav>\n    {nav_html}\n    </nav>\n'
        f'    <h2>Últimas noticias</h2>\n'
        f'    <ul>\n    {noticias_html}\n    </ul>\n'
        '  </div>'
    )

    if 'id="home-static"' not in index_html:
        index_html = index_html.replace(
            '<div id="root">', home_static + '\n  <div id="root">', 1
        )
        index_path.write_text(index_html, encoding="utf-8")
        print("✓ dist/index.html: bloque estático de home inyectado (home-static)")


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
        gen_home_static(articles)
        gen_news_sitemap(articles)
        update_sitemap(articles)
        update_robots()
        gen_llms_txt(articles)
        gen_section_pages(articles, index_html)
        print(f"  {len(list((DIST/'noticia').iterdir()))} páginas de artículo == {len(articles)} vigentes")
    else:
        print("  (no se encontraron artículos en news.js)")

    distritos, dist_meta = extract_districts()
    gen_district_pages(distritos, dist_meta, index_html)


if __name__ == "__main__":
    main()
