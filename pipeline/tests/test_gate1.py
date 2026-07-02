import sys, tempfile, unittest
from datetime import date
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

HOY = date(2026, 7, 2)

def cand(**kw):
    base = {"titulo": "t", "fuente": "Idealista", "url": "https://x/1",
            "fecha_iso": "2026-07-02", "score": 8}
    base.update(kw)
    return base

class TestGate1(unittest.TestCase):
    def test_acepta_fresco_con_score(self):
        ok, ko = ae.filter_candidates([cand()], set(), HOY)
        self.assertEqual(len(ok), 1)

    def test_rechaza_viejo(self):
        ok, ko = ae.filter_candidates([cand(fecha_iso="2026-06-29")], set(), HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("48h", ko[0][1])

    def test_acepta_ayer(self):
        ok, _ = ae.filter_candidates([cand(fecha_iso="2026-07-01")], set(), HOY)
        self.assertEqual(len(ok), 1)

    def test_rechaza_score_bajo(self):
        ok, ko = ae.filter_candidates([cand(score=4)], set(), HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("score", ko[0][1])

    def test_rechaza_duplicado_por_url(self):
        ok, ko = ae.filter_candidates([cand()], {"https://x/1"}, HOY)
        self.assertEqual(len(ok), 0)
        self.assertIn("duplicado", ko[0][1])

    def test_rechaza_blacklist(self):
        ok, ko = ae.filter_candidates([cand(fuente="Basura Diario")], set(), HOY,
                                      blacklist={"basura diario"})
        self.assertEqual(len(ok), 0)

    def test_maximo_articulos(self):
        cands = [cand(url=f"https://x/{i}") for i in range(9)]
        ok, _ = ae.filter_candidates(cands, set(), HOY, max_articles=4)
        self.assertEqual(len(ok), 4)

class TestSeenUrls(unittest.TestCase):
    def test_recoge_de_items_y_vault(self):
        with tempfile.TemporaryDirectory() as d:
            note = Path(d) / "nota.md"
            note.write_text("---\npublicar: publicado\nurl: 'https://x/vault'\n---\n",
                            encoding="utf-8")
            urls = ae.collect_seen_urls([{"url": "https://x/item"}], [Path(d)])
            self.assertEqual(urls, {"https://x/item", "https://x/vault"})

if __name__ == "__main__":
    unittest.main()
