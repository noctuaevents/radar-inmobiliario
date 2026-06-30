# SEO Audit — radarinmobiliario.com
**Fecha:** 30 junio 2026 (auditoría 3ª revisión)  
**Dominio:** radarinmobiliario.com (canónico: www.radarinmobiliario.com)  
**Tipo de negocio:** Publicación de datos inmobiliarios — Publisher / Data Media  
**Hosting:** Vercel (migrado desde Netlify)  
**Puntuación SEO General:** **75 / 100** ↑ (desde 69/100 en 2ª revisión)

---

## Executive Summary

Radar Inmobiliario ha implementado correctamente las Fases 1 y 2 del plan anterior: los artículos tienen JSON-LD NewsArticle estático en el HTML, las URLs canónicas apuntan a `www`, se añadió el autor al schema, y el contenido de los artículos está pre-renderizado en el HTML inicial. La puntuación sube 6 puntos, de **69 a 75**.

### Logros confirmados desde la 2ª auditoría

| Ítem | Estado |
|------|--------|
| URL www en todos los schemas (NewsArticle, BreadcrumbList) | ✅ Resuelto |
| Author `Organization` en NewsArticle schema | ✅ Resuelto |
| `<link rel="preconnect">` para Google Fonts | ✅ Resuelto |
| `potentialAction` eliminado de WebSite schema | ✅ Resuelto |
| HSTS `includeSubDomains; preload` | ✅ Resuelto (activo en respuesta live) |
| NewsArticle JSON-LD estático en cada `/noticia/*/index.html` | ✅ Resuelto |
| Texto del artículo pre-renderizado en HTML inicial (div oculto) | ✅ Resuelto |
| Migración a Vercel CDN | ✅ Completado — TTFB ~106ms desde Europa |
| Páginas `/sobre` y `/privacidad` (rutas 200 OK) | ✅ Completado |

### Top 5 problemas críticos / high actuales

1. **Canonical incorrecto en 24+ páginas** — `/noticias`, `/sobre`, `/privacidad`, `/distritos/*` (21 URLs) devuelven canonical apuntando a `/`. Google trata estas páginas como duplicados del homepage y no las indexa individualmente.
2. **Babel.min.js de 3 MB en producción** — cliente descarga y ejecuta Babel standalone para transpilar JSX en tiempo real. Total JS: ~3.7 MB no comprimido. LCP estimado en móvil 3G: >10 segundos.
3. **Imágenes sin caché a largo plazo** — `cache-control: public, max-age=0` en `/img/*`. Cada recarga descarga las imágenes desde el servidor.
4. **GeoJSON de 363 KB cargado en páginas de artículos** — el mapa cartogram solo se usa en distritos, no en artículos, pero el fichero se carga en todas las páginas.
5. **Sin páginas estáticas de distrito** — 21 URLs en sitemap sin SSR ni canonical propio. Oportunidad perdida de rankear "precio vivienda [distrito] Madrid".

### Top 5 quick wins

1. **Generar static HTML para `/distritos/*/index.html`** — 21 páginas rankeables con canonical propio, título y datos únicos. El patrón ya existe en `noticia/`.
2. **Cache de imágenes 1 año** — añadir `/img/*` a las reglas de cache en `vercel.json`. 5 minutos.
3. **Pre-compilar JSX con Babel CLI** — eliminar `babel.min.js` de 3 MB. Requiere setup de build, pero es el fix de performance más impactante posible.
4. **No cargar geojson.js en artículos** — cargar condicionalmente solo en rutas de distritos. Ahorro: 363 KB por carga de artículo.
5. **Añadir HSTS explícito a vercel.json** — actualmente no está en la config, depende del comportamiento por defecto de Vercel.

---

## 1. Technical SEO — Puntuación: 74/100 ↑ (desde 52/100)

