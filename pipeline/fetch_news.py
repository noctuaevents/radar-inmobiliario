#!/usr/bin/env python3
"""
fetch_news.py — Ingesta de noticias inmobiliarias de Madrid desde RSS.
Salida: pipeline/work/candidates.json (top 25 artículos puntuados, sin duplicados)

Uso: python3 pipeline/fetch_news.py
"""
import concurrent.futures
import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import feedparser
except ImportError:
    import subprocess, sys
    subprocess.run([sys.executable, "-m", "pip", "install", "feedparser"], check=True)
    import feedparser

ROOT = Path(__file__).parent.parent
WORK_DIR = ROOT / "pipeline" / "work"
WORK_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = WORK_DIR / "candidates.json"

FEEDS = [
    "https://news.google.com/rss/search?q=inmobiliario+madrid&hl=es&gl=ES&ceid=ES:es",
    "https://news.google.com/rss/search?q=precio+vivienda+madrid&hl=es&gl=ES&ceid=ES:es",
    "https://news.google.com/rss/search?q=alquiler+madrid+barrio&hl=es&gl=ES&ceid=ES:es",
    "https://news.google.com/rss/search?q=hipoteca+euribor+madrid&hl=es&gl=ES&ceid=ES:es",
    "https://news.google.com/rss/search?q=urbanismo+madrid+vivienda&hl=es&gl=ES&ceid=ES:es",
]

KEYWORDS_REQUIRED = [
    "madrid", "vivienda", "piso", "inmobiliario", "alquiler",
    "precio", "metro cuadrado", "distrito", "barrio", "hipoteca",
]

KEYWORDS_BOOST = [
    "nueva línea metro", "línea 11", "obras", "intercambiador", "BCE", "euríbor", "euribor",
    "hipoteca", "zona tensionada", "nuevo norte", "cercanías", "renfe", "plusvalía",
    "itp", "irpf", "atp", "decreto", "regulación", "alquiler asequible",
    "vivienda protegida", "vpo", "plan general", "pgoum",
]

DISTRITOS_MADRID = [
    "centro", "arganzuela", "retiro", "salamanca", "chamartín", "chamartin",
    "tetuán", "tetuan", "chamberí", "chamberi", "fuencarral", "el pardo",
    "moncloa", "aravaca", "latina", "carabanchel", "usera", "puente de vallecas",
    "vallecas", "moratalaz", "ciudad lineal", "hortaleza", "villaverde",
    "villa de vallecas", "vicálvaro", "vicalvaro", "san blas", "canillejas", "barajas",
]


def fetch_og_image(url: str, timeout: int = 6) -> str:
    """Descarga las primeras 64 KB de la URL y extrae og:image. Devuelve '' si falla."""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; RadarInmobiliario/1.0)'
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read(65536).decode('utf-8', errors='ignore')
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
        if not m:
            m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html, re.I)
        return m.group(1).strip() if m else ''
    except Exception:
        return ''


def score_article(title: str, summary: str) -> int:
    text = (title + " " + summary).lower()
    score = 0
    for kw in KEYWORDS_REQUIRED:
        if kw in text:
            score += 1
    for kw in KEYWORDS_BOOST:
        if kw in text:
            score += 3
    for d in DISTRITOS_MADRID:
        if d in text:
            score += 2
            break  # one bonus per article
    return score


def parse_date(entry):
    try:
        t = entry.get("published_parsed") or entry.get("updated_parsed")
        if t:
            return datetime(*t[:6], tzinfo=timezone.utc)
    except Exception:
        pass
    return None


def main():
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=14)
    seen_urls: set[str] = set()
    articles = []

    for feed_url in FEEDS:
        print(f"  Fetching: {feed_url[:70]}…")
        feed = feedparser.parse(feed_url)
        for entry in feed.entries:
            url = entry.get("link", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            pub = parse_date(entry)
            if pub and pub < cutoff:
                continue

            title = entry.get("title", "")
            summary = re.sub(r"<[^>]+>", " ", entry.get("summary", ""))
            score = score_article(title, summary)
            if score < 2:
                continue

            articles.append({
                "titulo": title,
                "fuente": feed.feed.get("title", feed_url.split("/")[2]),
                "url": url,
                "fecha_iso": pub.strftime("%Y-%m-%d") if pub else "",
                "fecha": pub.strftime("%-d %b") if pub else "",
                "hora": pub.strftime("%H:%M") if pub else "",
                "score": score,
                "resumen_raw": summary[:600],
            })

    articles.sort(key=lambda x: (-x["score"], x["fecha_iso"]))
    top = articles[:25]

    print(f"\nObteniendo og:image de {len(top)} artículos…")
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        imgs = list(pool.map(fetch_og_image, [a["url"] for a in top]))
    found = 0
    for a, img in zip(top, imgs):
        a["imagen"] = img
        if img:
            found += 1
    print(f"  {found}/{len(top)} imágenes encontradas")

    OUT_FILE.write_text(json.dumps(top, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(top)} candidatos escritos en {OUT_FILE.relative_to(ROOT)}")
    for a in top[:5]:
        print(f"  [{a['score']:2d}] {a['titulo'][:80]}")


if __name__ == "__main__":
    main()
