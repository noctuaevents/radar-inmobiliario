# SEO Audit — radarinmobiliario.com
**Fecha:** 29 junio 2026 (auditoría 2ª revisión)  
**Dominio:** radarinmobiliario.com  
**Tipo de negocio:** Publicación de datos inmobiliarios — Publisher/Data Media  
**Puntuación SEO General:** **69 / 100** ↑ (desde 47/100 en auditoría anterior)

---

## Executive Summary

Radar Inmobiliario Madrid ha experimentado una mejora significativa desde la auditoría anterior. Los tres problemas críticos originales — bundle de 1,8 MB, ausencia de metadatos por página y falta de cabeceras de seguridad — han sido resueltos. La puntuación sube de **47 a 69 puntos** (+22 puntos).

### Logros confirmados desde la última auditoría

| Problema anterior | Estado |
|------------------|--------|
| Bundle 1,8 MB | ✅ Resuelto — 210 KB (−88%) |
| Sin title/canonical dinámico | ✅ Resuelto — updatePageMeta() activo |
| Sin páginas estáticas por artículo | ✅ Resuelto — 8 `/noticia/slug/index.html` únicos |
| Sin CSP header | ✅ Resuelto — CSP configurado en netlify.toml |
| Sin hreflang x-default | ✅ Resuelto — presente en todos los heads |
| Favicon solo data URI | ✅ Resuelto — .ico + PNG 16/32/180/192/512 en dist/ |
| Imágenes en Unsplash externo | ✅ Resuelto — /img/ local para todos los artículos |
| foundingDate sin formato ISO | ✅ Resuelto — "2025-01-01" |
| Sin llms.txt | ✅ Resuelto — llms.txt comprensivo con tabla de distritos |
| Artículos sin cuerpo | ✅ Resuelto — 8 artículos con body (3–4 párrafos) |

### Top 5 problemas críticos / high actuales

1. **NewsArticle JSON-LD no es estático** — inyectado por JS, Google News lo ve solo tras render
2. **URL inconsistente en schemas** — NewsArticle usa non-www, canonical usa www
3. **Artículos sin texto crawleable en HTML inicial** — body renderizado por React, no pre-renderi
4. **Sin autor en artículos** — E-E-A-T débil para contenido financiero/inmobiliario
5. **Páginas de distrito sin contenido diferenciado** — 21 URLs en sitemap que devuelven mismo HTML

### Top 5 quick wins

1. **Añadir `"author"` al NewsArticle schema** — 15 min en el código JS, mejora E-E-A-T inmediatamente
2. **Corregir URL en schemas a www** — 5 min, una línea en el código
3. **Añadir `<link rel="preconnect">` para fuentes** — 2 líneas en index.html, ~50 ms de mejora LCP
4. **Mover NewsArticle JSON-LD al HTML estático por artículo** — 2–3h, habilita Google News Rich Results
5. **Byline visual mínimo en artículos** — "Redacción Radar Inmobiliario" + fecha visible en el artículo

---

## 1. Technical SEO — Puntuación: 72/100 ↑ (desde 45)

### Lo que funciona bien
- HTTPS + HSTS `max-age=63072000` (2 años)
- HTTP/2, Vercel Edge CDN — TTFB < 50 ms (medido: ~48 ms)
- Cabeceras de seguridad completas: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- robots.txt correcto — sin bloqueos accidentales
- Bundle HTML: **210 KB** (desde 1,8 MB, −88%)
- Páginas estáticas por artículo con head únicos (title + canonical + OG por artículo)
- `hreflang="es"` y `x-default` en todos los heads
- Favicon: .ico + PNG 16/32/180/192/512 px en dist/
- updatePageMeta() para navegación SPA dinámica

### Problemas

| # | Severidad | Problema | Fix |
|---|-----------|----------|-----|
| T1 | **High** | NewsArticle JSON-LD inyectado por JS | Embeber JSON-LD en HTML estático del artículo durante build |
| T2 | **High** | URL en schemas: `radarinmobiliario.com` vs `www.radarinmobiliario.com` | Cambiar a www en todas las referencias del schema |
| T3 | **Medium** | Páginas de distrito sin pre-render estático | Generar `/distritos/{slug}/index.html` con datos en el head durante build |
| T4 | **Medium** | CSP con `unsafe-inline` en scripts | Aceptable ahora; migrar a nonces en v2 |
| T5 | **Low** | Sin `<link rel="preconnect">` para fuentes | Añadir 2 líneas al `<head>` del template |
| T6 | **Low** | HSTS sin `includeSubDomains; preload` | Actualizar header en netlify.toml |

---

## 2. Content Quality — Puntuación: 63/100 ↑ (desde 52)

### Lo que funciona bien
- Dataset único: 21 distritos con precio €/m², rentabilidad y variación — diferencial de mercado
- 8 artículos con `body` completo (3–4 párrafos, ~300 palabras) en `news.js`
- Fuentes acreditadas: Idealista, Fotocasa, Colegios Notariales, Ayuntamiento
- Imágenes locales descriptivas en /img/ por slug

### Problemas

