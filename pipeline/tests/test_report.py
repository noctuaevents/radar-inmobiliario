import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

REPORT = {"fecha": "2026-07-02", "dry_run": False, "resultado": "publicados 2 artículos",
          "publicados": [{"titulo": "A", "slug": "a", "verificador": "codex"}],
          "rechazados": [{"titulo": "B", "motivo": "cifra inventada", "verificador": "codex"}],
          "descartados_p1": [("C", "score 3 < 5")],
          "commit": "abc1234", "deploy": "verificado", "indexnow": "HTTP 202",
          "duracion_min": 7.5}

class TestReport(unittest.TestCase):
    def test_render_contiene_lo_esencial(self):
        md = ae.render_report(REPORT)
        for frag in ("publicados 2 artículos", "[A](https://www.radarinmobiliario.com/noticia/a)",
                     "cifra inventada", "score 3 < 5", "abc1234", "7.5"):
            self.assertIn(frag, md)

    def test_render_con_error(self):
        md = ae.render_report({"fecha": "2026-07-02", "dry_run": False,
                               "resultado": "ERROR — sin publicar",
                               "error": "boom", "publicados": [], "rechazados": [],
                               "descartados_p1": []})
        self.assertIn("boom", md)
        self.assertIn("ERROR", md)

if __name__ == "__main__":
    unittest.main()
