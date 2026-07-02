# Edición Diaria Autónoma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pipeline autónomo que publica una edición diaria (máx. 4 artículos) en radarinmobiliario.com sin intervención humana, con verificación cruzada Codex como puerta de calidad.

**Architecture:** Un orquestador (`pipeline/auto_edition.py`) lanzado por launchd a las 07:30 (retry 14:00) reutiliza los scripts existentes (fetch → triage Ollama → polish Claude) y añade tres puertas: filtro determinista (Puerta 1), verificación adversarial Codex por artículo (Puerta 2, `pipeline/verify_codex.py`), y sanidad técnica pre-push (Puerta 3). Los artículos nuevos se FUSIONAN con los existentes en `news.js` (cap 30) en lugar de reemplazarlos.

**Tech Stack:** Python 3 stdlib (unittest para tests), bash, launchd, CLIs: `ollama` (localhost:11434), `claude -p` (`~/.local/bin/claude`), `codex exec` (instalar si falta; auth ya en `~/.codex/auth.json`, modo chatgpt).

**Spec:** `docs/superpowers/specs/2026-07-02-auto-edition-design.md`

## Global Constraints

- NUNCA editar `dist/` ni `Radar Inmobiliario Madrid.html` a mano — solo vía `build.py`/`distribute.py`.
- Producción es **Vercel** (deploy = push a `main`). `netlify.toml` es legacy.
- Commits: `noticias: edición auto <D Mmm YYYY>` (patrón del repo `tipo: descripción`).
- Regla de oro: cualquier fallo degrada hacia NO publicar. Sin verificador disponible ⇒ REJECT.
- Solo stdlib de Python — sin dependencias nuevas (feedparser ya lo usa fetch_news.py).
- Máx. 4 artículos/día; score mínimo 5; frescura `fecha_iso` ∈ {hoy, ayer}; cap 30 items en news.js.
- Rutas del vault: `~/Documents/Radar Inmobiliario/Contenido/Noticias/{_cola,Publicado,_rechazadas,_archivo}` y `Contenido/Ediciones/` (informes).
- Tests: `python3 pipeline/tests/test_<x>.py` (unittest.main(), con `sys.path` shim). Sin pytest.

**Addendum al spec (aprobar en Task 4):** `polish_claude.sh` reemplaza `news.js` entero y `distribute.py::gen_article_pages` borra las carpetas de artículos ausentes. En modo diario eso mataría cada día las URLs del día anterior (404 real desde commit `10cdc94`). El orquestador fusiona: `items = nuevos + anteriores` (dedup por url/slug, cap 30). El archivo crece y las URLs viven.

---

### Task 1: Codex CLI operativo

**Files:**
- Ninguno en el repo (instalación global + verificación).

**Interfaces:**
- Produces: binario `codex` invocable; patrón headless `codex exec --skip-git-repo-check -s read-only "<prompt>"` que imprime la respuesta por stdout.

- [ ] **Step 1: Localizar o instalar el binario**

```bash
command -v codex || ls ~/.local/bin /opt/homebrew/bin /usr/local/bin 2>/dev/null | grep -i codex
# Si no aparece:
npm install -g @openai/codex
command -v codex   # debe imprimir una ruta
```
La auth ya existe (`~/.codex/auth.json`, `auth_mode: chatgpt`) — NO tocar.

- [ ] **Step 2: Smoke test headless**

```bash
codex exec --skip-git-repo-check -s read-only 'Responde SOLO este JSON, sin texto extra: {"veredicto":"APPROVE","motivo":"smoke"}'
```
Expected: stdout contiene `{"veredicto":"APPROVE","motivo":"smoke"}` (puede venir rodeado de líneas de metadata del CLI — irrelevante, `extract_json` de Task 2 busca el primer `{...}`). Si `codex exec` pide login: avisar al usuario y PARAR (no se puede automatizar el login).

- [ ] **Step 3: Anotar la ruta absoluta del binario** (se usa en Task 8 para el PATH del plist). `command -v codex` → apuntarla en el reporte de la task.

---

### Task 2: `pipeline/verify_codex.py` — Puerta 2

**Files:**
- Create: `pipeline/verify_codex.py`
- Test: `pipeline/tests/test_verify.py`

**Interfaces:**
- Produces:
  - `verify_with_fallback(polished: dict, source: dict, primary=run_codex, fallback=run_claude) -> tuple[str, str, str]` — devuelve `(veredicto, motivo, verificador)` con veredicto ∈ {"APPROVE","REJECT"}, verificador ∈ {"codex","claude-fallback","ninguno"}. Sin verificador disponible ⇒ ("REJECT", motivo, "ninguno").
  - `run_codex(prompt: str) -> str`, `run_claude(prompt: str) -> str`, `extract_json(text) -> dict|None` (reutilizables por auto_edition).

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_verify.py
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import verify_codex as vc

POLISHED = {"titulo": "El precio sube un 6,2% en Letras", "resumen": "Sube.",
            "impacto": "+6,2 %", "slug": "letras-sube", "body": [{"type": "p", "text": "x"}]}
SOURCE = {"titulo_original": "Letras sube 6,2%", "fuente": "Idealista",
          "resumen_raw": "El barrio sube un 6,2% interanual", "resumen_borrador": "Sube 6,2%"}

class TestVerify(unittest.TestCase):
    def test_approve(self):
        v, m = vc.verify_article(POLISHED, SOURCE,
            runner=lambda p: 'bla\n{"veredicto":"APPROVE","motivo":"ok"}')
        self.assertEqual(v, "APPROVE")

    def test_reject(self):
        v, m = vc.verify_article(POLISHED, SOURCE,
            runner=lambda p: '{"veredicto":"REJECT","motivo":"cifra inventada"}')
        self.assertEqual(v, "REJECT"); self.assertIn("cifra", m)

    def test_garbage_is_error(self):
        v, m = vc.verify_article(POLISHED, SOURCE, runner=lambda p: "no soy json")
        self.assertEqual(v, "ERROR")

    def test_runner_exception_is_error(self):
        def boom(p): raise FileNotFoundError("codex")
        v, m = vc.verify_article(POLISHED, SOURCE, runner=boom)
        self.assertEqual(v, "ERROR")

    def test_fallback_chain(self):
        def boom(p): raise FileNotFoundError("codex")
        v, m, who = vc.verify_with_fallback(POLISHED, SOURCE, primary=boom,
            fallback=lambda p: '{"veredicto":"APPROVE","motivo":"ok"}')
        self.assertEqual((v, who), ("APPROVE", "claude-fallback"))

    def test_no_verifier_means_reject(self):
        def boom(p): raise FileNotFoundError("nada")
        v, m, who = vc.verify_with_fallback(POLISHED, SOURCE, primary=boom, fallback=boom)
        self.assertEqual((v, who), ("REJECT", "ninguno"))

    def test_prompt_contains_source_material(self):
        captured = {}
        def spy(p):
            captured["p"] = p
            return '{"veredicto":"APPROVE","motivo":"ok"}'
        vc.verify_article(POLISHED, SOURCE, runner=spy)
        self.assertIn("Idealista", captured["p"])
        self.assertIn("6,2% interanual", captured["p"])
        self.assertIn("El precio sube", captured["p"])

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 pipeline/tests/test_verify.py`
Expected: `ModuleNotFoundError: No module named 'verify_codex'`

- [ ] **Step 3: Write implementation**

```python
#!/usr/bin/env python3
"""verify_codex.py — Puerta 2 de la edición autónoma: verificación adversarial
por artículo con Codex (familia de modelo distinta a quien escribió).
Fallback: Claude con prompt adversarial. Sin verificador ⇒ REJECT (regla de oro).

Uso directo: python3 pipeline/verify_codex.py --self-test
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

CODEX_TIMEOUT = 180
CLAUDE_TIMEOUT = 120

VERIFY_PROMPT = """Eres el editor jefe de Radar Inmobiliario Madrid. Tu única tarea es VETAR \
artículos defectuosos antes de publicarlos. Sé estricto: ante la duda, rechaza.

