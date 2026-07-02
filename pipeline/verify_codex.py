#!/usr/bin/env python3
"""verify_codex.py — Puerta 2 de la edición autónoma: verificación adversarial
por artículo con Codex (familia de modelo distinta a quien escribió).
Fallback: Claude con prompt adversarial. Sin verificador ⇒ REJECT (regla de oro).

Uso directo: python3 pipeline/verify_codex.py --self-test
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

CODEX_TIMEOUT = 180
CLAUDE_TIMEOUT = 120

VERIFY_PROMPT = """Eres el editor jefe de Radar Inmobiliario Madrid. Tu única tarea es VETAR \
artículos defectuosos antes de publicarlos. Sé estricto: ante la duda, rechaza.

ARTÍCULO PULIDO (candidato a publicarse):
{polished}

MATERIAL ORIGINAL (única fuente de verdad):
Titular original: {src_titulo}
Fuente: {src_fuente}
Resumen de la fuente: {src_resumen}
Borrador del triaje: {src_borrador}

Rechaza (REJECT) si se cumple CUALQUIERA de estas condiciones:
1. El artículo afirma CIFRAS, porcentajes, fechas, nombres propios o ubicaciones CONCRETAS \
que NO aparecen en el material original ni se derivan trivialmente de él.
2. El titular exagera o contradice el material original (clickbait).
3. Hay errores de español (gramática, ortografía) o frases sin sentido.
4. El campo "impacto" no es plausible respecto al material original.

NO rechaces por contexto general del mercado madrileño (p.ej. "en un mercado tensionado", \
"la demanda de alquiler sigue alta") siempre que esté redactado como contexto y no aporte \
datos concretos verificables. Esa ambientación editorial es aceptable; los DATOS inventados no.

Responde SOLO este JSON, sin texto extra:
{{"veredicto": "APPROVE" | "REJECT", "motivo": "una frase concreta"}}"""


def extract_json(text: str):
    """Devuelve el ÚLTIMO objeto JSON parseable del texto. La salida de los CLI
    puede intercalar trazas u otros bloques {...} antes del veredicto final."""
    candidates = []
    depth, start, in_str, esc = 0, None, False, False
    for i, c in enumerate(text or ""):
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    candidates.append(text[start:i + 1])
                    start = None
    for cand in reversed(candidates):
        try:
            return json.loads(cand)
        except json.JSONDecodeError:
            continue
    return None


def _env_with_cli_paths():
    env = dict(os.environ)
    extras = [f"{Path.home()}/.local/bin", "/opt/homebrew/bin", "/usr/local/bin"]
    extras += [str(p) for p in sorted((Path.home() / ".nvm" / "versions" / "node").glob("*/bin"), reverse=True)]
    env["PATH"] = ":".join(extras) + ":" + env.get("PATH", "")
    return env


def run_codex(prompt: str) -> str:
    result = subprocess.run(
        ["codex", "exec", "--skip-git-repo-check", "-s", "read-only", prompt],
        capture_output=True, text=True, timeout=CODEX_TIMEOUT, env=_env_with_cli_paths(),
    )
    return result.stdout.strip()


def run_claude(prompt: str) -> str:
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True, text=True, timeout=CLAUDE_TIMEOUT, env=_env_with_cli_paths(),
    )
    return result.stdout.strip()


# Solo los campos escritos por el modelo se someten a veredicto; los metadatos del
# sistema (fecha/hora/slug/tag/categoria/distrito/imagen/url) vienen del RSS y no
# deben provocar falsos REJECT por "dato no presente en el material".
EDITORIAL_FIELDS = ("titulo", "resumen", "impacto", "impactoLabel", "body")


def build_prompt(polished: dict, source: dict) -> str:
    editorial = {k: polished[k] for k in EDITORIAL_FIELDS if k in polished}
    return VERIFY_PROMPT.format(
        polished=json.dumps(editorial, ensure_ascii=False, indent=2),
        src_titulo=(source.get("titulo_original") or "")[:200],
        src_fuente=source.get("fuente", ""),
        src_resumen=(source.get("resumen_raw") or "")[:500],
        src_borrador=(source.get("resumen_borrador") or "")[:300],
    )


def verify_article(polished: dict, source: dict, runner=run_codex):
    """(veredicto, motivo) con veredicto ∈ {APPROVE, REJECT, ERROR}."""
    prompt = build_prompt(polished, source)
    try:
        raw = runner(prompt)
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as e:
        return "ERROR", f"verificador no disponible: {e}"
    data = extract_json(raw)
    if not data or data.get("veredicto") not in ("APPROVE", "REJECT"):
        return "ERROR", f"respuesta no parseable: {(raw or '')[:120]}"
    return data["veredicto"], str(data.get("motivo", ""))[:300]


def verify_with_fallback(polished: dict, source: dict, primary=run_codex, fallback=run_claude):
    """(veredicto, motivo, verificador). Regla de oro: sin verificador ⇒ REJECT."""
    verdict, motivo = verify_article(polished, source, runner=primary)
    if verdict != "ERROR":
        return verdict, motivo, "codex"
    verdict, motivo = verify_article(polished, source, runner=fallback)
    if verdict != "ERROR":
        return verdict, motivo, "claude-fallback"
    return "REJECT", f"sin verificador disponible ({motivo})", "ninguno"


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        out = run_codex('Responde SOLO este JSON, sin texto extra: '
                        '{"veredicto":"APPROVE","motivo":"self-test"}')
        data = extract_json(out)
        ok = bool(data) and data.get("veredicto") == "APPROVE"
        print("self-test codex:", "OK" if ok else f"FALLO — salida: {out[:200]}")
        sys.exit(0 if ok else 1)
    print(__doc__)
