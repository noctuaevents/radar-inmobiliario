# Rediseño "piel de prensa" de noticias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-vestir la sección de noticias (portada `/noticias`, artículo `/noticia/[slug]`, nav en esas rutas, teaser de home) con una identidad de prensa económica (papel crema, serifa, filetes, acento teja), sin tocar rutas, datos, pipeline ni el resto de la web.

**Architecture:** Cambios puramente de presentación en 4 archivos de `src/`. Un objeto de tokens `window.PRENSA` centraliza los colores/fuentes; todo color y tipografía especial va por inline styles (el CSS de Tailwind está precompilado y no incluye clases nuevas — ver Global Constraints). La estructura de datos y la lógica de cada componente (filtros, slicing, lookups) no cambian.

**Tech Stack:** React 18 (UMD) + Babel standalone (in-browser JSX), Tailwind CSS v3.4.17 precompilado, bundle único vía `pipeline/build.py`.

## Global Constraints

- **No hay build step de Tailwind.** El CSS ya compilado en `src/template.html` solo contiene las clases que alguna vez se usaron en el repo. Cualquier clase Tailwind (incluida cualquier arbitrary value `text-[...]`, `tracking-[...]`, `border-b-2`, `italic`, colores `stone-700`, etc.) que **no** esté ya en ese CSS **no funcionará** — se renderiza sin estilo, en silencio, sin error. Verificado por auditoría directa del CSS compilado (ver tabla de clases seguras más abajo). **Regla:** todo color hexadecimal nuevo, todo `font-style: italic`, y todo tamaño de fuente que no esté en la lista verificada va por **inline style**, nunca por className nueva.
- **Clases Tailwind verificadas como seguras para reusar** (ya compiladas, confirmado por grep en `src/template.html`): layout — `flex flex-col flex-wrap grid grid-cols-2/3/4/7/12 col-span-4/5/7/8/12 items-center items-baseline items-end justify-between justify-center gap-1.5/2/2.5/3/4/5/6/8/10/12 max-w-6xl mx-auto px-8 relative absolute overflow-hidden cursor-pointer block inline-block`; texto — `font-serif font-mono font-sans font-bold font-semibold uppercase tabular-nums leading-snug leading-relaxed leading-tight tracking-wider tracking-[0.12em]/[0.15em]/[0.18em]/[0.2em]/[0.22em]/[0.28em]/[0.3em]/[0.32em]`; tamaños arbitrarios — `text-[9px] text-[10px] text-[11px] text-[12px] text-[13px] text-[13.5px] text-[14px] text-[15px] text-[15.5px] text-[16px] text-[17px] text-[1.4rem] text-[1.55rem] text-[1.8rem] text-[2.6rem] text-[3.4rem]`; color de cifras (semáforo, se conserva) — `text-emerald-700 text-rose-700`; `hover:underline`. **NO están compiladas y no se deben usar:** `italic`, `border-dotted`, `border-b-2`, `text-[16.5px]`, `text-[2.2rem]`, cualquier `stone-600/700/800/900`, cualquier clase con un valor no listado arriba, `group-hover:underline`.
- **`window.PRENSA`** se define una vez en `src/components/noticias-n2.js` (tokens de color y familias tipográficas) y se lee dentro de cada función de render (`const P = window.PRENSA;`), nunca en el scope de módulo — así el orden de carga de los `<script type="text/babel">` del bundle es indiferente.
- Después de cada tarea que toque `src/`, la tarea de verificación final (Task 5) es la única que reconstruye el bundle — no ejecutar `build.py` tras cada tarea intermedia, solo al final, para no perder tiempo re-empaquetando en cada paso.
- No se toca: `src/data/news.js`, pipeline (`gen_cards`, `polish_claude.sh`, `auto_edition.py`), rutas del router, `PricingPage`, modales, JSON-LD, `AffiliateBlock`, tests de `pipeline/tests/`.

---

### Task 1: Tokens `window.PRENSA` + rediseño de la portada `/noticias`

**Files:**
- Modify: `src/components/noticias-n2.js` (reemplazo completo del fichero, 400 líneas → nuevo contenido)

**Interfaces:**
- Consumes: `window.NEWS_DATA` (definido en `src/data/news.js`, ya cargado) con forma `{ actualizado, semanaResumen: {publicadas, distritosCubiertos, movimientoMedio}, destacada: {fecha, hora, categoria, distrito, fuente, imagen, titulo, resumen, impacto, impactoLabel, slug, metricas: [{label, valor, delta, up}]}, items: [{fecha, hora, categoria, distrito, fuente, imagen, titulo, resumen, impacto, slug}, ...] }`. `window.navTo(path)` (definido en `src/template.html`) para navegación.
- Produces: `window.PRENSA` — objeto de tokens `{ papel, superficie, filete, fileteFuerte, tinta, cuerpo, secundario, meta, teja, sube, baja }` — consumido también por Task 2, 3 y 4. `window.NewsV2` (componente, sin cambio de firma, se sigue montando como `<window.NewsV2 />`). `window.NewsV2Icon` (sin cambios, se sigue consumiendo desde `home-variation-d.js:313`).

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Reemplaza **todo** `src/components/noticias-n2.js` por:

