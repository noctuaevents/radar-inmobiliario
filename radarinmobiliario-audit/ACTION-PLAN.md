# Action Plan — radarinmobiliario.com
**Fecha:** 30 Jun 2026 | **Score actual:** 75/100 | **Objetivo:** 85/100

---

## Fase 1 — Quick Wins (1–3 horas) · +4 pts estimados

### 1.1 Cache de imágenes a 1 año ⚡ 5 min
**Archivo:** `vercel.json`

Añadir regla de cache para `/img/*`:
```json
{
  "source": "/img/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```
**Impacto:** Imágenes cacheadas indefinidamente en navegador y CDN. Mejora LCP en revisitas.

---

### 1.2 HSTS explícito en vercel.json ⚡ 5 min
**Archivo:** `vercel.json`

Añadir a los headers globales:
```json
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
```
**Impacto:** Garantiza HSTS independientemente del comportamiento por defecto de Vercel.

---

### 1.3 Fecha ISO completa en NewsArticle estático ⚡ 30 min
**Archivo:** `pipeline/build.py` (generador de `/noticia/*/index.html`)

Cambiar `"datePublished": "{fechaISO}"` → `"datePublished": "{fechaISO}T{hora}:00+02:00"`

Los campos `fechaISO` y `hora` ya están en `news.js`. También actualizar el resumen que se usa como `description` para que termine en frase completa (buscar el último punto antes del char 200).

**Impacto:** Schema NewsArticle más preciso, mejor elegibilidad para Google News Rich Results.

---

### 1.4 Eliminar schema NewsArticle dinámico (duplicado) ⚡ 20 min
**Archivo:** `src/components/noticia-detalle.js`

El componente React inyecta un NewsArticle JSON-LD en runtime (`useEffect`). El HTML estático ya tiene uno completo en el `<head>`. Eliminar el useEffect que inserta el schema dinámico para evitar duplicación y conflictos.

**Impacto:** Schema limpio, sin riesgo de que Google vea dos schemas conflictivos por artículo.

---

### 1.5 Preload de React y React-DOM ⚡ 15 min
**Archivo:** plantilla HTML del head (en `pipeline/build.py` o la plantilla base)

```html
<link rel="preload" href="/assets/react.min.js" as="script">
<link rel="preload" href="/assets/react-dom.min.js" as="script">
```
**Impacto:** El browser descubre y descarga React antes de parsear el `<body>`. ~100-200ms mejora en LCP.

---

## Fase 2 — Impacto Alto (2–5 días) · +5 pts estimados

### 2.1 Páginas estáticas de distrito ⚡🔧 3–4h
**Archivo:** `pipeline/build.py`

Generar `/dist/distritos/{slug}/index.html` para los 21 distritos. Patrón ya establecido en `noticia/`. Cada página debe tener:

```html
<title>Precio vivienda en {nombre}: {precio} €/m² | Radar Inmobiliario Madrid</title>
<meta name="description" content="Precio medio {precio} €/m², rentabilidad {rent}% y variación {var}% en {nombre}, Madrid. Datos junio 2026.">
<link rel="canonical" href="https://www.radarinmobiliario.com/distritos/{slug}">
```

Y JSON-LD estático:
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Precios inmobiliarios en {nombre}, Madrid",
  "description": "Precio medio {precio} €/m², rentabilidad bruta {rent}%, variación interanual {var}% en el distrito {nombre} de Madrid. Datos junio 2026.",
  "spatialCoverage": { "@type": "Place", "name": "{nombre}, Madrid" },
  "dateModified": "2026-06-29",
  "creator": { "@id": "https://www.radarinmobiliario.com/#organization" }
}
```

**Impacto:** 21 páginas nuevas indexables individualmente para búsquedas "precio vivienda [distrito] Madrid". Elimina el canonical incorrecto que duplicaba todas con el homepage.

---

### 2.2 Fix canonical de /noticias (SSR o static) ⚡🔧 1–2h
**Archivo:** `pipeline/build.py` o crear `dist/noticias/index.html`

Generar una página estática para `/noticias/` con canonical correcto y lista de artículos en HTML. O como mínimo, modificar la plantilla base para que cuando se sirva como `/noticias/index.html` use el canonical correcto.

Mismo approach para `/sobre/index.html` y `/privacidad/index.html`.

**Impacto:** 3 páginas adicionales indexables con canonical correcto.

---

### 2.3 WebP con `<picture>` en artículos 🔧 2–3h
**Archivo:** `pipeline/build.py` + componente React de imagen

Paso 1 — generar WebP en el pipeline:
```python
from PIL import Image
for jpg in glob.glob('dist/img/*.jpg'):
    img = Image.open(jpg)
    img.save(jpg.replace('.jpg', '.webp'), 'WEBP', quality=85)
```

Paso 2 — en el HTML estático de artículo, usar `<picture>`:
```html
<picture>
  <source srcset="/img/{slug}.webp" type="image/webp">
  <img src="/img/{slug}.jpg" alt="{titulo}" width="1200" height="630" loading="lazy">