ARTÍCULO PULIDO (candidato a publicarse):
{polished}

MATERIAL ORIGINAL (única fuente de verdad):
Titular original: {src_titulo}
Fuente: {src_fuente}
Resumen de la fuente: {src_resumen}
Borrador del triaje: {src_borrador}

Rechaza (REJECT) si se cumple CUALQUIERA de estas condiciones:
1. El artículo afirma cifras, porcentajes, fechas o nombres propios que NO aparecen en el \
material original ni se derivan trivialmente de él.
2. El titular exagera o contradice el material original (clickbait).
3. Hay errores de español (gramática, ortografía) o frases sin sentido.
4. El campo "impacto" no es plausible respecto al material original.

Responde SOLO este JSON, sin texto extra:
{{"veredicto": "APPROVE" | "REJECT", "motivo": "una frase concreta"}}"""


def extract_json(text: str):
    m = re.search(r"\{.*\}", text or "", re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def _env_with_cli_paths():
    env = dict(os.environ)
    extra = f"{Path.home()}/.local/bin:/opt/homebrew/bin:/usr/local/bin"
    env["PATH"] = extra + ":" + env.get("PATH", "")
    return env


def run_codex(prompt: str) -> str:
    result = subprocess.run(
        ["codex", "exec", "--skip-git-repo-check", "-s", "read-only", prompt],
        capture_output=True, text=True, timeout=CODEX_TIMEOUT, env=_env_with_cli_paths(),
    )
    return result.stdout.strip()


def run_claude(prompt: str) -> str:
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True, text=True, timeout=CLAUDE_TIMEOUT, env=_env_with_cli_paths(),
    )
    return result.stdout.strip()


def build_prompt(polished: dict, source: dict) -> str:
    return VERIFY_PROMPT.format(
        polished=json.dumps(polished, ensure_ascii=False, indent=2),
        src_titulo=(source.get("titulo_original") or "")[:200],
        src_fuente=source.get("fuente", ""),
        src_resumen=(source.get("resumen_raw") or "")[:500],
        src_borrador=(source.get("resumen_borrador") or "")[:300],
    )


def verify_article(polished: dict, source: dict, runner=run_codex):
    """(veredicto, motivo) con veredicto ∈ {APPROVE, REJECT, ERROR}."""
    prompt = build_prompt(polished, source)
    try:
        raw = runner(prompt)
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as e:
        return "ERROR", f"verificador no disponible: {e}"
    data = extract_json(raw)
    if not data or data.get("veredicto") not in ("APPROVE", "REJECT"):
        return "ERROR", f"respuesta no parseable: {(raw or '')[:120]}"
    return data["veredicto"], str(data.get("motivo", ""))[:300]


def verify_with_fallback(polished: dict, source: dict, primary=run_codex, fallback=run_claude):
    """(veredicto, motivo, verificador). Regla de oro: sin verificador ⇒ REJECT."""
    verdict, motivo = verify_article(polished, source, runner=primary)
    if verdict != "ERROR":
        return verdict, motivo, "codex"
    verdict, motivo = verify_article(polished, source, runner=fallback)
    if verdict != "ERROR":
        return verdict, motivo, "claude-fallback"
    return "REJECT", f"sin verificador disponible ({motivo})", "ninguno"


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        out = run_codex('Responde SOLO este JSON, sin texto extra: '
                        '{"veredicto":"APPROVE","motivo":"self-test"}')
        data = extract_json(out)
        ok = bool(data) and data.get("veredicto") == "APPROVE"
        print("self-test codex:", "OK" if ok else f"FALLO — salida: {out[:200]}")
        sys.exit(0 if ok else 1)
    print(__doc__)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 pipeline/tests/test_verify.py`
Expected: `OK` (7 tests)

- [ ] **Step 5: Self-test en vivo contra Codex real**

Run: `python3 pipeline/verify_codex.py --self-test`
Expected: `self-test codex: OK`. Si falla por login/instalación → volver a Task 1.

- [ ] **Step 6: Commit**

```bash
git add pipeline/verify_codex.py pipeline/tests/test_verify.py
git commit -m "pipeline: verify_codex.py — puerta 2 adversarial con fallback Claude"
```

---

### Task 3: Modificaciones mínimas a triage y polish

**Files:**
- Modify: `pipeline/triage_ollama.py` (función `write_note`, ~línea 95-152, y `main`, ~línea 155)
- Modify: `pipeline/polish_claude.sh` (bloque python del paso 2, ~línea 62-74)
- Test: `pipeline/tests/test_triage_auto.py`

**Interfaces:**
- Produces: `triage_ollama.py --auto` escribe notas con `publicar: true` + `modo: auto`; `write_note(article, triage, idx, auto=False, cola_dir=None)`. `approved.json` gana campos `titulo_original` y `resumen_raw` (los consume `verify_codex.build_prompt` de Task 2).

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_triage_auto.py
import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import triage_ollama as tr

ART = {"titulo": "Prueba de nota", "fecha": "2 Jul", "hora": "08:00",
       "fuente": "Idealista", "url": "https://x.example/a", "imagen": "",
       "score": 7, "resumen_raw": "Texto fuente"}
TRIAGE = {"categoria": "Demanda", "distrito": None, "tag": "emerald",
          "direccion_impacto": "sube", "resumen_borrador": "Borrador",
          "impacto_borrador": "+1%", "impacto_label_borrador": "test"}

class TestTriageAuto(unittest.TestCase):
    def test_auto_marks_publicar_true(self):
        with tempfile.TemporaryDirectory() as d:
            fname = tr.write_note(ART, TRIAGE, 1, auto=True, cola_dir=Path(d))
            text = (Path(d) / fname).read_text(encoding="utf-8")
            self.assertIn("publicar: true", text)
            self.assertIn("modo: auto", text)

    def test_default_keeps_publicar_false(self):
        with tempfile.TemporaryDirectory() as d:
            fname = tr.write_note(ART, TRIAGE, 1, cola_dir=Path(d))
            text = (Path(d) / fname).read_text(encoding="utf-8")
            self.assertIn("publicar: false", text)
            self.assertNotIn("modo: auto", text)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 pipeline/tests/test_triage_auto.py`
Expected: `TypeError: write_note() got an unexpected keyword argument 'auto'`

- [ ] **Step 3: Modificar `write_note` y `main` en triage_ollama.py**

Firma y frontmatter (reemplaza las líneas correspondientes; el resto del cuerpo no cambia):

```python
def write_note(article: dict, triage: dict, idx: int, auto: bool = False, cola_dir: Path = None):
    cola_dir = cola_dir or COLA_DIR
    slug = slugify(article["titulo"])
    fecha_file = datetime.now().strftime("%Y%m%d")
    filename = f"{fecha_file}-{idx:02d}-{slug}.md"
    filepath = cola_dir / filename
```

y en el f-string del frontmatter, la primera línea pasa de `publicar: false` fijo a:

```python
    publicar_line = "publicar: true\nmodo: auto" if auto else "publicar: false"
    content = f"""---
{publicar_line}
fecha: '{article["fecha"]}'
...resto idéntico...
```

En `main()`: detectar el flag y propagarlo:

```python
def main():
    auto = "--auto" in sys.argv
    ...
        filename = write_note(article, triage, i, auto=auto)
