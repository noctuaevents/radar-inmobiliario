# Technical SEO — Findings
**Fecha:** 29 Jun 2026 | **Score:** 72/100

## Lo que funciona bien
- HTTPS + HSTS `max-age=63072000` (2 años) ✅
- HTTP/2, Vercel Edge CDN — TTFB < 50 ms ✅
- Cabeceras de seguridad completas: CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy ✅
- robots.txt correcto: `Allow: /`, referencias a ambos sitemaps ✅
- Bundle HTML: 210 KB (desde 1,8 MB — reducción del 88%) ✅
- Páginas estáticas pre-renderizadas para todos los artículos (`/noticia/{slug}/index.html`) ✅
- `hreflang="es"` y `x-default` en todas las páginas ✅
- Favicon: .ico + PNG 16/32/180/192/512 px en dist/ ✅
- manifest.json con theme-color ✅
- updatePageMeta() actualiza title/canonical/OG dinámicamente en navegación SPA ✅
- Sitemap: 3 páginas core + 21 distritos + 8 noticias + news-sitemap.xml ✅
- Imágenes de artículos en /img/ (local, no Unsplash externo) ✅

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| T1 | **High** | NewsArticle JSON-LD inyectado por JS | `document.createElement('script')` en useEffect — no está en el HTML estático. Googlebot lo ve solo tras renderizado JS. Retrasa elegibilidad para Google News Rich Results. |
| T2 | **High** | URL inconsistente en NewsArticle schema | Schema usa `https://radarinmobiliario.com/noticia/...` (sin www) pero canonical es `https://www.radarinmobiliario.com/`. Inconsistencia puede confundir a Google sobre la URL canónica del artículo. |
| T3 | **Medium** | Páginas de distrito sin pre-renderizado estático | `/distritos/salamanca` devuelve el mismo `index.html` de 210 KB que la portada. El contenido (precio, rentabilidad) solo aparece tras ejecutar React. Sin metadatos estáticos únicos por distrito. |
| T4 | **Medium** | CSP usa `unsafe-inline` en scripts | Necesario para React inline, pero permite XSS básico. Considerar migrar a nonces o hashes en v2. |
| T5 | **Low** | Sin `<link rel="preconnect">` para fuentes | `fonts.googleapis.com` y `fonts.gstatic.com` no tienen preconnect hint. Añadir ahorra ~50 ms en primer render. |
| T6 | **Low** | HSTS sin `preload` ni `includeSubDomains` | `max-age=63072000` sin flags adicionales. Para máxima protección: `max-age=63072000; includeSubDomains; preload`. |
| T7 | **Info** | CSP bloquea `connect-src 'self'` | Si en el futuro se añaden llamadas externas (Analytics, APIs), CSP necesitará actualización. Actualmente correcto para la arquitectura actual. |
