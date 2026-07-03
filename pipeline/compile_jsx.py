"""Compila los scripts JSX del bundle a JS plano (Babel preset-react).

Contrato: compile_bundle(named_sources) -> (js_compilado, hash12) | (None, None).
Todo fallo degrada a (None, None) + compile_status.json {"mode": "babel-fallback"}:
el llamador (distribute.py) sirve entonces la variante Babel runtime de siempre.
"""
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

PIPE = Path(__file__).resolve().parent
WORK = PIPE / "work"
CACHE_DIR = WORK / "jsx_cache"
STATUS_FILE = WORK / "compile_status.json"
BABEL_TIMEOUT = 120


def _env_with_node():
    # Mismo patrón que verify_codex._env_with_cli_paths: launchd no ve nvm.
    env = dict(os.environ)
    extras = ["/opt/homebrew/bin", "/usr/local/bin", f"{Path.home()}/.local/bin"]
    nvm_bins = sorted(
        (Path.home() / ".nvm" / "versions" / "node").glob("*/bin"),
        key=lambda p: p.parent.name, reverse=True,
    )
    extras += [str(p) for p in nvm_bins]
    env["PATH"] = ":".join(extras) + ":" + env.get("PATH", "")
    return env


def _write_status(mode: str, detail: str = "") -> None:
    WORK.mkdir(exist_ok=True)
    STATUS_FILE.write_text(
        json.dumps({"mode": mode, "detail": detail}, ensure_ascii=False),
        encoding="utf-8",
    )


def compile_bundle(named_sources):
    concat = "\n".join(f"// {n}\n{s}" for n, s in named_sources)
    h = hashlib.sha256(concat.encode("utf-8")).hexdigest()[:12]
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = CACHE_DIR / f"{h}.js"
    if cached.exists():
        _write_status("compiled", f"cache {h}")
        return cached.read_text(encoding="utf-8"), h

    env = _env_with_node()
    npx = shutil.which("npx", path=env["PATH"])
    if not npx or not (PIPE / "node_modules" / "@babel" / "cli").exists():
        _write_status("babel-fallback", "npx o pipeline/node_modules ausentes")
        return None, None

    pieces = []
    with tempfile.TemporaryDirectory() as td:
        for name, src in named_sources:
            f = Path(td) / f"{name}.jsx"
            f.write_text(src, encoding="utf-8")
            try:
                r = subprocess.run(
                    [npx, "babel", "--presets", "@babel/preset-react",
                     "--compact", "true", str(f)],
                    cwd=PIPE, env=env, capture_output=True, text=True,
                    timeout=BABEL_TIMEOUT,
                )
            except (subprocess.TimeoutExpired, OSError) as e:
                _write_status("babel-fallback", f"{name}: {e}")
                return None, None
            if r.returncode != 0:
                _write_status("babel-fallback", f"{name}: {r.stderr[-400:]}")
                return None, None
            pieces.append(f"// ── {name} ──\n{r.stdout}")

    compiled = "\n".join(pieces)
    cached.write_text(compiled, encoding="utf-8")
    _write_status("compiled", h)
    return compiled, h
