# Schema & Structured Data — Findings
**Fecha:** 29 Jun 2026 | **Score:** 65/100

## Schemas presentes (estáticos en HTML inicial)
1. **WebSite** — con `SearchAction` (`urlTemplate` apunta a `/distritos?q=`) ✅
2. **NewsMediaOrganization** — con `foundingDate: "2025-01-01"`, `areaServed: Madrid/Wikidata` ✅
3. **Dataset** — con fuentes, licencia CC BY-NC 4.0, `spatialCoverage`, `variableMeasured` ✅

## Schemas presentes (inyectados por JS)
4. **NewsArticle** — por artículo via `document.createElement('script')` en useEffect ⚠️
5. **BreadcrumbList** — por artículo via useEffect (no confirmado en HTML pero referenciado en memoria)

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| S1 | **High** | NewsArticle no es estático | Se crea con `document.createElement('script')` — Googlebot lo renderiza pero Google News necesita schema estático para Rich Results inmediatos. Añadir el JSON-LD al pre-render de cada artículo estático resolvería esto. |
| S2 | **High** | URL en NewsArticle sin www | `"url": "https://radarinmobiliario.com/noticia/..."` vs canonical `https://www.radarinmobiliario.com/noticia/...`. Google puede crear duplicate entries en knowledge graph. Cambiar a `https://www.radarinmobiliario.com/`. |
| S3 | **High** | Publisher en NewsArticle usa non-www `@id` | `"@id": "https://radarinmobiliario.com/#organization"` vs NewsMediaOrganization declarado en `https://www.radarinmobiliario.com/#organization`. @id debe ser consistente. |
| S4 | **Medium** | Sin `"author"` en NewsArticle | `"author"` field ausente. Google News requiere autor para clasificación. Mínimo: `"author": {"@type":"Organization","name":"Redacción Radar Inmobiliario Madrid"}`. |
| S5 | **Medium** | Sin schema por página de distrito | Cada `/distritos/{slug}` debería tener un `RealEstateListing` o `Dataset` específico con `name`, `description`, y datos del distrito para rich results de datos inmobiliarios. |
| S6 | **Low** | `WebSite.potentialAction` apunta a `/distritos?q=` | La búsqueda no está implementada (herramienta anunciada, sin funcionalidad). El `SearchAction` schema es técnicamente válido pero la URL target no hace nada. Riesgo de penalización por experiencia de usuario. |
| S7 | **Low** | Sin `dateModified` distinto a `datePublished` | En artículos, `dateModified` = `datePublished`. Cuando se actualice contenido, deberían diferenciarse para señal de frescura. |
