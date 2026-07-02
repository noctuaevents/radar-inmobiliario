import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import triage_ollama as tr

ART = {"titulo": "Prueba de nota", "fecha": "2 Jul", "hora": "08:00",
       "fuente": "Idealista", "url": "https://x.example/a", "imagen": "",
       "score": 7, "resumen_raw": "Texto fuente"}
TRIAGE = {"categoria": "Demanda", "distrito": None, "tag": "emerald",
          "direccion_impacto": "sube", "resumen_borrador": "Borrador",
          "impacto_borrador": "+1%", "impacto_label_borrador": "test"}

class TestTriageAuto(unittest.TestCase):
    def test_auto_marks_publicar_true(self):
        with tempfile.TemporaryDirectory() as d:
            fname = tr.write_note(ART, TRIAGE, 1, auto=True, cola_dir=Path(d))
            text = (Path(d) / fname).read_text(encoding="utf-8")
            self.assertIn("publicar: true", text)
            self.assertIn("modo: auto", text)

    def test_default_keeps_publicar_false(self):
        with tempfile.TemporaryDirectory() as d:
            fname = tr.write_note(ART, TRIAGE, 1, cola_dir=Path(d))
            text = (Path(d) / fname).read_text(encoding="utf-8")
            self.assertIn("publicar: false", text)
            self.assertNotIn("modo: auto", text)

if __name__ == "__main__":
    unittest.main()
