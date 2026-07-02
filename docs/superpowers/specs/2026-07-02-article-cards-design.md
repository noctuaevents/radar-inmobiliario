# Tarjetas de dato por artículo — diseño

**Fecha:** 2 Jul 2026 · **Estado:** aprobado por el usuario (diseño y ejecución end-to-end)
**Objetivo:** todo artículo publicado lleva imagen propia — una tarjeta de dato de marca
generada programáticamente (Pillow) — para og:image/twitter:image/JSON-LD y para las
cards/hero del front. Cero coste, cero copyright, 100% autónomo.

**Decisión de fuente (usuario):** tarjetas programáticas. Descartadas: foto del medio
(copyright de prensa), IA (coste/API/credibilidad), híbrido.

## Contexto del problema

`fetch_news.py::fetch_og_image` consulta la URL de **redirect de Google News**, que no
expone la foto del artículo → el 100% de items sale con `imagen: ""` → OG genérico
(`/og-image.png`) y cards sin foto. Los 12 artículos ya publicados están así.

## Módulo: `pipeline/gen_cards.py`

### Función pura de dibujo

`draw_card(titulo, categoria, tag, impacto, impactoLabel, distrito) -> PIL.Image`

- Lienzo **1200×675** (16:9 — sirve para OG 1.91:1 y para las cards del front, que
  recortan con `objectFit: cover`).
- Fondo `#fafaf9` (stone-50). Barra de acento vertical izquierda (12 px) del color del tag.
- Colores por tag (los del front): emerald `#059669`, rose `#e11d48`, amber `#d97706`,
  sky `#0284c7`, violet `#7c3aed`. Tag desconocido → sky.
- Cabecera: `● Radar Inmobiliario Madrid` (punto en color de acento) arriba-izquierda,
  slate-500 `#64748b`, ~28 px.
- Etiqueta de categoría en MAYÚSCULAS con tracking, color de acento, ~30 px.
- **Con `impacto`** (p.ej. "+6,2 %", "446"): la cifra en ~170 px bold slate-900 `#0f172a`,
  con `impactoLabel` debajo en ~34 px slate-500; el titular debajo en ~44 px, máx. 3 líneas.
- **Sin `impacto`**: el titular es el protagonista, ~64 px bold, máx. 4 líneas.
- Titular: wrap por palabras medido con `draw.textlength`; si excede las líneas máximas,
  última línea con "…". Tildes/ñ soportadas (TTF del sistema).
- `distrito` (si existe): píldora con fondo de acento al 12% y texto de acento, bajo la categoría.
- Pie: `radarinmobiliario.com` slate-500 + fecha corta opcional NO (YAGNI).
- Tipografía: `/System/Library/Fonts/Helvetica.ttc` vía `ImageFont.truetype` (índices para
  regular/bold); si falla la carga → `ImageFont.load_default()` (la tarjeta sale igualmente).

### CLI idempotente

`python3 pipeline/gen_cards.py [--force]`

1. Lee `src/data/news.js` con `auto_edition.parse_news_data` (reutilizar — mismo formato
   garantizado; NO parsear a mano).
2. Para cada item con `imagen == ""` y slug: genera `dist/img/card-<slug>.png`
   (`optimize=True`; objetivo <120 KB) y pone `imagen = "/img/card-<slug>.png"`.
   Si el PNG ya existe y no se pasa `--force`, no regenera (solo parchea el campo).
3. `destacada`: si su `imagen == ""`, usa la tarjeta de su propio slug (generándola si falta).
4. Reescribe `news.js` con `auto_edition.render_news_js` SOLO si hubo cambios.
5. Errores por artículo: captura, avisa por stdout y deja ese artículo con `imagen: ""` —
   **nunca** rompe el proceso ni el fichero.
6. Salida: resumen `N tarjetas generadas, M parcheadas, K errores`; exit 0 salvo error de
   E/S en news.js.

## Integración

- **`auto_edition.py`**: invoca `sh([sys.executable, "pipeline/gen_cards.py"])` justo antes
  de `gate3(report)` (tras el merge — cubre supervivientes del día y cualquier antiguo sin
  imagen). Fallo del subproceso NO aborta la edición: capturar `CalledProcessError`, anotar
  en `report["cards"]` y seguir (los artículos quedan sin imagen, como hoy).
- **Puerta 3 sin cambios**: `dist/img/` cae bajo el prefijo permitido `dist/`; `news.js`
  ya está permitido.
- **Aguas abajo, sin cambios**: `distribute.py` ya usa `imagen` para og/twitter/JSON-LD con
  prefijo de dominio cuando no empieza por `http`; los componentes ya renderizan
  `article.imagen`; `polish_claude.sh::localise_imagen` ignora `imagen == ""` (sin conflicto,
  gen_cards corre después).
- **Retroactivo**: una ejecución manual ahora + build + distribute + commit + push deja los
  12 artículos actuales con tarjeta.

## Pruebas

1. `draw_card` devuelve imagen 1200×675 con y sin impacto/distrito.
2. Titular larguísimo con tildes/ñ → no lanza excepción y respeta el nº máx. de líneas
   (verificable: la función de wrap se expone separada, `_wrap(draw, text, font, max_w, max_lines)`).
3. CLI sobre un news.js de fixture (tmpdir): parchea `imagen`, genera PNGs, es idempotente
   (segunda ejecución: 0 generadas), y el resultado sobrevive `parse_news_data` round-trip.
4. Artículo sin slug → se salta con aviso, sin excepción.

## Fuera de alcance

Fotos reales de medios, IA generativa, variantes por red social, cambio del og-image
global del sitio, tarjetas para páginas de distrito.