```jsx
// N2 — Noticias, piel de prensa económica.
// Papel crema, serifa (Georgia vía className="font-serif"), filetes, acento teja único.
// Colores y tipografía especial van por inline style: el CSS de Tailwind está
// precompilado y no incluye clases nuevas (ver plan de rediseño, Global Constraints).

const { useState: useStateN2 } = React;

window.PRENSA = {
  papel:        '#faf6ef',
  superficie:   '#fffdf8',
  filete:       '#d6d3d1',
  fileteFuerte: '#1c1917',
  tinta:        '#1c1917',
  cuerpo:       '#44403c',
  secundario:   '#57534e',
  meta:         '#78716c',
  teja:         '#9a3412',
  sube:         '#047857',
  baja:         '#be123c',
};

function NewsV2() {
  const P = window.PRENSA;
  const D = window.NEWS_DATA;
  const [filtro, setFiltro] = useStateN2('Todas');

  const sinDestacada = D.items.filter(n => n.titulo !== D.destacada.titulo);
  const categorias = ['Todas', ...Array.from(new Set(sinDestacada.map(n => n.categoria)))];
  const filtered = filtro === 'Todas' ? sinDestacada : sinDestacada.filter(n => n.categoria === filtro);

  const recientes = filtered.slice(0, 6);
  const resto = filtered.slice(6);

  return (
    <div style={{ background: P.papel }}>

      {/* MANCHETA */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-4">
        <div
          className="flex items-end justify-between pb-3"
          style={{ borderBottom: `2px solid ${P.fileteFuerte}` }}
        >
          <p
            className="font-serif text-[1.4rem]"
            style={{ fontStyle: 'italic', color: P.teja }}
          >
            Pulso del mercado
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: P.meta }}>
            Edición {D.actualizado} · Madrid
          </p>
        </div>
      </div>

      {/* BANNER SEMANAL */}
      <div className="max-w-6xl mx-auto px-8">
        <div
          className="flex items-center gap-3 font-mono text-[11px] pb-3"
          style={{ color: P.meta, borderBottom: `1px solid ${P.filete}` }}
        >
          <span><b style={{ color: P.teja }}>{D.semanaResumen.publicadas}</b> {D.semanaResumen.publicadas === 1 ? 'noticia' : 'noticias'} esta semana</span>
          <span>·</span>
          <span><b style={{ color: P.teja }}>{D.semanaResumen.distritosCubiertos}</b> {D.semanaResumen.distritosCubiertos === 1 ? 'distrito cubierto' : 'distritos cubiertos'}</span>
          <span>·</span>
          <span>movimiento medio <b style={{ color: P.teja }}>{D.semanaResumen.movimientoMedio}</b></span>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-8 mt-8">
        <NewsV2Hero d={D.destacada} />
      </div>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto px-8 mt-10">
        <div className="flex items-center gap-5 flex-wrap">
          {categorias.map(cat => {
            const active = filtro === cat;
            return (
              <span
                key={cat}
                onClick={() => setFiltro(cat)}
                className="font-serif text-[14px] cursor-pointer"
                style={{
                  color: active ? P.teja : P.secundario,
                  fontStyle: active ? 'normal' : 'italic',
                  fontWeight: active ? 700 : 400,
                  borderBottom: active ? `2px solid ${P.teja}` : '2px solid transparent',
                  paddingBottom: '2px',
                }}
              >
                {cat}
              </span>
            );
          })}
          {filtro !== 'Todas' && (
            <span className="font-mono text-[11px]" style={{ color: P.meta }}>
              {filtered.length} {filtered.length === 1 ? 'noticia' : 'noticias'}
            </span>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: P.meta }}>
            {filtro === 'Todas' ? 'Desarrollos recientes' : filtro}
          </h3>
          <p className="font-mono text-[11px]" style={{ color: P.meta }}>Actualizado {D.actualizado}</p>
        </div>

        {recientes.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {recientes.map((n, i) => (
              <NewsV2Card key={i} n={n} />
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ height: '8rem', background: P.superficie, border: `1px solid ${P.filete}` }}
          >
            <p className="font-serif text-[14px]" style={{ color: P.meta, fontStyle: 'italic' }}>Sin noticias en esta categoría</p>
          </div>
        )}
      </div>

      {/* MÁS ESTA SEMANA */}
      {resto.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 mt-16 pb-20">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] mb-5" style={{ color: P.meta }}>
            Más esta semana
          </h3>
          <ul style={{ borderTop: `2px solid ${P.fileteFuerte}` }}>
            {resto.map((n, i) => (
              <li
                key={i}
                onClick={() => window.navTo && window.navTo('/noticia/' + n.slug)}
                className="flex items-baseline gap-5 py-4 cursor-pointer"
                style={{ borderBottom: `1px solid ${P.filete}` }}
              >
                <span className="font-mono text-[11px] tabular-nums flex-shrink-0" style={{ width: '3rem', color: P.teja }}>
                  {n.fecha}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: P.teja }}>
                    {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                  </p>
                  <h4
                    className="font-serif text-[15px] font-bold hover:underline"
                    style={{ color: P.tinta, textWrap: 'balance' }}
                  >
                    {n.titulo}
                  </h4>
                </div>
                <span className="font-mono text-[12px] text-right flex-shrink-0" style={{ width: '8rem', color: P.meta }}>
                  {n.fuente}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resto.length === 0 && <div className="pb-20" />}
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────
function NewsV2Hero({ d }) {
  const P = window.PRENSA;
  return (
    <div style={{ paddingBottom: '1.5rem', borderBottom: `2px solid ${P.fileteFuerte}` }}>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: P.teja }}>
            {d.fecha} · {d.categoria}{d.distrito ? ` · ${d.distrito}` : ''} · {d.fuente}
          </p>

          <h3
            className="font-serif text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] mb-5"
            style={{ color: P.tinta, textWrap: 'balance' }}
          >
            {d.titulo}
          </h3>

          <p
            className="font-serif text-[15.5px] leading-relaxed max-w-xl mb-6"
            style={{ color: P.cuerpo, fontStyle: 'italic' }}
          >
            {d.resumen}
          </p>

          <div className="flex items-center gap-5">
            <button
              onClick={() => window.navTo && window.navTo('/noticia/' + d.slug)}
              className="font-semibold px-5 py-2.5 text-sm"
              style={{ background: P.tinta, color: P.papel }}
            >
              Leer cobertura completa →
            </button>
            <span className="font-mono text-[12px]" style={{ color: P.meta }}>
              {d.fuente} · {d.fecha} · {d.hora}
            </span>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center gap-4">
          {d.imagen && (
            <div>
              <div
                style={{ aspectRatio: '16/9', border: `1px solid ${P.filete}`, overflow: 'hidden', background: P.superficie }}
              >
                <img
                  src={d.imagen}
                  alt={d.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }}
                />
              </div>
              <p className="font-serif text-[11px] mt-1.5" style={{ color: P.meta, fontStyle: 'italic' }}>
                Tarjeta de datos · {d.fuente}
              </p>
            </div>
          )}
          {d.metricas && d.metricas.length > 0 && (
            <div>
              {d.metricas.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < d.metricas.length - 1 ? `1px solid ${P.filete}` : 'none' }}
                >
                  <span className="font-serif text-[12px]" style={{ color: P.secundario }}>{m.label}</span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-[15px] font-bold" style={{ color: P.tinta }}>{m.valor}</span>
                    {m.delta && (
                      <span className={`font-mono text-[12px] font-bold tabular-nums ${m.up ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────────
function NewsV2Card({ n }) {
  const P = window.PRENSA;
  return (
    <div
      onClick={() => window.navTo && window.navTo('/noticia/' + n.slug)}
      className="cursor-pointer"
      style={{ background: P.superficie, border: `1px solid ${P.filete}` }}
    >
      {n.imagen && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderBottom: `1px solid ${P.filete}` }}>
          <img
            src={n.imagen}
            alt={n.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.teja }}>
            {n.categoria}
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: P.meta }}>{n.fecha} · {n.hora}</span>
        </div>

        <h4
          className="font-serif text-[17px] font-bold leading-snug mb-3 hover:underline"
          style={{ color: P.tinta, textWrap: 'balance' }}
        >
          {n.titulo}
        </h4>

        <p
          className="font-serif text-[13.5px] leading-relaxed mb-5"
          style={{ color: P.secundario, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {n.resumen}
        </p>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${P.filete}` }}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.meta }}>Impacto</p>
            <p className="font-mono text-sm font-bold tabular-nums mt-0.5" style={{ color: P.tinta }}>{n.impacto}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.meta }}>Fuente</p>
            <p className="font-mono text-[12px] font-semibold mt-0.5" style={{ color: P.secundario }}>{n.fuente}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ICONS (sin cambios — consumido por home-variation-d.js Herramientas) ──
function NewsV2Icon({ name }) {
  const common = 'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0';
  if (name === 'compare') {
    return (
      <div className={`${common} bg-emerald-50 border border-emerald-100`}>
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16m0-16l-3 3m3-3l3 3M17 20V4m0 16l-3-3m3 3l3-3" />
        </svg>
      </div>
    );
  }
  if (name === 'bell') {
    return (
      <div className={`${common} bg-amber-50 border border-amber-100`}>
        <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${common} bg-sky-50 border border-sky-100`}>
      <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6M9 11h6M9 15h3M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    </div>
  );
}