| # | Severidad | Problema | Fix |
|---|-----------|----------|-----|
| C1 | **High** | Body de artículo solo visible tras JS | Pre-renderizar artículos con texto estático durante build |
| C2 | **High** | Sin autor en artículos | Añadir byline "Redacción Radar" + `"author"` en schema |
| C3 | **Medium** | Páginas de distrito sin texto descriptivo | Generar párrafo intro estático con datos por distrito |
| C4 | **Medium** | Página /sobre sin contenido editorial | Añadir misión, metodología editorial, dateline |
| C5 | **Medium** | Sin política de privacidad real | Añadir política RGPD mínima en /legal |

---

## 3. On-Page SEO — Puntuación: 68/100 ↑ (desde 35)

### Lo que funciona bien
- Titles únicos por artículo con formato "[Titular] | Radar Inmobiliario Madrid"
- Meta descriptions de artículos únicas y con longitud correcta (~150 chars)
- OG tags diferenciados: `og:type=article` en artículos vs `og:type=website` en home
- OG image por artículo desde /img/{slug}.jpg
- Twitter Card `summary_large_image` configurado

### Problemas

| # | Severidad | Problema | Fix |
|---|-----------|----------|-----|
| OP1 | **Medium** | Títulos de distritos solo dinámicos (JS) | Sin HTML inicial diferenciado, Google puede indexar todos con el título de la portada |
| OP2 | **Medium** | Sin H1 visible en páginas de distrito pre-render | La estructura de headings existe en JS pero no en el HTML estático servido a crawlers |
| OP3 | **Low** | SearchAction en WebSite schema apunta a búsqueda no funcional | Desactivar `potentialAction` hasta implementar buscador real |

---

## 4. Schema & Structured Data — Puntuación: 65/100

### Schemas implementados (estáticos)
- **WebSite** con SearchAction ⚠️ (search no implementado)
- **NewsMediaOrganization** con foundingDate ISO, areaServed:Madrid/Wikidata ✅
- **Dataset** con fuentes, licencia, spatialCoverage, variableMeasured ✅

### Schemas implementados (JS dinámico)
- **NewsArticle** — inyectado por JS en artículos ⚠️

### Problemas

| # | Severidad | Problema | Fix |
|---|-----------|----------|-----|
| S1 | **High** | NewsArticle no estático | Embeber en HTML de artículo durante build |
| S2 | **High** | URL sin www en NewsArticle y publisher @id | Cambiar a `https://www.radarinmobiliario.com/` |
| S3 | **Medium** | Sin `"author"` en NewsArticle | `"author": {"@type":"Organization","name":"Redacción Radar Inmobiliario Madrid"}` |
| S4 | **Medium** | Sin schema por distrito | Añadir `Dataset` o `Place` por distrito en build |
| S5 | **Low** | SearchAction apunta a URL no funcional | Eliminar `potentialAction` hasta tener búsqueda |

---

## 5. Performance — Puntuación: 72/100 ↑ (desde ~40)

| Métrica | Estimación | Estado |
|---------|-----------|--------|
| TTFB | 48 ms | ✅ Excelente |
| Bundle HTML | 210 KB | ✅ Bueno |
| LCP (estimado) | 1.8–2.5 s | ⚠️ Límite |
| CLS (estimado) | < 0.1 | ✅ Bueno |
| INP | Sin medir | ❓ |

### Problemas
- Sin `<link rel="preconnect">` para Google Fonts (−50 ms LCP)
- Imágenes en JPEG sin WebP (−25–35% peso)
- Sin `fetchpriority="high"` en imagen hero

---

## 6. Sitemap — Puntuación: 74/100

### Lo que funciona bien
- 2 sitemaps (general + Google News) referenciados en robots.txt y enviados a GSC ✅
- news-sitemap.xml con ISO 8601 timestamps ✅
- Todos los URLs usan www ✅

### Problemas
- 21 URLs de distrito sin contenido diferenciado (riesgo de duplicate content)
- Sin sitemap de imágenes

---

## 7. AI Search Readiness (GEO) — Puntuación: 80/100

### Lo que funciona bien
- llms.txt comprensivo con tabla de 21 distritos, macrodatos, artículos con URLs ✅
- Licencia CC BY-NC 4.0 declarada ✅
- All AI bots en Allow: / ✅
- Dataset schema facilita AI Overview eligibility ✅

### Problemas
- Sin llms-full.txt con 131 barrios
- Artículos sin texto estático para passage-level indexing de LLMs

---

## Scoring por Categoría

| Categoría | Peso | Score | Pts |
|-----------|------|-------|-----|
| Technical SEO | 22% | 72 | 15.8 |
| Content Quality | 23% | 63 | 14.5 |
| On-Page SEO | 20% | 68 | 13.6 |
| Schema | 10% | 65 | 6.5 |
| Performance | 10% | 72 | 7.2 |
| AI Search (GEO) | 10% | 80 | 8.0 |
| Images | 5% | 72 | 3.6 |
| **TOTAL** | **100%** | — | **69.2** |

**SEO Health Score: 69 / 100**

---

## Evolución

| Fecha | Score | Cambio | Hitos clave |
|-------|-------|--------|------------|
| 29 Jun 2026 (v1) | 47/100 | — | Baseline |
| 29 Jun 2026 (v2) | **69/100** | **+22** | Bundle 210KB, artículos estáticos, CSP, llms.txt, imágenes locales |

---

*Próxima auditoría recomendada: agosto 2026 (tras implementar Fases 1–2 del action plan)*
