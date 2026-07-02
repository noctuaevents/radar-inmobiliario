#!/usr/bin/env python3
"""Notifica a IndexNow (Bing/Copilot/Seznam/Yandex) las URLs del sitemap.

Se ejecuta manualmente DESPUÉS de un deploy (el fichero de clave
dist/<key>.txt debe estar ya servido en producción):

    python3 pipeline/indexnow_submit.py            # envía
    python3 pipeline/indexnow_submit.py --dry-run  # muestra el payload sin enviar
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
DIST = ROOT / "dist"
HOST = "www.radarinmobiliario.com"
API = "https://api.indexnow.org/indexnow"

# Debe coincidir con INDEXNOW_KEY en pipeline/distribute.py (genera dist/<key>.txt)
KEY = "be31110c3260a87fc7f098177773bb6c"


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    sitemap = DIST / "sitemap.xml"
    if not sitemap.exists():
        print("✗ dist/sitemap.xml no existe — ejecuta pipeline/distribute.py primero")
        return 1

    urls = re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8"))
    if not urls:
        print("✗ sitemap.xml sin URLs")
        return 1

    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": urls,
    }

    if dry_run:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print(f"\n(dry-run: {len(urls)} URLs, nada enviado)")
        return 0

    req = urllib.request.Request(
        API,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"✓ IndexNow: HTTP {resp.status} — {len(urls)} URLs enviadas")
            return 0
    except urllib.error.HTTPError as e:
        # 200/202 = aceptado; 4xx = clave o payload mal
        print(f"✗ IndexNow: HTTP {e.code} — {e.read().decode('utf-8', 'replace')[:300]}")
        return 1
    except urllib.error.URLError as e:
        print(f"✗ IndexNow: sin conexión — {e.reason}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