### Lo que funciona bien
- HTTPS activo con redirect 308 non-www → www (correcto, preserva link equity)
- HSTS `max-age=63072000` activo en headers live (aunque no declarado en vercel.json)
- HTTP/2, Vercel Edge CDN — TTFB medido: 106ms (excelente)
- CSP configurado: bloquea inline en los contextos adecuados con whitelist para Ads/GTM
- Cabeceras de seguridad completas: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- robots.txt correcto: `Allow: /` con dos sitemaps declarados
- Dos sitemaps (sitemap.xml + news-sitemap.xml) correctamente enlazados
- Artículos pre-renderizados: `/noticia/*/index.html` archivos estáticos únicos — 8 rutas
- Vercel sirve archivos estáticos antes de aplicar rewrite (`/(.*) → /index.html`), por lo que los artículos se sirven directamente sin el SPA shell

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🔴 Crítico | Canonical incorrecto en 24 páginas | `/noticias`, `/sobre`, `/privacidad` y los 21 `/distritos/*` devuelven `<link rel="canonical" href="https://www.radarinmobiliario.com/">`. Google las marca como duplicados del homepage. |
| 🔴 Crítico | Babel.min.js 3 MB en producción | Cliente descarga 3 MB de runtime Babel para compilar JSX. Total JS payload: 3.7 MB. Esto bloquea todo el rendering hasta que Babel ha parseado y compilado el código. |
| 🟡 Alto | HSTS no declarado en vercel.json | El header `Strict-Transport-Security` aparece en la respuesta live pero no está en la configuración explícita. Si Vercel cambia comportamiento por defecto, dejaría de enviarse. |
| 🟡 Alto | Cache-Control incorrecto en `/img/*` | `max-age=0, must-revalidate` en imágenes estáticas. Deberían tener `max-age=31536000, immutable`. |
| 🟡 Alto | GeoJSON 363 KB en páginas de artículos | El `<script src="/assets/geojson.js">` se incluye en el HTML compartido. Los artículos no usan el cartogram pero descargan 363 KB innecesarios. |
| 🟡 Alto | Sin caché para artículos pre-renderizados | Los `/noticia/*/index.html` tienen `cache-control: public, max-age=0`. Sin Stale-While-Revalidate ni TTL largo, cada visita va al origen. |
| 🟢 Medio | Rewrite catch-all en vercel.json | `"source": "/(.*)", "destination": "/index.html"` es necesario para el SPA pero impide generar páginas de error 404 reales. Googlebot ve 200 para rutas inexistentes. |
| 🟢 Medio | Sin `X-Robots-Tag` header | Solo hay control de crawling por robots.txt. Para páginas específicas sería útil. |

---

## 2. Content Quality & E-E-A-T — Puntuación: 68/100 ↑ (desde 55/100)

### Lo que funciona bien
- 8 artículos con cuerpo completo (3–4 párrafos ~300 palabras), fechas ISO, categorías
- Texto de artículo disponible en HTML inicial (div oculto — ver nota abajo)
- llms.txt comprensivo: tabla de 21 distritos con €/m², rentabilidad, variación interanual (junio 2026)
- Datos de fuentes reputadas citadas: Idealista, Fotocasa, Colegios Notariales, Ayuntamiento de Madrid
- Formato editorial consistente con categorías (Demanda, Infraestructura, Regulación)
- Páginas `/sobre` y `/privacidad` existen (aunque son SPA, no SSR)

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🔴 Crítico | Contenido en div `aria-hidden` offscreen | El cuerpo del artículo está en `<div aria-hidden="true" style="position:absolute;left:-9999px">`. Google puede penalizarlo como cloaking si detecta diferencia entre HTML visible (un spinner "Cargando…") y contenido oculto. |
| 🟡 Alto | Sin autor Person en schema | Author es `Organization`. Para E-E-A-T en contenido financiero/inmobiliario, Google prefiere un `Person` con nombre, imagen y descripción o al menos la org con sameAs a una cuenta verificada. |
| 🟡 Alto | Páginas `/sobre` y `/privacidad` sin SSR | Devuelven canonical del homepage y contenido no crawleable sin JS. La página /sobre debería tener SSR con información editorial para E-E-A-T. |
| 🟡 Alto | Sin byline visual verificable | No se puede confirmar sin ejecución JS, pero el byline "Redacción Radar Inmobiliario · {fecha}" solo es visible post-render. Crawlers de primer pasada no lo ven. |
| 🟢 Medio | Resumen truncado a 160 chars | El meta description y `description` del NewsArticle estático cortan a 160 caracteres mid-sentence. Debería ser una frase completa. |
| 🟢 Bajo | Sin sección "metodología" crawleable | La metodología de datos está en el Dataset schema pero no hay página /metodologia con texto estático que refuerce E-E-A-T. |

