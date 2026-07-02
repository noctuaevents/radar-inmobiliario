import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import verify_codex as vc

POLISHED = {"titulo": "El precio sube un 6,2% en Letras", "resumen": "Sube.",
            "impacto": "+6,2 %", "slug": "letras-sube", "body": [{"type": "p", "text": "x"}]}
SOURCE = {"titulo_original": "Letras sube 6,2%", "fuente": "Idealista",
          "resumen_raw": "El barrio sube un 6,2% interanual", "resumen_borrador": "Sube 6,2%"}

class TestVerify(unittest.TestCase):
    def test_approve(self):
        v, m = vc.verify_article(POLISHED, SOURCE,
            runner=lambda p: 'bla\n{"veredicto":"APPROVE","motivo":"ok"}')
        self.assertEqual(v, "APPROVE")

    def test_reject(self):
        v, m = vc.verify_article(POLISHED, SOURCE,
            runner=lambda p: '{"veredicto":"REJECT","motivo":"cifra inventada"}')
        self.assertEqual(v, "REJECT"); self.assertIn("cifra", m)

    def test_garbage_is_error(self):
        v, m = vc.verify_article(POLISHED, SOURCE, runner=lambda p: "no soy json")
        self.assertEqual(v, "ERROR")

    def test_runner_exception_is_error(self):
        def boom(p): raise FileNotFoundError("codex")
        v, m = vc.verify_article(POLISHED, SOURCE, runner=boom)
        self.assertEqual(v, "ERROR")

    def test_fallback_chain(self):
        def boom(p): raise FileNotFoundError("codex")
        v, m, who = vc.verify_with_fallback(POLISHED, SOURCE, primary=boom,
            fallback=lambda p: '{"veredicto":"APPROVE","motivo":"ok"}')
        self.assertEqual((v, who), ("APPROVE", "claude-fallback"))

    def test_no_verifier_means_reject(self):
        def boom(p): raise FileNotFoundError("nada")
        v, m, who = vc.verify_with_fallback(POLISHED, SOURCE, primary=boom, fallback=boom)
        self.assertEqual((v, who), ("REJECT", "ninguno"))

    def test_prompt_contains_source_material(self):
        captured = {}
        def spy(p):
            captured["p"] = p
            return '{"veredicto":"APPROVE","motivo":"ok"}'
        vc.verify_article(POLISHED, SOURCE, runner=spy)
        self.assertIn("Idealista", captured["p"])
        self.assertIn("6,2% interanual", captured["p"])
        self.assertIn("El precio sube", captured["p"])

if __name__ == "__main__":
    unittest.main()
