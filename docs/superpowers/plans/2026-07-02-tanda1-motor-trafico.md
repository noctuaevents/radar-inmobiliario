# Tanda 1 — Motor de tráfico · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar Babel Standalone de producción, reparar la captura de emails (nativa Vercel), hacer honesto el nav, hacer visible la prosa estática, instalar medición y podar los restos Netlify/AdSense/huérfanos.

**Architecture:** El monolito y `src/` siguen siendo la fuente editable con Babel runtime (dev). Solo cambia lo que emite `pipeline/distribute.py` hacia `dist/`: bundle JSX precompilado con fallback, fallback estático visible dentro de `#root`, snippet de analytics. La captura vive en una función serverless `api/subscribe.js` que escribe en Vercel Blob.

**Tech Stack:** Python 3 (pipeline), Node + @babel/cli + @babel/preset-react (compilación, instalación local en `pipeline/`), Vercel Serverless Functions + @vercel/blob (captura), React/JSX vía bundle.

**Spec:** `docs/superpowers/specs/2026-07-02-sprint-trafico-monetizacion-design.md`

## Global Constraints

- **NUNCA editar `Radar Inmobiliario Madrid.html` directamente** — editar `src/`, luego `python3 pipeline/build.py`.
- **Cero clases Tailwind nuevas** (bundle precompilado): estilos nuevos = inline styles o clases ya existentes.
- **`distribute.py` usa `re.findall` para los bloques `<style>`** — no regresionar.
- Tras tocar `src/` o `distribute.py`: `python3 pipeline/build.py && python3 pipeline/distribute.py`.
- Commits: `tipo: descripción breve` en español + trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **La edición autónoma corre a las 07:30 y 14:00** y hace push a `main`: no dejar el working tree sucio entre sesiones; `git pull --rebase` antes de cada push.
- Los tests del pipeline son scripts sueltos: `python3 pipeline/tests/test_X.py` (asserts planos, exit 0 = verde). El canario global: `for t in pipeline/tests/test_*.py; do python3 "$t" || break; done`.
- Las carpetas huérfanas de `dist/noticia/` son archivo histórico: **no tocarlas ni borrar los assets que referencian** (incluye `babel.min.js` y futuros `app.<hash>.js` viejos).
- Los números de línea citados son orientativos (el fichero puede haberse movido); ancla siempre por el contenido citado.

---

### Task 1: Higiene del working tree (Jarvis + CLAUDE.md + .gitignore)

El working tree ya contiene la retirada de Jarvis sin commitear (nav y router en
`src/template.html`, `src/manifest.map.json`, monolito y `dist/` reconstruidos).
Se commitea tal cual y se dejan las herramientas locales fuera de git.

**Files:**
- Modify: `.gitignore` (crear si no existe)
- Commit: cambios pendientes de `src/template.html`, `src/manifest.map.json`, `Radar Inmobiliario Madrid.html`, `dist/`, más `CLAUDE.md`

**Interfaces:**
- Produces: working tree limpio sobre el que trabajan las Tasks 2–10.

- [ ] **Step 1: Confirmar que lo pendiente es solo la retirada de Jarvis + rebuild**

Run: `git diff --stat src/ | tail -3 && git diff src/template.html | head -40`
Expected: solo desaparecen la línea `<script ... src="0f46302f-...">`, el `link('jarvis', ...)` y el caso `r === '/jarvis'`.
Si aparece CUALQUIER otro cambio de src/, parar y revisar antes de commitear.

- [ ] **Step 2: Ignorar herramientas locales**

Añadir a `.gitignore` (crear con este contenido si no existe):

```gitignore
pipeline/jarvis_server.py
pipeline/jarvis_static/
pipeline/generate_distribution_pack.py
node_modules/
pipeline/node_modules/
pipeline/work/jsx_cache/
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore CLAUDE.md src/template.html src/manifest.map.json "Radar Inmobiliario Madrid.html" dist/
git commit -m "chore: retira la consola Jarvis del nav y el router; documenta agentes en CLAUDE.md

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Run: `git status --short` — Expected: solo `?? GEMINI.md` (se deja: fichero del usuario) y nada más.

---

### Task 2: Poda — Netlify, AdSense, huérfanos y CSP

**Files:**
- Delete: `netlify.toml`, `netlify/` (dir completo), `index.html` (raíz, duplicado de 1,8 MB del 29 Jun), `carpeta sin título/`
- Modify: `src/template.html` (bloque AdSense del head), `pipeline/distribute.py` (extracción AdSense), `vercel.json` (CSP)

**Interfaces:**
- Produces: `vercel.json` con CSP sin hosts de ads; template sin AdSense. Task 4 elimina el resto de Netlify (form + inyección).

- [ ] **Step 1: Verificar que el index.html raíz es huérfano**

Run: `grep -c "vercel\|netlify" vercel.json netlify.toml 2>/dev/null; git log --oneline -1 -- index.html`
Confirmar que `vercel.json` tiene `"outputDirectory": "dist"` (nada sirve el `index.html` raíz) y que su último commit es viejo.

- [ ] **Step 2: Borrar los muertos**

```bash
git rm netlify.toml index.html
git rm -r netlify
rmdir "carpeta sin título" 2>/dev/null || rm -ri "carpeta sin título"
```

(Si `carpeta sin título` tiene contenido, listar y consultar antes de borrar.)

- [ ] **Step 3: Quitar AdSense del template**

En `src/template.html`, localizar el bloque comentado `<!-- Google AdSense -->` con el
script de `pagead2.googlesyndication.com` dentro del `<head>` y eliminarlo entero.
(Si no existe en template.html, buscarlo con `grep -n googlesyndication src/template.html` — si
solo vive en el monolito heredado, no hay nada que quitar aquí.)

- [ ] **Step 4: Quitar la extracción AdSense de distribute.py**

En `pipeline/distribute.py` `main()`, eliminar el bloque completo:

```python
    # Extract AdSense script from head — inject before </body> to unblock render
    adsense_m = re.search(
        r'\s*<!-- Google AdSense -->\s*<script[\s\S]*?googlesyndication[\s\S]*?</script>',
        head_clean
    )
    adsense_tag = adsense_m.group(0).strip() if adsense_m else ""
    if adsense_m:
        head_clean = head_clean[:adsense_m.start()] + head_clean[adsense_m.end():]
