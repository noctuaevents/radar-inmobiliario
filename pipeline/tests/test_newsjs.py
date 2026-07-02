import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import auto_edition as ae

ROOT = Path(__file__).parent.parent.parent
REAL_NEWS = (ROOT / "src" / "data" / "news.js").read_text(encoding="utf-8")

class TestParse(unittest.TestCase):
    def test_parse_real_news_js(self):
        data = ae.parse_news_data(REAL_NEWS)
        self.assertGreaterEqual(len(data["items"]), 1)
        it = data["items"][0]
        for field in ("slug", "titulo", "fuente", "url", "fechaISO", "body"):
            self.assertIn(field, it)
        self.assertIn("titulo", data["destacada"])
        self.assertIn("publicadas", data["semanaResumen"])
        self.assertTrue(data["actualizado"])

    def test_roundtrip(self):
        data = ae.parse_news_data(REAL_NEWS)
        out = ae.render_news_js(data["actualizado"], data["semanaResumen"],
                                data["destacada"], data["items"])
        data2 = ae.parse_news_data(out)
        self.assertEqual(data["items"], data2["items"])
        self.assertEqual(data["destacada"], data2["destacada"])

class TestMerge(unittest.TestCase):
    def test_new_first_dedup_and_cap(self):
        old = [{"slug": f"viejo-{i}", "url": f"https://x/{i}"} for i in range(29)]
        new = [{"slug": "nuevo", "url": "https://x/nuevo"},
               {"slug": "repetido", "url": "https://x/3"}]  # misma url que viejo-3
        merged = ae.merge_items(new, old, cap=30)
        self.assertEqual(merged[0]["slug"], "nuevo")
        self.assertEqual(len([m for m in merged if m["url"] == "https://x/3"]), 1)
        self.assertLessEqual(len(merged), 30)

if __name__ == "__main__":
    unittest.main()
