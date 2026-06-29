# Action Plan — radarinmobiliario.com
**Fecha:** 29 Jun 2026 | **Score actual:** 69/100 | **Objetivo:** 80/100

---

## Fase 1 — Quick Wins (1–2 días) · +4 pts estimados

### 1.1 Corregir URL www en schemas ⚡ 5 min
**Archivos:** `dist/index.html` (NewsArticle JS code + BreadcrumbList)
Cambiar `https://radarinmobiliario.com/` → `https://www.radarinmobiliario.com/` en:
- URL del NewsArticle: `"url": 'https://radarinmobiliario.com/noticia/' + ...`
- Publisher `@id`: `"https://radarinmobiliario.com/#organization"`
- mainEntityOfPage

**Impacto:** Elimina duplicación www/non-www en knowledge graph de Google.

### 1.2 Añadir `"author"` al NewsArticle schema ⚡ 15 min
**Archivo:** `dist/index.html` (en el JSON.stringify del NewsArticle)
```js
"author": {
  "@type": "Organization",
  "name": "Redacción Radar Inmobiliario Madrid",
  "url": "https://www.radarinmobiliario.com/sobre"
},
```
**Impacto:** E-E-A-T mejorado, requisito para Google News indexing.

### 1.3 Añadir preconnect para fuentes ⚡ 5 min
**Archivo:** template HTML head
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
**Impacto:** ~50 ms menos en LCP, mejora CWV.

### 1.4 Byline visual en artículos ⚡ 30 min
**Archivo:** `src/components/noticia-detalle.js`
Añadir debajo del título: `Por Redacción Radar Inmobiliario · {fecha}`
**Impacto:** E-E-A-T visual, señal de autoría para usuarios y crawlers.

### 1.5 Eliminar `potentialAction` del WebSite schema ⚡ 5 min
Hasta que el buscador esté implementado. Evita confundir a Google.

### 1.6 HSTS con flags completos ⚡ 5 min
**Archivo:** `netlify.toml`
```toml
Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
```

---

## Fase 2 — Impacto Alto (1 semana) · +5 pts estimados

### 2.1 NewsArticle JSON-LD estático en artículos 🔧 2–3h
Durante el `pipeline/build.py`, generar el JSON-LD de NewsArticle como `<script type="application/ld+json">` estático en el `<head>` de cada `/noticia/{slug}/index.html`.

Datos disponibles en `news.js`: `titulo`, `resumen`, `fechaISO`, `imagen`, `slug`, `categoria`.

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "{titulo}",
  "description": "{resumen[:200]}",
  "image": "https://www.radarinmobiliario.com/img/{slug}.jpg",
  "datePublished": "{fechaISO}",
  "url": "https://www.radarinmobiliario.com/noticia/{slug}",
  "inLanguage": "es",
  "author": {"@type":"Organization","name":"Redacción Radar Inmobiliario Madrid","url":"https://www.radarinmobiliario.com/sobre"},
  "publisher": {"@id":"https://www.radarinmobiliario.com/#organization"},
  "mainEntityOfPage": "https://www.radarinmobiliario.com/noticia/{slug}"
}
```

**Impacto:** Habilita Google News Rich Results sin necesidad de renderizar JS.

### 2.2 Texto del artículo estático en HTML 🔧 3–4h
En `pipeline/build.py`, añadir un `<noscript>` o `<script type="application/json">` con el texto del artículo para crawlers que no ejecutan JS. El body array de `news.js` contiene los párrafos ya disponibles.

**Impacto:** Passage-level indexing, mejor E-E-A-T, citabilidad por LLMs sin JS.

### 2.3 Imágenes WebP con fallback 🔧 1–2h
Generar versiones WebP en pipeline:
```python
from PIL import Image
img = Image.open('dist/img/slug.jpg')
img.save('dist/img/slug.webp', 'WEBP', quality=85)
```
Usar `<picture>` en componentes con WebP + JPEG fallback.
**Impacto:** −25–35% peso de imágenes, mejor LCP en móvil.

---

## Fase 3 — Contenido y Autoridad (mes 2) · +4 pts estimados

### 3.1 Páginas estáticas por distrito
Generar `/distritos/{slug}/index.html` con title único, meta description, JSON-LD Place/Dataset, y párrafo intro estático: "En {nombre}, el precio medio es {precio} €/m², rentabilidad {rent}%, variación +{var}%."

**Impacto:** 21 páginas rankeables individualmente en búsquedas "precio vivienda {distrito} Madrid".

### 3.2 Página /sobre con perfil editorial
- Misión del proyecto, metodología, dateline de lanzamiento
- `Person` o `Organization` schema ampliado

### 3.3 Política de privacidad real (RGPD)
Requerida por Beehiiv (newsletter) y Google AdSense. Incluir política de cookies.

### 3.4 llms-full.txt con 131 barrios
Expandir llms.txt con datos de barrios cuando el pipeline de barrios esté operativo.

---

## Fase 4 — Monitorización (ongoing)

- Google Search Console: Coverage, Core Web Vitals, Rich Results — revisar mensualmente
- PageSpeed Insights tras WebP + preconnect para medir LCP real
- Verificar Google News indexing tras NewsArticle estático (Rich Results Test)
- Actualizar llms.txt en cada edición mensual con datos frescos

---

## Resumen de impacto estimado

| Fase | Esfuerzo | Score proyectado |
|------|---------|-----------------|
| Baseline actual | — | 69/100 |
| Fase 1 Quick Wins | 1–2h | 73/100 |
| Fase 2 Alto Impacto | 1 semana | 78/100 |
| Fase 3 Contenido | Mes 2 | 82/100 |
