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
1. El artículo afirma cifras, porcentajes, fechas o nombres propios que NO aparecen en el \
material original ni se derivan trivialmente de él.
2. El titular exagera o contradice el material original (clickbait).
3. Hay errores de español (gramática, ortografía) o frases sin sentido.
4. El campo "impacto" no es plausible respecto al material original.

Responde SOLO este JSON, sin texto extra:
{{"veredicto": "APPROVE" | "REJECT", "motivo": "una frase concreta"}}"""


def extract_json(text: str):
    m = re.search(r"\{.*\}", text or "", re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
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


def build_prompt(polished: dict, source: dict) -> str:
    return VERIFY_PROMPT.format(
        polished=json.dumps(polished, ensure_ascii=False, indent=2),
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