window.NewsV2 = NewsV2;
window.NewsV2Icon = NewsV2Icon;
```

- [ ] **Step 2: Verificar que no queden referencias a lo eliminado**

Run: `grep -n "tagBg\|categoriaBar\|NewsV2Side" "src/components/noticias-n2.js"`
Expected: sin resultados (exit code 1 de grep).

- [ ] **Step 3: Verificar que nada más en el repo dependía de `NewsV2Side`**

Run: `grep -rn "NewsV2Side" src/`
Expected: sin resultados — ya se confirmó en el diseño que no se usaba en ningún otro archivo.

- [ ] **Step 4: Commit**

```bash
git add src/components/noticias-n2.js
git commit -m "noticias: piel de prensa en la portada /noticias"
```

---

### Task 2: Rediseño de `NoticiaDetalleDynamic` (página de artículo)

**Files:**
- Modify: `src/components/noticia-detalle.js:840-1086` (función completa `NoticiaDetalleDynamic`; las variantes `V1`/`V2`/`V3` y todo lo anterior a la línea 840 no se tocan)

**Interfaces:**
- Consumes: `window.PRENSA` (Task 1). `window.NEWS_DATA.items` / `.destacada` (misma forma que Task 1). `window.HOME_DATA.distritos` (array de `{nombre, precioMedio, varAnual, rent}`, sin cambios). `window.AffiliateBlock` (componente existente, sin cambios). `window.navTo`.
- Produces: `window.NoticiaDetalleDynamic({ slug })` (misma firma, se sigue montando igual desde `src/template.html:845`).

- [ ] **Step 1: Reemplazar las líneas 840–1086**

Localiza el bloque que empieza en `function NoticiaDetalleDynamic({ slug }) {` (línea 840) y termina en la línave `}` que cierra la función justo antes de `// ─── Metodología ─────` (línea 1086 inclusive). Sustitúyelo por:

