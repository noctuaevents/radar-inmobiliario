# SEO Audit — radarinmobiliario.com
**Fecha:** 29 junio 2026  
**Dominio:** radarinmobiliario.com  
**Tipo de negocio:** Publicación de datos inmobiliarios — Publisher/Data Media  
**Puntuación SEO General:** 47 / 100

---

## Executive Summary

Radar Inmobiliario Madrid tiene una base técnica sólida (HTTPS, CDN, cabeceras de seguridad, robots.txt correcto, sitemap enviado a GSC) pero sufre un problema estructural que lastra toda la indexación: **es una SPA de archivo único donde todos los URLs devuelven exactamente el mismo HTML de 1,8 MB**, con los mismos metatítulos, meta descriptions, canonical y JSON-LD. Esto significa que Google solo puede diferenciar páginas si renderiza el JavaScript, y aun así las etiquetas `<head>` nunca cambian.

Los 5 problemas más críticos:

1. **SPA sin metadatos por página** — `/distritos/salamanca`, `/noticias`, `/noticia/hipotecas-...` devuelven la misma `<title>` y `<link rel="canonical">` que la portada
2. **Payload HTML: 1,8 MB** — El bundle completo (assets Base64 incluidos) se descarga en cada visita; encarece el índice de Google y degrada CWV
3. **Sin NewsArticle schema en artículos** — Las noticias no aportan structured data propio; Google no puede presentar Rich Results de noticias
4. **Sin BreadcrumbList ni canonicals per-URL** — Impide que Google entienda la jerarquía y deduplique correctamente
5. **Contenido de artículos delgado** — 7 de los 8 artículos tienen solo ~100 palabras de resumen; solo "Madrid Nuevo Norte" tiene cuerpo completo

Los 5 quick wins más rápidos:

1. Añadir `document.title` + meta canonical dinámicos en el router (1–2h de código)
2. Inyectar `NewsArticle` JSON-LD en cada artículo al renderizar (2–3h)
3. Añadir `x-default` a `hreflang` (5 min)
4. Añadir `Content-Security-Policy` header en `netlify.toml` (15 min)
5. Completar `llms.txt` con URLs directas a artículos (20 min)

---

## 1. Technical SEO — Puntuación: 45/100

