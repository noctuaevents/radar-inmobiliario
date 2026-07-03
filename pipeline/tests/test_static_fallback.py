import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import distribute  # noqa: E402

FIX = '<body class="bg-stone-100">\n  <div id="root"><!--STATIC_FALLBACK--></div>\n</body>'

def test_marker_replacement():
    out = distribute._set_root_fallback(FIX, '<h1>Hola</h1>')
    assert '<!--STATIC_FALLBACK-->' not in out
    assert '<div id="root"><h1>Hola</h1></div>' in out

def test_article_static_visible():
    art = {
        "slug": "prueba-slug", "titulo": "Titular <de> prueba",
        "resumen": "Resumen & corto.", "fechaISO": "2026-07-02",
        "categoria": "Mercado", "fuente": "El País",
        "url": "https://example.com/original",
        "distrito": "Tetuán",
        "body_texts": ["Primer párrafo.", "Segundo párrafo."],
    }
    html = distribute._article_static_html(art)
    assert '-9999px' not in html and 'aria-hidden' not in html
    assert '<h1' in html and 'Titular &lt;de&gt; prueba' in html
    assert 'Primer párrafo.' in html and 'Segundo párrafo.' in html
    assert 'https://example.com/original' in html

test_marker_replacement()
test_article_static_visible()
print("test_static_fallback OK")