```

- [ ] **Step 4: Run tests**

Run: `python3 pipeline/tests/test_triage_auto.py`
Expected: `OK` (2 tests)

- [ ] **Step 5: Enriquecer approved.json en polish_claude.sh**

En el bloque python del paso 2 (tras calcular `borrador`), añadir extracción de H1 y resumen raw, y los dos campos al dict:

```python
    h1 = ""
    hm = re.search(r"^# (.+)$", text, re.M)
    if hm:
        h1 = hm.group(1).strip()
    raw = ""
    rm = re.search(r"## Resumen raw \(fuente\)\n\n(.*?)(?=\n##|\Z)", text, re.S)
    if rm:
        raw = rm.group(1).strip()

    articles.append({
        "fecha": get("fecha"),
        ...campos existentes sin tocar...,
        "titulo_original": h1,
        "resumen_raw": raw,
        "resumen_borrador": borrador,
    })
```
(Los campos extra viajan a Claude como contexto adicional en el prompt de pulido — inocuo — y NO acaban en news.js porque el dict de retorno de `polish_article` es explícito.)

- [ ] **Step 6: Verificación manual del sh (sin gastar API)**

```bash
bash -n pipeline/polish_claude.sh   # syntax check
```
Expected: sin salida (exit 0).

- [ ] **Step 7: Commit**

```bash
git add pipeline/triage_ollama.py pipeline/polish_claude.sh pipeline/tests/test_triage_auto.py
git commit -m "pipeline: triage --auto + approved.json con material original para verificación"
```

---

### Task 4: `auto_edition.py` parte 1 — parse/merge/render de news.js

**Files:**
- Create: `pipeline/auto_edition.py` (solo helpers puros en esta task)
- Test: `pipeline/tests/test_newsjs.py`

**Interfaces:**
- Produces:
  - `parse_news_data(text: str) -> dict` con claves `actualizado` (str), `semanaResumen` (dict), `destacada` (dict), `items` (list[dict] con TODOS los campos originales).
  - `merge_items(new_items: list, prev_items: list, cap: int = 30) -> list` — nuevos primero, dedup por `url` (o `slug` si no hay url), tope `cap`.
  - `render_news_js(actualizado, semana, destacada, items) -> str` — mismo formato que polish_claude.sh (round-trip estable).

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_newsjs.py
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

ROOT = Path(__file__).parent.parent.parent
REAL_NEWS = (ROOT / "src" / "data" / "news.js").read_text(encoding="utf-8")

class TestParse(unittest.TestCase):
    def test_parse_real_news_js(self):
        data = ae.parse_news_data(REAL_NEWS)
        self.assertGreaterEqual(len(data["items"]), 1)
        it = data["items"][0]
        for field in ("slug", "titulo", "fuente", "url", "fechaISO", "body"):
            self.assertIn(field, it)
        self.assertIn("titulo", data["destacada"])
        self.assertIn("publicadas", data["semanaResumen"])
        self.assertTrue(data["actualizado"])

    def test_roundtrip(self):
        data = ae.parse_news_data(REAL_NEWS)
        out = ae.render_news_js(data["actualizado"], data["semanaResumen"],
                                data["destacada"], data["items"])
        data2 = ae.parse_news_data(out)
        self.assertEqual(data["items"], data2["items"])
        self.assertEqual(data["destacada"], data2["destacada"])

class TestMerge(unittest.TestCase):
    def test_new_first_dedup_and_cap(self):
        old = [{"slug": f"viejo-{i}", "url": f"https://x/{i}"} for i in range(29)]
        new = [{"slug": "nuevo", "url": "https://x/nuevo"},
               {"slug": "repetido", "url": "https://x/3"}]  # misma url que viejo-3
        merged = ae.merge_items(new, old, cap=30)
        self.assertEqual(merged[0]["slug"], "nuevo")
        self.assertEqual(len([m for m in merged if m["url"] == "https://x/3"]), 1)
        self.assertLessEqual(len(merged), 30)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 pipeline/tests/test_newsjs.py`
Expected: `ModuleNotFoundError: No module named 'auto_edition'`

- [ ] **Step 3: Write implementation (helpers puros)**

