# Performance — Findings
**Fecha:** 29 Jun 2026 | **Score:** 72/100

## Lo que funciona bien
- Bundle HTML: **210 KB** (reducción del 88% desde 1,8 MB) ✅
- Vercel Edge CDN: TTFB medido ~48 ms (respuesta HTTP/2) ✅
- Cache-Control correcto: HTML `max-age=0, must-revalidate`, assets `/assets/*` `max-age=31536000, immutable` ✅
- Compresión habilitada (Vercel) ✅
- OG images servidas localmente desde /img/ ✅

## Estimaciones CWV (sin medición de campo)

| Métrica | Estimación | Umbral Google | Estado |
|---------|-----------|---------------|--------|
| LCP | ~1.8–2.5 s | < 2.5 s | ⚠️ Límite |
| INP | Desconocido | < 200 ms | ❓ |
| CLS | Bajo (layout estático) | < 0.1 | ✅ est. |
| FCP | ~1.2–1.8 s | < 1.8 s | ⚠️ Límite |
| TTFB | ~48 ms | < 800 ms | ✅ |

*Nota: mediciones estimadas basadas en tamaño de bundle y análisis de código. Medir con PageSpeed Insights o CrUX para datos de campo reales.*

## Problemas detectados

| # | Severidad | Problema | Detalle |
|---|-----------|----------|---------|
| P1 | **Medium** | LCP puede superar 2,5 s en móvil 4G | 210 KB HTML + fuentes + React (~150 KB en assets/) + cartogram.js deben cargarse antes de pintar contenido. El hero/spotlight es el LCP candidate. |
| P2 | **Medium** | Sin `<link rel="preconnect">` para fuentes | `fonts.googleapis.com` y `fonts.gstatic.com` no tienen preconnect. Añadir `<link rel="preconnect" href="https://fonts.googleapis.com">` y `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` ahorra ~50 ms en first render. |
| P3 | **Medium** | React + Babel runtime incluidos como assets | `react.min.js` + `react-dom.min.js` + `babel.min.js` en /assets/ suman ~150 KB adicionales (estimación). Considerar migrar a `preact` o usar import maps para reducir tamaño. |
| P4 | **Low** | Imágenes en /img/ sin WebP | Los .jpg funcionan pero WebP reduce peso ~25–35%. Generar versiones WebP y usar `<picture>` con fallback. |
| P5 | **Low** | No hay `fetchpriority="high"` en imagen hero | La imagen hero debería tener `fetchpriority="high"` para mejorar LCP. |
| P6 | **Info** | Sin medición de campo real | Google Search Console > Core Web Vitals dará datos de campo una vez el sitio acumule tráfico suficiente (>1.000 visitas/28d). Prioridad cuando haya datos. |
