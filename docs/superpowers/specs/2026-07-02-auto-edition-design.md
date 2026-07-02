# Edición diaria autónoma — diseño

**Fecha:** 2 Jul 2026 · **Estado:** aprobado por el usuario
**Objetivo:** publicar contenido fresco a diario en radarinmobiliario.com sin intervención
humana, usando los tres motores disponibles (Ollama local, Claude CLI, Codex CLI) con
verificación cruzada entre familias de modelos como sustituto del editor humano.

## Decisiones tomadas (con el usuario)

1. **Autonomía:** piloto automático total. Nada requiere aprobación humana; el usuario audita
   a posteriori vía informe diario y puede hacer rollback.
2. **Cadencia:** una edición al día con umbral de calidad. Si ningún artículo pasa las
   puertas, ese día no se publica (mejor silencio que relleno).
3. **Infra:** MacBook del usuario con launchd a las 07:30 + catch-up nativo (si el Mac
   dormía, launchd ejecuta al despertar). Si el Mac pasa el día apagado, no hay edición.
4. **Máximo 4 artículos por edición.**
5. **Fallback de verificación:** si Codex no está disponible, verifica una segunda pasada de
   Claude con prompt adversarial distinto, y el informe lo marca como "fallback". La
   alternativa conservadora ("sin Codex no se publica") fue descartada por el usuario.

## Reparto de roles entre modelos

| Motor | Rol | Coste |
|---|---|---|
| Ollama (qwen2.5:7b local) | Borrador/triaje de cada candidato | Gratis |
| Claude (`claude -p`, ya en `~/.local/bin/claude`) | Pulido editorial (prosa, titular, impacto, destacada) — ya implementado en `polish_claude.sh` | Cuota suscripción |
| Codex (`codex exec`) | **Editor jefe adversarial**: verificación por artículo. Familia de modelo distinta ⇒ errores no correlacionados con quien escribió | Cuota ChatGPT |

Estado verificado: `~/.codex/` existe con `auth_mode: chatgpt` (sesión válida), pero el
binario `codex` NO está en PATH → instalarlo (`npm i -g @openai/codex` o localizar el
existente) es parte de la implementación. `claude` sí está en `~/.local/bin`.

## Arquitectura

```
launchd (07:30, catch-up al despertar)
   │
   ▼
pipeline/auto_edition.py  (orquestador único, con --dry-run)
   │
   ├─ 0. Preflight: lock del día (pipeline/work/last_edition.date), red, Ollama vivo
   │     (lo arranca si no responde), claude y codex localizables.
   ├─ 1. fetch_news.py  →  candidates.json                     [reutilizado]
   ├─ 2. PUERTA 1 (determinista, gratis):
   │     · frescura < 48h (fecha_iso)
   │     · score ≥ 5 (el score ya existe en fetch_news.py)
   │     · dedup contra slugs en src/data/news.js y notas en Publicado/
   │     · blacklist de fuentes (constante configurable en auto_edition.py; empieza vacía)
   │     · top 4 como máximo
   ├─ 3. triage_ollama.py --auto  →  notas en _cola con
   │     `publicar: true` + `modo: auto`                       [cambio mínimo]
   │     (fallback: triage_claude.py si Ollama irrecuperable)
   ├─ 4. polish_claude.sh  →  src/data/news.js                 [reutilizado]
   │     (fallback: pulido vía codex exec si Claude falla tras reintentos)
   ├─ 5. PUERTA 2 — pipeline/verify_codex.py (NUEVO):
   │     por cada artículo pulido: prompt adversarial con el artículo final +
   │     material original del RSS → JSON estricto {veredicto, motivo}.
   │     Comprueba: sin datos/cifras ausentes de la fuente, titular fiel,
   │     español correcto, impactoPrecio plausible.
   │     REJECT ⇒ se elimina ese artículo de news.js y su nota va a
   │     _rechazadas/ con `rechazo_motivo` en frontmatter.
   ├─ 6. PUERTA 3 (sanidad técnica):
   │     · news.js re-parseable (extract_news_articles() sin fallback regex)
   │     · build.py y distribute.py exit 0
   │     · git status: solo ficheros esperados modificados
   │     Fallo ⇒ ABORT sin push + informe de error.
   ├─ 7. Publicar: git add (paths específicos) + commit
   │     `noticias: edición auto <D Mmm YYYY>` + push → espera deploy
   │     (poll HTTP a un slug nuevo) → indexnow_submit.py.
   └─ 8. Informe: Contenido/Ediciones/AAAA-MM-DD.md en el vault
         (publicados con enlaces, rechazados con motivo y puerta, errores,
         duración) + notificación macOS (osascript).
```

## Regla de oro de degradación

Cualquier fallo degrada hacia **no publicar**, nunca hacia publicar sin verificación de un
segundo modelo. Única excepción: fallback Claude-adversarial (decisión 5), siempre registrado
en el informe.

| Falla | Respuesta |
|---|---|
| Ollama caído | Intentar arrancarlo; si no → `triage_claude.py` |
| Claude timeout/cuota | Reintentos con backoff (ya hay base en polish_claude.sh); persiste → pulido vía Codex |
| Codex no disponible | Verificación fallback con Claude adversarial (prompt distinto), marcada en informe |
| Sin red / todo caído | Sin edición; informe de error + notificación |
| Puerta 3 falla | Abort sin push; el working tree queda para inspección (`git status` lo muestra) |

## Estados de las notas en el vault

- `_cola/` + `publicar: true` + `modo: auto` → pendiente de pulido (transitorio, minutos).
- `Publicado/` → publicada (polish ya las mueve y marca `publicar: publicado`).
- `_rechazadas/` (NUEVA carpeta) + `rechazo_motivo:` → rechazada por Puerta 2, auditable.
- Primera ejecución: archivar las notas huérfanas en `_cola` (>7 días, hay notas del 28 Jun).

## Restricciones del repo que aplican

- No editar `dist/` ni el monolito a mano; el orquestador solo llama a build/distribute.
- Producción es **Vercel** (vercel.json); `netlify.toml` es legacy. El deploy es push a main.
- Commits: patrón `noticias: edición auto <fecha>`.

## Fuera de alcance

Imágenes por artículo, actualización de precios (parse_prices sigue manual mensual), redes
sociales, múltiples ediciones diarias, A/B de titulares, edición cloud de respaldo.

## Pruebas

1. `auto_edition.py --dry-run`: ciclo completo sin commit/push ni mover notas (escribe el
   informe con sufijo `-dryrun`).
2. Prueba de puertas con fixtures: un candidato viejo (>48h), uno de score bajo, uno
   duplicado — los tres deben caer en Puerta 1 sin gastar API.
3. Prueba de REJECT: forzar un artículo con una cifra inventada y comprobar que Codex lo
   tumba y la nota acaba en `_rechazadas/`.
4. launchd: primera activación con `launchctl kickstart` manual; validar lock del día
   (segunda ejecución el mismo día = no-op con log).

## Addendum (2 Jul 2026, durante planificación)

`polish_claude.sh` reemplaza `news.js` entero con la edición del día y
`distribute.py::gen_article_pages` borra las páginas de artículos ausentes. En modo
diario automático eso destruiría cada día las URLs del día anterior (404 real).
Decisión: el orquestador FUSIONA (`merge_items`: nuevos primero, dedup por url/slug,
cap 30) para que el archivo crezca y las URLs indexadas sobrevivan.