```python
#!/usr/bin/env python3
"""auto_edition.py — Orquestador de la edición diaria autónoma.

Flujo: preflight → fetch → PUERTA 1 → triage (Ollama, --auto) → polish (Claude)
→ PUERTA 2 (verify_codex) → merge con archivo → PUERTA 3 → publish → informe.
Diseño: docs/superpowers/specs/2026-07-02-auto-edition-design.md

Uso: python3 pipeline/auto_edition.py [--dry-run]
"""
import json
import re
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from distribute import _split_top_level_objects  # parser balanceado ya probado

ROOT = Path(__file__).parent.parent
NEWS_JS = ROOT / "src" / "data" / "news.js"
WORK = ROOT / "pipeline" / "work"
VAULT = Path.home() / "Documents" / "Radar Inmobiliario" / "Contenido"
COLA = VAULT / "Noticias" / "_cola"
PUBLICADO = VAULT / "Noticias" / "Publicado"
RECHAZADAS = VAULT / "Noticias" / "_rechazadas"
ARCHIVO = VAULT / "Noticias" / "_archivo"
EDICIONES = VAULT / "Ediciones"

MIN_SCORE = 5
MAX_ARTICULOS = 4
CAP_ITEMS = 30
FUENTES_BLACKLIST = set()  # nombres de fuente en minúsculas, p.ej. {"forocoches"}


# ── news.js: parse / merge / render ──────────────────────────────────────────

def _balanced_span(text: str, anchor_regex: str, open_ch: str, close_ch: str):
    """Texto del bloque balanceado (incluidos delimitadores) tras el anchor."""
    m = re.search(anchor_regex, text)
    if not m:
        return None
    i = text.find(open_ch, m.end() - 1)
    if i < 0:
        return None
    depth, in_str, esc = 0, False, False
    for j in range(i, len(text)):
        c = text[j]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return text[i:j + 1]
    return None


def parse_news_data(text: str) -> dict:
    m = re.search(r"actualizado:\s*'([^']*)'", text)
    semana_txt = _balanced_span(text, r"semanaResumen:\s*\{", "{", "}") or "{}"
    dest_txt = _balanced_span(text, r"destacada:\s*\{", "{", "}") or "{}"
    items_txt = _balanced_span(text, r"items:\s*\[", "[", "]") or "[]"
    items = [json.loads(o) for o in _split_top_level_objects(items_txt[1:-1])]
    return {
        "actualizado": m.group(1) if m else "",
        "semanaResumen": json.loads(semana_txt),
        "destacada": json.loads(dest_txt),
        "items": items,
    }


def merge_items(new_items: list, prev_items: list, cap: int = CAP_ITEMS) -> list:
    def key(it):
        return it.get("url") or it.get("slug") or ""
    seen = {key(it) for it in new_items}
    merged = list(new_items)
    for it in prev_items:
        k = key(it)
        if k and k in seen:
            continue
        seen.add(k)
        merged.append(it)
    return merged[:cap]


def render_news_js(actualizado: str, semana: dict, destacada: dict, items: list) -> str:
    return f"""// Enriched news data for the redesigned "noticias" section.
// Each item carries: fecha, hora, categoria, distrito, fuente, titulo, resumen,
// impactoPrecio (estimated bps for the affected zone), tag (color hint).
// Generated by pipeline/polish_claude.sh + pipeline/auto_edition.py

window.NEWS_DATA = {{
  actualizado: '{actualizado}',
  semanaResumen: {json.dumps(semana, indent=2, ensure_ascii=False)},

  // Featured "hero" piece — the lead story
  destacada: {json.dumps(destacada, indent=2, ensure_ascii=False)},

  items: {json.dumps(items, indent=2, ensure_ascii=False)},
}};
"""
```

- [ ] **Step 4: Run tests**

Run: `python3 pipeline/tests/test_newsjs.py`
Expected: `OK` (3 tests)

- [ ] **Step 5: Añadir addendum al spec y commit**

Añadir al final de `docs/superpowers/specs/2026-07-02-auto-edition-design.md`:

```markdown
## Addendum (2 Jul 2026, durante planificación)

`polish_claude.sh` reemplaza `news.js` entero con la edición del día y
`distribute.py::gen_article_pages` borra las páginas de artículos ausentes. En modo
diario automático eso destruiría cada día las URLs del día anterior (404 real).
Decisión: el orquestador FUSIONA (`merge_items`: nuevos primero, dedup por url/slug,
cap 30) para que el archivo crezca y las URLs indexadas sobrevivan.
```

```bash
git add pipeline/auto_edition.py pipeline/tests/test_newsjs.py docs/superpowers/specs/2026-07-02-auto-edition-design.md
git commit -m "pipeline: auto_edition parse/merge/render de news.js (archivo acumulativo)"
```

---

### Task 5: `auto_edition.py` parte 2 — Puerta 1

**Files:**
- Modify: `pipeline/auto_edition.py` (añadir funciones)
- Test: `pipeline/tests/test_gate1.py`

**Interfaces:**
- Consumes: `parse_news_data` (Task 4).
- Produces:
  - `filter_candidates(candidates: list, seen_urls: set, today: date, min_score=MIN_SCORE, max_articles=MAX_ARTICULOS, blacklist=FUENTES_BLACKLIST) -> tuple[list, list[tuple[dict, str]]]` — (aceptados, descartados con motivo).
  - `collect_seen_urls(news_items: list, vault_dirs: list[Path]) -> set[str]`.

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_gate1.py
import sys, tempfile, unittest
from datetime import date
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

HOY = date(2026, 7, 2)

def cand(**kw):
    base = {"titulo": "t", "fuente": "Idealista", "url": "https://x/1",
            "fecha_iso": "2026-07-02", "score": 8}
    base.update(kw)
    return base

