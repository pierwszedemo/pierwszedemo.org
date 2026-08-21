#!/usr/bin/env bun
/**
 * Karuzela na Instagram: kwadraty 1080×1080 rysowane tym samym językiem, co
 * karty OG (src/og.ts): biel, twarda linia, Archivo w nagłówkach, IBM Plex
 * Mono w etykietach. Okładka i slajdy treści na bieli, CTA na negatywie – jak
 * wiersze bloga na stronie.
 *
 * Dlaczego satori, a nie SVG w sharpie: sharp renderuje SVG librsvg, który
 * sięga po *systemowe* fonty – Archivo nie ma na tej maszynie. Satori dostaje
 * TTF wprost i zamienia tekst na ścieżki. Regular (treść slajdów) jest
 * zvendorowany w assets/ obok skryptu, bo src/assets/fonts trzyma tylko
 * odmiany potrzebne kartom OG.
 *
 * Uruchomienie – zawsze z katalogu głównego repo:
 *   bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>
 * Czyta instagram/<slug>/slides.json, zapisuje instagram/<slug>/NN.png.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { SITE_HOST, WORDMARK } from "../../../../src/consts.ts";

const SIZE = 1080;
const PAD = 84;

const INK = "#101010";
const MUTED = "#6f6d68";
const BODY = "#3c3a36";
/** Odpowiednik muted na negatywie – hairline z palety strony. */
const MUTED_ON_INK = "#a6a49f";

// Ścieżki od process.cwd(): skrypt czyta też pliki spoza swojego katalogu
// (fonty OG, instagram/<slug>/), więc i tak wymaga startu z korzenia repo –
// jedna konwencja zamiast dwóch.
const font = (path) => readFileSync(resolve(process.cwd(), path));

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Użycie: bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>");
  if (slug?.startsWith("_")) console.error("Szkic (_slug.md) nie ma adresu – najpierw opublikuj wpis.");
  process.exit(1);
}
if (!existsSync(resolve(process.cwd(), "src/assets/fonts/Archivo-SemiBold.ttf"))) {
  console.error("Nie widzę src/assets/fonts – uruchom skrypt z katalogu głównego repo.");
  process.exit(1);
}
// Adres wpisu trafia na slajd CTA jako piksele – literówka w slugu dałaby
// karuzelę z martwym linkiem, którego nikt już nie poprawi.
// Pliki wpisów mają prefiks daty (`RRRR-MM-DD-slug.md`), adres – sam slug.
const postFile = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${slug}\\.md$`);
if (!readdirSync(resolve(process.cwd(), "src/content/blog")).some((f) => postFile.test(f))) {
  console.error(`Nie ma opublikowanego wpisu src/content/blog/RRRR-MM-DD-${slug}.md.`);
  process.exit(1);
}

const dir = resolve(process.cwd(), "instagram", slug);
const specPath = resolve(dir, "slides.json");
if (!existsSync(specPath)) {
  console.error(`Brak ${specPath} – najpierw zapisz specyfikację slajdów (schemat w SKILL.md).`);
  process.exit(1);
}
let spec;
try {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
} catch (e) {
  console.error(`${specPath} nie jest poprawnym JSON-em: ${e.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Walidacja. Limity znaków to nie stylistyka, tylko geometria: satori nie
// zmniejsza tekstu, który się nie mieści – wyjechałby poza kadr.
// ---------------------------------------------------------------------------
const errors = [];
const cover = spec.cover ?? {};
const slides = Array.isArray(spec.slides) ? spec.slides : [];
const cta = spec.cta ?? {};

const isText = (v) => typeof v === "string" && v.trim().length > 0;
/** Satori nie łamie w środku słowa – jeden długi token wyjedzie poza kadr. */
const longestToken = (s) => Math.max(0, ...s.split(/\s+/).map((t) => t.length));
const check = (name, value, max, { required = true, token = 26 } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) errors.push(`${name} jest wymagany`);
    return;
  }
  if (!isText(value)) return errors.push(`${name} musi być niepustym tekstem`);
  if (value.length > max) errors.push(`${name} ma ${value.length} znaków, limit ${max}`);
  if (longestToken(value) > token) errors.push(`${name}: słowo dłuższe niż ${token} znaków nie złamie się w wierszu`);
};

// Limit tokenu zależy od stopnia pisma: 17 znaków Archivo przy 96 px to już ~900 px.
check("cover.hook", cover.hook, 110, { token: 17 });
check("cover.eyebrow", cover.eyebrow, 40, { required: false });
if (slides.length < 1 || slides.length > 4) errors.push(`slajdów treści jest ${slides.length}, ma być 1–4`);

const paragraphs = (body) => (Array.isArray(body) ? body : typeof body === "string" ? [body] : []);
slides.forEach((s, i) => {
  check(`slides[${i}].heading`, s.heading, 64);
  const ps = paragraphs(s.body);
  if (ps.length < 1 || ps.length > 3) errors.push(`slides[${i}].body: 1–3 akapity`);
  ps.forEach((p, j) => check(`slides[${i}].body[${j}]`, p, 440, { token: 30 }));
  const total = ps.join(" ").length;
  if (total > 440) errors.push(`slides[${i}].body ma łącznie ${total} znaków, limit 440`);
});

const ctaLines = cta.lines ?? ["Obserwuj.", "Zapisz.", "Wróć po więcej."];
if (!Array.isArray(ctaLines) || ctaLines.length < 1 || ctaLines.length > 3) {
  errors.push("cta.lines: tablica 1–3 linii");
} else {
  ctaLines.forEach((line, i) => check(`cta.lines[${i}]`, line, 22, { token: 14 }));
}
const ctaUrl = cta.url ?? `${SITE_HOST}/blog/${slug}`;
check("cta.url", ctaUrl, 60, { token: 60 });

