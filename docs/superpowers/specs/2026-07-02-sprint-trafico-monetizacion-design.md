# Sprint de tráfico y monetización — revisión integral de la web

**Fecha:** 2 Jul 2026
**Estado:** aprobado por el usuario (brainstorming; a partir de la Tanda 1 el usuario
delegó las decisiones restantes: "haz lo que tú quieras, tú llevas todo esto")
**Objetivo de negocio:** monetizar la web. Situación de partida: **0 visitas**.

## Contexto

La web (radarinmobiliario.com, dominio de 4 días, servido desde **Vercel**) ya tiene
construida la maquinaria de monetización (Pro 49€ fundador, simulador gratis, comparador
Pro, waitlist, afiliados config-driven) y un pipeline de contenido autónomo diario
(launchd 07:30). La auditoría SEO del 1 Jul dio 59/100. Hallazgo nuevo de esta revisión:
**la captura de conversión está muerta en producción** — la waitlist usa Netlify Forms y
la newsletter llama a `/.netlify/functions/subscribe`, pero producción es Vercel: ni un
solo email puede capturarse hoy. Además no hay analytics instalado.

## Decisiones del usuario (2 Jul 2026)

1. **Prioridad: tráfico primero** — 80 % adquisición, 20 % reparar captura.
2. **Off-site que asume el usuario:** perfiles sociales (X/LinkedIn) + difusión, y alta
   en Google Publisher Center (News/Discover). NO por ahora: cuentas nuevas de servicios
   (Beehiiv, Stripe) ni presupuesto de promoción.
3. **Estética: unificar todo el sitio en la "piel de prensa"** (revoca el confinamiento
   a noticias del spec `2026-07-02-noticias-prensa-redesign-design.md`).
4. **Hosting: seguir en Vercel** — la captura se reescribe nativa (función serverless
   + Vercel Blob), no se vuelve a Netlify.
5. **Enfoque A: sprint por capas** — tres tandas deployables por separado, compatibles
   con la edición autónoma diaria que reconstruye `dist/` cada mañana.

## Métricas de éxito

- Impresiones/clicks en Search Console creciendo semana a semana (hoy ~0).
- Inclusión en Google News/Discover (2–4 semanas tras solicitud).
- PageSpeed móvil > 80 (hoy Babel Standalone ~3,1 MB compila JSX en el navegador).
- Primeros emails capturados en Vercel Blob (hoy: imposible capturar ninguno).
- Visitas reales visibles en Vercel Web Analytics (hoy no hay medición).
- Re-auditoría `/seo-audit` tras Tandas 1–2 con objetivo ≥ 75/100 (hoy 59).

---

## Tanda 1 — Motor de tráfico y caja registradora mínima

### 1.1 Precompilar JSX: fuera Babel Standalone de producción

- El monolito y `src/` **no cambian**: el bundle de desarrollo sigue usando Babel
  (cómodo para editar/depurar). Solo cambia lo que se sirve en `dist/`.
- `distribute.py` gana un paso de compilación: extrae todos los `<script
  type="text/babel">` (assets por UUID + router inline) **en su orden actual**, los
  compila **asset por asset** con `@babel/cli` + `@babel/preset-react` (así un error
  de sintaxis señala el fichero culpable) y concatena en un único
  `dist/assets/app.compiled.js` (con hash de contenido en el nombre para caché
  inmutable). `dist/index.html` referencia el compilado con `defer` y deja de cargar
  `babel.min.js`.
- **Caché por hash del JSX concatenado** en `pipeline/work/`: la edición diaria de las
  07:30 no recompila si solo cambió `news.js` (los datos van en scripts normales, no
  JSX). Nota: `news.js`/`distritos.js`/`config.js`/geojson son JS plano y quedan FUERA
  del compilado — siguen siendo assets independientes.
- **Resolución de node bajo launchd:** reutilizar el patrón
  `verify_codex._env_with_cli_paths()` (nvm fuera del PATH de launchd). Las
  dependencias de babel se instalan en `pipeline/node_modules` (package.json propio),
  no globales.