class TestGate1(unittest.TestCase):
    def test_acepta_fresco_con_score(self):
        ok, ko = ae.filter_candidates([cand()], set(), HOY)
        self.assertEqual(len(ok), 1)

    def test_rechaza_viejo(self):
        ok, ko = ae.filter_candidates([cand(fecha_iso="2026-06-29")], set(), HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("48h", ko[0][1])

    def test_acepta_ayer(self):
        ok, _ = ae.filter_candidates([cand(fecha_iso="2026-07-01")], set(), HOY)
        self.assertEqual(len(ok), 1)

    def test_rechaza_score_bajo(self):
        ok, ko = ae.filter_candidates([cand(score=4)], set(), HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("score", ko[0][1])

    def test_rechaza_duplicado_por_url(self):
        ok, ko = ae.filter_candidates([cand()], {"https://x/1"}, HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("duplicado", ko[0][1])

    def test_rechaza_blacklist(self):
        ok, ko = ae.filter_candidates([cand(fuente="Basura Diario")], set(), HOY,
                                      blacklist={"basura diario"})
        self.assertEqual(len(ok), 0)

    def test_maximo_articulos(self):
        cands = [cand(url=f"https://x/{i}") for i in range(9)]
        ok, _ = ae.filter_candidates(cands, set(), HOY, max_articles=4)
        self.assertEqual(len(ok), 4)

class TestSeenUrls(unittest.TestCase):
    def test_recoge_de_items_y_vault(self):
        with tempfile.TemporaryDirectory() as d:
            note = Path(d) / "nota.md"
            note.write_text("---\npublicar: publicado\nurl: 'https://x/vault'\n---\n",
                            encoding="utf-8")
            urls = ae.collect_seen_urls([{"url": "https://x/item"}], [Path(d)])
            self.assertEqual(urls, {"https://x/item", "https://x/vault"})

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 pipeline/tests/test_gate1.py`
Expected: `AttributeError: module 'auto_edition' has no attribute 'filter_candidates'`

- [ ] **Step 3: Write implementation** (añadir a auto_edition.py tras los helpers de news.js)

```python
# ── PUERTA 1: filtro determinista ─────────────────────────────────────────────

def filter_candidates(candidates, seen_urls, today, min_score=MIN_SCORE,
                      max_articles=MAX_ARTICULOS, blacklist=FUENTES_BLACKLIST):
    """(aceptados, [(candidato, motivo_descarte), ...]). Candidates ya viene
    ordenado por score desc desde fetch_news.py — el corte max_articles se
    queda con los mejores."""
    fresh = {today.isoformat(), (today - timedelta(days=1)).isoformat()}
    ok, ko = [], []
    for c in candidates:
        if c.get("fecha_iso") not in fresh:
            ko.append((c, f"más de 48h ({c.get('fecha_iso')})"))
        elif c.get("score", 0) < min_score:
            ko.append((c, f"score {c.get('score')} < {min_score}"))
        elif c.get("fuente", "").strip().lower() in blacklist:
            ko.append((c, f"fuente en blacklist: {c.get('fuente')}"))
        elif c.get("url", "") in seen_urls:
            ko.append((c, "duplicado (url ya publicada)"))
        elif len(ok) >= max_articles:
            ko.append((c, f"cupo diario lleno ({max_articles})"))
        else:
            ok.append(c)
    return ok, ko


def collect_seen_urls(news_items, vault_dirs):
    urls = {it.get("url", "") for it in news_items if it.get("url")}
    for d in vault_dirs:
        if not d.exists():
            continue
        for f in d.glob("*.md"):
            m = re.search(r"^url: '([^']+)'", f.read_text(encoding="utf-8"), re.M)
            if m:
                urls.add(m.group(1))
    return urls
```

- [ ] **Step 4: Run tests**

Run: `python3 pipeline/tests/test_gate1.py && python3 pipeline/tests/test_newsjs.py`
Expected: `OK` en ambos

- [ ] **Step 5: Commit**

```bash
git add pipeline/auto_edition.py pipeline/tests/test_gate1.py
git commit -m "pipeline: auto_edition puerta 1 (frescura, score, dedup, blacklist, cupo)"
```

---

### Task 6: `auto_edition.py` parte 3 — orquestador completo

**Files:**
- Modify: `pipeline/auto_edition.py` (añadir preflight, etapas, puertas 2-3, publish, main)
- Test: manual con `--dry-run` (el flujo integra subprocesos reales; los helpers ya están testeados)

**Interfaces:**
- Consumes: `verify_codex.verify_with_fallback/run_codex/run_claude/extract_json` (Task 2), `triage_ollama --auto` (Task 3), helpers de Tasks 4-5.
- Produces: `python3 pipeline/auto_edition.py [--dry-run]`; lock `pipeline/work/last_edition.date`; llama a `write_report`/`notify` (Task 7 — en esta task se dejan como stubs mínimos que imprimen por stdout).

- [ ] **Step 1: Añadir el bloque de etapas** (código completo; los stubs `write_report`/`notify` se sustituyen en Task 7)

```python
# ── infraestructura del flujo ─────────────────────────────────────────────────

import verify_codex as vc

LOCK = WORK / "last_edition.date"
POLISH_REPROMPT = """Eres el editor de Radar Inmobiliario Madrid. Hoy es {today}.
Reescribe esta noticia. Devuelve SOLO este JSON (sin texto extra ni bloques de código):
{{"titulo":"...(max 100 chars, con datos)","resumen":"...(1-2 frases, max 200 chars)",\
"impacto":"...(max 20 chars)","impactoLabel":"...(max 35 chars)",\
"slug":"...(kebab-case sin acentos, max 70 chars)","fechaISO":"2026-MM-DD",\
"body":[{{"type":"p","dropcap":true,"text":"..."}},{{"type":"p","text":"..."}},\
{{"type":"pullquote","text":"..."}},{{"type":"p","text":"..."}}]}}
El body: 4 bloques, ~250 palabras, sin markdown, solo hechos del material original.

Material original:
{art_json}"""


def sh(cmd, **kw):
    """Ejecuta y devuelve CompletedProcess; check=True por defecto."""
    kw.setdefault("check", True)
    kw.setdefault("cwd", ROOT)
    kw.setdefault("capture_output", True)
    kw.setdefault("text", True)
    return subprocess.run(cmd, **kw)


def ollama_alive() -> bool:
    import urllib.request
    try:
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5):
            return True
    except OSError:
        return False


def preflight(report: dict) -> None:
    import shutil as _shutil
    import urllib.request
    # red
    try:
        with urllib.request.urlopen("https://www.radarinmobiliario.com/robots.txt", timeout=15):
            pass
    except OSError as e:
        raise SystemExit(f"ABORT preflight: sin red ({e})")
    # ollama (intenta arrancarlo si está caído)
    if not ollama_alive():
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, env=vc._env_with_cli_paths())
        import time
        time.sleep(10)
    report["ollama"] = ollama_alive()
    # CLIs
    env_path = vc._env_with_cli_paths()["PATH"]
    report["claude"] = bool(_shutil.which("claude", path=env_path))
    report["codex"] = bool(_shutil.which("codex", path=env_path))
    if not report["claude"] and not report["codex"]:
        raise SystemExit("ABORT preflight: ni claude ni codex disponibles")
    # limpiar cola caducada (>48h) → _archivo/
    ARCHIVO.mkdir(parents=True, exist_ok=True)
    limite = (date.today() - timedelta(days=2)).strftime("%Y%m%d")
    for f in sorted(COLA.glob("*.md")):
        prefix = f.name[:8]
        if prefix.isdigit() and prefix < limite:
            f.rename(ARCHIVO / f.name)
            report.setdefault("archivadas", []).append(f.name)


def find_note_by_url(url: str, folder: Path):
    for f in folder.glob("*.md"):
        if f"url: '{url}'" in f.read_text(encoding="utf-8"):
            return f
    return None


def reject_note(url: str, motivo: str) -> None:
    """La nota ya está en Publicado/ (polish la movió); trasladar a _rechazadas."""
    RECHAZADAS.mkdir(parents=True, exist_ok=True)
    note = find_note_by_url(url, PUBLICADO)
    if not note:
        return
    text = note.read_text(encoding="utf-8")
    text = text.replace("publicar: publicado", "publicar: rechazado", 1)
    text = text.replace("---\n", f"---\nrechazo_motivo: '{motivo[:180]}'\n", 1)
    (RECHAZADAS / note.name).write_text(text, encoding="utf-8")
    note.unlink()


def needs_repolish(item: dict) -> bool:
    return len(item.get("body") or []) < 4


def repolish_item(item: dict, source: dict, today_h: str) -> dict:
    """Fallback de pulido vía Codex cuando polish dejó el artículo en modo degradado."""
    prompt = POLISH_REPROMPT.format(today=today_h,
                                    art_json=json.dumps(source, ensure_ascii=False, indent=2))
    try:
        data = vc.extract_json(vc.run_codex(prompt))
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        data = None
    if data and len(data.get("body") or []) >= 4:
        item.update({k: data[k] for k in
                     ("titulo", "resumen", "impacto", "impactoLabel", "slug", "fechaISO", "body")
                     if k in data})
    return item


def gate3(report: dict) -> None:
    data = parse_news_data(NEWS_JS.read_text(encoding="utf-8"))
    for it in data["items"]:
        if not (it.get("slug") and it.get("titulo") and it.get("fechaISO")):
            raise SystemExit(f"ABORT puerta 3: item incompleto {it.get('slug', '?')}")
    sh([sys.executable, "pipeline/build.py"])
    sh([sys.executable, "pipeline/distribute.py"])
    porcelain = sh(["git", "status", "--porcelain"]).stdout
    allowed = ("src/data/news.js", "Radar Inmobiliario Madrid.html", "dist/",
               "pipeline/work/", "\"Radar Inmobiliario Madrid.html\"")
    for line in porcelain.splitlines():
        path = line[3:].strip().strip('"')
        if not path.startswith(tuple(a.strip('"') for a in allowed)):
            raise SystemExit(f"ABORT puerta 3: fichero inesperado modificado: {path}")
    report["gate3"] = "OK"


def publish(new_items: list, report: dict) -> None:
    today_h = datetime.now().strftime("%-d %b %Y")
    sh(["git", "add", "src/data/news.js", "Radar Inmobiliario Madrid.html", "dist/",
        "pipeline/work/candidates.json", "pipeline/work/approved.json"])
    sh(["git", "commit", "-m",
        f"noticias: edición auto {today_h}\n\nAutomated by pipeline/auto_edition.py"])
    sh(["git", "push", "origin", "main"])
    report["commit"] = sh(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
    # esperar deploy: poll al primer artículo nuevo
    import time
    import urllib.request
    url = f"https://www.radarinmobiliario.com/noticia/{new_items[0]['slug']}"
    for _ in range(30):
        try:
            with urllib.request.urlopen(url, timeout=10) as r:
                if r.status == 200:
                    report["deploy"] = "verificado"
                    break
        except OSError:
            pass
        time.sleep(10)
    else:
        report["deploy"] = "no verificado en 5 min (revisar Vercel)"
    r = subprocess.run([sys.executable, "pipeline/indexnow_submit.py"],
                       capture_output=True, text=True, cwd=ROOT)
    report["indexnow"] = (r.stdout or r.stderr).strip()


# stubs — Task 7 los sustituye
def write_report(report: dict, dry_run: bool) -> None:
    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))


