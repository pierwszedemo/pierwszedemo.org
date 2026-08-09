/**
 * Generuje komplet ikon z jednego źródła: `public/favicon.svg` + PNG-i + .ico.
 * Uruchamiane ręcznie (`bun scripts/generate-favicons.mjs`), nie w buildzie —
 * ikony zmieniają się raz na kilka lat, a wynik siedzi w repo.
 *
 * Litera „M" jest wypalona jako ścieżka, nie `<text>`. Poprzednia wersja
 * używała `<text font-family="Archivo, …">` i wychodził pusty kwadrat: sharp
 * rasteryzuje SVG librsvg, który sięga po fonty *systemowe*, a Archivo tam nie
 * ma. Ten sam problem miałaby przeglądarka gościa renderująca favicon.svg.
 */
import { readFileSync } from "node:fs";
import opentype from "@shuding/opentype.js";
import sharp from "sharp";

const SIZE = 64;
// Duży glif: przy 16 px w karcie przeglądarki ramka zjada resztę miejsca
// i cieńsza litera robi się nieczytelną plamą.
const FONT_SIZE = 54;
const INK = "#101010";

const font = opentype.parse(
  readFileSync("src/assets/fonts/Archivo-SemiBold.ttf").buffer,
);

/** Ta wersja opentype.js nie ma getBoundingBox — zakres liczymy z komend. */
function bounds(path) {
  const xs = [];
  const ys = [];
  for (const command of path.commands) {
    for (const key of ["x", "x1", "x2"])
      if (command[key] !== undefined) xs.push(command[key]);
    for (const key of ["y", "y1", "y2"])
      if (command[key] !== undefined) ys.push(command[key]);
  }
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

// Wyśrodkowanie po realnych krawędziach glifu, nie po metrykach fontu —
// metryki zostawiają nierówny margines nad i pod literą.
const { x1, y1, x2, y2 } = bounds(font.getPath("M", 0, 0, FONT_SIZE));
const dx = (SIZE - (x2 - x1)) / 2 - x1;
const dy = (SIZE - (y2 - y1)) / 2 - y1;
const d = font.getPath("M", dx, dy, FONT_SIZE).toPathData(3);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="#ffffff"/>
  <rect x="2" y="2" width="${SIZE - 4}" height="${SIZE - 4}" fill="none" stroke="${INK}" stroke-width="4"/>
  <path d="${d}" fill="${INK}"/>
</svg>
`;
await Bun.write("public/favicon.svg", svg);

const render = (size) =>
  sharp("public/favicon.svg", { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

for (const [file, size] of [
  ["public/favicon-96x96.png", 96],
  ["public/apple-touch-icon.png", 180],
  ["public/web-app-manifest-192x192.png", 192],
  ["public/web-app-manifest-512x512.png", 512],
]) {
  await Bun.write(file, await render(size));
}

// .ico z ładunkiem PNG: 6-bajtowy nagłówek + 16 bajtów na wpis + same PNG-i.
// `sips -s format ico` daje tu 285 kB śmiecia, stąd ręczne składanie.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(render));

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

await Bun.write(
  "public/favicon.ico",
  Buffer.concat([header, ...entries, ...pngs]),
);

console.log(`Ikony przegenerowane (${sizes.join("/")} px w .ico).`);
