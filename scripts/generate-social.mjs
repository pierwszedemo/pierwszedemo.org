/**
 * Grafiki profilowe do wgrania ręcznie (Facebook, Instagram). Uruchamiane
 * ręcznie (`bun scripts/generate-social.mjs`), wynik ląduje w `assets/`, nie
 * w `public/` – to nie są zasoby strony. Zdjęcie profilowe (monogram) robi
 * `generate-favicons.mjs`, bo dzieli z ikonami ramkę i glif.
 *
 * Okładka strony na Facebooku: plik 1640×856, ale FB pokazuje z niego dwa
 * różne kadry – desktop środkowy pas 1640×624 (proporcja 820×312), telefon
 * środkową kolumnę ~1522×856 (640×360). Kartę rysujemy więc na 1640×624
 * z szerokimi marginesami i dokładamy białe pasy u góry i u dołu: desktop
 * widzi kartę co do piksela, telefon tę samą kartę z białym oddechem.
 *
 * Na desktopie FB kładzie na dolne 68 px kadru (w skali 820×312) gradientowy
 * cień pod przyciskami – w pliku to 136 px. Karta jest więc o tyle niższa,
 * a różnicę dostaje dolny pas, żeby stopka z wordmarkiem nie wpadała pod cień.
 */
import sharp from "sharp";
import { renderOgCard } from "../src/og.ts";

const WIDTH = 1640;
const HEIGHT = 856;
const DESKTOP = 624;
const SHADOW = 68 * 2;

const card = await renderOgCard({
  title: "Kariera to strategia.",
  width: WIDTH,
  height: DESKTOP - SHADOW,
  paddingX: 200,
});
const band = (HEIGHT - DESKTOP) / 2;

await Bun.write(
  "assets/facebook-cover-1640x856.png",
  await sharp(card)
    .extend({ top: band, bottom: band + SHADOW, background: "#ffffff" })
    .png({ compressionLevel: 9 })
    .toBuffer(),
);

console.log("Okładka zapisana: assets/facebook-cover-1640x856.png");
