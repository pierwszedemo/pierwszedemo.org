/**
 * Generuje komplet ikon z płótna „Logo — wybrane” (wariant „seledyn na
 * ultramarynie”): `public/favicon.svg` + PNG-i + .ico, zdjęcie profilowe
 * i logo BIMI. Uruchamiane ręcznie (`bun scripts/generate-favicons.mjs`), nie
 * w buildzie — ikony zmieniają się raz na kilka lat, a wynik siedzi w repo.
 *
 * Dwa rysunki, jak na płótnie:
 * - favikona (karta przeglądarki, .ico) – kafel ultramaryny z sześcioma
 *   pomarańczowymi słupkami fali (`iconSvg` w src/logo.ts). Bez liter: przy 16 px
 *   „demo” byłoby plamą.
 * - avatar (iOS, manifest, profil, BIMI) – „demo” w seledynie nad pomarańczową falą
 *   (`renderAvatarBody` w src/og.ts). Litery to ścieżki z satori, bo sharp
 *   rasteryzuje SVG librsvg, a ten sięga po fonty *systemowe* – Instrument
 *   Serif na nich nie ma.
 */
import sharp from "sharp";
import { SITE_NAME } from "../src/consts.ts";
import { iconSvg } from "../src/logo.ts";
import { renderAvatarBody } from "../src/og.ts";

const render = (size, source) =>
	sharp(Buffer.from(source), { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Każdy rozmiar z własnego pola – słupki liczone w pikselach docelowych, nie skalowane z jednego SVG. */
const icon = (size) => render(size, iconSvg(size));

const avatar = async (size) =>
	render(
		size,
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${await renderAvatarBody(size)}</svg>`,
	);

// Karta przeglądarki: kafel z zaokrąglonymi rogami na przezroczystym tle.
await Bun.write("public/favicon.svg", `${iconSvg(32)}\n`);
await Bun.write("public/favicon-96x96.png", await icon(96));

// Ikony „aplikacji” (iOS, manifest): pełny kwadrat bez zaokrągleń – system
// dokłada własną maskę, a iOS wypełnia przezroczystość czernią. Treść mieści
// się w strefie bezpiecznej maski (koło 80% boku).
for (const [file, size] of [
	["public/apple-touch-icon.png", 180],
	["public/web-app-manifest-192x192.png", 192],
	["public/web-app-manifest-512x512.png", 512],
]) {
	await Bun.write(file, await avatar(size));
}

// Zdjęcie profilowe na Facebooka / Instagram / LinkedIn. Platformy kadrują je
// w koło, a pełne tło daje ultramarynowe koło jak na płótnie.
// Nie trafia do `public/`, bo to nie zasób strony, tylko plik do wgrania.
await Bun.write("assets/profile-1080.png", await avatar(1080));

// Logo do BIMI (DMARC): avatar, bo skrzynki pokazują je jak zdjęcie
// profilowe. Profil SVG Tiny PS: `version="1.2"`, `baseProfile="tiny-ps"`,
// `<title>` jako pierwsze dziecko, bez `x`/`y` na korzeniu, bez skryptów,
// stylów, obrazków i odwołań zewnętrznych – walidator BIMI odrzuca plik za
// każde z nich. Tło pełne, bo przezroczystość w skrzynkach wychodzi różnie.
// Gmail i Apple Mail kadrują w koło – „demo” z falą siedzi w środku z zapasem.
// `renderAvatarBody` daje same ścieżki i prostokąty w liczbach bezwzględnych,
// bez <g transform>, na które walidatory Tiny PS bywają wrażliwe.
const BIMI_SIZE = 512;
const bimi = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${BIMI_SIZE} ${BIMI_SIZE}">
  <title>${SITE_NAME}</title>
  ${await renderAvatarBody(BIMI_SIZE)}
</svg>
`;
await Bun.write("public/bimi.svg", bimi);

// .ico z ładunkiem PNG: 6-bajtowy nagłówek + 16 bajtów na wpis + same PNG-i.
// `sips -s format ico` daje tu 285 kB śmiecia, stąd ręczne składanie.
//
// Kolejność jest **malejąca**, i to nie kosmetyka: Google (jak większość
// prostych parserów ICO) bierze pierwszy wpis z katalogu, a nie największy.
// Przy 16 → 32 → 48 dostawał 16×16 i skalował je w górę do 48 px w wynikach
// wyszukiwania, czyli do szarej plamy. Dokumentacja Google prosi o ikonę
// większą niż 48×48 – stąd 96 na czele.
//
// Górny pułap to 96 i to jest świadome. Pole szerokości we wpisie katalogu ma
// jeden bajt: spec mówi „unsigned, 0 = 256", ale część czytników (choćby
// `file`) bierze go jako signed char i 128 wychodzi im jako -128. 96 mieści
// się poniżej progu i żaden parser nie musi zgadywać.
const sizes = [96, 64, 48, 32, 16];
const pngs = await Promise.all(sizes.map(icon));

const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // typ: ikona
header.writeUInt16LE(sizes.length, 4);

let offset = header.length + 16 * sizes.length;
const entries = pngs.map((png, index) => {
	const entry = Buffer.alloc(16);
	entry.writeUInt8(sizes[index], 0); // szerokość
	entry.writeUInt8(sizes[index], 1); // wysokość
	entry.writeUInt16LE(1, 4); // planes
	entry.writeUInt16LE(32, 6); // bity na piksel
	entry.writeUInt32LE(png.length, 8);
	entry.writeUInt32LE(offset, 12);
	offset += png.length;
	return entry;
});

await Bun.write("public/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));

console.log(`Ikony przegenerowane (${sizes.join("/")} px w .ico).`);