if (errors.length) {
  console.error("Specyfikacja nie przeszła walidacji:");
  for (const e of errors) console.error(`  – ${e}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Rysowanie.
// ---------------------------------------------------------------------------
const FONTS = [
  { name: "Archivo", data: font(".agents/skills/instagram-carousel/assets/Archivo-Regular.ttf"), weight: 400, style: "normal" },
  { name: "Archivo", data: font("src/assets/fonts/Archivo-SemiBold.ttf"), weight: 600, style: "normal" },
  { name: "IBM Plex Mono", data: font("src/assets/fonts/IBMPlexMono-Medium.ttf"), weight: 500, style: "normal" },
];

// Satori bez JSX: element to obiekt {type, props}. Każdy div z wieloma dziećmi
// musi mieć jawny `display: flex` – satori nie zakłada blokowego układu.
const el = (type, style, children) =>
  ({ type, props: { style, ...(children === undefined ? {} : { children }) } });

const mono = {
  fontFamily: "IBM Plex Mono",
  fontWeight: 500,
  fontSize: 23,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

// Wiszące spójniki: „i", „w", „z", „a", „o", „u" na końcu wiersza to błąd
// polskiej typografii. Twarda spacja (U+00A0) po nich – satori jej nie łamie.
const glue = (s) => s.replace(/(^|[\s(„])([aiouwzAIOUWZ])\s+/g, "$1$2\u00A0");

const total = slides.length + 2;
const pageNo = (i) => `${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

/** Nagłówek i stopka są wspólne dla wszystkich slajdów – to one robią serię. */
const header = (left, right, onInk) => el(
  "div",
  { display: "flex", justifyContent: "space-between", alignItems: "center" },
  [
    el("div", { ...mono, color: onInk ? MUTED_ON_INK : MUTED }, left),
    el("div", { ...mono, color: onInk ? "#ffffff" : INK }, right),
  ],
);

const footer = (onInk) => el(
  "div",
  {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: `3px solid ${onInk ? "#ffffff" : INK}`,
    paddingTop: 30,
  },
  [
    el("div", { fontSize: 30, fontWeight: 600 }, WORDMARK),
    el("div", { ...mono, color: onInk ? MUTED_ON_INK : MUTED }, SITE_HOST),
  ],
);

const frame = (onInk, children) => el(
  "div",
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    padding: PAD,
    backgroundColor: onInk ? INK : "#ffffff",
    color: onInk ? "#ffffff" : INK,
    fontFamily: "Archivo",
  },
  children,
);

const coverSlide = () => {
  const hook = glue(cover.hook);
  // Progi dobrane tak, żeby hook mieścił się w 2–4 wierszach przy 912 px.
  const size = hook.length > 90 ? 64 : hook.length > 70 ? 72 : hook.length > 40 ? 84 : 96;
  return frame(false, [
    header(cover.eyebrow ?? "Blog", pageNo(1)),
    el(
      "div",
      { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "flex-end", paddingBottom: 56 },
      el("div", { fontSize: size, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.035em", maxWidth: 912 }, hook),
    ),
    footer(false),
  ]);
};

const contentSlide = (s, i) => {
  const heading = s.heading;
  const headingSize = heading.length > 34 ? 46 : 56;
  return frame(false, [
    header(cover.eyebrow ?? "Blog", pageNo(i + 2)),
    el(
      "div",
      { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center" },
      [
        el("div", { fontSize: headingSize, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 912 }, glue(heading)),
        // 38 px to ~14 px po przeskalowaniu do szerokości telefonu – mniej
        // wymaga już przybliżania palcami.
        ...paragraphs(s.body).map((p) =>
          el("div", { marginTop: 30, fontSize: 38, fontWeight: 400, lineHeight: 1.4, color: BODY, maxWidth: 900 }, glue(p)),
        ),
      ],
    ),
    footer(false),
  ]);
};

const ctaSlide = () => frame(true, [
  header("Na koniec", pageNo(total), true),
  el(
    "div",
    { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "flex-end", paddingBottom: 56 },
    [
      ...ctaLines.map((line, i) =>
        el("div", { fontSize: 84, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.03em", marginTop: i ? 8 : 0 }, line),
      ),
      // Adres bez wersalików i rozstrzelenia: ścieżki na Vercelu rozróżniają
      // wielkość liter, a 53-znakowy slug z trackingiem 0.18em łamał się w pół.
      el("div", { ...mono, textTransform: "none", letterSpacing: "0.04em", color: MUTED_ON_INK, marginTop: 48 }, ctaUrl),
    ],
  ),
  footer(true),
]);

const nodes = [coverSlide(), ...slides.map(contentSlide), ctaSlide()];

mkdirSync(dir, { recursive: true });
// Poprzedni przebieg mógł mieć więcej slajdów – stare NN.png z inną
// numeracją MM zostałyby obok nowych i poszłyby razem na Instagram.
for (const f of readdirSync(dir)) {
  if (/^\d{2}\.png$/.test(f)) rmSync(resolve(dir, f));
}
for (let i = 0; i < nodes.length; i++) {
  const svg = await satori(nodes[i], { width: SIZE, height: SIZE, fonts: FONTS });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const file = resolve(dir, `${String(i + 1).padStart(2, "0")}.png`);
  writeFileSync(file, png);
  console.log(`✓ instagram/${slug}/${String(i + 1).padStart(2, "0")}.png`);
}
console.log(`Gotowe: ${nodes.length} slajdów (okładka + ${slides.length} treści + CTA).`);