```

y más abajo `adsense_body = f"\n  {adsense_tag}" if adsense_tag else ""` — sustituir por nada
y quitar `{adsense_body}` del f-string de `index_html` (queda `{component_scripts_html}`).

- [ ] **Step 5: Limpiar el CSP en vercel.json**

Sustituir el valor de `Content-Security-Policy` por:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self'; frame-src 'none';
```

- [ ] **Step 6: Rebuild y verificación**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Run: `grep -c "googlesyndication\|netlify" dist/index.html` — Expected: `0`
(Nota: `inject_waitlist_form()` aún existe hasta la Task 4; si el grep da 1 por el form
`data-netlify`, es esperado — el objetivo aquí es que AdSense haya desaparecido:
`grep -c googlesyndication dist/index.html` debe dar 0.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: poda Netlify legacy, AdSense sin cuenta, index.html huérfano y CSP de ads

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Función de captura `api/subscribe.js` + dependencia Blob

**Files:**
- Create: `api/subscribe.js`, `package.json` (raíz), `pipeline/list_signups.mjs`

**Interfaces:**
- Produces: contrato HTTP `POST /api/subscribe` con body JSON
  `{email: string, list: 'newsletter'|'pro-waitlist', website: ''}` → `200 {ok:true}` |
  `400 {ok:false,error:'invalid'}` | `405` | `503 {ok:false,error:'storage'}`.
  El campo `website` es honeypot: si llega relleno se responde `200 {ok:true}` sin guardar.
- Consumes: `BLOB_READ_WRITE_TOKEN` (lo inyecta Vercel al conectar un Blob store — acción del usuario).

- [ ] **Step 1: package.json raíz**

```json
{
  "name": "radar-inmobiliario",
  "private": true,
  "dependencies": {
    "@vercel/blob": "^1.0.0"
  }
}
```

(No añadir scripts de build: `vercel.json` ya fija `"buildCommand": null` y
`"outputDirectory": "dist"`; el package.json existe solo para que Vercel resuelva la
dependencia de la función.)

- [ ] **Step 2: api/subscribe.js**

```js
// POST /api/subscribe — captura de emails (newsletter y waitlist Pro) en Vercel Blob.
// Contrato: {email, list: 'newsletter'|'pro-waitlist', website: ''(honeypot)} → {ok}
const { put } = require('@vercel/blob');

const LISTS = new Set(['newsletter', 'pro-waitlist']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const list = String(body.list || '');
  const honeypot = String(body.website || '');
  if (honeypot) { res.status(200).json({ ok: true }); return; }
  if (!EMAIL_RE.test(email) || email.length > 254 || !LISTS.has(list)) {
    res.status(400).json({ ok: false, error: 'invalid' });
    return;
  }
  try {
    const ts = new Date().toISOString();
    const key = ts.replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 10);
    await put(
      `signups/${list}/${key}.json`,
      JSON.stringify({ email, list, ts, ua: req.headers['user-agent'] || '' }),
      { access: 'public', contentType: 'application/json', addRandomSuffix: false }
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err && err.message);
    res.status(503).json({ ok: false, error: 'storage' });
  }
};
```

Nota de privacidad asumida en el spec: los blobs son `access: 'public'` (única opción del
SDK), pero el hostname del store es un id aleatorio no adivinable. Aceptado para esta fase.

- [ ] **Step 3: Exportador local de altas**

`pipeline/list_signups.mjs`:

```js
// Exporta las altas capturadas en Vercel Blob a CSV por stdout.
// Uso: BLOB_READ_WRITE_TOKEN=vercel_blob_… node pipeline/list_signups.mjs > signups.csv
import { list } from '@vercel/blob';

const rows = ['ts,list,email'];
let cursor;
do {
  const page = await list({ prefix: 'signups/', cursor, limit: 1000 });
  for (const b of page.blobs) {
    const data = await (await fetch(b.url)).json();
    rows.push(`${data.ts},${data.list},${data.email}`);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
console.log(rows.join('\n'));
```

- [ ] **Step 4: Smoke test local de la validación (sin red)**

Run:
```bash
node -e "
const fn = require('./api/subscribe.js');
function mockRes(){const r={code:0,body:null,status(c){r.code=c;return r;},json(b){r.body=b;return r;}};return r;}
(async()=>{
  let r=mockRes(); await fn({method:'GET',headers:{}},r); console.assert(r.code===405,'405');
  r=mockRes(); await fn({method:'POST',headers:{},body:{email:'no-es-email',list:'newsletter',website:''}},r); console.assert(r.code===400,'400 email');
  r=mockRes(); await fn({method:'POST',headers:{},body:{email:'a@b.es',list:'otra',website:''}},r); console.assert(r.code===400,'400 lista');
  r=mockRes(); await fn({method:'POST',headers:{},body:{email:'a@b.es',list:'newsletter',website:'spam'}},r); console.assert(r.code===200&&r.body.ok,'honeypot 200');
  r=mockRes(); await fn({method:'POST',headers:{},body:{email:'a@b.es',list:'newsletter',website:''}},r); console.assert(r.code===503,'503 sin token');
  console.log('subscribe.js: validación OK');
})();"
```
Expected: `subscribe.js: validación OK` (el caso final da 503 porque no hay token local — correcto).
Requiere `npm install` previo en la raíz (crea `node_modules/`, ya ignorado en Task 1).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json api/subscribe.js pipeline/list_signups.mjs
git commit -m "feat: captura de emails nativa Vercel (función subscribe + Blob + exportador)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Recablear los formularios al nuevo endpoint + RGPD

**Files:**
- Modify: `src/components/home-variation-d.js` (newsletter, línea ~27 y ~350-380)
- Modify: `src/template.html` (form estático ~573; PricingPage `handleWaitlistSubmit` ~672-687)
- Modify: `src/components/noticia-detalle.js` (`LegalPage`, línea ~1176)
- Modify: `pipeline/distribute.py` (`inject_waitlist_form`, línea ~1173 y su llamada en `main()`)

**Interfaces:**
- Consumes: contrato `POST /api/subscribe` de la Task 3.

- [ ] **Step 1: Newsletter de la home**

En `src/components/home-variation-d.js` sustituir:

```js
  const BEEHIIV_URL = '/.netlify/functions/subscribe';
```
por:
```js
  const SUBSCRIBE_URL = '/api/subscribe';
```

y en `handleNlSubmit` sustituir el cuerpo desde `if (!BEEHIIV_URL) {` hasta el `.catch` por:

```js
    setNlStatus('loading');
    fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nlEmail.trim(), list: 'newsletter', website: '' }),
    })
      .then((r) => { setNlStatus(r.ok ? 'ok' : 'error'); })
      .catch(() => { setNlStatus('error'); });
```

(desaparece la rama `window.open('https://beehiiv.com', …)`).

- [ ] **Step 2: RGPD bajo el input de newsletter**

Justo debajo del botón "Suscribirme" (dentro del mismo contenedor del form, ~línea 375), añadir:

```jsx
<p className="text-[11px] text-slate-400 mt-2">
  Solo para enviarte el radar. Baja en un click.{' '}
  <span className="underline cursor-pointer" onClick={() => window.navTo && window.navTo('/legal')}>
    Política de privacidad
  </span>
</p>
```

- [ ] **Step 3: Waitlist de /pro en template.html**

1. Eliminar el form estático de Netlify (las 3 líneas):

```html
  <!-- Netlify Forms detection: static form so Netlify's build-time HTML parser registers it. -->
  <form name="pro-waitlist" data-netlify="true" netlify hidden>
    <input type="email" name="email" />
  </form>
```

2. En `PricingPage`, borrar la función `encodeForm(data) {…}` completa y sustituir el
   `fetch('/', {…})` de `handleWaitlistSubmit` por:

```js
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: waitlistEmail.trim(), list: 'pro-waitlist', website: '' }),
        })
          .then((r) => { setWaitlistStatus(r.ok ? 'ok' : 'error'); })
          .catch(() => { setWaitlistStatus('error'); });
```

3. Añadir el mismo `<p>` de RGPD del Step 2 bajo el input del waitlist (buscar
   `id="waitlist-form"` para localizar el bloque).

- [ ] **Step 4: Quitar la inyección Netlify de distribute.py**

Borrar la función `inject_waitlist_form()` entera y su llamada en `main()`
(línea `inject_waitlist_form()` tras `update_sitemap_core()`).

- [ ] **Step 5: Párrafo de emails en LegalPage**

En `src/components/noticia-detalle.js` → `function LegalPage()`, añadir al final del
contenido existente (imitar el estilo de los párrafos vecinos):

```jsx
<h2 className="text-lg font-semibold text-slate-900 mt-8 mb-2">Emails y newsletter</h2>
<p className="text-sm text-slate-600 leading-relaxed">
  Si te suscribes a la newsletter o a la lista de espera de Radar Pro guardamos únicamente
  tu dirección de email y la fecha de alta, con la única finalidad de enviarte el contenido
  solicitado. No cedemos tu email a terceros. Puedes darte de baja o pedir la eliminación
  de tus datos respondiendo a cualquier email o escribiendo a la dirección de contacto.
</p>
```

- [ ] **Step 6: Rebuild + verificación**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Run: `grep -c "netlify" dist/index.html "Radar Inmobiliario Madrid.html"` — Expected: `0` en ambos.
Run: `grep -c "/api/subscribe" dist/index.html` — Expected: `≥ 2` (newsletter + waitlist).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: newsletter y waitlist Pro apuntan a /api/subscribe + microcopy RGPD

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Nav honesto (Comparar real, Rankings fuera, Newsletter funcional)

**Files:**
- Modify: `src/template.html` (`SiteNav`, ~líneas 645-653)
- Modify: `src/components/home-variation-d.js` (header propio de la home ~líneas 60-65; sección newsletter ~línea 350)

**Interfaces:**
- Produces: ancla `id="newsletter"` en la sección de suscripción de la home (la reutilizará la Tanda 3).

- [ ] **Step 1: SiteNav en template.html**

Sustituir las tres líneas:

```jsx
<span className="text-slate-600 hover:text-emerald-700 cursor-pointer" onClick={() => window.showProModal("Comparador de distritos")}>Comparar</span>
<span className="text-slate-600 hover:text-emerald-700 cursor-pointer" onClick={() => window.showProModal("Rankings de barrios")}>Rankings</span>
<span className="bg-emerald-600 text-white px-3 py-1.5 rounded-md cursor-pointer hover:bg-emerald-500">Newsletter</span>
```

por:

```jsx
<span className="text-slate-600 hover:text-emerald-700 cursor-pointer" onClick={() => window.navTo('/herramientas/comparador')}>Comparar</span>
<span
  className="bg-emerald-600 text-white px-3 py-1.5 rounded-md cursor-pointer hover:bg-emerald-500"
  onClick={() => {
    window.navTo('/');
    setTimeout(() => {
      const el = document.getElementById('newsletter');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }}
>Newsletter</span>
```

("Rankings" desaparece; vuelve en la Tanda 3 con página real.)

- [ ] **Step 2: Header propio de la home**

En `home-variation-d.js`, el span `Newsletter` del header interno (~línea 64) recibe:

```jsx
onClick={() => {
  const el = document.getElementById('newsletter');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}}
```

- [ ] **Step 3: Ancla en la sección de suscripción**

Localizar el contenedor de la sección del formulario de newsletter (el bloque que envuelve
el input `value={nlEmail}`, ~línea 350) y añadirle `id="newsletter"` al elemento de sección
más externo de ese bloque.

- [ ] **Step 4: Rebuild + verificación manual**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Abrir `Radar Inmobiliario Madrid.html` en el navegador: click en "Comparar" → página del
comparador (gate Pro visible); no existe "Rankings"; "Newsletter" desde /noticias lleva a
la home y hace scroll al formulario.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: nav honesto — Comparar a su página real, Rankings fuera, Newsletter con destino

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Fallback estático VISIBLE en artículos y home

Hoy el contenido estático se inyecta en divs off-screen (`left:-9999px` + `aria-hidden`):
patrón de hidden text. Pasa a renderizarse visible dentro de `#root` (React lo sustituye al montar).

**Files:**
- Modify: `pipeline/distribute.py` — assembly de `index_html` (paso 10), `gen_article_pages()`, `gen_home_static()`, nueva `finalize_static_fallbacks()`
- Test: `pipeline/tests/test_static_fallback.py`

**Interfaces:**
- Produces: constante `STATIC_FALLBACK_MARKER = '<!--STATIC_FALLBACK-->'`, helpers
  `_set_root_fallback(page_html: str, inner_html: str) -> str` y
  `_article_static_html(art: dict) -> str` en `distribute.py`.
- Los bloques ocultos existentes de `gen_district_pages`/`gen_section_pages` (vía
  `_inject_hidden_block`) NO se tocan en esta tanda (Tanda 3).

- [ ] **Step 1: Test que falla**

`pipeline/tests/test_static_fallback.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import distribute  # noqa: E402

FIX = '<body class="bg-stone-100">\n  <div id="root"><!--STATIC_FALLBACK--></div>\n</body>'

def test_marker_replacement():
    out = distribute._set_root_fallback(FIX, '<h1>Hola</h1>')
    assert '<!--STATIC_FALLBACK-->' not in out
    assert '<div id="root"><h1>Hola</h1></div>' in out

def test_article_static_visible():
    art = {
        "slug": "prueba-slug", "titulo": "Titular <de> prueba",
        "resumen": "Resumen & corto.", "fechaISO": "2026-07-02",
        "categoria": "Mercado", "fuente": "El País",
        "url": "https://example.com/original",
        "distrito": "Tetuán",
        "body_texts": ["Primer párrafo.", "Segundo párrafo."],
    }
    html = distribute._article_static_html(art)
    assert '-9999px' not in html and 'aria-hidden' not in html
    assert '<h1' in html and 'Titular &lt;de&gt; prueba' in html
    assert 'Primer párrafo.' in html and 'Segundo párrafo.' in html
    assert 'https://example.com/original' in html

test_marker_replacement()
test_article_static_visible()
print("test_static_fallback OK")
```

- [ ] **Step 2: Verificar que falla**

Run: `python3 pipeline/tests/test_static_fallback.py`
Expected: `AttributeError: module 'distribute' has no attribute '_set_root_fallback'`

- [ ] **Step 3: Implementación en distribute.py**

3a. Junto a `_inject_hidden_block`, añadir:

```python
STATIC_FALLBACK_MARKER = '<!--STATIC_FALLBACK-->'

SPINNER_HTML = (
    '<div style="position:fixed;inset:0;display:flex;align-items:center;'
    'justify-content:center;background:#faf6ef;font:14px/1 -apple-system,'
    'BlinkMacSystemFont,sans-serif;color:#9ca3af;">Cargando…</div>'
)


def _set_root_fallback(page_html: str, inner_html: str) -> str:
    """Coloca contenido estático visible dentro de #root (React lo sustituye al montar)."""
    return page_html.replace(STATIC_FALLBACK_MARKER, inner_html, 1)


def _article_static_html(art: dict) -> str:
    """Fallback visible de artículo: legible sin JS, sin texto oculto."""
    import html as _html
    t = _html.escape(art.get('titulo') or '')
    resumen = _html.escape(art.get('resumen') or '')
    fecha = _html.escape(art.get('fechaISO') or '')
    fuente = _html.escape(art.get('fuente') or '')
    url = art.get('url') or ''
    parrafos = ''.join(
        f'<p style="margin:0 0 1em">{_html.escape(p)}</p>'
        for p in art.get('body_texts', [])
    )
    fuente_html = (
        f'<p style="margin:1.5em 0 0;font-size:13px">Fuente original: '
        f'<a href="{_html.escape(url, quote=True)}" rel="noopener">{fuente or "enlace"}</a></p>'
        if url else ''
    )
    return (
        '<div style="max-width:680px;margin:0 auto;padding:48px 20px;'
        'font-family:Georgia,\'Times New Roman\',serif;color:#1c1917;'
        'background:#faf6ef;line-height:1.7">'
        f'<p style="margin:0 0 8px;font-size:12px;color:#9a3412;'
        f'font-family:ui-monospace,monospace;text-transform:uppercase">{fecha}'
        f'{" · " + fuente if fuente else ""}</p>'
        f'<h1 style="margin:0 0 16px;font-size:2rem;line-height:1.15">{t}</h1>'
        f'<p style="margin:0 0 1.5em;font-style:italic;color:#44403c">{resumen}</p>'
        f'{parrafos}'
        f'{fuente_html}'
        f'<p style="margin:2em 0 0;font-size:13px">'
        f'<a href="{BASE_URL}/noticias">← Todas las noticias</a> · '
        f'<a href="{BASE_URL}/">Radar Inmobiliario Madrid</a></p>'
        '</div>'
    )
```

3b. En el assembly del paso 10 de `main()`, el `#root` pasa de:

```python
  <div id="root">
    <div style="position:fixed;...">
      Cargando…
    </div>
  </div>
```
a:
```python
  <div id="root"><!--STATIC_FALLBACK--></div>
```
(escribir literalmente el marcador en el f-string).

3c. En `gen_article_pages()`: eliminar TODO el bloque de inyección oculta (desde
`# Inject article body text as hidden element for crawlers` hasta el segundo
`art_html = art_html.replace('<div id="root">', …)` inclusive) y sustituirlo por:

```python
        art_html = _set_root_fallback(art_html, _article_static_html(art))
```

3d. En `gen_home_static()`: conservar la construcción de `titulo/intro/nav_html/noticias_html`
pero el bloque final pasa a visible:

```python
    home_static = (
        '<div style="max-width:680px;margin:0 auto;padding:48px 20px;'
        'font-family:Georgia,\'Times New Roman\',serif;color:#1c1917;line-height:1.7">'
        f'<h1 style="margin:0 0 12px;font-size:1.7rem;line-height:1.2">{_html.escape(titulo)}</h1>'
        f'<p style="margin:0 0 1.5em;font-style:italic;color:#44403c">{_html.escape(intro)}</p>'
        f'<nav style="margin:0 0 1.5em">{nav_html}</nav>'
        '<h2 style="margin:0 0 8px;font-size:1.1rem">Últimas noticias</h2>'
        f'<ul style="margin:0;padding-left:20px">{noticias_html}</ul>'
        '</div>'
    )
    if STATIC_FALLBACK_MARKER in index_html:
        index_html = _set_root_fallback(index_html, home_static)
        index_path.write_text(index_html, encoding="utf-8")
        print("✓ dist/index.html: fallback estático visible de home")
```

(los `li_items` dejan de necesitar cambios; el patrón `position:absolute;left:-9999px`
desaparece de esta función).

3e. Nueva función + llamada al FINAL de `main()` (última línea):

```python
def finalize_static_fallbacks() -> None:
    """Las páginas generadas que no recibieron fallback propio vuelven al spinner."""
    n = 0
    for p in DIST.rglob("index.html"):
        s = p.read_text(encoding="utf-8")
        if STATIC_FALLBACK_MARKER in s:
            p.write_text(s.replace(STATIC_FALLBACK_MARKER, SPINNER_HTML), encoding="utf-8")
            n += 1
    if n:
        print(f"✓ {n} páginas con spinner por defecto (sin fallback propio)")
```

- [ ] **Step 4: Test verde + regresión**

Run: `python3 pipeline/tests/test_static_fallback.py` — Expected: `test_static_fallback OK`
Run: `for t in pipeline/tests/test_*.py; do python3 "$t" || break; done` — Expected: todos OK.

- [ ] **Step 5: Rebuild + verificación sobre dist real**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Run:
```bash
python3 - <<'EOF'
import re
t = open('dist/noticia/tetuan-bravo-murillo-variacion-precios-junio-2026/index.html').read()
assert 'id="article-body"' not in t and '-9999px' not in t, "queda texto oculto"
root = re.search(r'<div id="root">(.*?)</div>\s*(?:<script|$)', t, re.S).group(1)
words = len(re.sub(r'<[^>]+>', ' ', root).split())
assert words > 250, f"solo {words} palabras visibles"
h = open('dist/index.html').read()
assert 'left:-9999px' not in h, "home aún oculta"
print("fallback visible OK —", words, "palabras en el artículo")
EOF
```
Expected: `fallback visible OK — 3xx palabras…`. Nota: el cierre `</div>` del regex es
aproximado; si falla por anidamiento, comprobar a ojo que el texto está dentro de `#root`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "seo: fallback estático visible en artículos y home (fuera el patrón hidden-text)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Vercel Web Analytics

**Files:**
- Modify: `pipeline/distribute.py` (assembly paso 10)

- [ ] **Step 1: Snippet en el head del assembly**

En el f-string de `index_html`, justo antes de `  <script src="/assets/react.min.js"></script>`:

```html
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>
```

(Todas las páginas estáticas derivan de `index_html`, así que heredan el snippet.
`/_vercel/insights/…` es same-origin: el CSP `script-src 'self'` de la Task 2 lo permite.)

- [ ] **Step 2: Rebuild + verificación + commit**

Run: `python3 pipeline/distribute.py && grep -c "_vercel/insights" dist/index.html dist/noticias/index.html`
Expected: `1` en cada fichero.

```bash
git add -A
git commit -m "feat: snippet de Vercel Web Analytics en todas las páginas de dist

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(El usuario debe activar Web Analytics en el dashboard de Vercel para que registre.)

---

### Task 8: Precompilar el JSX (adiós Babel Standalone en producción)

**Files:**
- Create: `pipeline/package.json`, `pipeline/compile_jsx.py`
- Modify: `pipeline/distribute.py` (pasos 8 y 10 de `main()`), `pipeline/auto_edition.py` (`gate3` + `render_report`)
- Test: `pipeline/tests/test_compile.py`

**Interfaces:**
- Produces: `compile_bundle(named_sources: list[tuple[str, str]]) -> tuple[str|None, str|None]`
  (JS compilado + hash de 12 hex, o `(None, None)` si no hay node/babel o falla la compilación) y
  `pipeline/work/compile_status.json` = `{"mode": "compiled"|"babel-fallback", "detail": str}`.
- Consumes: patrón de PATH de `verify_codex._env_with_cli_paths()` (nvm fuera del PATH de launchd).

- [ ] **Step 1: package.json del pipeline**

`pipeline/package.json`:

```json
{
  "name": "radar-pipeline",
  "private": true,
  "devDependencies": {
    "@babel/cli": "^7.24.0",
    "@babel/core": "^7.24.0",
    "@babel/preset-react": "^7.24.0"
  }
}
```

Run: `cd pipeline && npm install --no-audit --no-fund && cd ..`
Expected: crea `pipeline/node_modules` (ignorado) y `pipeline/package-lock.json` (se commitea).

- [ ] **Step 2: Test que falla**

`pipeline/tests/test_compile.py`:

```python
import os, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import compile_jsx  # noqa: E402

def test_fallback_sin_node():
    old = os.environ.get("PATH", "")
    os.environ["PATH"] = "/nonexistent"
    real_env = compile_jsx._env_with_node
    compile_jsx._env_with_node = lambda: {"PATH": "/nonexistent"}
    try:
        out, h = compile_jsx.compile_bundle([("t", "const A = () => <div/>;")])
        assert out is None and h is None
        assert '"babel-fallback"' in compile_jsx.STATUS_FILE.read_text()
    finally:
        compile_jsx._env_with_node = real_env
        os.environ["PATH"] = old

def test_compila_y_cachea():
    env = compile_jsx._env_with_node()
    if not shutil.which("npx", path=env["PATH"]):
        print("  (npx no disponible — test de compilación saltado)")
        return
    src = [("demo", "const Demo = () => <div className='x'>hola</div>;")]
    out, h = compile_jsx.compile_bundle(src)
    assert out and "React.createElement" in out, out
    assert (compile_jsx.CACHE_DIR / f"{h}.js").exists()
    out2, h2 = compile_jsx.compile_bundle(src)   # segunda vez: cache
    assert h2 == h and out2 == out
    assert '"compiled"' in compile_jsx.STATUS_FILE.read_text()

test_fallback_sin_node()
test_compila_y_cachea()
print("test_compile OK")
```

Run: `python3 pipeline/tests/test_compile.py`
Expected: FAIL con `ModuleNotFoundError: No module named 'compile_jsx'`

- [ ] **Step 3: pipeline/compile_jsx.py**

```python
"""Compila los scripts JSX del bundle a JS plano (Babel preset-react).

Contrato: compile_bundle(named_sources) -> (js_compilado, hash12) | (None, None).
Todo fallo degrada a (None, None) + compile_status.json {"mode": "babel-fallback"}:
el llamador (distribute.py) sirve entonces la variante Babel runtime de siempre.
"""
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

PIPE = Path(__file__).resolve().parent
WORK = PIPE / "work"
CACHE_DIR = WORK / "jsx_cache"
STATUS_FILE = WORK / "compile_status.json"
BABEL_TIMEOUT = 120


def _env_with_node():
    # Mismo patrón que verify_codex._env_with_cli_paths: launchd no ve nvm.
    env = dict(os.environ)
    extras = ["/opt/homebrew/bin", "/usr/local/bin", f"{Path.home()}/.local/bin"]
    nvm_bins = sorted(
        (Path.home() / ".nvm" / "versions" / "node").glob("*/bin"),
        key=lambda p: p.parent.name, reverse=True,
    )
    extras += [str(p) for p in nvm_bins]
    env["PATH"] = ":".join(extras) + ":" + env.get("PATH", "")
    return env


def _write_status(mode: str, detail: str = "") -> None:
    WORK.mkdir(exist_ok=True)
    STATUS_FILE.write_text(
        json.dumps({"mode": mode, "detail": detail}, ensure_ascii=False),
        encoding="utf-8",
    )


def compile_bundle(named_sources):
    concat = "\n".join(f"// {n}\n{s}" for n, s in named_sources)
    h = hashlib.sha256(concat.encode("utf-8")).hexdigest()[:12]
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = CACHE_DIR / f"{h}.js"
    if cached.exists():
        _write_status("compiled", f"cache {h}")
        return cached.read_text(encoding="utf-8"), h

    env = _env_with_node()
    npx = shutil.which("npx", path=env["PATH"])
    if not npx or not (PIPE / "node_modules" / "@babel" / "cli").exists():
        _write_status("babel-fallback", "npx o pipeline/node_modules ausentes")
        return None, None

    pieces = []
    with tempfile.TemporaryDirectory() as td:
        for name, src in named_sources:
            f = Path(td) / f"{name}.jsx"
            f.write_text(src, encoding="utf-8")
            try:
                r = subprocess.run(
                    [npx, "babel", "--presets", "@babel/preset-react",
                     "--compact", "true", str(f)],
                    cwd=PIPE, env=env, capture_output=True, text=True,
                    timeout=BABEL_TIMEOUT,
                )
            except (subprocess.TimeoutExpired, OSError) as e:
                _write_status("babel-fallback", f"{name}: {e}")
                return None, None
            if r.returncode != 0:
                _write_status("babel-fallback", f"{name}: {r.stderr[-400:]}")
                return None, None
            pieces.append(f"// ── {name} ──\n{r.stdout}")

    compiled = "\n".join(pieces)
    cached.write_text(compiled, encoding="utf-8")
    _write_status("compiled", h)
    return compiled, h
```

- [ ] **Step 4: Tests verdes**

Run: `python3 pipeline/tests/test_compile.py` — Expected: `test_compile OK`

- [ ] **Step 5: Integración en distribute.py**

5a. Import junto a los demás: `from compile_jsx import compile_bundle` (distribute.py se
ejecuta como script desde la raíz; `auto_edition.py` ya hace `from distribute import …`,
así que el import plano funciona con `sys.path` del propio directorio pipeline; si
distribute.py no añade su directorio a sys.path, usar el mismo mecanismo que ya usa
auto_edition.py línea 18).

5b. En el paso 8 de `main()`, además de construir `component_scripts_html`, acumular
las fuentes:

```python
    named_sources = []
    for sm in re.finditer(r'<script\b[^>]*type="text/babel"[^>]*src="([0-9a-f-]{36})"[^>]*/?>(?:</script>)?', template_body):
        uuid = sm.group(1)
        if uuid in assets and assets[uuid]["role"] == "component":
            named_sources.append((uuid, assets[uuid]["content"].decode("utf-8")))
    if router_m:
        named_sources.append(("router", router_m.group(1)))
```

(el bucle existente de `component_scripts_html` se conserva como rama de fallback; nótese
que para `named_sources` se usa el contenido SIN `escape_script` — eso solo aplica a inline).

5c. Tras construir ambos:

```python
    compiled_js, bundle_hash = compile_bundle(named_sources)
    if compiled_js is not None:
        bundle_file = DIST / "assets" / f"app.{bundle_hash}.js"
        bundle_file.write_text(compiled_js, encoding="utf-8")
        component_scripts_html = f'\n<script defer src="/assets/app.{bundle_hash}.js"></script>'
        babel_script_tag = ""
        print(f"✓ JSX precompilado → assets/app.{bundle_hash}.js ({len(compiled_js)//1024} KB)")
    else:
        babel_script_tag = '\n  <script src="/assets/babel.min.js"></script>'
        print("⚠ compilación JSX no disponible — se sirve Babel runtime (ver compile_status.json)")
```

5d. En el f-string del assembly, la línea `  <script src="/assets/babel.min.js"></script>`
se sustituye por `{babel_script_tag}`.

Importante: `babel.min.js` se sigue ESCRIBIENDO en dist/assets pase lo que pase (las
páginas huérfanas del archivo histórico lo referencian), y los `app.<hash>.js` viejos
no se borran nunca por la misma razón.

- [ ] **Step 6: Informe de la edición autónoma**

En `pipeline/auto_edition.py`:

6a. En `gate3()`, tras `sh([sys.executable, "pipeline/distribute.py"])`:

```python
    status = ROOT / "pipeline" / "work" / "compile_status.json"
    if status.exists():
        report["compile"] = json.loads(status.read_text(encoding="utf-8")).get("mode", "?")
```

(comprobar que `json` y `ROOT` ya están importados/definidos en el módulo; si `ROOT` no
existe, usar la constante equivalente que ya use el fichero para rutas).

6b. En `render_report()`, en la línea final de metadatos, añadir el modo:

```python
    L += ["", "---", f"Commit: {meta[0]} · Deploy: {meta[1]} · IndexNow: {meta[2]} · "
          f"Compilado: {report.get('compile', '?')} · "
          f"Duración: {report.get('duracion_min', '?')} min"]
```

6c. Revisar `publish()` — confirmar que el `git add` que hace cubre `dist/assets/`
(añade `dist/` completo o similar). Si añade rutas selectivas, incluir `dist/assets`.

- [ ] **Step 7: Rebuild + verificación completa**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Run:
```bash
grep -c "babel.min.js" dist/index.html                       # Expected: 0
grep -c 'app\.[0-9a-f]*\.js' dist/index.html                 # Expected: 1
ls dist/assets/app.*.js && ls dist/assets/babel.min.js       # ambos existen
grep -c "babel.min.js" dist/noticia/tetuan-bravo-murillo-variacion-precios-junio-2026/index.html  # Expected: 0 (regenerada)
```
Verificación de humo en navegador: `cd dist && python3 -m http.server 8899` →
abrir `http://localhost:8899/`, `http://localhost:8899/distritos/salamanca/`,
`http://localhost:8899/noticias/` y un artículo. Todo debe renderizar igual que antes
(sin errores en consola). Parar el server.

Run: `for t in pipeline/tests/test_*.py; do python3 "$t" || break; done` — todos OK.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "perf: JSX precompilado en build — Babel Standalone fuera de producción (con fallback)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Carga diferida del GeoJSON (364 KB)

**Files:**
- Modify: `src/components/cartogram.js` (~líneas 205-300), `pipeline/distribute.py` (paso 9)

**Interfaces:**
- Consumes: `buildMadridGeoCache()` ya devuelve `null` si `window.MADRID_GEOJSON` no existe.
- En el monolito (dev) el geojson sigue cargándose como script normal — el hook no-opea.

- [ ] **Step 1: Hook de carga en cartogram.js**

Encima del componente que llama a `buildMadridGeoCache()` (~línea 295), añadir:

```js
function useMadridGeo() {
  const [ready, setReady] = React.useState(!!window.MADRID_GEOJSON);
  React.useEffect(() => {
    if (window.MADRID_GEOJSON) return;
    if (!window.__geoLoading) {
      window.__geoLoading = new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = '/assets/geojson.js';
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
      });
    }
    let alive = true;
    window.__geoLoading.then(() => { if (alive) setReady(!!window.MADRID_GEOJSON); });
    return () => { alive = false; };
  }, []);
  return ready;
}
```

Y en el componente, ANTES de `const cache = buildMadridGeoCache();`:

```js
  const geoReady = useMadridGeo();
```

cambiando la línea a:

```js
  const cache = geoReady ? buildMadridGeoCache() : null;
```

Localizar qué renderiza hoy el componente cuando `cache` es null (rama existente); si no
hay rama, añadir tras el cálculo:

```js
  if (!cache) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Cargando mapa…
      </div>
    );
  }
```

(ajustar el contenedor a lo que el JSX circundante espere — mirar el return actual).
Si hay más de un componente en el fichero que llame a `buildMadridGeoCache()`, aplicar
el mismo patrón en cada uno.

- [ ] **Step 2: No emitir el script en dist**

En `distribute.py` paso 9, excluir el geojson de los tags de body:

```python
    uuid_to_url = {u: a["url"] for u, a in assets.items()
                   if a["url"] and a["role"] not in ("component", "react_dev", "rdom_dev", "geojson")}
```

(el asset `dist/assets/geojson.js` se sigue escribiendo — lo carga el hook bajo demanda).

- [ ] **Step 3: Rebuild + verificación**

Run: `python3 pipeline/build.py && python3 pipeline/distribute.py`
Run: `grep -c "assets/geojson.js" dist/index.html` — Expected: `0`
Humo en navegador (server local como en Task 8): la home muestra "Cargando mapa…" un
instante y el cartograma aparece; en la pestaña Network, `geojson.js` se pide DESPUÉS
del bundle; un artículo no pide `geojson.js` en absoluto.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: geojson bajo demanda — las páginas sin mapa se ahorran 364 KB

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Verificación final, deploy y checklist de usuario

**Files:** ninguno nuevo — verificación, push y prueba E2E en Vercel.

- [ ] **Step 1: Suite completa + rebuild limpio**

```bash
for t in pipeline/tests/test_*.py; do python3 "$t" || break; done
python3 pipeline/build.py && python3 pipeline/distribute.py
git status --short   # solo cambios esperados de dist/ si los hay; commitear residuos
```

- [ ] **Step 2: Push**

```bash
git pull --rebase && git push
```

(Vercel despliega `main` a producción automáticamente.)

- [ ] **Step 3: E2E de captura en producción**

Precondición (usuario): Blob store creado y conectado al proyecto en el dashboard Vercel.

```bash
curl -s -X POST https://www.radarinmobiliario.com/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"prueba-tanda1@radarinmobiliario.com","list":"newsletter","website":""}'
```
Expected: `{"ok":true}` — y el blob visible en el dashboard (Storage → Blob → signups/newsletter/).
Si devuelve `{"ok":false,"error":"storage"}`: el Blob store no está conectado aún — es la
acción de usuario pendiente, no un bug.

- [ ] **Step 4: Verificación de producción**

```bash
curl -s https://www.radarinmobiliario.com/ | grep -c "babel.min.js"        # 0
curl -s https://www.radarinmobiliario.com/ | grep -c "_vercel/insights"    # 1
curl -s https://www.radarinmobiliario.com/noticia/tetuan-bravo-murillo-variacion-precios-junio-2026/ | grep -c '\-9999px'  # 0
python3 pipeline/indexnow_submit.py   # re-avisar a buscadores
```
PageSpeed móvil (https://pagespeed.web.dev) sobre la home: objetivo > 80 (antes ~42).

- [ ] **Step 5: Recordar al usuario sus 4 acciones**

1. Vercel dashboard → Storage → crear Blob store y conectarlo al proyecto.
2. Vercel dashboard → Analytics → Enable Web Analytics.
3. Google Publisher Center → dar de alta la publicación (News/Discover).
4. Crear perfiles X/LinkedIn (los URLs alimentan `sameAs` en la Tanda 3).

- [ ] **Step 6: Canario del día siguiente**

Tras la siguiente edición autónoma (07:30), revisar el informe en
`~/Documents/Radar Inmobiliario/Contenido/Ediciones/` — debe decir `Compilado: compiled`
y el deploy verificado. Si dice `babel-fallback`, revisar `pipeline/work/compile_status.json`.