def notify(title: str, message: str) -> None:
    print(f"[NOTIFY] {title}: {message}")


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    t0 = datetime.now()
    today = date.today()
    report = {"fecha": today.isoformat(), "dry_run": dry_run, "publicados": [],
              "rechazados": [], "descartados_p1": []}

    if LOCK.exists() and LOCK.read_text().strip() == today.isoformat() and not dry_run:
        print("Ya hay edición hoy — no-op.")
        return 0

    try:
        preflight(report)

        # 1. fetch + PUERTA 1
        sh([sys.executable, "pipeline/fetch_news.py"])
        candidates = json.loads((WORK / "candidates.json").read_text(encoding="utf-8"))
        prev = parse_news_data(NEWS_JS.read_text(encoding="utf-8"))
        seen = collect_seen_urls(prev["items"], [PUBLICADO, RECHAZADAS, ARCHIVO])
        ok, ko = filter_candidates(candidates, seen, today)
        report["descartados_p1"] = [(c["titulo"][:60], motivo) for c, motivo in ko]
        if not ok:
            report["resultado"] = "sin candidatos que pasen la puerta 1 — no hay edición"
            raise _NoEdition()
        (WORK / "candidates.json").write_text(
            json.dumps(ok, indent=2, ensure_ascii=False), encoding="utf-8")

        # 2. triage (Ollama --auto; fallback triage_claude)
        triage_script = "pipeline/triage_ollama.py" if report["ollama"] else "pipeline/triage_claude.py"
        args = [sys.executable, triage_script]
        if triage_script.endswith("ollama.py"):
            args.append("--auto")
        sh(args)
        if not triage_script.endswith("ollama.py"):
            # triage_claude no conoce --auto: marcar las notas de hoy a mano
            hoy = date.today().strftime("%Y%m%d")
            for f in COLA.glob(f"{hoy}-*.md"):
                t = f.read_text(encoding="utf-8")
                f.write_text(t.replace("publicar: false", "publicar: true\nmodo: auto", 1),
                             encoding="utf-8")

        # 3. polish (Claude) — mueve las notas a Publicado/ al acabar
        sh(["bash", "pipeline/polish_claude.sh"], timeout=1800)
        approved = json.loads((WORK / "approved.json").read_text(encoding="utf-8"))
        edicion = parse_news_data(NEWS_JS.read_text(encoding="utf-8"))
        today_items = edicion["items"]
        if len(today_items) != len(approved):
            raise SystemExit(f"ABORT: polish produjo {len(today_items)} items "
                             f"pero había {len(approved)} aprobados")

        # 3b. re-pulido vía Codex de los que quedaron degradados
        today_h = datetime.now().strftime("%-d %b %Y")
        for i, item in enumerate(today_items):
            if needs_repolish(item):
                today_items[i] = repolish_item(item, approved[i], today_h)

        # 4. PUERTA 2 — verificación por artículo
        survivors, sources_ok = [], []
        for item, source in zip(today_items, approved):
            verdict, motivo, who = vc.verify_with_fallback(item, source)
            if verdict == "APPROVE":
                survivors.append(item)
                sources_ok.append(source)
                report["publicados"].append(
                    {"titulo": item["titulo"], "slug": item["slug"], "verificador": who})
            else:
                report["rechazados"].append(
                    {"titulo": item.get("titulo", "?"), "motivo": motivo, "verificador": who})
                if not dry_run:
                    reject_note(source.get("url", ""), motivo)
        if not survivors:
            # restaurar el news.js anterior: la edición de hoy no existe
            NEWS_JS.write_text(render_news_js(prev["actualizado"], prev["semanaResumen"],
                                              prev["destacada"], prev["items"]),
                               encoding="utf-8")
            report["resultado"] = "todos los artículos rechazados en puerta 2 — no hay edición"
            raise _NoEdition()

        # 5. merge con archivo + destacada
        destacada = edicion["destacada"]
        if destacada.get("slug") not in {s["slug"] for s in survivors}:
            destacada = {**survivors[0], "metricas": destacada.get("metricas", [])}
        distritos = len({s.get("distrito") for s in survivors if s.get("distrito")})
        semana = {"publicadas": len(survivors), "distritosCubiertos": distritos or 1,
                  "movimientoMedio": edicion["semanaResumen"].get("movimientoMedio", "")}
        merged = merge_items(survivors, prev["items"])
        NEWS_JS.write_text(render_news_js(edicion["actualizado"], semana, destacada, merged),
                           encoding="utf-8")

        # 6. PUERTA 3 + publicación
        gate3(report)
        if dry_run:
            report["resultado"] = ("dry-run OK — working tree con cambios para inspección; "
                                   "restaurar con: git checkout -- . ")
        else:
            publish(survivors, report)
            LOCK.write_text(today.isoformat(), encoding="utf-8")
            report["resultado"] = f"publicados {len(survivors)} artículos"

    except _NoEdition:
        if not dry_run:
            LOCK.write_text(today.isoformat(), encoding="utf-8")
    except (SystemExit, subprocess.CalledProcessError, Exception) as e:
        report["error"] = str(e)[:500]
        report["resultado"] = "ERROR — sin publicar"
        write_report(report, dry_run)
        notify("Radar: edición FALLIDA", str(e)[:150])
        return 1

    report["duracion_min"] = round((datetime.now() - t0).total_seconds() / 60, 1)
    write_report(report, dry_run)
    notify("Radar: edición del día",
           report.get("resultado", "") + f" · {len(report['rechazados'])} rechazados")
    return 0