### Lo que funciona bien
- HTTPS con HSTS (`max-age=31536000`) — correcto
- HTTP/2, CDN Netlify Edge — TTFB medido: **137 ms** (excelente)
- `robots.txt` correcto: `Allow: /` para todos los bots, referencia al sitemap
- Sitemap enviado a Google Search Console
- Canonical presente en el `<head>` estático
- `lang="es"` en `<html>` — correcto
- Cabeceras de seguridad: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` — todas configuradas vía `netlify.toml`

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| T1 | **Critical** | Todos los URLs devuelven el mismo HTML | `netlify.toml` redirige `/*` → `/index.html` con status 200. Todos los subrutas tienen `content-length: 1828943` idéntico. Google no recibe HTML diferenciado por página |
| T2 | **Critical** | Sin actualización de `<title>` en navegación | `window.navTo` cambia la vista pero nunca escribe `document.title`. La pestaña del navegador y los crawlers siempre leen "Radar Inmobiliario Madrid \| Precios y datos del mercado por distrito" |
| T3 | **Critical** | Sin actualización del canonical en sub-páginas | `<link rel="canonical" href="https://radarinmobiliario.com/">` es estático. `/distritos/salamanca` tiene canonical apuntando a `/` |
| T4 | **High** | Bundle HTML de 1,8 MB | El archivo único embebe todos los assets como Base64. El Time To Interactive real en 4G es estimado en >5 s. Google puede penalizar CWV |
| T5 | **High** | Sin `Content-Security-Policy` header | Las demás cabeceras de seguridad están pero falta CSP. Riesgo de XSS |
| T6 | **Medium** | Favicon solo como data URI inline | No existen ficheros `.png` en `/dist`. PWA manifest usa `src: "data:image/svg+xml,..."` — los dispositivos Android no pueden mostrar icon en pantalla inicio |
| T7 | **Medium** | Sitemap incluye 21 URLs de distritos sin contenido diferenciado | `/distritos/centro` y el resto devuelven el mismo HTML; Google podría detectar contenido duplicado |
| T8 | **Low** | `hreflang` sin `x-default` | Solo `hreflang="es"`. Google recomienda siempre añadir `x-default` |
| T9 | **Low** | Sin netlify `_redirects` de www → non-www | No comprobado si Netlify lo gestiona automáticamente — verificar |

---

## 2. Content Quality — Puntuación: 52/100

### Lo que funciona bien
- Datos reales y actualizados mensualmente (21 distritos, €/m², rentabilidad, variación)
- Noticias con fuentes explícitas (Colegios Notariales, Ayuntamiento de Madrid, Idealista)
- Página de Metodología con explicación de fuentes — buena señal E-E-A-T
- Artículo "Madrid Nuevo Norte" con cuerpo completo (~400 palabras), pull-quotes, datos clave
- Resúmenes de noticias en ~80–120 palabras con métricas numéricas específicas

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| C1 | **Critical** | 7 de 8 artículos sin cuerpo de texto | Solo `noticia-detalle.js` tiene un artículo con `body` completo (Madrid Nuevo Norte). El resto solo expone `resumen` (~100 palabras). Las páginas `/noticia/{slug}` son esencialmente thin content |
| C2 | **High** | Sin autor identificado en artículos | No hay byline ni firma de autor en ningún artículo. Google News y E-E-A-T penalizan ausencia de autoría. |
| C3 | **High** | Sin contenido estático crawleable en páginas de distrito | `/distritos/salamanca` no tiene texto H1/H2/párrafos servidos en el HTML inicial — todo se renderiza con JS. Google puede indexarlo pero tarda más |
| C4 | **Medium** | Imágenes de noticias desde Unsplash (externas) | Las fotos de artículos usan URLs de `images.unsplash.com`. Si Unsplash cambia URLs o elimina fotos, el sitio muestra imágenes rotas |
| C5 | **Medium** | Páginas /sobre y /legal no tienen URL propia | Son vistas client-side sin canonical ni meta tags propios. Google puede indexarlas bajo cualquier URL |
| C6 | **Low** | `foundingDate` en schema es solo año "2025" | Debería ser fecha ISO completa: `"2025-01-01"` |

---

## 3. On-Page SEO — Puntuación: 35/100

### Lo que funciona bien
- Título de portada optimizado: "Radar Inmobiliario Madrid | Precios y datos del mercado por distrito" (61 chars)
- Meta description descriptiva y con keywords: "Datos actualizados de precio €/m², rentabilidad y variación anual por distrito y barrio en Madrid." (99 chars)
- H1 dinámico presente en artículos y páginas de distrito (en JS)
- Links internos con atributos `href` válidos (crawleable aunque usen `window.navTo`)

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| O1 | **Critical** | Todas las páginas comparten title y meta description | Google ve el mismo title para `/`, `/distritos`, `/noticias`, `/distritos/salamanca`, etc. |
| O2 | **Critical** | Meta description no cambia por página | Los artículos de noticias no tienen su propio resumen como meta description |
| O3 | **High** | Sin breadcrumbs visibles ni BreadcrumbList schema | No existe componente de breadcrumb en ninguna página. Dificulta la comprensión de jerarquía |
| O4 | **High** | OG tags estáticos para todas las páginas | Compartir un artículo en redes sociales muestra el OG de la portada (imagen genérica, título de portada) |
| O5 | **Medium** | No hay links internos en el cuerpo de artículos | Los artículos no enlazan a páginas de distritos relevantes ni a otros artículos |
| O6 | **Low** | Twitter card sin `twitter:site` | Añadir `@handle` de Twitter si existe |

---

## 4. Schema / Structured Data — Puntuación: 50/100

### Lo que funciona bien
- `WebSite` schema con `SearchAction` (sitelinks searchbox potential)
- `NewsMediaOrganization` con `@id`, `areaServed`, `sameAs` Wikidata — muy bien
- `Dataset` schema completo: `variableMeasured`, `measurementTechnique`, `isBasedOn`, `license`, `spatialCoverage`
- Todos los schemas bien formados JSON-LD

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| S1 | **Critical** | Sin `NewsArticle` schema en páginas de artículos | Los artículos no inyectan `NewsArticle` JSON-LD. Google News requiere este schema para Rich Results |
| S2 | **High** | Sin `BreadcrumbList` schema | Ninguna página tiene breadcrumbs estructurados. Se pierde SERP rich snippet |
| S3 | **High** | `Dataset` schema en portada pero sin sub-schemas por distrito | Idealmente cada página de distrito tendría su propio `Dataset` o `Table` schema con los datos específicos |
| S4 | **Medium** | `NewsMediaOrganization.logo` apunta a `og-image.png` | El logo de la organización debería ser el logo real (no la imagen de portada). Usar un PNG cuadrado de 600x60 recomendado por Google |
| S5 | **Medium** | `SearchAction.urlTemplate` apunta a ruta inexistente | `?q={search_term_string}` en `/distritos` — verificar que el buscador responde a ese param |
| S6 | **Low** | `foundingDate: "2025"` — formato incompleto | ISO 8601 requiere `"2025-01-01"` |

---

## 5. Performance — Puntuación: 40/100

### Lo que funciona bien
- TTFB: **137 ms** — excelente (Netlify CDN)
- HTTP/2
- Respuesta comprimida (gzip/brotli gestionado por Netlify)
- `cache-control: public, max-age=0, must-revalidate` — correcto para contenido actualizable

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| P1 | **Critical** | HTML bundle de 1.828.943 bytes (~1,8 MB) | Todo el sitio en un solo archivo: React, Inter font (múltiples variantes), assets Base64, datos de 21 distritos. LCP estimado en >3 s en conexión media. Supera ampliamente el budget de 200 KB recomendado |
| P2 | **Critical** | Google AdSense `async` en `<head>` | El script de AdSense se carga en el `<head>` antes del contenido. Aunque es `async`, puede bloquear el rendering. Mover a final de body o usar `defer` |
| P3 | **High** | Contenido solo visible tras descomprimir y ejecutar JS | El bundle incluye Base64+gzip. La descompresión sucede en el navegador (`DecompressionStream`). En móviles lentos puede generar CLS y retraso de LCP |
| P4 | **High** | Fuentes Google Fonts cargadas en tiempo de ejecución | Inter cargada desde Google Fonts dentro del bundle JS. Añadir `<link rel="preconnect">` y `font-display: swap` en el HTML estático |
| P5 | **Medium** | Sin service worker activo | `manifest.json` presente pero sin SW que permita carga offline o cache inteligente |
| P6 | **Low** | `cache-control: max-age=0` — sin caché browser | Con `must-revalidate`, el navegador siempre verifica con el servidor. Subir `max-age=3600` para activos inmutables si se añaden hashes |

---

## 6. AI Search Readiness (GEO) — Puntuación: 60/100

### Lo que funciona bien
- `llms.txt` presente en `/llms.txt` — **excelente**
- Tabla de datos de 21 distritos en formato markdown en `llms.txt` — muy citable por ChatGPT/Perplexity
- Datos numéricos específicos (precio, rentabilidad, variación) — alta densidad de hechos verificables
- `robots.txt` permite todos los crawlers IA
- Dataset schema con fuentes citadas
- `NewsMediaOrganization` con Wikidata sameAs

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| G1 | **High** | `llms.txt` sin URLs de artículos individuales | El fichero no lista los artículos publicados con sus URLs. Los crawlers IA no saben que existen |
| G2 | **High** | Contenido principal solo en JS | ChatGPT Crawler, Perplexity Bot y Google AI Overviews pueden tener dificultades para extraer texto de la SPA si no ejecutan JS |
| G3 | **Medium** | `llms.txt` tiene macro de euríbor sin valor | "Euríbor 12 meses: referencia hipotecaria principal" — no da el valor actual. Debería ser "Euríbor 12m: 2,45 %" (dato real) |
| G4 | **Medium** | Sin sección `## Noticias recientes` en `llms.txt` | Añadir los 8 titulares con fecha y URL para que los LLMs citen artículos concretos |
| G5 | **Low** | Sin `llms-full.txt` para contenido expandido | Para sitios de datos, ofrecer un segundo fichero con datos completos de barrios (131) mejora la citabilidad |

---

## 7. Images & Media — Puntuación: 55/100

### Lo que funciona bien
- OG image: `/og-image.png` — **1200×630px, 75 KB** — dimensiones perfectas
- OG image presente en `og:image` y `twitter:image`
- Imágenes de noticias con ratio 16:9 correcto

### Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| I1 | **High** | Sin favicon `.ico` ni PNG en `/dist` | El favicon es una data URI SVG inline. Los navegadores más antiguos y las previsualizaciones de links no lo muestran correctamente. Añadir `favicon.ico` y `apple-touch-icon.png` (180×180) |
| I2 | **High** | PWA icons sin PNG | `manifest.json` usa `data:image/svg+xml` para los iconos. Play Store y Chrome OS requieren PNG 192×192 y 512×512 |
| I3 | **Medium** | Imágenes de noticias de Unsplash (externas) | Dependencia externa: si Unsplash cambia la URL o elimina la foto, el artículo queda sin imagen. Descargar y alojar las imágenes en `/dist/img/` |
| I4 | **Low** | Sin `alt` text verificable en imágenes de noticias | Al ser SPA no se puede comprobar sin ejecutar JS; revisar que `img alt` se rellena con el título de la noticia |

---

## Scoring Summary

| Categoría | Peso | Puntuación | Contribución |
|-----------|------|------------|--------------|
| Technical SEO | 22% | 45/100 | 9.9 |
| Content Quality | 23% | 52/100 | 11.9 |
| On-Page SEO | 20% | 35/100 | 7.0 |
| Schema / Structured Data | 10% | 50/100 | 5.0 |
| Performance (CWV) | 10% | 40/100 | 4.0 |
| AI Search Readiness | 10% | 60/100 | 6.0 |
| Images | 5% | 55/100 | 2.75 |
| **TOTAL** | **100%** | — | **46.55 → 47/100** |

---

## Nota arquitectural clave

El problema raíz de la mayoría de los issues críticos es la arquitectura SPA de un solo fichero. La solución de fondo sería mover a **SSG (Static Site Generation)**: generar un HTML independiente por cada URL con sus propios `<title>`, `<meta>`, `<canonical>` y JSON-LD en el `<head>`. Sin tocar el stack actual, una solución incremental viable es **añadir un step post-build** que clone `index.html` para cada ruta y sobrescriba el `<head>` con los datos correctos. Ver ACTION-PLAN.md para la propuesta detallada.
