import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import gen_cards as gc
from PIL import Image, ImageDraw


class TestDrawCard(unittest.TestCase):
    def test_dimensiones_con_impacto(self):
        img = gc.draw_card("Madrid inicia 446 pisos", "Urbanismo", "emerald",
                           impacto="446", impactoLabel="viviendas nuevas",
                           distrito="Vicálvaro")
        self.assertEqual(img.size, (1200, 675))

    def test_sin_impacto_ni_distrito(self):
        img = gc.draw_card("Titular sin dato", "Demanda", "rose")
        self.assertEqual(img.size, (1200, 675))

    def test_tag_desconocido_no_rompe(self):
        img = gc.draw_card("X", "Y", "fucsia")
        self.assertEqual(img.size, (1200, 675))

    def test_titular_larguisimo_con_tildes(self):
        t = ("La construcción de viviendas de alquiler asequible en los barrios "
             "periféricos acelera la transformación urbanística según los últimos "
             "datos añadidos por el Ayuntamiento de Madrid este año " * 3)
        img = gc.draw_card(t, "Urbanismo", "amber", impacto="+14,4 %",
                           impactoLabel="variación interanual")
        self.assertEqual(img.size, (1200, 675))


class TestWrap(unittest.TestCase):
    def setUp(self):
        self.d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
        self.f = gc._font(44, bold=True)

    def test_respeta_max_lines_con_elipsis(self):
        lines = gc._wrap(self.d, "palabra " * 60, self.f, max_w=1000, max_lines=3)
        self.assertLessEqual(len(lines), 3)
        self.assertTrue(lines[-1].endswith("…"))

    def test_texto_corto_sin_elipsis(self):
        lines = gc._wrap(self.d, "titular corto", self.f, max_w=1000, max_lines=3)
        self.assertEqual(lines, ["titular corto"])


if __name__ == "__main__":
    unittest.main()
