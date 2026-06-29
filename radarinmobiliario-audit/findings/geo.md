# GEO & AI Search Readiness — Findings
**Fecha:** 29 Jun 2026 | **Score:** 80/100

## Lo que funciona bien
- **llms.txt**: comprensivo con tabla de 21 distritos (€/m², rentabilidad, variación), macrodatos junio 2026, barrios más rentables/caros/subidas, 8 artículos con URLs directas ✅
- **Licencia CC BY-NC 4.0**: declarada en llms.txt y Dataset schema — facilita citación por LLMs ✅
- **Datos estructurados en texto plano**: llms.txt usa Markdown table — óptimo para extracción por LLMs ✅
- **Dataset schema**: permite a Google AI Overviews identificar el contenido como datos verificables ✅
- **Fuentes declaradas**: Idealista, Fotocasa, Notariado, Ayuntamiento — señal de autoridad ✅
- **URLs directas a artículos** en llms.txt con fecha y categoría ✅
- **Euríbor 2,52%** y macrodatos incluidos — datos de alta citable por ChatGPT/Perplexity ✅

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| G1 | **Medium** | Sin llms-full.txt | Los LLMs crawlers (GPTBot, Claude-Web, PerplexityBot) priorizan `llms-full.txt` para contexto completo. Crear versión expandida con todos los datos de barrios (131) cuando estén disponibles. |
| G2 | **Medium** | Artículos sin texto crawleable estático | Para que Perplexity y ChatGPT citen párrafos específicos, necesitan texto en el HTML inicial (passage-level indexing). El body de artículos se renderiza con JS. |
| G3 | **Low** | Sin `robots.txt` allowlist explícita para AI bots | GPTBot, ClaudeBot, PerplexityBot están permitidos (Allow: /), pero no hay `Allow` explícito. Considera añadir comentario documentando la política. |
| G4 | **Low** | Datos de barrios ausentes en llms.txt | llms.txt tiene distritos pero no los 131 barrios. Los datos de barrios son el valor diferencial del sitio — incluirlos en llms-full.txt cuando estén disponibles. |
| G5 | **Info** | Sin menciones de marca en fuentes externas | El sitio es nuevo. Para Google AI Overviews y Perplexity Citations, el sitio necesita ser mencionado por terceros (prensa, foros, redes). SEO de autoridad a largo plazo. |

## Estado de bots conocidos
| Bot | Acceso | Verificado |
|-----|--------|------------|
| Googlebot | ✅ Allow: / | robots.txt |
| GPTBot | ✅ Allow: / | robots.txt |
| ClaudeBot | ✅ Allow: / | robots.txt |
| PerplexityBot | ✅ Allow: / | robots.txt |
| Bingbot | ✅ Allow: / | robots.txt |
