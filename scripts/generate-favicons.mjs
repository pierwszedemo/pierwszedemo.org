/**
 * Generuje komplet ikon z jednego źródła: `public/favicon.svg` + PNG-i + .ico,
 * zdjęcie profilowe i logo BIMI. Uruchamiane ręcznie
 * (`bun scripts/generate-favicons.mjs`), nie w buildzie — ikony zmieniają się
 * raz na kilka lat, a wynik siedzi w repo.
 *
 * Znakiem jest płyta z nawigacji (`RECORD_SVG` w src/og.ts, ten sam rysunek co
 * Logo.astro): same koła, bez tekstu. Poprzednia ikona była monogramem „PD"
 * i musiała wypalać litery jako ścieżki, bo sharp rasteryzuje SVG librsvg,
 * a ten sięga po fonty *systemowe*. Koła tego problemu nie mają – i przy
 * 16 px czytają się lepiej niż dwie litery: ciemny krążek z pomarańczowym
 * środkiem, bez lasek, które schodzą poniżej piksela.
 */
import sharp from "sharp";
import { SITE_NAME } from "../src/consts.ts";
import { PALETTE, RECORD_SVG } from "../src/og.ts";

const SIZE = 64;

/** Wnętrze znaku (bez <svg>), przeskalowane z viewBoxa 40 na `diameter` i wyśrodkowane. */
const record = (diameter) => {
	const scale = diameter / 40;
	const offset = (SIZE - diameter) / 2;
	const inner = RECORD_SVG.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
	return `<g transform="translate(${offset} ${offset}) scale(${scale})">${inner}</g>`;
};

const svg = (body, background) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  ${background ? `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>` : ""}
  ${record(SIZE * body)}
</svg>
`;

// Karta przeglądarki: sam krążek na przezroczystym tle, na całe pole.
const bare = svg(1);
// Ikony „aplikacji” (iOS, manifest): system dokłada własną maskę z zaokrąglonymi
// rogami i nie znosi przezroczystości – iOS wypełnia ją czernią. Stąd tło
// strony i krążek z marginesem.
const tile = svg(0.72, PALETTE.paper);

await Bun.write("public/favicon.svg", bare);

const render = (size, source) =>
	sharp(Buffer.from(source), { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

for (const [file, size, source] of [
	["public/favicon-96x96.png", 96, bare],
	["public/apple-touch-icon.png", 180, tile],
	["public/web-app-manifest-192x192.png", 192, tile],
	["public/web-app-manifest-512x512.png", 512, tile],
]) {
	await Bun.write(file, await render(size, source));
}

// Zdjęcie profilowe na Facebooka / Instagram. Platformy pokazują je w kółku,
// więc krążek dostaje margines, a tło jest tłem strony.
// Nie trafia do `public/`, bo to nie zasób strony, tylko plik do wgrania.
await Bun.write("assets/profile-1080.png", await render(1080, svg(0.7, PALETTE.paper)));

// Logo do BIMI (DMARC). Profil SVG Tiny PS: `version="1.2"`,
// `baseProfile="tiny-ps"`, `<title>` jako pierwsze dziecko, bez `x`/`y` na
// korzeniu, bez skryptów, stylów, obrazków i odwołań zewnętrznych – walidator
// BIMI odrzuca plik za każde z nich. Tło pełne, bo przezroczystość
// w skrzynkach wychodzi różnie. Gmail i Apple Mail kadrują logo w kółko, więc
// krążek ma margines – przy średnicy równej bokowi kadr ścinałby jego krawędź.
// Bez <g transform> – walidatory Tiny PS bywają na nie wrażliwe, więc koła
// są przeliczone wprost.
const BIMI_DIAMETER = SIZE * 0.72;
const c = SIZE / 2;
/** Promień ze skali znaku (viewBox 40) na pole BIMI, do dwóch miejsc po przecinku. */
const k = (value) => Number(((value * BIMI_DIAMETER) / 40).toFixed(2));
const bimi = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${SIZE} ${SIZE}">
  <title>${SITE_NAME}</title>
  <rect width="${SIZE}" height="${SIZE}" fill="${PALETTE.paper}"/>
  <circle cx="${c}" cy="${c}" r="${k(20)}" fill="${PALETTE.ink}"/>
  <circle cx="${c}" cy="${c}" r="${k(14)}" fill="none" stroke="#3a3a42" stroke-width="${k(1.5)}"/>
  <circle cx="${c}" cy="${c}" r="${k(7)}" fill="${PALETTE.orange}"/>
  <circle cx="${c}" cy="${c}" r="${k(1.8)}" fill="${PALETTE.paper}"/>
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
const pngs = await Promise.all(sizes.map((size) => render(size, bare)));

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