class _NoEdition(Exception):
    """Día sin edición (legítimo, no error)."""


if __name__ == "__main__":
    sys.exit(main())
```

Nota de implementación: `class _NoEdition` debe declararse ANTES de `main()` en el fichero (aquí se muestra al final solo por legibilidad del plan).

- [ ] **Step 2: Comprobación estática + tests existentes siguen verdes**

```bash
python3 -m py_compile pipeline/auto_edition.py
python3 pipeline/tests/test_newsjs.py && python3 pipeline/tests/test_gate1.py
```
Expected: compila; `OK` ambos.

- [ ] **Step 3: Dry-run supervisado completo** (gasta API de verdad — Ollama + Claude + Codex)

```bash
python3 pipeline/auto_edition.py --dry-run
```
Expected: informe JSON por stdout con `"resultado": "dry-run OK..."` (o "sin candidatos..." si el día está flojo — también válido). Verificar a mano:
- `git status` muestra SOLO news.js, monolito, dist/, pipeline/work/.
- `parse_news_data(NEWS_JS)` conserva los items antiguos + nuevos primeros.
- Las notas rechazadas NO se movieron (dry-run).

- [ ] **Step 4: Restaurar working tree tras el dry-run**

```bash
git checkout -- "src/data/news.js" "Radar Inmobiliario Madrid.html" dist/ pipeline/work/ 2>/dev/null || git checkout -- .
git status   # limpio
```

- [ ] **Step 5: Commit**

```bash
git add pipeline/auto_edition.py
git commit -m "pipeline: auto_edition orquestador completo (puertas 2-3, publish, lock, dry-run)"
```

---

### Task 7: Informe diario + notificación + gestión de notas

**Files:**
- Modify: `pipeline/auto_edition.py` (sustituir stubs `write_report` y `notify`)
- Test: `pipeline/tests/test_report.py`

**Interfaces:**
- Consumes: dict `report` con las claves que puebla `main()` (fecha, dry_run, publicados, rechazados, descartados_p1, resultado, error?, commit?, deploy?, indexnow?, duracion_min, archivadas?).
- Produces: `render_report(report: dict) -> str` (markdown puro, testeable); `write_report` escribe en `EDICIONES/<fecha>[-dryrun].md`; `notify` usa osascript.

- [ ] **Step 1: Write the failing test**

```python
# pipeline/tests/test_report.py
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

REPORT = {"fecha": "2026-07-02", "dry_run": False, "resultado": "publicados 2 artículos",
          "publicados": [{"titulo": "A", "slug": "a", "verificador": "codex"}],
          "rechazados": [{"titulo": "B", "motivo": "cifra inventada", "verificador": "codex"}],
          "descartados_p1": [("C", "score 3 < 5")],
          "commit": "abc1234", "deploy": "verificado", "indexnow": "HTTP 202",
          "duracion_min": 7.5}

class TestReport(unittest.TestCase):
    def test_render_contiene_lo_esencial(self):
        md = ae.render_report(REPORT)
        for frag in ("publicados 2 artículos", "[A](https://www.radarinmobiliario.com/noticia/a)",
                     "cifra inventada", "score 3 < 5", "abc1234", "7.5"):
            self.assertIn(frag, md)

    def test_render_con_error(self):
        md = ae.render_report({"fecha": "2026-07-02", "dry_run": False,
                               "resultado": "ERROR — sin publicar",
                               "error": "boom", "publicados": [], "rechazados": [],
                               "descartados_p1": []})
        self.assertIn("boom", md)
        self.assertIn("ERROR", md)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 pipeline/tests/test_report.py`
Expected: `AttributeError: ... no attribute 'render_report'`

- [ ] **Step 3: Sustituir los stubs**

```python
def render_report(report: dict) -> str:
    L = [f"# Edición {report['fecha']}" + (" (dry-run)" if report.get("dry_run") else ""),
         "", f"**Resultado:** {report.get('resultado', '?')}"]
    if report.get("error"):
        L += ["", f"**Error:** `{report['error']}`"]
    if report.get("publicados"):
        L += ["", "## Publicados", ""]
        L += [f"- [{p['titulo']}](https://www.radarinmobiliario.com/noticia/{p['slug']}) "
              f"— verificado por {p['verificador']}" for p in report["publicados"]]
    if report.get("rechazados"):
        L += ["", "## Rechazados (puerta 2)", ""]
        L += [f"- {r['titulo']} — {r['motivo']} ({r['verificador']})"
              for r in report["rechazados"]]
    if report.get("descartados_p1"):
        L += ["", "## Descartados (puerta 1)", ""]
        L += [f"- {t} — {m}" for t, m in report["descartados_p1"]]
    if report.get("archivadas"):
        L += ["", f"_{len(report['archivadas'])} notas caducadas archivadas._"]
    meta = [str(report.get(k, "")) for k in ("commit", "deploy", "indexnow")]
    L += ["", "---", f"Commit: {meta[0]} · Deploy: {meta[1]} · IndexNow: {meta[2]} · "
          f"Duración: {report.get('duracion_min', '?')} min"]
    return "\n".join(L) + "\n"


def write_report(report: dict, dry_run: bool) -> None:
    EDICIONES.mkdir(parents=True, exist_ok=True)
    suffix = "-dryrun" if dry_run else ""
    path = EDICIONES / f"{report['fecha']}{suffix}.md"
    path.write_text(render_report(report), encoding="utf-8")
    print(f"Informe: {path}")


