/**
 * Generuje komplet ikon z jednego źródła: `public/favicon.svg` + PNG-i + .ico.
 * Uruchamiane ręcznie (`bun scripts/generate-favicons.mjs`), nie w buildzie —
 * ikony zmieniają się raz na kilka lat, a wynik siedzi w repo.
 *
 * Litera (dziś „P" od „Pierwsze Demo") jest wypalona jako ścieżka, nie `<text>`.
 * Poprzednia wersja
 * używała `<text font-family="Archivo, …">` i wychodził pusty kwadrat: sharp
 * rasteryzuje SVG librsvg, który sięga po fonty *systemowe*, a Archivo tam nie
 * ma. Ten sam problem miałaby przeglądarka gościa renderująca favicon.svg.
 */
import { readFileSync } from "node:fs";
import opentype from "@shuding/opentype.js";
import sharp from "sharp";
import { SITE_NAME } from "../src/consts.ts";

const SIZE = 64;
const GLYPH = "PD";
// Duży glif: przy 16 px w karcie przeglądarki ramka zjada resztę miejsca
// i cieńsza litera robi się nieczytelną plamą. Wartość jest górnym pułapem –
// przy dwóch literach spada tyle, żeby monogram zmieścił się w ramce.
const FONT_SIZE = 54;
/** Grubość ramki; obrys leży na x=2, więc jej wewnętrzna krawędź jest na FRAME. */
const FRAME = 4;
/**
 * Światło między *wewnętrzną* krawędzią ramki a monogramem. Wcześniej padding
 * liczył się od krawędzi viewBoxa i był równy grubości ramki – litery
 * dotykały obrysu.
 */
const GAP = 7;
const INK = "#101010";

const font = opentype.parse(readFileSync("src/assets/fonts/Archivo-SemiBold.ttf").buffer);

/** Ta wersja opentype.js nie ma getBoundingBox — zakres liczymy z komend. */
function bounds(path) {
	const xs = [];
	const ys = [];
	for (const command of path.commands) {
		for (const key of ["x", "x1", "x2"]) if (command[key] !== undefined) xs.push(command[key]);
		for (const key of ["y", "y1", "y2"]) if (command[key] !== undefined) ys.push(command[key]);
	}
	return {
		x1: Math.min(...xs),
		y1: Math.min(...ys),
		x2: Math.max(...xs),
		y2: Math.max(...ys),
	};
}

/**
 * Monogram wpisany w kwadrat `SIZE`, wyśrodkowany po realnych krawędziach
 * glifów, nie po metrykach fontu — metryki zostawiają nierówny margines nad
 * i pod literami. „PD" jest szersze niż wyższe, więc o skali decyduje
 * szerokość.
 */
function monogram(padding) {
	const raw = bounds(font.getPath(GLYPH, 0, 0, FONT_SIZE));
	const fontSize = Math.min(FONT_SIZE, (FONT_SIZE * (SIZE - 2 * padding)) / (raw.x2 - raw.x1));
	const { x1, y1, x2, y2 } = bounds(font.getPath(GLYPH, 0, 0, fontSize));
	const dx = (SIZE - (x2 - x1)) / 2 - x1;
	const dy = (SIZE - (y2 - y1)) / 2 - y1;
	return font.getPath(GLYPH, dx, dy, fontSize).toPathData(3);
}

const framed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  <rect x="2" y="2" width="${SIZE - 4}" height="${SIZE - 4}" fill="none" stroke="${INK}" stroke-width="${FRAME}"/>
  <path d="${monogram(FRAME + GAP)}" fill="${INK}"/>
</svg>
`;

/**
 * Wersja na 16–48 px. Ramka i dwie litery nie mieszczą się razem w karcie
 * przeglądarki: przy 16 px na monogram zostaje ~10 px, laski liter schodzą
 * poniżej piksela i „PD" rozmywa się w szarą plamę. Poniżej 64 px ramka więc
 * znika, a monogram dostaje całe pole.
 */
const bare = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  <path d="${monogram(2)}" fill="${INK}"/>
</svg>
`;

await Bun.write("public/favicon.svg", framed);

const render = (size, svg = framed) =>
	sharp(Buffer.from(svg), { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

for (const [file, size] of [
	["public/favicon-96x96.png", 96],
	["public/apple-touch-icon.png", 180],
	["public/web-app-manifest-192x192.png", 192],
	["public/web-app-manifest-512x512.png", 512],
]) {
	await Bun.write(file, await render(size));
}

// Zdjęcie profilowe na Facebooka / Instagram. Platformy pokazują je w kółku,
// więc kwadratowa ramka traciłaby rogi – zamiast niej okrąg tej samej
// grubości, a monogram dostaje szersze światło, bo w okręgu najwięcej miejsca
// zjada się po przekątnej, czyli tam, gdzie kończą się laski „P" i brzuch „D".
// Nie trafia do `public/`, bo to nie zasób strony, tylko plik do wgrania.
const profile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - FRAME / 2}" fill="none" stroke="${INK}" stroke-width="${FRAME}"/>
  <path d="${monogram(15)}" fill="${INK}"/>
</svg>
`;
await Bun.write("assets/profile-1080.png", await render(1080, profile));

// Logo do BIMI (DMARC). Profil SVG Tiny PS: `version="1.2"`,
// `baseProfile="tiny-ps"`, `<title>` jako pierwsze dziecko, bez `x`/`y` na
// korzeniu, bez skryptów, stylów, obrazków i odwołań zewnętrznych – walidator
// BIMI odrzuca plik za każde z nich. Tło pełne (biel), bo przezroczystość
// w skrzynkach wychodzi różnie. Gmail i Apple Mail kadrują logo w kółko, więc
// pierścień jest wciągnięty do środka o własną grubość – przy `r` równym
// połowie boku kadr ścinałby obrys. Monogram ma szersze światło niż w ikonie,
// żeby w kółku nie dotykał pierścienia po przekątnej.
const BIMI_INSET = FRAME * 2;
const bimi = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${SIZE} ${SIZE}">
  <title>${SITE_NAME}</title>
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - BIMI_INSET - FRAME / 2}" fill="none" stroke="${INK}" stroke-width="${FRAME}"/>
  <path d="${monogram(BIMI_INSET + 10)}" fill="${INK}"/>
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
const pngs = await Promise.all(sizes.map((size) => render(size, size >= 64 ? framed : bare)));

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
