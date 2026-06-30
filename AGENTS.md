# Radar Inmobiliario — Agent Office

This file documents every agent and automation script in the project.
Read it before editing any pipeline file or slash command.

---

## What this project is

**Radar Inmobiliario Madrid** is a Spanish real-estate news & data site covering Madrid's 21 districts. It is built as a single self-contained HTML bundle (`Radar Inmobiliario Madrid.html`) that embeds all assets (React, fonts, GeoJSON, news data, components) as gzip+base64 inside a JSON manifest. A deploy pipeline decomposes the bundle into a static `dist/` folder for Vercel/Netlify.

---

## Agent map

### 1. `/noticias` — Editorial Orchestrator (Claude Code slash command)

**File:** `.claude/commands/noticias.md`
**Trigger:** user runs `/noticias` inside Claude Code
**Role:** Step-by-step conductor for a full news publication cycle. It calls the terminal scripts, pauses for human editorial review in Obsidian, then resumes to polish, build, commit, and push.

Steps it orchestrates:
1. `fetch_news.py` + `triage_ollama.py`
2. Human pause — user approves articles in Obsidian
3. `polish_claude.sh` → `build.py` → git commit + push

---

### 2. `fetch_news.py` — RSS Ingest Agent

**File:** `pipeline/fetch_news.py`
**Input:** Google News RSS feeds (inmobiliario Madrid, precio vivienda, alquiler barrio, plus additional sources)
**Output:** `pipeline/work/candidates.json` — top 25 scored articles, deduped

**What it does:**
- Fetches multiple RSS feeds in parallel
- Scores articles by keyword relevance and recency
- Deduplicates by URL and title similarity
- Strips tracking parameters from URLs

**Run:** `python3 pipeline/fetch_news.py`

---

### 3. `triage_ollama.py` — Local Triage Agent (free, offline)

**File:** `pipeline/triage_ollama.py`
**Model:** Ollama `qwen2.5:7b` running locally
**Input:** `pipeline/work/candidates.json`
**Output:** Markdown note files in `~/Documents/Radar Inmobiliario/Contenido/Noticias/_cola/`

**What it does:**
- Reads each candidate article
- Calls the local Ollama API to draft a Spanish-language editorial summary
- Writes one `.md` file per article with YAML frontmatter (`publicar: false`)
- Human then opens Obsidian and flips approved articles to `publicar: true`

**Run:** `python3 pipeline/triage_ollama.py`

---

### 4. `triage_claude.py` — Cloud Triage Agent (Claude headless)

**File:** `pipeline/triage_claude.py`
**Model:** Claude via `claude -p` (headless CLI)
**Input:** `pipeline/work/candidates.json`
**Output:** Same markdown queue as `triage_ollama.py`

**What it does:** Same as triage_ollama but uses Claude instead of a local model — higher quality prose, requires internet and Claude Code CLI installed.

**Run:** `python3 pipeline/triage_claude.py`

---

### 5. `polish_claude.sh` — Editorial Polish Agent

**File:** `pipeline/polish_claude.sh`
**Model:** Claude via `claude -p` (headless)
**Input:** Approved `.md` files (`publicar: true`) from the Obsidian queue
**Output:** `src/data/news.js` — structured JS module with polished articles ready for the front-end

**What it does:**
- Scans the Obsidian queue for approved articles
- For each article, calls Claude headless to:
  - Improve Spanish prose and headline
  - Estimate real-estate impact (price trend, affected districts)
  - Draft a "noticia destacada" (featured story) blurb
- Assembles all results into `news.js` and writes `pipeline/work/approved.json`

**Run:** `bash pipeline/polish_claude.sh`

---

### 6. `parse_prices.py` — Price Update Agent

**File:** `pipeline/parse_prices.py`
**Input:** CSV file in `pipeline/input/` with columns: `slug, nombre, precioMedio, alquilerM2, tx`
**Output:** Updated `src/data/distritos.js`

**What it does:**
- Reads new district price data from a manual CSV (published monthly by Idealista/Fotocasa)
- Calculates rental yield (`rent = alquilerM2*12/precioMedio*100`)
- Computes `varAnual` by diffing against current values in `distritos.js`
- Recalculates district ranking
- Patches the JS data file in-place

**Run:** `python3 pipeline/parse_prices.py pipeline/input/precios_MONTH_YEAR.csv`

