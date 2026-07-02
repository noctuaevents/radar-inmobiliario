# Tarjetas de Dato por Artículo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todo artículo sin foto recibe una tarjeta de dato de marca (Pillow, 1200×675) usada por og:image/JSON-LD y por las cards/hero del front; retroactivo para los 12 publicados.

**Architecture:** Módulo nuevo `pipeline/gen_cards.py`: función pura `draw_card` + CLI idempotente que parchea `imagen` en news.js reutilizando `auto_edition.parse_news_data/render_news_js`. `auto_edition.py` lo invoca antes de la Puerta 3 (fallo no bloqueante).

**Tech Stack:** Python 3 stdlib + Pillow 11.3 (ya instalado). Tests unittest.

**Spec:** `docs/superpowers/specs/2026-07-02-article-cards-design.md`

## Global Constraints

- No editar `dist/` a mano salvo los PNG que este módulo genera en `dist/img/` (persisten: distribute no limpia img/).
- Colores exactos por tag: emerald `#059669`, rose `#e11d48`, amber `#d97706`, sky `#0284c7`, violet `#7c3aed`; desconocido → sky. Fondo `#fafaf9`, tinta `#0f172a`, muted `#64748b`.
- Lienzo 1200×675. Nombre de fichero `dist/img/card-<slug>.png`. Campo parcheado: `imagen = "/img/card-<slug>.png"`.
- Fallo de tarjeta ⇒ artículo queda con `imagen: ""`; NUNCA rompe news.js ni la edición.
- Tipografía `/System/Library/Fonts/Helvetica.ttc` con fallback `ImageFont.load_default()`.

---

### Task A: `draw_card` + `_wrap`

**Files:**
- Create: `pipeline/gen_cards.py`
- Test: `pipeline/tests/test_cards.py`

**Interfaces:**
- Produces: `draw_card(titulo, categoria, tag, impacto="", impactoLabel="", distrito=None) -> PIL.Image.Image` (1200×675); `_wrap(draw, text, font, max_w, max_lines) -> list[str]`; constantes `NEWS_JS`, `IMG_DIR` a nivel de módulo (Task B las usa y los tests las sobrescriben).

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_cards.py
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import gen_cards as gc
from PIL import Image, ImageDraw

class TestDrawCard(unittest.TestCase):
    def test_dimensiones_con_impacto(self):
        img = gc.draw_card("Madrid inicia 446 pisos", "Urbanismo", "emerald",
                           impacto="446", impactoLabel="viviendas nuevas",
                           distrito="Vicálvaro")
        self.assertEqual(img.size, (1200, 675))

    def test_sin_impacto_ni_distrito(self):
        img = gc.draw_card("Titular sin dato", "Demanda", "rose")
        self.assertEqual(img.size, (1200, 675))

    def test_tag_desconocido_no_rompe(self):
        img = gc.draw_card("X", "Y", "fucsia")
        self.assertEqual(img.size, (1200, 675))

    def test_titular_larguisimo_con_tildes(self):
        t = ("La construcción de viviendas de alquiler asequible en los barrios "
             "periféricos acelera la transformación urbanística según los últimos "
             "datos añadidos por el Ayuntamiento de Madrid este año " * 3)
        img = gc.draw_card(t, "Urbanismo", "amber", impacto="+14,4 %",
                           impactoLabel="variación interanual")
        self.assertEqual(img.size, (1200, 675))

class TestWrap(unittest.TestCase):
    def setUp(self):
        self.d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
        self.f = gc._font(44, bold=True)

    def test_respeta_max_lines_con_elipsis(self):
        lines = gc._wrap(self.d, "palabra " * 60, self.f, max_w=1000, max_lines=3)
        self.assertLessEqual(len(lines), 3)
        self.assertTrue(lines[-1].endswith("…"))

    def test_texto_corto_sin_elipsis(self):
        lines = gc._wrap(self.d, "titular corto", self.f, max_w=1000, max_lines=3)
        self.assertEqual(lines, ["titular corto"])

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run to verify FAIL** — `python3 pipeline/tests/test_cards.py` → `ModuleNotFoundError: gen_cards`

- [ ] **Step 3: Implementation**

```python
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
    truncated = False
    for i, w in enumerate(words):
        probe = (cur + " " + w).strip()
        if draw.textlength(probe, font=font) <= max_w or not cur:
            cur = probe
        else:
            lines.append(cur)
            cur = w
            if len(lines) == max_lines:
                truncated = True
                break
    if not truncated and cur and len(lines) < max_lines:
        lines.append(cur)
    elif truncated:
        pass  # cur (y el resto) no caben
    if truncated or " ".join(lines).count(" ") + len(lines) < len(words):
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
        # cifra protagonista, tamaño adaptativo
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

    for line in _wrap(d, titulo or "", f_tit, max_w, max_lines):
        if y + line_h > H - 76:
            break
        d.text((x, y), line, font=f_tit, fill=INK)
        y += line_h

    d.text((x, H - 64), "radarinmobiliario.com", font=_font(28), fill=MUTED)
    return img
```

- [ ] **Step 4: Run to verify PASS** — `python3 pipeline/tests/test_cards.py` → OK (6 tests)

- [ ] **Step 5: Commit** — `git add pipeline/gen_cards.py pipeline/tests/test_cards.py && git commit -m "pipeline: gen_cards draw_card + wrap (tarjetas de dato 1200×675)"`