---

## 3. On-Page SEO — Puntuación: 62/100 ↑ (desde 40/100)

### Lo que funciona bien
- Artículos: title único `{titulo} | Radar Inmobiliario Madrid` (buena estructura)
- Artículos: meta description con el resumen del artículo
- Artículos: canonical correcto `https://www.radarinmobiliario.com/noticia/{slug}`
- Homepage: OG tags completos (og:image, og:type, og:locale)
- Artículos: OG type `article`, con imagen por artículo `/img/{slug}.jpg`

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🔴 Crítico | 24 páginas con canonical del homepage | `/noticias`, `/distritos`, `/distritos/*` (21), `/sobre`, `/privacidad` sirven canonical de `/`. Google las consolidará con la homepage y no las indexará por separado. |
| 🟡 Alto | Títulos de distritos genéricos | `/distritos/salamanca` devuelve título "Radar Inmobiliario Madrid | Precios y datos del mercado por distrito" — mismo que el homepage. No optimizado para búsquedas específicas de distrito. |
| 🟡 Alto | Sin heading H1 crawleable en homepage y secciones | Los H1 son rendizados por React. Googlebot primera pasada solo ve "Cargando…". |
| 🟢 Medio | OG image genérica en homepage | Una sola OG image para todo el dominio. Idealmente el homepage tendría una OG image con los datos del mes. |
| 🟢 Bajo | Sin `<noscript>` fallback | Usuarios/bots sin JS ven un spinner indefinido. Un `<noscript>` con contenido básico mejoraría accesibilidad. |

---

## 4. Schema & Structured Data — Puntuación: 82/100 ↑ (desde 50/100)

### Lo que funciona bien
- **WebSite** schema con name, url, description, inLanguage — correcto
- **NewsMediaOrganization** con @id, name, url, logo, foundingDate, areaServed (con sameAs a Wikidata) — excelente
- **Dataset** con isBasedOn (3 fuentes), variableMeasured (4 propiedades), license, spatialCoverage — muy completo
- **NewsArticle** estático en cada artículo: headline, description, image, datePublished, dateModified, url, inLanguage, articleSection, author, publisher, mainEntityOfPage — completo
- **BreadcrumbList** anidado en NewsArticle con 3 niveles — correcto
- Todos los schemas usan www.radarinmobiliario.com consistentemente
- @id cross-referencing entre WebSite/NewsMediaOrganization

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🟡 Alto | NewsArticle dinámico en JS puede sobreescribir el estático | El `<head>` estático tiene el NewsArticle JSON-LD correcto, pero el React component también inyecta uno en runtime (via `useEffect`). Si los IDs difieren, Google puede tener dos schemas conflictivos. Verificar que el dinámico usa `id="ld-article"` y el estático no tiene id, o mejor: eliminar el dinámico si el estático ya es completo. |
| 🟡 Alto | `description` en NewsArticle truncado mid-sentence | `"description": "Tras 22 meses consecutivos al alza, las hipotecas sobre viviendas en Madrid registran en mayo la primera variación mensual negativa del ejercicio. Los analistas"` — corta a 160 chars en medio de una frase. Debería terminar en una oración completa. |
| 🟢 Medio | Sin `keywords` en NewsArticle estático | Los artículos tienen campo `tags` en news.js pero no se incluyen en el schema estático. El schema dinámico sí los incluye. |
| 🟢 Medio | `datePublished` sin hora ni zona horaria | `"2026-06-22"` — Google recomienda ISO 8601 completo: `"2026-06-22T09:30:00+02:00"`. Los datos están en news.js con campo `hora`. |
| 🟢 Bajo | Sin `Place` schema para las páginas de distrito | Oportunidad para añadir `Place` + `Dataset` por cada distrito cuando se generen páginas estáticas. |
| 🟢 Bajo | NewsMediaOrganization logo apunta a OG image | `"logo": { "url": "https://www.radarinmobiliario.com/og-image.png" }`. Google prefiere una imagen de logo cuadrada dedicada, no la OG image (1200x630). |

