import os, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import compile_jsx  # noqa: E402

def test_fallback_sin_node():
    old = os.environ.get("PATH", "")
    os.environ["PATH"] = "/nonexistent"
    real_env = compile_jsx._env_with_node
    compile_jsx._env_with_node = lambda: {"PATH": "/nonexistent"}
    try:
        out, h = compile_jsx.compile_bundle([("t", "const A = () => <div/>;")])
        assert out is None and h is None
        assert '"babel-fallback"' in compile_jsx.STATUS_FILE.read_text()
    finally:
        compile_jsx._env_with_node = real_env
        os.environ["PATH"] = old

def test_compila_y_cachea():
    env = compile_jsx._env_with_node()
    if not shutil.which("npx", path=env["PATH"]):
        print("  (npx no disponible — test de compilación saltado)")
        return
    src = [("demo", "const Demo = () => <div className='x'>hola</div>;")]
    out, h = compile_jsx.compile_bundle(src)
    assert out and "React.createElement" in out, out
    assert (compile_jsx.CACHE_DIR / f"{h}.js").exists()
    out2, h2 = compile_jsx.compile_bundle(src)   # segunda vez: cache
    assert h2 == h and out2 == out
    assert '"compiled"' in compile_jsx.STATUS_FILE.read_text()

test_fallback_sin_node()
test_compila_y_cachea()
print("test_compile OK")