---

### 7. `build.py` — Bundle Agent

**File:** `pipeline/build.py`
**Input:** `src/` tree + `src/manifest.map.json`
**Output:** `Radar Inmobiliario Madrid.html` (the monolithic bundle)

**What it does:**
- Reads the manifest map (UUID → file path + mime + compressed flag)
- Re-reads each source file from `src/`
- gzip+base64 encodes assets where `compressed: true`
- Replaces the `<script type="__bundler/manifest">` block in the HTML shell

**Run:** `python3 pipeline/build.py`

---

### 8. `distribute.py` — Distribution Agent

**File:** `pipeline/distribute.py`
**Input:** `Radar Inmobiliario Madrid.html` (monolithic bundle)
**Output:** `dist/` static site tree

**What it produces:**
- `dist/index.html` — lightweight HTML shell (~150 KB)
- `dist/assets/` — React, ReactDOM, Babel, GeoJSON, fonts
- `dist/data/news.js` + `dist/data/distritos.js`
- `dist/noticia/[slug]/index.html` — one static page per article (OG tags for bots/crawlers)
- `dist/news-sitemap.xml` — Google News sitemap

**Run:** `python3 pipeline/distribute.py`

---

### 9. `extract.py` — De-bundle Agent

**File:** `pipeline/extract.py`
**Input:** `Radar Inmobiliario Madrid.html`
**Output:** `src/` tree + `src/manifest.map.json`

**What it does:** Reverses `build.py`. Unpacks all assets from the manifest into editable source files. Run this once to set up `src/` if you only have the compiled HTML.

**Run:** `python3 pipeline/extract.py`

---

### 10. `run_edition.sh` — Full-cycle Orchestrator (bash)

**File:** `pipeline/run_edition.sh`
**Role:** Headless shell alternative to `/noticias` — runs the complete update cycle non-interactively (except for the mandatory editorial pause).

**Usage:**
```bash
# Full update with new prices:
bash pipeline/run_edition.sh pipeline/input/precios_junio_2026.csv

# News only (skip price update):
bash pipeline/run_edition.sh --only-news
```

**Steps:** parse_prices → fetch_news → triage_ollama → [HUMAN PAUSE] → polish_claude → build

---

## Data flow

```
RSS feeds
    │
    ▼
fetch_news.py ──→ pipeline/work/candidates.json
    │
    ▼
triage_ollama.py (or triage_claude.py)
    │
    ▼
~/Documents/.../Noticias/_cola/*.md   ← HUMAN reviews here in Obsidian
    │  (publicar: false → true)
    ▼
polish_claude.sh ──→ src/data/news.js + pipeline/work/approved.json
    │
    ▼
parse_prices.py ──→ src/data/distritos.js   (optional, monthly)
    │
    ▼
build.py ──→ Radar Inmobiliario Madrid.html   (monolithic bundle)
    │
    ▼
distribute.py ──→ dist/   (static site for Vercel/Netlify)
    │
    ▼
git push ──→ Vercel auto-deploys
```

---

## Key paths

| Path | Purpose |
|------|---------|
| `src/components/home-variation-d.js` | Main React home component |
| `src/components/noticias-n2.js` | News cards component |
| `src/components/noticia-detalle.js` | Article detail page |
| `src/data/news.js` | Current edition news data |
| `src/data/distritos.js` | District price + rental data |
| `pipeline/work/candidates.json` | Raw RSS fetch results |
| `pipeline/work/approved.json` | Articles that passed editorial review |
| `dist/` | Static deploy output |

---

## Rules for agents editing this repo

1. **Never edit `Radar Inmobiliario Madrid.html` directly.** Edit files under `src/`, then run `build.py`.
2. **New Tailwind classes won't work.** The Tailwind bundle is pre-compiled. Use inline styles for any CSS property not already in the bundle.
3. **After editing `src/data/news.js` or `src/data/distritos.js`, always run `build.py`** and copy the output: `cp "Radar Inmobiliario Madrid.html" dist/index.html`.
4. **`distribute.py` uses `re.findall`** (not `re.search`) to extract all style blocks — do not regress this.
5. Commit messages follow the pattern: `tipo: descripción breve` (e.g. `noticias: edición 30 Jun 2026`, `fix: canonical URL`, `seo: schema markup`).
