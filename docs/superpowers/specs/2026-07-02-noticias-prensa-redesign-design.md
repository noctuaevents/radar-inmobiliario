# Rediseño "piel de prensa" de la sección de noticias

**Fecha:** 2 Jul 2026
**Estado:** aprobado por el usuario (brainstorming con companion visual)
**Implementa:** agente `constructor` (Sonnet) siguiendo el plan derivado de este spec

## Contexto y objetivo

Al usuario no le gusta la estética actual de las noticias (estilo "Perplexity Finance":
fondo blanco/stone, acentos emerald, chips de colores, tarjetas redondeadas). Se rediseña
la sección completa de noticias con una identidad de **prensa económica**: papel crema,
titulares con serifa, filetes, un solo acento teja. Decisiones tomadas con mockups:

1. Dirección estética: **A · Prensa económica** (vs. terminal oscuro y kiosco moderno).
2. Encaje del fondo: **el crema vive solo en las noticias** — páginas `/noticias` y
   `/noticia/*` al 100 %, la nav se tiñe solo ahí; el resto de la web sigue blanca.
3. Portada `/noticias`: **estructura actual con piel nueva** (se conservan banner
   semanal, hero, filtros, grid de tarjetas con imagen, lista final).
4. Detalle `/noticia/[slug]`: **dos columnas con ficha lateral** (estructura actual
   re-vestida; la sidebar de datos se mantiene).

## Tokens de diseño

Definir **una sola vez** como objeto JS global `window.PRENSA` (nuevo bloque al inicio
de `src/components/noticias-n2.js`) y consumir desde todos los componentes de noticias
**dentro de las funciones de render** (se resuelve al renderizar, así el orden de carga
de los scripts del bundle es indiferente). Todos los valores van por **inline styles** (el bundle de
Tailwind está precompilado; no existen clases para estos colores).

```js
window.PRENSA = {
  papel:        '#faf6ef',  // fondo de página noticias + nav en esas rutas
  superficie:   '#fffdf8',  // fondo de tarjetas/cajas
  filete:       '#d6d3d1',  // separadores finos y bordes de caja
  fileteFuerte: '#1c1917',  // filetes de 2px (mancheta, cierre de cabecera)
  tinta:        '#1c1917',  // titulares
  cuerpo:       '#44403c',  // texto de párrafo
  secundario:   '#57534e',  // resúmenes, texto menor
  meta:         '#78716c',  // fechas, fuentes, pies de foto
  teja:         '#9a3412',  // acento único: categorías, fechas destacadas, enlaces
  sube:         '#047857',  // cifras positivas (se conserva el semáforo)
  baja:         '#be123c',  // cifras negativas
  serif:        'Georgia, "Times New Roman", serif',
  mono:         '"JetBrains Mono", ui-monospace, monospace',
};
```

Reglas transversales:

- **Serifa (Georgia)** en titulares de noticias y cuerpo de artículo. Georgia es fuente
  de sistema: no se añade ningún asset al bundle.
- **Mono** para fechas, horas, fuentes, cifras y micro-etiquetas (mayúsculas con
  letter-spacing). **Inter** sigue en elementos funcionales (botones, nav).
- Desaparecen en noticias: los chips de colores por categoría (`tagBg` amber/rose/
  emerald/sky/violet), las barras laterales de acento por categoría, los
  `rounded-2xl/3xl` y las sombras. Bordes rectos (radius 0, máx 2px) y filetes.
- La categoría se muestra como texto mono en mayúsculas color teja (sin fondo).
- El semáforo emerald/rose **solo** sobrevive en cifras (deltas, variaciones).
- Hovers: no introducir cambios de color que necesiten clases Tailwind nuevas; usar
  `hover:underline` (existe en el bundle) con color teja estático, o estilos ya
  presentes en el bundle.

## Alcance por archivo

### 1. `src/components/noticias-n2.js` — portada `/noticias`