</picture>
```

Paso 3 — añadir cache de 1 año para `/img/*.webp` en vercel.json.

**Impacto:** -25–35% peso de imágenes. Mejora LCP en Chrome/mobile. Alt text explícito.

---

### 2.4 No cargar geojson.js en artículos 🔧 2h
**Archivo:** plantilla HTML / lógica de generación en `pipeline/build.py`

Las páginas de artículo (`/noticia/*/index.html`) no necesitan el cartogram. Eliminar `<script src="/assets/geojson.js">` del template de artículo.

**Impacto:** Ahorro de 363 KB por carga de artículo. Mejora significativa de LCP en artículos.

---

## Fase 3 — Contenido y Autoridad (semana 2–4) · +4 pts estimados

### 3.1 Resolver cloaking del div oculto de artículos
**Archivo:** `pipeline/build.py` + template de artículo

El texto del artículo está en `<div aria-hidden="true" style="position:absolute;left:-9999px">`. Esto es borderline cloaking. Alternativas:

**Opción A (recomendada):** Incluir el texto en un `<main>` visible pero visualmente estilizado como "versión texto plano". Con CSS se puede ocultar visualmente con un diseño que renderice el JS por encima, pero el HTML es accesible.

**Opción B:** Usar `<noscript>` tag con el contenido — garantiza que Google lo trate como fallback legítimo, no como cloaking.

**Impacto:** Elimina riesgo de penalización por cloaking. Mejora passage-level indexing.

---

### 3.2 Página /sobre con contenido estático E-E-A-T
Generar `dist/sobre/index.html` con:
- Descripción de la publicación (quiénes somos, metodología)
- Fecha de fundación (2025)
- Schema `Person` o `Organization` expandido con sameAs a redes verificables
- Byline: "Redacción Radar Inmobiliario Madrid"

**Impacto:** E-E-A-T mejorado para contenido financiero/inmobiliario.

---

### 3.3 Pre-compilar JSX (eliminar Babel 3 MB) 🔧 1 día
**Archivo:** sistema de build

Configurar Vite o el Babel CLI para pre-compilar los `<script type="text/babel">` en JavaScript estándar durante el build. Eliminar `babel.min.js` (3 MB) y los type="text/babel".

```bash
# Ejemplo con Vite
npm create vite@latest -- --template react
# Migrar componentes JSX → archivos .jsx
# Output: dist/assets/bundle.[hash].js ~150 KB (vs 3 MB Babel)
```

**Impacto:** El fix de performance más grande posible. Potencialmente -3 MB de JS = mejora de LCP de 5-10 segundos en móvil. Pasaría de "Poor" a "Good" en CWV.

---

### 3.4 llms-full.txt con datos de barrios
Cuando el pipeline de barrios esté operativo, expandir llms.txt con los 131 barrios de Madrid y sus datos. Actualizar en cada edición mensual.

---

## Fase 4 — Monitorización (ongoing)

- **Google Search Console** — Coverage report tras generar páginas de distrito (indexación en 2–4 semanas)
- **Rich Results Test** — Verificar NewsArticle en artículos tras eliminar schema dinámico duplicado
- **PageSpeed Insights** — Medir LCP real tras WebP + preload + geojson condicional
- **CrUX / Field Data** — Revisar tras tener tráfico suficiente (~28 días de datos)
- **Actualizar llms.txt** en cada edición mensual con datos frescos

---

## Resumen de impacto estimado

| Fase | Esfuerzo | Score proyectado |
|------|---------|-----------------|
| Baseline actual | — | 75/100 |
| Fase 1 Quick Wins | 1–2h | 79/100 |
| Fase 2 Alto Impacto | 2–5 días | 84/100 |
| Fase 3 Contenido + Build | Semana 2–4 | **87/100** |

---

## Tabla de prioridad compacta

| # | Acción | Esfuerzo | Score delta | Prioridad |
|---|--------|---------|------------|-----------|
| 1 | Cache imágenes 1 año (vercel.json) | 5 min | +0.5 | 🔴 Ya |
| 2 | HSTS explícito en vercel.json | 5 min | +0.3 | 🔴 Ya |
| 3 | Fecha ISO completa en NewsArticle | 30 min | +0.5 | 🔴 Ya |
| 4 | Eliminar schema NewsArticle dinámico | 20 min | +0.5 | 🔴 Ya |
| 5 | Preload React/React-DOM | 15 min | +0.3 | 🟡 Esta semana |
| 6 | Páginas estáticas de distrito (21) | 3–4h | +2.5 | 🟡 Esta semana |
| 7 | Fix canonical /noticias + /sobre + /privacidad | 1–2h | +1.0 | 🟡 Esta semana |
| 8 | WebP + picture en artículos | 2–3h | +1.0 | 🟡 Esta semana |
| 9 | No cargar GeoJSON en artículos | 2h | +0.5 | 🟡 Esta semana |
| 10 | Resolver div oculto (cloaking) | 2h | +1.0 | 🟠 Semana 2 |
| 11 | Página /sobre con E-E-A-T estático | 2h | +1.0 | 🟠 Semana 2 |
| 12 | Pre-compilar JSX (eliminar Babel 3 MB) | 1 día | +5.0 | 🟠 Semana 3 |
