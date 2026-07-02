#!/usr/bin/env python3
"""gen_cards.py — Tarjetas de dato de marca para artículos sin imagen.

Genera dist/img/card-<slug>.png (1200×675) y parchea `imagen` en src/data/news.js.
Idempotente; --force regenera PNGs existentes. Fallo por artículo NUNCA rompe news.js.
Spec: docs/superpowers/specs/2026-07-02-article-cards-design.md

Uso: python3 pipeline/gen_cards.py [--force]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent.parent
NEWS_JS = ROOT / "src" / "data" / "news.js"
IMG_DIR = ROOT / "dist" / "img"

W, H = 1200, 675
MARGIN = 72
BAR_W = 12
BG = "#fafaf9"
INK = "#0f172a"
MUTED = "#64748b"
TAG_COLORS = {"emerald": "#059669", "rose": "#e11d48", "amber": "#d97706",
              "sky": "#0284c7", "violet": "#7c3aed"}
FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"


def _font(size: int, bold: bool = False):
    try:
        return ImageFont.truetype(FONT_PATH, size, index=1 if bold else 0)
    except OSError:
        return ImageFont.load_default()


def _wrap(draw, text, font, max_w, max_lines):
    """Corta `text` en <= max_lines líneas que caben en max_w; añade '…' si sobró."""
    words = text.split()
    lines, cur = [], ""
    consumed = 0
    for w in words:
        probe = (cur + " " + w).strip()
        if draw.textlength(probe, font=font) <= max_w or not cur:
            cur = probe
            consumed += 1
        else:
            lines.append(cur)
            cur = w
            consumed += 1
            if len(lines) == max_lines:
                consumed -= 1  # la palabra que abrió la línea de más no cupo
                cur = ""
                break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if consumed < len(words) and lines:
        last = lines[-1]
        while last and draw.textlength(last + "…", font=font) > max_w:
            last = last[:-1].rstrip()
        lines[-1] = (last + "…") if last else "…"
    return lines


def _hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def draw_card(titulo, categoria, tag, impacto="", impactoLabel="", distrito=None):
    accent = TAG_COLORS.get(tag, TAG_COLORS["sky"])
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, BAR_W, H], fill=accent)
    x = MARGIN
    max_w = W - 2 * MARGIN

    # cabecera de marca
    f_head = _font(28, bold=True)
    d.text((x, 52), "●", font=f_head, fill=accent)
    d.text((x + 36, 52), "Radar Inmobiliario Madrid", font=f_head, fill=MUTED)

    # categoría + píldora de distrito
    f_cat = _font(30, bold=True)
    d.text((x, 136), (categoria or "Actualidad").upper(), font=f_cat, fill=accent)
    y = 196
    if distrito:
        f_pill = _font(26, bold=True)
        tw = d.textlength(str(distrito), font=f_pill)
        bg_rgb = _hex_rgb(BG)
        ac_rgb = _hex_rgb(accent)
        pill_bg = tuple(int(b * 0.88 + a * 0.12) for b, a in zip(bg_rgb, ac_rgb))
        d.rounded_rectangle([x, y, x + tw + 40, y + 46], radius=23, fill=pill_bg)
        d.text((x + 20, y + 8), str(distrito), font=f_pill, fill=accent)
        y += 70

    if impacto:
        # cifra protagonista, tamaño adaptativo si es larga
        size = 150
        f_big = _font(size, bold=True)
        while d.textlength(impacto, font=f_big) > max_w and size > 60:
            size -= 10
            f_big = _font(size, bold=True)
        d.text((x, y), impacto, font=f_big, fill=INK)
        y += int(size * 1.18)
        if impactoLabel:
            d.text((x, y), impactoLabel, font=_font(34), fill=MUTED)
            y += 58
        f_tit = _font(44, bold=True)
        line_h, max_lines = 56, 3
    else:
        f_tit = _font(64, bold=True)
        line_h, max_lines = 82, 4

    # el wrap decide las líneas con la altura REAL disponible, para que la
    # elipsis caiga en la última línea visible (no en una que nunca se dibuja)
    max_lines_fit = max(1, int((H - 76 - y) // line_h))
    for line in _wrap(d, titulo or "", f_tit, max_w, min(max_lines, max_lines_fit)):
        d.text((x, y), line, font=f_tit, fill=INK)
        y += line_h

    d.text((x, H - 64), "radarinmobiliario.com", font=_font(28), fill=MUTED)
    return img


def process(force: bool = False):
    """Devuelve (generadas, parcheadas, errores). Parchea news.js solo si cambió algo."""
    sys.path.insert(0, str(Path(__file__).parent))
    from auto_edition import parse_news_data, render_news_js

    data = parse_news_data(NEWS_JS.read_text(encoding="utf-8"))
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    stats = {"gen": 0, "patched": 0, "err": 0}

    def ensure_card(item):
        slug = item.get("slug")
        if not slug:
            if not item.get("imagen"):
                print("  ⚠ artículo sin slug — sin tarjeta")
            return
        card_rel = f"/img/card-{slug}.png"
        imagen = item.get("imagen") or ""
        if imagen and imagen != card_rel:
            return  # foto propia (no nuestra tarjeta) — no tocar
        dest = IMG_DIR / f"card-{slug}.png"
        try:
            if force or not dest.exists():
                draw_card(item.get("titulo", ""), item.get("categoria", ""),
                          item.get("tag", ""), item.get("impacto") or "",
                          item.get("impactoLabel") or "",
                          item.get("distrito")).save(dest, optimize=True)
                stats["gen"] += 1
            if imagen != card_rel:
                item["imagen"] = card_rel
                stats["patched"] += 1
        except Exception as e:  # nunca romper la edición por una tarjeta
            print(f"  ⚠ tarjeta fallida para {slug}: {e}")
            stats["err"] += 1

    for it in data["items"]:
        ensure_card(it)
    ensure_card(data["destacada"])

    if stats["patched"]:
        NEWS_JS.write_text(render_news_js(data["actualizado"], data["semanaResumen"],
                                          data["destacada"], data["items"]),
                           encoding="utf-8")
    print(f"✓ tarjetas: {stats['gen']} generadas, {stats['patched']} parcheadas, "
          f"{stats['err']} errores")
    return stats["gen"], stats["patched"], stats["err"]


if __name__ == "__main__":
    process(force="--force" in sys.argv)
    sys.exit(0)