- **Degradación:** si la compilación falla o no hay node, `distribute.py` emite la
  variante actual con Babel runtime y lo marca en el informe de la edición autónoma.
  Una edición de noticias nunca se queda sin publicar por esto.
- **Extra:** `madrid-geojson.js` (364 KB) pasa a cargarse con inyección dinámica de
  `<script>` solo cuando se monta el cartograma (con estado "cargando mapa…" mientras).

### 1.2 Captura de emails nativa en Vercel

- Nueva función `api/subscribe.js` (Vercel serverless, runtime Node): `POST {email,
  list}` con `list ∈ {newsletter, pro-waitlist}`. Validación de email, campo honeypot,
  respuesta JSON `{ok}`. Rechaza métodos ≠ POST.
- **Almacenamiento: Vercel Blob** (dentro de la cuenta Vercel actual, tier gratis).
  Un JSON por alta: `signups/<list>/<ISO-timestamp>-<hash8>.json` con `{email, list,
  ts, ua}`. Requiere que el usuario cree el Blob store en el dashboard (~2 min); la
  función usa el `BLOB_READ_WRITE_TOKEN` que Vercel inyecta solo.
- Export: `pipeline/list_signups.py` lista/exporta a CSV vía la API de Blob (token en
  env local). Alternativa manual: el browser de Blob del dashboard.
- Front-end: el formulario de newsletter (`home-variation-d.js`, hoy apunta a
  `/.netlify/functions/subscribe`) y la waitlist de /pro (`template.html`, hoy POST
  Netlify-encoded a `/`) pasan a `fetch('/api/subscribe', {method:'POST', body: JSON})`.
  Se conservan los estados visuales de éxito/error existentes.
- Se elimina: el form oculto `pro-waitlist` de `template.html`, su inyección en
  `distribute.py` (`inject_netlify_form` o equivalente), y `netlify/functions/`.