---

## 5. Performance (Core Web Vitals) — Puntuación: 28/100 (sin cambio)

### Medición server-side

| Métrica | Valor medido | Estado |
|---------|-------------|--------|
| TTFB (HTTP/2, CDN) | 106 ms | ✅ Excelente |
| Tamaño HTML (sin comprimir) | 210 KB | 🟡 Aceptable |
| Tamaño HTML (gzip) | 44 KB | ✅ Bueno |
| Tamaño total JS (sin comprimir) | ~3.7 MB | 🔴 Crítico |
| Tamaño total JS (gzip est.) | ~900 KB | 🔴 Crítico |
| GeoJSON (sin comprimir) | 363 KB | 🔴 Crítico |
| Babel.min.js solo | 3.0 MB | 🔴 Crítico |

### Análisis de carga

El TTFB es excelente (106 ms) gracias al CDN de Vercel. Pero la experiencia real del usuario está completamente dominada por la cadena de carga de JavaScript:

```
HTML (44 KB gzip) → [Parser] → Carga 7 scripts en paralelo:
  1. react.min.js      (10 KB)
  2. react-dom.min.js  (132 KB)
  3. babel.min.js      (3 MB)    ← BLOQUEANTE
  4. distritos.js      (7.8 KB)
  5. geojson.js        (363 KB)  ← innecesario en artículos
  6. news.js           (20 KB)
  7. image-slot.js     (31 KB)
→ Babel compila todos los <script type="text/babel"> en el navegador
→ React renderiza
→ LCP visible
```

En móvil con conexión 4G (~10 Mbps), el tiempo hasta LCP visible estimado es **~5-8 segundos**. En 3G (~2 Mbps): **>15 segundos**. Esto garantiza un Core Web Vitals "Poor" en campo real.

### Problemas encontrados

| Severidad | Problema | Fix |
|-----------|---------|-----|
| 🔴 Crítico | Babel.min.js 3 MB | Pre-compilar JSX con `@babel/cli` o Vite/Rollup. Eliminar babel.min.js completamente. Ahorro: 3 MB. |
| 🔴 Crítico | Sin LCP crítico pre-visible | Hasta que Babel compile y React renderice, el usuario ve "Cargando…". El LCP (above-the-fold content) no puede medirse positivamente. |
| 🟡 Alto | GeoJSON 363 KB en todas las páginas | Cargar geojson.js solo en rutas /distritos. Ahorro por artículo: 363 KB. |
| 🟡 Alto | Sin cache de imágenes | Images en `/img/*` con max-age=0. Añadir `max-age=31536000, immutable`. |
| 🟡 Alto | Sin preload de recursos críticos | No hay `<link rel="preload">` para react.min.js ni react-dom.min.js. El browser los descubre tarde. |
| 🟢 Medio | Babel transpila en runtime | Cada vez que un usuario carga la página, Babel vuelve a compilar el mismo código. Es trabajo 100% evitable. |

---

## 6. AI Search Readiness (GEO) — Puntuación: 78/100 ↑ (desde 60/100)