Misma estructura y misma lógica (filtro por categoría, destacada excluida del grid,
primeras 6 en grid, resto en lista). Cambios de piel:

- **Contenedor de página:** fondo `papel` en el div raíz (sustituye `bg-white`).
- **Cabecera de sección → mancheta:** "Pulso del mercado" en serifa cursiva color teja
  + "EDICIÓN {actualizado} · MADRID" en mono a la derecha, cerrado por un filete
  inferior de 2px `fileteFuerte`. Sustituye el header actual ("03 · Pulso del mercado"
  + H2 grande + borde slate). El H2 "Lo que hoy mueve precios en Madrid." **se
  elimina**: la mancheta + la destacada ya cumplen ese papel y el titular grande
  duplicado compite con el de la destacada.
- **Banner semanal:** deja de ser caja emerald redondeada; pasa a ser una línea de
  texto mono pequeña bajo la mancheta ("**1** noticia esta semana · **1** distrito
  cubierto · movimiento medio **+14,4 %**", cifras en teja), separada por filete fino.
- **Hero destacada:** sin caja stone redondeada ni barra de color; grid ~3/2:
  izquierda kicker mono ("1 JUL · INFRAESTRUCTURA · LA RAZÓN") en teja, titular serifa
  grande (~2.2–2.6rem, tracking apretado), resumen serifa, línea de impacto en mono;
  derecha la tarjeta de dato 16:9 con **borde fino `filete` y pie de foto en cursiva**.
  Las tarjetas de métricas del hero (si `metricas` existe) pasan a filas clave/valor
  con filete punteado (label serifa pequeña, valor mono negrita). Cierre del hero con
  filete de 2px. El botón "Leer cobertura completa →" se mantiene pero re-vestido:
  fondo `tinta`, texto papel, sin radius grande (0–2px).
- **Filtros:** de botones-píldora a enlaces de texto en serifa cursiva; el activo en
  teja, negrita, no cursiva, con subrayado de 2px teja (border-bottom inline). El
  contador de resultados en mono.
- **Grid de tarjetas (6):** tarjetas planas: fondo `superficie`, borde 1px `filete`,
  radius 0; imagen 16:9 arriba con filete inferior; dentro: categoría mono teja,
  titular serifa, resumen serifa pequeña, pie con Impacto/Fuente en mono separado por
  filete punteado. Sin hover de sombra; hover = subrayado del titular.
- **Lista "Más esta semana":** filete superior de 2px; filas con fecha mono teja,
  titular serifa negrita, fuente mono a la derecha; separadores `filete`.
- El componente muerto `NewsV2Side` (predicciones) no se usa: **eliminarlo** en esta
  pasada. `NewsV2Icon` se usa desde la home (Herramientas): **no tocarlo**.

### 2. `src/components/noticia-detalle.js` — solo `NoticiaDetalleDynamic`

Las variantes V1/V2/V3 son demos legacy (V3 sirve la ruta muerta `/noticia` sin slug):
**no re-diseñarlas**. Cambios en `NoticiaDetalleDynamic`:

- **Página:** fondo `papel` (sustituye `bg-white`).
- **Breadcrumb:** mono pequeño, categoría final en teja.
- **Cabecera de periódico** (sustituye la caja hero stone redondeada con barra de
  color): categoría + distrito en mono teja mayúsculas, H1 serifa grande, entradilla
  (resumen) en serifa cursiva, línea de meta en mono ("LA RAZÓN · 1 JUL 2026 · 11:00 ·
  Por Redacción…") cerrada con filete de 2px. La imagen (tarjeta de dato) va a la
  derecha en grid ~3/2 con borde fino y pie de foto; las `metricCards` pasan a filas
  clave/valor con filete punteado bajo la imagen.
- **Cuerpo:** párrafos en serifa (~17px, leading 1.7), capitular del primer párrafo
  (serifa, ~3.2rem, float left) — la capitular actual usa `first-letter:` de Tailwind;
  si esas clases ya están en el bundle pueden reutilizarse, si no, replicar con un
  span inline. **Pull quote:** filete superior 2px `fileteFuerte` + filete inferior
  fino, texto serifa cursiva negrita, sin comilla decorativa emerald.
- **Bloque "Fuente original":** labels en mono, enlace en teja con `hover:underline`;
  botón "← Volver a noticias" re-vestido como el CTA del hero (fondo tinta, radius 0–2).
- **Sidebar:** cajas planas (fondo `superficie`, borde `filete`, radius 0): ficha del
  distrito (título de caja en mono teja; filas clave/valor con filete punteado; valores
  mono; variación con semáforo) y "Más noticias" (categoría mono teja + titular serifa).
  Enlaces "Ver todos los distritos →" en teja.
- **No tocar:** el `useEffect` del JSON-LD, `AffiliateBlock`, la lógica de datos
  (`distritoData`, `relacionadas`, `metricCards`) ni las rutas.

### 3. `src/template.html` — SiteNav consciente de la ruta

- `SiteNav` recibe la ruta activa (ya recibe `active`); cuando `active === 'noticias'`
  el header usa fondo `papel` y borde inferior `#e5ddca` vía inline style (sustituyendo
  `bg-white border-slate-200` solo en ese caso). El resto de páginas quedan igual.
- El enlace activo "Noticias" en la nav pasa a teja en esas páginas (inline style);
  los demás enlaces no cambian.
- No tocar router, PricingPage ni modales.

### 4. `src/components/home-variation-d.js` — teaser "Pulso del mercado"

Solo tipografía (fondo blanco intacto, estructura intacta, columna "Rankings rápidos"
intacta):

- Titulares del listado (`h3`) en serifa vía inline style.
- Categoría por ítem: de emerald a teja, en mono.
- Fecha en mono color teja.
- El enlace "Todas las noticias →" pasa a teja.

## Fuera de alcance

- Rediseño global de la web (home, distritos, herramientas, pricing) — descartado
  explícitamente (opción 2 del encaje de fondo).
- Cambios en `src/data/news.js`, pipeline (`gen_cards`, `polish`, `auto_edition`),
  estética de las tarjetas de dato PNG, sitemaps, schema.
- Responsive nuevo: se conserva el comportamiento actual de los grids.
- Páginas estáticas de `dist/noticia/*/index.html`: las genera `distribute.py` a partir
  del bundle; si incluyen colores de fondo hardcodeados que choquen (blanco vs papel),
  ajustar solo el color de fondo en la plantilla de `distribute.py` — nada más.

## Verificación (puerta de salida)

1. `python3 pipeline/build.py` termina exit 0.
2. `cp "Radar Inmobiliario Madrid.html" dist/index.html` y `python3 pipeline/distribute.py` exit 0.
3. Comprobación visual (abrir el HTML o servir `dist/`): `/noticias`, un artículo real
   (`/noticia/madrid-construccion-446-pisos-alquiler-asequible`) y la home. Checklist:
   fondo papel en ambas páginas de noticias, nav teñida solo ahí, sin chips de colores,
   serifa en titulares, home blanca con teaser en serifa, JSON-LD presente en el detalle.
4. Los tests del pipeline siguen pasando: `for t in pipeline/tests/test_*.py; do python3 "$t"; done`
   (el rediseño no toca pipeline; es un canario de regresión).

## Riesgos conocidos

- `auto_edition.py` parchea `news.js`, no los componentes — sin conflicto. Pero si una
  edición autónoma corre a mitad de la implementación, hacer rebase antes del commit.
- Las clases `first-letter:*` de la capitular pueden no estar completas en el bundle
  precompilado para nuevos valores: reutilizar exactamente las existentes o capitular
  con span manual.
- `distribute.py` debe seguir usando `re.findall` para los bloques de estilo (regla
  del repo); el rediseño no debe tocar esa lógica.