- **RGPD:** microcopy junto a ambos formularios ("Solo para enviarte el radar. Baja en
  un click. [Política]") enlazando a `/legal`; añadir a `/legal` un párrafo sobre el
  tratamiento de emails (finalidad, baja por respuesta, sin cesión).

### 1.3 Nav honesto

- "Comparar" deja de abrir `showProModal` y navega a `/herramientas/comparador` (la
  página real ya existe y gestiona su propio gate Pro).
- "Rankings" **desaparece del nav** hasta que exista la página real (vuelve en Tanda 3).
- Añadir "Herramientas" al nav si cabe sin apretar (móvil manda); si no, se resuelve en
  Tanda 2 con el nav re-vestido.

### 1.4 Prosa estática VISIBLE en artículos y home (corrige patrón de texto oculto)

- Corrección tras leer el código: el cuerpo completo (~312 palabras) YA está en las
  páginas estáticas, pero en un div off-screen (`position:absolute;left:-9999px` +
  `aria-hidden`) — patrón de "hidden text" que Google descuenta y puede penalizar,
  y que los crawlers de IA ignoran a menudo.
- Cambio: `gen_article_pages()` y `gen_home_static()` pasan a inyectar el fallback
  **visible dentro de `#root`** (H1, entradilla, párrafos, enlace a fuente original y
  a la ficha del distrito), sustituyendo al spinner "Cargando…"; React lo reemplaza al
  montar. Estilo mínimo inline (papel, serifa) para que no "flashee" feo.
- Beneficia a Google (contenido visible, no descontado) y a crawlers de IA sin JS — GEO.

### 1.5 Medición

- Activar **Vercel Web Analytics** (incluido en la cuenta, gratis): el usuario lo
  habilita en el dashboard (1 click) y el template de `dist` añade el script
  `/_vercel/insights/script.js` (same-origin: el CSP actual ya lo permite).

### 1.6 Poda de cosas inútiles

- Commitear la retirada de Jarvis pendiente en el working tree (nav + router en
  `template.html` + rebuild). `pipeline/jarvis_server.py` y `pipeline/jarvis_static/`
  quedan sin trackear (herramienta local); añadirlos a `.gitignore`.
- Eliminar `netlify.toml`, `netlify/` y toda referencia Netlify en `distribute.py`.
- Verificar y eliminar `index.html` de la raíz del repo si es un duplicado huérfano, y
  la carpeta `carpeta sin título`.
- Limpiar del CSP de `vercel.json` los dominios de AdSense/GTM (no hay ads ni GTM;
  reintroducir cuando toque).
- Commitear `CLAUDE.md` (documentación de agentes, hoy sin trackear).

### Acciones del usuario en paralelo (Tanda 1)

1. Google Publisher Center: dar de alta la publicación y solicitar News/Discover.
2. Crear perfiles X y LinkedIn de Radar Inmobiliario (los URLs alimentan `sameAs` en
   Tanda 3).
3. Dashboard Vercel: crear Blob store + activar Web Analytics (~3 min total).

---

## Tanda 2 — Piel de prensa unificada en todo el sitio

Extender la identidad editorial (spec `2026-07-02-noticias-prensa-redesign-design.md`)
al resto del sitio. Mismas reglas transversales: tokens `window.PRENSA`, inline styles
(el bundle de Tailwind está precompilado — regla del repo), serifa Georgia en
titulares, mono en cifras/meta, acento único teja, semáforo emerald/rose solo en
cifras, bordes rectos y filetes en vez de sombras y radius.

- **`window.PRENSA` se muda** de `noticias-n2.js` a un asset que cargue antes que todos
  los componentes (junto a `config.js`), para consumo global sin dependencia de orden.
- **Nav (`template.html`):** papel crema y filete en TODAS las rutas (se elimina el
  condicional "solo noticias" del commit `cf81446`). Enlace activo en teja.
- **Home (`home-variation-d.js`):** fondo papel, hero con titular serifa, ticker y
  cifras en mono, tarjetas planas con filete. El cartograma conserva su semántica de
  color de datos (escala de precios); solo se re-viste el marco.
- **Distritos (`distritos-d2.js` + `distrito-detalle.js`):** hub y 21 fichas con piel
  de prensa; tablas de datos con filas clave/valor y filete punteado, cifras en mono.
- **Herramientas (`herramientas.js`):** simulador y comparador re-vestidos; los
  formularios mantienen su lógica.
- **/pro, /gracias y modal Pro (`monetize.js`):** pricing en piel de prensa — caja
  plana, precio grande en serifa, features con filetes; el CTA conserva alto contraste
  (fondo tinta).
- **/sobre, /metodologia, /legal (en `template.html`):** tipografía editorial.
- **Páginas estáticas de `dist/`:** los fallbacks estáticos que genera `distribute.py`
  (home, distritos, artículos de 1.4) adoptan el fondo papel para no "flashear" blanco
  antes del montaje de React.
- Se mantienen: estructura y lógica de todos los componentes, JSON-LD, rutas,
  responsive actual. Es una re-piel, no un re-layout — con una excepción: eliminar
  restos decorativos ya identificados como inútiles si aparecen al re-vestir
  (criterio: si no informa ni convierte, fuera).

---

## Tanda 3 — Imanes de tráfico y enlazado interno

### 3.1 Página /rankings (gratis, real)

- Nuevo componente con los datos que YA existen en `distritos.js`: ranking completo de
  21 distritos (ordenable por precio, variación, rentabilidad) + los tres top-10 de
  barrios (más caros, mayor subida, más baratos).
- H1 orientado a búsqueda ("Ranking de precios por distrito y barrio en Madrid, 2026"),
  JSON-LD `ItemList`, fallback estático con la tabla en HTML semántico, alta en
  `sitemap.xml`, y "Rankings" vuelve al nav apuntando aquí.
- CTA suave al final: los top-10 completos de 131 barrios como gancho Pro/waitlist.

### 3.2 Simulador como imán SEO

- Título/meta/H1 orientados a "calculadora hipoteca Madrid" (+ variantes en el copy).
- Bloque FAQ (4–6 preguntas: euríbor, gastos de compra en Madrid, % entrada, fijo vs
  variable) con JSON-LD `FAQPage`, también en el fallback estático.
- Enlaces internos: desde cada ficha de distrito ("Calcula tu hipoteca para un piso de
  X € en <distrito>" con el precio medio pre-cargado vía query/hash) y desde artículos
  de precios.

### 3.3 Hub /herramientas

- Página índice simple que lista simulador (gratis), comparador (Pro) y rankings, con
  descripciones; en `sitemap.xml`.

### 3.4 Fichas de distrito enriquecidas + enlazado interno

- Tabla semántica real (`<table>`) con las métricas en el fallback estático.
- **Noticias relacionadas por distrito:** cruce automático `news.js` (campo distrito/
  tags) → ficha, y al revés: los artículos enlazan la ficha del distrito mencionado.
  Es la palanca de enlazado interno más barata del sitio.
- Párrafo de contexto editorial generado desde los datos (plantillas variadas por
  casuística — sube/baja/estable — para evitar 21 páginas clónicas); distritos
  vecinos enlazados.

### 3.5 Autoridad y schema

- `sameAs` en `NewsMediaOrganization` con los perfiles que cree el usuario + iconos en
  el footer.
- CTA de newsletter al final del cuerpo de cada artículo (el punto de mayor intención).

---

## Fuera de alcance (explícito, con motivo)

- **Stripe / cobro real:** el usuario pospone crear cuentas; la waitlist captura la
  demanda mientras. Cuando active Stripe: pegar Payment Links en `config.js` (ya
  soportado).
- **131 barrios / páginas programáticas de barrio:** NO existe el dataset en el repo
  (solo top-10). Requiere sourcing de datos (Idealista mensual / open data del
  Ayuntamiento) — fase futura propia; es la mayor palanca SEO a medio plazo.
- **Beehiiv / newsletter real:** sin cuenta por ahora; los emails se acumulan en Blob
  y se migran cuando exista.
- **Alertas:** sin backend de envío, sería otro botón falso. Ni se anuncia.
- **Publicidad display (AdSense):** con 0 visitas no hay inventario que vender;
  revisar al superar ~10k páginas vistas/mes.
- **Rebrand completo:** descartado en favor de unificar la piel de prensa existente.

## Verificación (puerta de salida de cada tanda)

1. `python3 pipeline/build.py` y `python3 pipeline/distribute.py` exit 0; tests del
   pipeline verdes (`pipeline/tests/test_*.py`).
2. Tanda 1: `dist/index.html` sin `babel.min.js`; render headless de `/`, `/distritos/
   salamanca`, un artículo y `/pro` idéntico en contenido al actual; `POST /api/
   subscribe` probado contra un deploy de preview (alta visible en Blob); página de
   artículo estática con ≥ 250 palabras visibles sin JS.
3. Tanda 2: checklist visual headless de todas las rutas (papel, serifa, teja, sin
   restos emerald de caja); sin overflow horizontal en 375px.
4. Tanda 3: `/rankings` y `/herramientas` en sitemap y renderizando; `FAQPage` e
   `ItemList` válidos (validador de schema); enlaces distrito↔noticia presentes en
   ambos sentidos.
5. La edición autónoma del día siguiente a cada merge publica sin intervención (canario
   real del pipeline).
6. Tras Tandas 1–2: re-ejecutar `/seo-audit` y comparar con 59/100.

## Riesgos

- **Colisión con la edición autónoma (07:30/14:00):** trabajar en commits pequeños
  sobre `main`, rebase antes de push; no dejar el working tree sucio de un día para
  otro. El paso de compilación entra con fallback para no romper la edición diaria.
- **Compilado único de ~todo el JSX:** un error de sintaxis en un componente rompería
  todo el bundle compilado; mitigación: compilar por-asset y concatenar, con el nombre
  del asset en el error, y el fallback Babel.
- **CSP:** `script-src 'self' 'unsafe-inline'` debe seguir cubriendo el compilado
  (mismo origen) y los JSON-LD inline; probar en preview antes de producción.
- **Tailwind precompilado:** toda la Tanda 2 va con inline styles/clases existentes
  (regla del repo); cualquier clase nueva silenciosamente no aplicaría.
- **`distribute.py` debe seguir usando `re.findall`** para los bloques de estilo
  (regla del repo).