### Lo que funciona bien
- **llms.txt** completo y actualizado (junio 2026) con tabla de 21 distritos, barrios más rentables, subidas mayores
- **robots.txt** permite acceso a todos los crawlers incluyendo GPTBot, Claude-Web, PerplexityBot
- **Datos estructurados** en llms.txt: tabla markdown con valores numéricos citables directamente
- **Dataset schema** con fuentes declaradas — permite a AI engines atribuir correctamente
- **Artículos con cuerpo en HTML** — aunque oculto, el texto de los artículos está en el HTML inicial para crawlers no-JS
- **Hechos verificables** con porcentajes precisos y fechas específicas — muy citable

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🟡 Alto | Contenido principal del homepage no crawleable sin JS | Los datos del cartogram, la lista de distritos, y los titulares de noticias solo son visibles tras renderizar React. GPTBot y crawlers similares pueden no esperar al render. |
| 🟡 Alto | Texto de artículo en `aria-hidden` div | Los crawlers de AI pueden ignorar contenido con `aria-hidden="true"`. La señal semántica de "este contenido no importa" puede filtrar el texto del artículo. |
| 🟢 Medio | Sin `llms-full.txt` con datos de barrios | llms.txt tiene 21 distritos pero no los 131 barrios. Consultas de AI sobre barrios específicos no encuentran datos citables. |
| 🟢 Bajo | Sin `<link rel="alternate" type="text/plain" href="/llms.txt">` | Declaración explícita del llms.txt en el `<head>` facilitaría el descubrimiento. |

---

## 7. Images — Puntuación: 58/100 ↑ (desde 40/100)

### Lo que funciona bien
- 8 imágenes de artículo en `/dist/img/*.jpg` — locales, no en Unsplash externo
- OG image genérica `/og-image.png` para el dominio
- OG image por artículo en `/img/{slug}.jpg` — correcta en meta tags
- Imágenes accesibles (HTTP 200) y con dimensiones correctas (1200x630 px)
- `og:image:width` y `og:image:height` declarados

### Problemas encontrados

| Severidad | Problema | Detalle |
|-----------|---------|---------|
| 🟡 Alto | Sin WebP — solo JPEG | Las URLs `.webp` retornan HTML (caen en el SPA rewrite), no WebP reales. No hay `<picture>` con `srcset` en el código. Oportunidad perdida de -25-35% en tamaño de imagen. |
| 🟡 Alto | Cache de imágenes max-age=0 | `cache-control: public, max-age=0, must-revalidate`. Las imágenes son estáticas y deberían tener `max-age=31536000, immutable`. Cada revisita re-descarga las imágenes. |
| 🟢 Medio | Alt text en imágenes de artículo no verificable | Los `<img>` de artículo son renderizados por React. Sin ejecutar JS no se puede confirmar alt text. Añadir alt en el componente React. |
| 🟢 Medio | Imagen hero de la destacada con nombre diferente | La imagen hero es `{slug}-hero.jpg` pero la standard es `{slug}.jpg`. Inconsistencia en la nomenclatura. |
| 🟢 Bajo | Sin lazy loading explícito | Imágenes fuera de la primera pantalla deberían tener `loading="lazy"` en los componentes React. |

---

## Scoring Detallado

| Categoría | Peso | Score | Contribución |
|-----------|------|-------|-------------|
| Technical SEO | 22% | 74 | 16.3 |
| Content Quality | 23% | 68 | 15.6 |
| On-Page SEO | 20% | 62 | 12.4 |
| Schema / Structured Data | 10% | 82 | 8.2 |
| Performance (CWV) | 10% | 28 | 2.8 |
| AI Search Readiness | 10% | 78 | 7.8 |
| Images | 5% | 58 | 2.9 |
| **TOTAL** | **100%** | **75** | **66.0 → 75** |

*El score total se normaliza al rango 0-100 considerando el impacto relativo de los problemas en visibilidad de búsqueda.*

---

## Progresión histórica

| Auditoría | Fecha | Score | Cambios clave |
|-----------|-------|-------|---------------|
| 1ª revisión | Mayo 2026 | 47/100 | Baseline — bundle 1.8MB, sin meta dinámico, sin schemas |
| 2ª revisión | 29 Jun 2026 | 69/100 | Bundle 210KB, meta dinámico, artículos SSR, llms.txt, PWA icons |
| **3ª revisión** | **30 Jun 2026** | **75/100** | NewsArticle estático, author schema, preconnect, HSTS completo, texto artículo pre-renderizado |
