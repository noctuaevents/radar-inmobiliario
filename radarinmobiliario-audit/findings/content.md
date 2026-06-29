# Content Quality — Findings
**Fecha:** 29 Jun 2026 | **Score:** 63/100

## Lo que funciona bien
- Datos reales: 21 distritos con precio €/m², rentabilidad y variación — dataset único en su nicho ✅
- 8 artículos publicados con `body` (3–4 párrafos ~300 palabras c/u) en `news.js` ✅
- Imágenes locales en /img/ con nombres descriptivos por slug ✅
- Fuentes explícitas: Idealista, Fotocasa, Colegios Notariales, Ayuntamiento de Madrid ✅
- llms.txt comprensivo: tabla de 21 distritos, macrodatos junio 2026, 8 artículos con URLs ✅
- `inLanguage: "es"` declarado en todos los schemas ✅
- Meta descriptions únicas por artículo (truncadas a 160 chars) ✅

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| C1 | **High** | Cuerpo de artículo solo visible tras JS | El HTML inicial del artículo no contiene texto crawleable. El `body` array se renderiza con React. Googlebot lo ve solo en 2ª ronda de indexación (Googlebot renderiza JS, pero con retraso). |
| C2 | **High** | Sin autor identificado en artículos | Sin byline ni firma. Google News y E-E-A-T penalizan ausencia de autoría. Añadir `"author"` al NewsArticle schema y un byline visual mínimo ("Redacción Radar Inmobiliario") mejoraría señales E-E-A-T. |
| C3 | **Medium** | Páginas de distrito sin texto estático | `/distritos/salamanca` no tiene párrafos descriptivos únicos, H1, ni contenido diferenciado del HTML inicial. El crawler ve el mismo `<div id="root"></div>` en todos los distritos. |
| C4 | **Medium** | Sin página /sobre con perfil real | La vista `/sobre` existe como SPA pero no tiene nombre del equipo editorial, LinkedIn, ni señales de expertise. Clave para E-E-A-T en sector financiero/inmobiliario. |
| C5 | **Medium** | Sin política de privacidad real (RGPD) | La vista `/legal` existe pero sin contenido de privacidad sustancial. Beehiiv requiere política de privacidad. |
| C6 | **Low** | `og:description` truncada en 160 chars | No crítico, pero LinkedIn y Twitter pueden cortar antes. Optimizar para 120 chars en artículos más impactantes. |
| C7 | **Info** | Municipios-metropolitanos-alza-4-1: imagen de card solo | Tiene `municipios-metropolitanos-alza-4-1.jpg` pero no versión `-hero.jpg`. Solo hipotecas-madrid-22-meses tiene hero separada. Consistencia opcional. |
