# Sitemap — Findings
**Fecha:** 29 Jun 2026 | **Score:** 74/100

## Lo que funciona bien
- Sitemap enviado a Google Search Console ✅
- Dos sitemaps: `sitemap.xml` (general) + `news-sitemap.xml` (Google News) ✅
- Ambos referenciados en robots.txt ✅
- `news-sitemap.xml`: 8 artículos con `<news:publication_date>` en ISO 8601 + timezone ✅
- `<lastmod>` actualizado en cada publicación ✅
- `<priority>` correctamente jerarquizada: 1.0 home → 0.9 core → 0.8 distritos → 0.7 noticias ✅
- Todos los sitemap URLs usan `https://www.radarinmobiliario.com/` (con www) ✅

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| SM1 | **Medium** | 21 URLs de distrito en sitemap sin contenido diferenciado estático | `/distritos/centro` y similares devuelven el mismo HTML que `/`. Google puede detectarlas como duplicadas al no encontrar contenido único en el HTML inicial. Considerar eliminarlas del sitemap hasta tener pre-renders estáticos por distrito. |
| SM2 | **Medium** | Sin sitemap index file | Con 2 sitemaps, un sitemap index (`sitemap-index.xml`) sería más escalable. No crítico aún pero conveniente para cuando se añadan más secciones. |
| SM3 | **Low** | `<changefreq>monthly</changefreq>` en artículos | Una vez publicados, los artículos no cambian. Usar `never` o `monthly` es correcto, pero si se actualiza el body de artículos debería ser `weekly`. |
| SM4 | **Low** | `news-sitemap.xml` incluye solo 8 artículos | Google News Sitemap recomienda incluir todos los artículos de las últimas 48h con prioridad, y artículos de hasta 2 días para inclusión en Google News. A medida que se publiquen más artículos, el news-sitemap debería limitarse a los más recientes (< 2 días). |
| SM5 | **Info** | Sin sitemap de imágenes | Los artículos tienen imágenes en /img/ que no están declaradas en `<image:image>` dentro del sitemap. Google Image Sitemap puede aumentar visibilidad. |
