# Plan de Acción SEO — radarinmobiliario.com
**Prioridad:** Critical → High → Medium → Low

---

## Fase 1: Critical Fixes (Esta semana — 1–2 días de trabajo)

### 1.1 Añadir `document.title` + meta canonical dinámicos en el router
**Issue:** T2, T3, O1, O2, O4  
**Impacto:** Permite que Google indexe cada página con su propio título y canonical  
**Esfuerzo:** ~3 horas

Añadir en `window.navTo` (o donde se gestione la navegación):
```js
function updatePageMeta({ title, description, canonical, ogTitle, ogDesc }) {
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('link[rel="canonical"]').href = canonical;
  document.querySelector('meta[property="og:url"]').content = canonical;
  document.querySelector('meta[property="og:title"]').content = ogTitle || title;
  document.querySelector('meta[property="og:description"]').content = ogDesc || description;
  document.querySelector('meta[name="twitter:title"]').content = ogTitle || title;
  document.querySelector('meta[name="twitter:description"]').content = ogDesc || description;
}
```

Llamar en cada ruta:
- `/` → título actual de portada
- `/distritos` → "Distritos de Madrid: precio €/m² y rentabilidad | Radar Inmobiliario"
- `/distritos/{slug}` → "Precio vivienda en {Nombre}: {€/m²} €/m² — Radar Inmobiliario Madrid"
- `/noticias` → "Noticias del mercado inmobiliario de Madrid | Radar Inmobiliario"
- `/noticia/{slug}` → `article.titulo + " | Radar Inmobiliario Madrid"`
- `/metodologia` → "Metodología de datos | Radar Inmobiliario Madrid"
- `/legal` → "Aviso Legal y Privacidad | Radar Inmobiliario Madrid"

---

### 1.2 Inyectar `NewsArticle` JSON-LD en artículos
**Issue:** S1  
**Impacto:** Habilita Rich Results en Google News y Discover  
**Esfuerzo:** ~2 horas

En `NoticiaDetalleDynamic`, añadir un `useEffect` que inyecte en `<head>`:
```js
useEffect(() => {
  const existing = document.getElementById('ld-article');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = 'ld-article';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.titulo,
    "description": article.resumen,
    "datePublished": article.fecha,    // convertir a ISO 8601
    "dateModified": article.fecha,
    "image": article.imagen,
    "url": `https://radarinmobiliario.com/noticia/${article.slug}`,
    "inLanguage": "es",
    "publisher": { "@id": "https://radarinmobiliario.com/#organization" },
    "mainEntityOfPage": `https://radarinmobiliario.com/noticia/${article.slug}`,
    "articleSection": article.categoria,
    "keywords": article.tags?.join(', ')
  });
  document.head.appendChild(script);
  return () => document.getElementById('ld-article')?.remove();
}, [article.slug]);
```

---

### 1.3 Añadir `x-default` a hreflang
**Issue:** T8  
**Esfuerzo:** 5 minutos  
En `index.html` (y en el output de `pipeline/build.py`):
```html
<link rel="alternate" hreflang="es" href="https://radarinmobiliario.com/">
<link rel="alternate" hreflang="x-default" href="https://radarinmobiliario.com/">
```

---

### 1.4 Añadir `Content-Security-Policy` en `netlify.toml`
**Issue:** T5  
**Esfuerzo:** 15 minutos  
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://radarinmobiliario.com; connect-src 'self'; frame-src https://googleads.g.doubleclick.net;"
```
Ajustar según los recursos reales cargados.

---

## Fase 2: High-Impact Improvements (Semanas 2–3)

### 2.1 Reducir el bundle HTML a <300 KB
**Issue:** P1, P3  
**Impacto:** Mejora LCP, reduce coste de indexación para Google  
**Esfuerzo:** 1–2 días de refactoring del pipeline

Opciones ordenadas por esfuerzo:

**Opción A (recomendada, bajo riesgo):** Step post-build de generación de HTML por ruta  
Modificar `pipeline/build.py` para generar un `index.html` por cada URL con el `<head>` correcto, y mover los assets JS/CSS a ficheros separados referenciados con `<script src="...">`. Netlify servirá el fichero correcto por ruta.

**Opción B (mayor refactoring):** Convertir a Vite + React con code splitting  
Abandonar el bundler custom y usar Vite. Cada ruta carga solo su chunk. Trabajo de ~2–3 días.