def notify(title: str, message: str) -> None:
    try:
        subprocess.run(["osascript", "-e",
                        f"display notification {json.dumps(message)} "
                        f"with title {json.dumps(title)}"],
                       capture_output=True, timeout=10)
    except OSError:
        pass  # sin GUI (ssh) — el informe ya quedó escrito
```

- [ ] **Step 4: Run tests (todos)**

Run: `for t in pipeline/tests/test_*.py; do python3 "$t" || exit 1; done`
Expected: `OK` en los 4 ficheros.

- [ ] **Step 5: Commit**

```bash
git add pipeline/auto_edition.py pipeline/tests/test_report.py
git commit -m "pipeline: informe diario en vault + notificación macOS"
```

---

### Task 8: launchd + logs

**Files:**
- Create: `pipeline/launchd/com.radar.autoedition.plist`
- Create: `~/Library/LaunchAgents/com.radar.autoedition.plist` (copia instalada)
- Modify: `.gitignore` (añadir `pipeline/logs/`)

**Interfaces:**
- Produces: job `com.radar.autoedition` a las 07:30 y 14:00 (el de las 14:00 es reintento — no-op si el lock del día existe); log en `pipeline/logs/autoedition.log`.

- [ ] **Step 1: Crear el plist** (en el repo, como fuente de verdad versionada)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.radar.autoedition</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "/Users/zaro/RADAR INMOBILIARIO" &amp;&amp; mkdir -p pipeline/logs &amp;&amp; python3 pipeline/auto_edition.py >> pipeline/logs/autoedition.log 2>&amp;1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
  </array>
</dict>
</plist>
```
(zsh -lc carga el perfil del usuario → mismo PATH que las ejecuciones manuales, incluido npm/codex. launchd ejecuta al despertar los StartCalendarInterval perdidos durante el sueño — el catch-up del diseño.)

- [ ] **Step 2: Añadir `pipeline/logs/` a .gitignore**

```bash
echo "pipeline/logs/" >> "/Users/zaro/RADAR INMOBILIARIO/.gitignore"
```

- [ ] **Step 3: Instalar y validar**

```bash
cp "/Users/zaro/RADAR INMOBILIARIO/pipeline/launchd/com.radar.autoedition.plist" ~/Library/LaunchAgents/
plutil -lint ~/Library/LaunchAgents/com.radar.autoedition.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.radar.autoedition.plist
launchctl print gui/$(id -u)/com.radar.autoedition | head -20
```
Expected: `OK` de plutil; `launchctl print` muestra el job con los dos calendar intervals.

- [ ] **Step 4: Validar el no-op con lock** (sin gastar API)

```bash
date +%Y-%m-%d > "/Users/zaro/RADAR INMOBILIARIO/pipeline/work/last_edition.date"
launchctl kickstart gui/$(id -u)/com.radar.autoedition
sleep 5 && tail -3 "/Users/zaro/RADAR INMOBILIARIO/pipeline/logs/autoedition.log"
```
Expected: el log termina con `Ya hay edición hoy — no-op.`

- [ ] **Step 5: Commit**

```bash
git add pipeline/launchd/com.radar.autoedition.plist .gitignore
git commit -m "pipeline: launchd 07:30 + retry 14:00 para la edición autónoma"
```

---

### Task 9: E2E supervisado + documentación

**Files:**
- Modify: `CLAUDE.md` (mapa de agentes)
- Delete: `pipeline/work/last_edition.date` (para permitir la primera edición real)

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: Primera edición real supervisada**

```bash
rm -f "/Users/zaro/RADAR INMOBILIARIO/pipeline/work/last_edition.date"
python3 "/Users/zaro/RADAR INMOBILIARIO/pipeline/auto_edition.py"
```
Expected: informe en `~/Documents/Radar Inmobiliario/Contenido/Ediciones/<hoy>.md`, notificación macOS, commit `noticias: edición auto ...` pusheado, artículos nuevos vivos en https://www.radarinmobiliario.com y los ANTIGUOS también (merge), IndexNow HTTP 202. Si el día no da candidatos: `resultado: sin candidatos...` también es éxito — repetir otro día o bajar MIN_SCORE temporalmente para la prueba.

- [ ] **Step 2: Verificación en producción**

```bash
curl -s https://www.radarinmobiliario.com/noticia/<slug-nuevo> -o /dev/null -w "%{http_code}\n"   # 200
curl -s https://www.radarinmobiliario.com/noticia/<slug-antiguo-preexistente> -o /dev/null -w "%{http_code}\n"   # 200 ← el merge funcionó
curl -s https://www.radarinmobiliario.com/news-sitemap.xml | grep -c "<url>"   # ≥1 (solo <48h)
```

- [ ] **Step 3: Documentar en CLAUDE.md** — añadir al mapa de agentes (tras la sección 10):

```markdown
### 11. `auto_edition.py` — Edición Diaria Autónoma

**File:** `pipeline/auto_edition.py` · **Trigger:** launchd `com.radar.autoedition` (07:30, retry 14:00)
**Qué hace:** ciclo completo sin humano: fetch → Puerta 1 (frescura/score/dedup) →
triage Ollama `--auto` → polish Claude → Puerta 2 (`verify_codex.py`, veredicto
APPROVE/REJECT por artículo, fallback Claude-adversarial) → merge con archivo (cap 30)
→ Puerta 3 (build/distribute/git limpio) → push + IndexNow → informe en
`Contenido/Ediciones/` + notificación. Regla de oro: todo fallo degrada a NO publicar.
**Run manual:** `python3 pipeline/auto_edition.py [--dry-run]` (lock diario en
`pipeline/work/last_edition.date`).
```

- [ ] **Step 4: Commit final**

```bash
git add CLAUDE.md
git commit -m "docs: auto_edition en el mapa de agentes"
git push origin main
```

---

## Self-Review (hecho al escribir el plan)

1. **Cobertura del spec:** decisiones 1-5 ✓ (autonomía→Task 6, umbral→Tasks 5-6, launchd+catch-up→Task 8, máx 4→Task 5, fallback verificación→Task 2); puertas 1/2/3 ✓ (Tasks 5/2/6); degradaciones ✓ (preflight+fallbacks Task 6); estados de notas ✓ (Tasks 6-7, archivo caducadas en preflight); informe+notificación ✓ (Task 7); pruebas del spec ✓ (dry-run Task 6, fixtures Puerta 1 Task 5, REJECT simulado Task 2, launchd lock Task 8). Añadido no previsto: merge acumulativo (addendum, Task 4).
2. **Placeholders:** los "...resto idéntico..." de Task 3 delimitan código EXISTENTE que no cambia (el diff exacto está indicado); no hay TBDs.
3. **Consistencia de tipos:** `verify_with_fallback` (3-tupla) consumida así en Task 6; `filter_candidates` (2-tupla) ídem; `write_note(auto=, cola_dir=)` coincide test/uso; claves del dict `report` coinciden entre Task 6 y `render_report` de Task 7.