```jsx
function NoticiaDetalleDynamic({ slug }) {
  const P = window.PRENSA;
  const D = window.NEWS_DATA;
  const allItems = D.items || [];
  const article = allItems.find(a => a.slug === slug)
    || (D.destacada && D.destacada.slug === slug ? D.destacada : null)
    || D.destacada;

  if (!article) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Artículo no encontrado.</p>
      </div>
    );
  }

  let distritoData = null;
  if (article.distrito && window.HOME_DATA) {
    distritoData = window.HOME_DATA.distritos.find(d => d.nombre === article.distrito);
  }

  const relacionadas = allItems
    .filter(n => n.slug !== slug && n.titulo !== D.destacada?.titulo)
    .slice(0, 3);

  const metricCards = article.metricas
    || (article.impacto ? [{ label: article.impactoLabel || 'Impacto', valor: article.impacto, delta: '', up: true }] : []);

  const { useEffect: useEffectND } = React;
  useEffectND(() => {
    const prev = document.getElementById('ld-article');
    if (prev) prev.remove();
    const script = document.createElement('script');
    script.id = 'ld-article';
    script.type = 'application/ld+json';
    const pageUrl = 'https://www.radarinmobiliario.com/noticia/' + article.slug;
    const dateValue = (article.fechaISO && article.hora)
      ? (article.fechaISO + 'T' + article.hora + ':00+02:00')
      : (article.fechaISO || article.fecha);
    const articleBody = Array.isArray(article.body)
      ? article.body.filter(b => b.type === 'p').map(b => b.text).join('\n\n')
      : undefined;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.titulo,
      "description": article.resumen ? article.resumen.slice(0, 200) : undefined,
      "image": article.imagen,
      "datePublished": dateValue,
      "dateModified": dateValue,
      "url": pageUrl,
      "inLanguage": "es",
      "articleSection": article.categoria,
      "keywords": article.tags ? article.tags.join(', ') : undefined,
      "articleBody": articleBody,
      "author": {
        "@type": "Organization",
        "name": "Redacción Radar Inmobiliario Madrid",
        "url": "https://www.radarinmobiliario.com/sobre"
      },
      "publisher": { "@id": "https://www.radarinmobiliario.com/#organization" },
      "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.radarinmobiliario.com/" },
          { "@type": "ListItem", "position": 2, "name": "Noticias", "item": "https://www.radarinmobiliario.com/noticias" },
          { "@type": "ListItem", "position": 3, "name": article.titulo }
        ]
      }
    });
    document.head.appendChild(script);
    return () => { const el = document.getElementById('ld-article'); if (el) el.remove(); };
  }, [article.slug]);

  return (
    <div style={{ background: P.papel }}>
      <div className="max-w-6xl mx-auto px-10 pt-10">
        <nav className="flex items-center gap-2 font-mono text-[11px]" style={{ color: P.meta }}>
          <a href="/" onClick={(e) => { e.preventDefault(); window.navTo('/'); }} className="hover:underline" style={{ color: P.meta }}>Inicio</a>
          <span>›</span>
          <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo('/noticias'); }} className="hover:underline" style={{ color: P.meta }}>Noticias</a>
          <span>›</span>
          <span style={{ color: P.teja }}>{article.categoria}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-10 mt-6" style={{ paddingBottom: '1.75rem', borderBottom: `2px solid ${P.fileteFuerte}` }}>
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] mb-5" style={{ color: P.teja }}>
              {article.categoria}{article.distrito ? ` · ${article.distrito}` : ''}
            </p>
            <h1
              className="font-serif text-[2.6rem] font-bold leading-[1.04] tracking-[-0.02em] mb-4"
              style={{ color: P.tinta, textWrap: 'balance' }}
            >
              {article.titulo}
            </h1>
            <p className="font-mono text-[11px] mb-4" style={{ color: P.meta }}>
              Por Redacción Radar Inmobiliario · {article.fecha || article.fechaISO}
            </p>
            <p className="font-serif text-[15.5px] leading-relaxed max-w-xl" style={{ color: P.cuerpo, fontStyle: 'italic' }}>
              {article.resumen}
            </p>
            <div className="flex items-center gap-5 mt-6 font-mono text-[12px]" style={{ color: P.meta }}>
              <span style={{ color: P.secundario, fontWeight: 600 }}>{article.fuente}</span>
              <span>·</span>
              <span className="tabular-nums">{article.fecha} · {article.hora}</span>
            </div>
          </div>
          <div className="col-span-5 flex flex-col justify-center gap-4">
            {article.imagen && (
              <div>
                <div style={{ aspectRatio: '16/9', border: `1px solid ${P.filete}`, overflow: 'hidden', background: P.superficie }}>
                  <img src={article.imagen} alt={article.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }} />
                </div>
                <p className="font-serif text-[11px] mt-1.5" style={{ color: P.meta, fontStyle: 'italic' }}>
                  Tarjeta de datos · {article.fuente}
                </p>
              </div>
            )}
            {metricCards.length > 0 && (
              <div>
                {metricCards.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: i < metricCards.length - 1 ? `1px solid ${P.filete}` : 'none' }}
                  >
                    <span className="font-serif text-[12px]" style={{ color: P.secundario }}>{m.label}</span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[15px] font-bold" style={{ color: P.tinta }}>{m.valor}</span>
                      {m.delta && (
                        <span className={`font-mono text-[12px] font-bold tabular-nums ${m.up ? 'text-emerald-700' : 'text-rose-700'}`}>{m.delta}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-10 mt-14 grid grid-cols-12 gap-10 pb-20">
        <article className="col-span-8">
          {article.body ? (
            article.body.map((block, i) => {
              if (block.type === 'pullquote') {
                return (
                  <blockquote
                    key={i}
                    className="my-8 py-5"
                    style={{ borderTop: `2px solid ${P.fileteFuerte}`, borderBottom: `1px solid ${P.filete}` }}
                  >
                    <p
                      className="font-serif text-[1.55rem] font-bold leading-[1.3]"
                      style={{ color: P.tinta, fontStyle: 'italic', textWrap: 'balance' }}
                    >
                      {block.text}
                    </p>
                  </blockquote>
                );
              }
              const isFirst = i === 0 && block.dropcap;
              if (isFirst) {
                const first = block.text.charAt(0);
                const rest = block.text.slice(1);
                return (
                  <p key={i} className="font-serif text-[16px] leading-[1.7] mb-5" style={{ color: P.cuerpo }}>
                    <span
                      className="font-serif font-bold"
                      style={{ fontSize: '3.2rem', lineHeight: '0.85', float: 'left', marginRight: '0.5rem', marginTop: '0.3rem', color: P.tinta }}
                    >
                      {first}
                    </span>
                    {rest}
                  </p>
                );
              }
              return (
                <p key={i} className="font-serif text-[16px] leading-[1.7] mb-5" style={{ color: P.cuerpo }}>
                  {block.text}
                </p>
              );
            })
          ) : (
            <p className="font-serif text-[16px] leading-[1.7] mb-8" style={{ color: P.cuerpo }}>{article.resumen}</p>
          )}
          {window.AffiliateBlock && (
            <div className="mb-8">
              <window.AffiliateBlock context="hipoteca" />
            </div>
          )}
          <div className="pt-6 flex items-center justify-between" style={{ borderTop: `1px solid ${P.filete}` }}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: P.meta }}>Fuente original</p>
              {article.url && article.url.indexOf('http') === 0 ? (
                <p className="font-serif text-[14px] mt-1">
                  <a href={article.url} target="_blank" rel="noopener nofollow"
                     className="font-semibold hover:underline" style={{ color: P.teja }}>
                    Leer en {article.fuente} ↗
                  </a>
                  <span style={{ color: P.secundario }}> · {article.fecha}</span>
                </p>
              ) : (
                <p className="font-serif text-[14px] mt-1" style={{ color: P.secundario }}>{article.fuente} · {article.fecha}</p>
              )}
            </div>
            <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo('/noticias'); }}
              className="font-semibold px-5 py-2.5 text-sm cursor-pointer" style={{ background: P.tinta, color: P.papel }}>
              ← Volver a noticias
            </a>
          </div>
        </article>
        <aside className="col-span-4 space-y-5">
          {distritoData && (
            <div className="p-6" style={{ background: P.superficie, border: `1px solid ${P.filete}` }}>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: P.teja }}>Distrito afectado</p>
              <h2 className="font-serif text-xl font-bold mt-1" style={{ color: P.tinta }}>{distritoData.nombre}</h2>
              <div className="mt-4">
                {[
                  ['Precio medio', `${distritoData.precioMedio.toLocaleString('es-ES')} €/m²`],
                  ['Var. interanual', `+${distritoData.varAnual.toFixed(1)} %`],
                  ['Rentabilidad bruta', `${distritoData.rent.toFixed(2)} %`],
                ].map(([label, val], i) => (
                  <div key={label} className="flex items-baseline justify-between py-2" style={{ borderBottom: i < 2 ? `1px solid ${P.filete}` : 'none' }}>
                    <span className="font-serif text-[12px]" style={{ color: P.secundario }}>{label}</span>
                    <span className="font-mono text-sm font-bold tabular-nums" style={{ color: P.tinta }}>{val}</span>
                  </div>
                ))}
              </div>
              <a href="/distritos" onClick={(e) => { e.preventDefault(); window.navTo('/distritos'); }}
                className="block mt-4 font-mono text-[12px] font-semibold hover:underline" style={{ color: P.teja }}>
                Ver todos los distritos →
              </a>
            </div>
          )}
          {relacionadas.length > 0 && (
            <div className="p-6" style={{ background: P.superficie, border: `1px solid ${P.filete}` }}>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: P.teja }}>Más noticias</p>
              <div className="space-y-4">
                {relacionadas.map((r, i) => (
                  <a key={i} href={`/noticia/${r.slug}`}
                    onClick={(e) => { e.preventDefault(); window.navTo(`/noticia/${r.slug}`); }}
                    className="block cursor-pointer">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: P.teja }}>{r.categoria}</p>
                    <p className="font-serif text-[13px] font-semibold leading-snug hover:underline" style={{ color: P.tinta, textWrap: 'balance' }}>
                      {r.titulo}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que el resto del archivo (V1/V2/V3, Metodología, Legal) sigue intacto**

Run: `grep -n "function NoticiaDetalleV1\|function NoticiaDetalleV3\|function MetodologiaPage\|function LegalPage\|window.NoticiaDetalleDynamic = NoticiaDetalleDynamic" "src/components/noticia-detalle.js"`
Expected: las 5 líneas aparecen, sin errores — confirma que el reemplazo no desbordó el rango de la función y no rompió lo que viene después.

- [ ] **Step 3: Commit**

```bash
git add src/components/noticia-detalle.js
git commit -m "noticias: piel de prensa en la página de artículo"
```

---

### Task 3: `SiteNav` consciente de la ruta (nav en papel solo en /noticias)

**Files:**
- Modify: `src/template.html:614-647` (función `SiteNav`)

**Interfaces:**
- Consumes: `window.PRENSA` (Task 1, disponible en tiempo de render ya que `SiteNav` se invoca después de que todos los scripts han cargado). Prop `active` (sin cambios de firma, ya se pasa `"noticias"` desde las rutas `/noticias` y `/noticia/*`).
- Produces: sin cambios de interfaz — mismo componente `SiteNav({ active })`.

- [ ] **Step 1: Localizar y reemplazar la línea del `<header>`**

En `src/template.html`, dentro de `function SiteNav({ active })` (línea 614), sustituye la línea:

```
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm">
```

por:

```jsx
        <header
          className="sticky top-0 z-50 backdrop-blur-sm"
          style={
            active === 'noticias'
              ? { background: window.PRENSA.papel, borderBottom: `1px solid #e5ddca` }
              : { background: '#ffffff', borderBottom: '1px solid #e2e8f0' }
          }
        >
```

- [ ] **Step 2: Recolorear el enlace "Noticias" activo cuando la ruta es de noticias**

Localiza, dentro de la misma función, la función interna `link`:

```jsx
      const link = (key, label, path) => (
        <span
          onClick={() => window.navTo(path)}
          className={`cursor-pointer transition-colors ${active === key ? 'text-emerald-700 font-semibold' : 'text-slate-600 hover:text-emerald-700'}`}
        >
          {label}
        </span>
      );
```

Sustitúyela por:

```jsx
      const link = (key, label, path) => {
        const isActive = active === key;
        const isPrensa = active === 'noticias' && isActive;
        return (
          <span
            onClick={() => window.navTo(path)}
            className={`cursor-pointer transition-colors ${isPrensa ? 'font-semibold' : isActive ? 'text-emerald-700 font-semibold' : 'text-slate-600 hover:text-emerald-700'}`}
            style={isPrensa ? { color: window.PRENSA.teja } : undefined}
          >
            {label}
          </span>
        );
      };
```

- [ ] **Step 3: Verificar que ninguna otra ruta quedó afectada**

Run: `grep -n 'active === .noticias.' src/template.html`
Expected: dos coincidencias (la del `<header>` y la del `link`), ambas dentro de `SiteNav`. Ninguna otra página (`/`, `/distritos`, `/sobre`, etc.) pasa `active="noticias"`, así que su nav sigue blanca.

- [ ] **Step 4: Commit**

```bash
git add src/template.html
git commit -m "noticias: nav en papel crema solo en rutas de noticias"
```

---

### Task 4: Teaser "Pulso del mercado" en la home (solo tipografía)

**Files:**
- Modify: `src/components/home-variation-d.js:232-249`

**Interfaces:**
- Consumes: `window.PRENSA` (Task 1). `latestNews` (variable ya existente en el scope de la función que envuelve este bloque — no se toca su definición). `window.navTo`.
- Produces: sin cambios de interfaz.

- [ ] **Step 1: Reemplazar el bloque de la lista de noticias**

Sustituye las líneas 232-249:

```jsx
              <ul className="space-y-0 border-t border-slate-200">
                {latestNews.map((n, i) => (
                  <li key={n.slug || i} className="border-b border-slate-200 py-5 group">
                    <a href={'/noticia/' + n.slug} onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticia/' + n.slug); }} className="flex items-baseline gap-5 cursor-pointer">
                      <span className="text-xs font-bold tabular-nums text-slate-400 w-12 flex-shrink-0">{n.fecha}</span>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">
                          {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                          {n.titulo}
                        </h3>
                      </div>
                      <span className="text-slate-300 group-hover:text-emerald-600 transition-colors">→</span>
                    </a>
                  </li>
                ))}
              </ul>
              <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticias'); }} className="inline-block mt-6 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline">Todas las noticias →</a>
```

por:

```jsx
              <ul className="space-y-0 border-t border-slate-200">
                {latestNews.map((n, i) => {
                  const P = window.PRENSA;
                  return (
                    <li key={n.slug || i} className="border-b border-slate-200 py-5">
                      <a href={'/noticia/' + n.slug} onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticia/' + n.slug); }} className="flex items-baseline gap-5 cursor-pointer">
                        <span className="font-mono text-xs font-bold tabular-nums w-12 flex-shrink-0" style={{ color: P.teja }}>{n.fecha}</span>
                        <div className="flex-1">
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: P.teja }}>
                            {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                          </p>
                          <h3 className="font-serif text-base font-semibold leading-snug hover:underline" style={{ color: P.tinta, textWrap: 'balance' }}>
                            {n.titulo}
                          </h3>
                        </div>
                        <span className="text-slate-300">→</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticias'); }} className="inline-block mt-6 text-sm font-semibold underline-offset-4 hover:underline" style={{ color: window.PRENSA.teja }}>Todas las noticias →</a>
```

- [ ] **Step 2: Verificar que la columna "Rankings rápidos" (hermana de este bloque) no fue tocada**

Run: `grep -n "DCompactRanking\|Rankings rápidos" src/components/home-variation-d.js`
Expected: coincidencias sin cambios respecto a antes de la edición — esa columna usa `masSuben`/`masBaratos`, ajena a este bloque.

- [ ] **Step 3: Commit**

```bash
git add src/components/home-variation-d.js
git commit -m "noticias: tipografía de prensa en el teaser de la home"
```

---

### Task 5: Build, distribute y verificación visual

**Files:**
- No se crean ni modifican archivos de `src/` en esta tarea. Se genera: `Radar Inmobiliario Madrid.html` (regenerado por `build.py`), `dist/` (regenerado por `distribute.py`), y un script temporal de verificación en `/tmp` (no se commitea).

**Interfaces:**
- Consumes: todos los cambios de Task 1-4 ya commiteados.
- Produces: bundle reconstruido + capturas de pantalla para revisión visual.

- [ ] **Step 1: Reconstruir el bundle**

Run: `cd "/Users/zaro/RADAR INMOBILIARIO" && python3 pipeline/build.py`
Expected: exit 0, sin traceback. El script imprime cuántos assets cambiaron.

- [ ] **Step 2: Regenerar `dist/`**

Run:
```bash
cd "/Users/zaro/RADAR INMOBILIARIO"
cp "Radar Inmobiliario Madrid.html" dist/index.html
python3 pipeline/distribute.py
```
Expected: exit 0 en ambos comandos.

- [ ] **Step 3: Servir `dist/` localmente**

Run: `cd "/Users/zaro/RADAR INMOBILIARIO/dist" && python3 -m http.server 8791 &`
Expected: el servidor arranca en background, imprime "Serving HTTP on ...".

- [ ] **Step 4: Capturar y verificar visualmente con Playwright**

Crea `/tmp/verify_noticias.py`:

```python
from playwright.sync_api import sync_playwright

PAGES = [
    ("home", "http://localhost:8791/#/"),
    ("noticias", "http://localhost:8791/#/noticias"),
    ("articulo", "http://localhost:8791/#/noticia/madrid-construccion-446-pisos-alquiler-asequible"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 1400})
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    for name, url in PAGES:
        page.goto(url, wait_until="networkidle")
        page.wait_for_timeout(500)
        page.screenshot(path=f"/tmp/verify_{name}.png", full_page=True)
        print(f"{name}: screenshot saved")

    browser.close()
    if errors:
        print("CONSOLE ERRORS:")
        for e in errors:
            print(" -", e)
    else:
        print("No console errors.")
```

Run: `python3 /tmp/verify_noticias.py`
Expected: "No console errors." y 3 archivos `.png` guardados. Si hay errores de consola, son de esta tarea — diagnosticar antes de continuar (típicamente: typo en un nombre de campo de `PRENSA` o de `article`).

- [ ] **Step 5: Revisar las capturas**

Abre `/tmp/verify_home.png`, `/tmp/verify_noticias.png` y `/tmp/verify_articulo.png` (con el visor de imágenes / herramienta de lectura de imágenes). Checklist:
- `verify_noticias.png`: fondo papel crema en toda la página, nav teñida de crema, mancheta con filete de 2px, titulares en serifa, sin chips de colores por categoría, filtros como texto en cursiva.
- `verify_articulo.png`: mismo fondo papel y nav, H1 en serifa grande, capitular visible en el primer párrafo, cita destacada con filete superior grueso, sidebar con ficha de distrito en caja plana.
- `verify_home.png`: fondo **blanco** (no crema), nav blanca, el teaser "Lo último que mueve precios" con titulares en serifa y categoría/fecha en teja — el resto de la home sin cambios.

Si algo no cuadra con el checklist, corrígelo en el archivo correspondiente (Task 1, 2, 3 o 4) y repite desde el Step 1 de esta tarea.

- [ ] **Step 6: Detener el servidor de verificación**

Run: `kill %1 2>/dev/null; rm -f /tmp/verify_noticias.py /tmp/verify_*.png`
Expected: sin salida relevante — limpieza de artefactos temporales de verificación.

- [ ] **Step 7: Canario de regresión del pipeline**

Run: `cd "/Users/zaro/RADAR INMOBILIARIO" && for t in pipeline/tests/test_*.py; do echo "== $t =="; python3 "$t" || exit 1; done`
Expected: todos los tests terminan con exit 0. Este rediseño no toca el pipeline; si algo falla aquí, es una regresión inesperada a investigar antes de continuar (no achacarla al rediseño sin comprobar primero).

- [ ] **Step 8: Commit final de los artefactos generados**

```bash
cd "/Users/zaro/RADAR INMOBILIARIO"
git add "Radar Inmobiliario Madrid.html" dist/
git commit -m "noticias: build + distribute con la piel de prensa"
git status
```
Expected: `git status` muestra el árbol de trabajo limpio (sin cambios pendientes) — cierra la puerta de verificación del spec.

---

## Self-Review

**Cobertura del spec:** tokens `window.PRENSA` (Task 1) · portada re-vestida con estructura intacta (Task 1) · `NoticiaDetalleDynamic` re-vestido con sidebar intacta (Task 2) · nav consciente de ruta (Task 3) · teaser de home solo tipografía (Task 4) · build+distribute+checklist visual+tests de pipeline (Task 5). El punto del spec "capitular con span manual si las clases `first-letter:` no están compiladas" se resolvió en Task 2 Step 1 con un `<span>` manual — se comprobó por auditoría del CSS compilado que las clases `first-letter:text-[3.4rem]` que usaba el original **no estaban compiladas** (solo `first-letter:text-[3.6rem]`, usado por la variante V2), así que el span manual no es solo la opción de respaldo del spec sino la única que garantiza que el capitular se vea.

**Placeholders:** ninguno — cada paso trae código completo, sin "TODO" ni "similar a la Task N".

**Consistencia de tipos/nombres:** `window.PRENSA` se define una sola vez (Task 1) con las claves `papel, superficie, filete, fileteFuerte, tinta, cuerpo, secundario, meta, teja, sube, baja`; Task 2, 3 y 4 solo leen esas mismas claves (verificado: no se introduce ninguna clave nueva ni se renombra ninguna). `NewsV2Hero({ d })` y `NewsV2Card({ n })` mantienen la firma original. `NoticiaDetalleDynamic({ slug })` mantiene la firma original.

**Nota sobre `sube`/`baja`:** quedan definidos en `window.PRENSA` por completitud del spec, pero en la práctica Task 1 y 2 usan directamente las clases ya compiladas `text-emerald-700`/`text-rose-700` para las cifras (más simple, cero riesgo, mismo resultado visual que los valores hex `sube`/`baja`). No es una inconsistencia: son dos formas válidas de llegar al mismo color, y usar la clase existente es la opción de menor riesgo.