---

### 2.2 Añadir `BreadcrumbList` schema
**Issue:** S2, O3  
**Esfuerzo:** 1 hora

Inyectar en cada página de detalle (noticia, distrito):
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://radarinmobiliario.com/"},
    {"@type": "ListItem", "position": 2, "name": "Noticias", "item": "https://radarinmobiliario.com/noticias"},
    {"@type": "ListItem", "position": 3, "name": "{titulo artículo}"}
  ]
}
```

---

### 2.3 Completar cuerpo de artículos
**Issue:** C1  
**Impacto:** E-E-A-T, tiempo en página, thin content risk  
**Esfuerzo:** Editorial — añadir campo `body` en `news.js` para los 7 artículos restantes

Estructura mínima por artículo: 3–5 párrafos (~300–500 palabras), 1 pullquote, datos clave.  
Añadir campo `body` en `news.js` y actualizar `NoticiaDetalleDynamic` para renderizarlo.

---

### 2.4 Añadir byline / autoría en artículos
**Issue:** C2  
**Esfuerzo:** 30 min de código + decisión editorial  
Añadir "Redacción Radar Inmobiliario" o nombre del editor. Incluir en `NewsArticle` schema como `author`.

---

### 2.5 Actualizar `llms.txt` con artículos y datos completos
**Issue:** G1, G3, G4  
**Esfuerzo:** 20 minutos

Añadir sección:
```markdown
## Noticias recientes

- [Hipotecas en Madrid: 22 meses al alza y el mejor abril desde 2010](https://radarinmobiliario.com/noticia/hipotecas-madrid-22-meses-alza-abril-2010) — 22 Jun 2026
- [La firma de hipotecas en Madrid frena: primera caída mensual del año](https://radarinmobiliario.com/noticia/hipotecas-madrid-frena-primera-caida-mensual) — 22 Jun 2026
...
```

Actualizar "Euríbor 12 meses: referencia hipotecaria principal" con el valor real.

---

### 2.6 Añadir favicon PNG y PWA icons
**Issue:** T6, I1, I2  
**Esfuerzo:** 1 hora

Generar desde el SVG existente:
- `favicon.ico` (32×32)
- `apple-touch-icon.png` (180×180)
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Actualizar `manifest.json` y `<head>` del HTML.

---

### 2.7 Mover imágenes de Unsplash a `/dist/img/`
**Issue:** I3  
**Esfuerzo:** Modificar `pipeline/fetch_news.py` para descargar y guardar imágenes localmente

---

## Fase 3: Content & Authority (Mes 2)

### 3.1 Añadir `Dataset` schema por página de distrito
Cada `/distritos/{slug}` debería inyectar un schema con los datos específicos del distrito.

### 3.2 Crear `og-image` dinámica por artículo
Generar OG images por artículo en build time con los datos de precio/titular. Puede hacerse con `node-canvas` o Playwright en el pipeline.

### 3.3 Newsletter con backend (Beehiiv)
Conectar el formulario actual (`handleNlSubmit` en `home-variation-d.js`) a la API de Beehiiv.

### 3.4 Links internos en artículos
Enlazar cada artículo a las páginas de distrito mencionadas (ya existen como rutas `/distritos/{slug}`).

### 3.5 Datos de barrios en llms.txt
Añadir la tabla de 131 barrios (ya en `src/data/distritos.js`) al llms.txt para citabilidad completa.

---

## Fase 4: Monitoring & Iteration (Ongoing)

- Revisar GSC semanalmente: indexación, CTR, queries de posición 11–20 para push
- Monitorizar `sitemapindex` en GSC — verificar que las páginas de distrito se indexan correctamente
- Configurar alertas de CWV en GSC (cuando haya suficiente tráfico para datos de campo)
- Ejecutar este audit mensualmente tras cada edición de datos

---

## Resumen de impacto estimado por fase

| Fase | Esfuerzo | Impacto SEO |
|------|----------|-------------|
| Fase 1 (Critical) | ~6h | +15–20 puntos en On-Page y Technical |
| Fase 2 (High) | ~2 días | +10–15 puntos en Contenido y Schema |
| Fase 3 (Content) | ~1 semana | +5–10 puntos; habilita Google News Rich Results |
| Fase 4 (Ongoing) | recurrente | Mantener + mejora gradual de autoridad |

Puntuación objetivo tras Fases 1+2: **65–70 / 100**