---

### Task B: CLI idempotente + parcheo de news.js

**Files:**
- Modify: `pipeline/gen_cards.py` (añadir `main`)
- Test: `pipeline/tests/test_cards.py` (añadir clase)

**Interfaces:**
- Consumes: `auto_edition.parse_news_data/render_news_js` (import perezoso dentro de main).
- Produces: `python3 pipeline/gen_cards.py [--force]`; exit 0; línea final `✓ tarjetas: N generadas, M parcheadas, K errores`.

- [ ] **Step 1: Failing test** (añadir a test_cards.py)

```python
import json, tempfile

class TestCli(unittest.TestCase):
    def _fixture(self, tmp):
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from auto_edition import render_news_js
        items = [
            {"slug": "con-imagen", "titulo": "Ya tiene", "imagen": "/img/x.jpg",
             "categoria": "Demanda", "tag": "emerald", "url": "https://x/1"},
            {"slug": "sin-imagen", "titulo": "Necesita tarjeta", "imagen": "",
             "categoria": "Obras", "tag": "amber", "impacto": "+5 %",
             "impactoLabel": "test", "url": "https://x/2"},
            {"titulo": "Sin slug", "imagen": "", "url": "https://x/3"},
        ]
        dest = {**items[1]}
        news = tmp / "news.js"
        news.write_text(render_news_js("2 Jul", {"publicadas": 2}, dest, items),
                        encoding="utf-8")
        return news

    def test_parchea_genera_e_idempotente(self):
        import gen_cards as gc2
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            news = self._fixture(tmp)
            old_news, old_img = gc2.NEWS_JS, gc2.IMG_DIR
            gc2.NEWS_JS, gc2.IMG_DIR = news, tmp / "img"
            try:
                gen, patched, err = gc2.process()
                self.assertEqual((gen, patched, err), (1, 2, 0))  # 1 PNG; item+destacada parcheados
                self.assertTrue((tmp / "img" / "card-sin-imagen.png").exists())
                from auto_edition import parse_news_data
                data = parse_news_data(news.read_text(encoding="utf-8"))
                self.assertEqual(data["items"][1]["imagen"], "/img/card-sin-imagen.png")
                self.assertEqual(data["destacada"]["imagen"], "/img/card-sin-imagen.png")
                self.assertEqual(data["items"][0]["imagen"], "/img/x.jpg")  # intacto
                gen2, patched2, err2 = gc2.process()
                self.assertEqual((gen2, patched2), (0, 0))  # idempotente
            finally:
                gc2.NEWS_JS, gc2.IMG_DIR = old_news, old_img
```

- [ ] **Step 2: FAIL** — `AttributeError: no attribute 'process'`

- [ ] **Step 3: Implementation** (añadir a gen_cards.py)

```python
def process(force: bool = False):
    """Devuelve (generadas, parcheadas, errores). Parchea news.js solo si cambió algo."""
    sys.path.insert(0, str(Path(__file__).parent))
    from auto_edition import parse_news_data, render_news_js

    data = parse_news_data(NEWS_JS.read_text(encoding="utf-8"))
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    stats = {"gen": 0, "patched": 0, "err": 0}

    def ensure_card(item):
        slug = item.get("slug")
        if not slug or item.get("imagen"):
            if not slug and not item.get("imagen"):
                print("  ⚠ artículo sin slug — sin tarjeta")
            return
        dest = IMG_DIR / f"card-{slug}.png"
        try:
            if force or not dest.exists():
                draw_card(item.get("titulo", ""), item.get("categoria", ""),
                          item.get("tag", ""), item.get("impacto") or "",
                          item.get("impactoLabel") or "",
                          item.get("distrito")).save(dest, optimize=True)
                stats["gen"] += 1
            item["imagen"] = f"/img/card-{slug}.png"
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
```

- [ ] **Step 4: PASS** — test_cards.py OK (7 tests) + resto de la suite sin regresión
- [ ] **Step 5: Commit** — `git commit -m "pipeline: gen_cards CLI idempotente — parchea imagen en news.js"`

---

### Task C: integración + retroactivo + deploy

**Files:**
- Modify: `pipeline/auto_edition.py` (antes de `gate3(report)`)
- Modify: `src/data/news.js` + `dist/` (vía CLI + build)

- [ ] **Step 1: Integración en auto_edition** — justo antes de `gate3(report)` en `main()`:

```python
        # tarjetas de dato para artículos sin imagen (no bloqueante)
        try:
            out = sh([sys.executable, "pipeline/gen_cards.py"]).stdout.strip()
            report["cards"] = out.splitlines()[-1] if out else "ok"
        except subprocess.CalledProcessError as e:
            report["cards"] = f"fallo no bloqueante: {(e.stderr or '')[-200:]}"
```

- [ ] **Step 2: Retroactivo real** — `python3 pipeline/gen_cards.py` → 12 tarjetas; inspección visual de 1-2 PNG (Read); `python3 pipeline/build.py && python3 pipeline/distribute.py`.
- [ ] **Step 3: Verificar** — og:image de un artículo en dist apunta a `/img/card-<slug>.png`; suite completa en verde.
- [ ] **Step 4: Commit + push** — `noticias: tarjetas de dato para los 12 artículos + integración en la edición autónoma`.
- [ ] **Step 5: Producción** — curl a un PNG (200), og:image en el HTML vivo, card visible en la home.
