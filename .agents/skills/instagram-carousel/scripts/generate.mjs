#!/usr/bin/env bun
/**
 * Karuzela na Instagram: okładka z hookiem, 1–4 slajdy treści, CTA na
 * negatywie – jak wiersze bloga na stronie. Wspólne ramy (kadr, paleta,
 * fonty, nagłówek, stopka, walidacja, zapis) są w lib.mjs; tu jest tylko
 * układ środka kadru właściwy dla karuzeli.
 *
 * Uruchomienie – zawsze z katalogu głównego repo:
 *   bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>
 * Czyta instagram/<data>-<slug>-karuzela/spec.json, zapisuje tam NN.png, alt.txt.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { SITE_HOST } from "../../../../src/consts.ts";
import {
  BODY, MUTED_ON_INK, el, failOn, footer, frame, glue, header, makeCheck, mono, pageNo, readSpec, render,
  requireRepoRoot, resolvePostDir,
} from "./lib.mjs";

const slug = process.argv[2];
requireRepoRoot();
const post = resolvePostDir(slug, "karuzela");
if (!post) {
  console.error("Użycie: bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>");
  process.exit(1);
}
const { dir, dirName } = post;
const spec = readSpec(resolve(dir, "spec.json"));

// ---------------------------------------------------------------------------
// Walidacja.
// ---------------------------------------------------------------------------
const errors = [];
const check = makeCheck(errors);
const cover = spec.cover ?? {};
const slides = Array.isArray(spec.slides) ? spec.slides : [];
const cta = spec.cta ?? {};

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
if (!Array.isArray(ctaLines) || ctaLines.length < 1 || ctaLines.length > 4) {
  errors.push("cta.lines: tablica 1–4 linii");
} else {
  ctaLines.forEach((line, i) => check(`cta.lines[${i}]`, line, 22, { token: 16 }));
}
const ctaUrl = cta.url ?? `${SITE_HOST}/blog/${slug}`;
check("cta.url", ctaUrl, 60, { token: 60 });
failOn(errors);

// ---------------------------------------------------------------------------
// Rysowanie.
// ---------------------------------------------------------------------------
const total = slides.length + 2;
const no = (i) => pageNo(i, total);

const coverSlide = () => {
  const hook = glue(cover.hook);
  // Progi dobrane tak, żeby hook mieścił się w 2–4 wierszach przy 912 px.
  const size = hook.length > 90 ? 64 : hook.length > 70 ? 72 : hook.length > 40 ? 84 : 96;
  // `\n` w hooku to twarde łamanie wiersza (np. nazwa wydarzenia w osobnej
  // linii). Satori nie honoruje znaku nowej linii w tekście, więc każda linia
  // idzie w osobnym divie.
  const lines = hook.split("\n").map((line) =>
    el("div", { fontSize: size, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.035em", maxWidth: 912 }, line),
  );
  return frame(false, [
    header(cover.eyebrow ?? "Blog", no(1)),
    el(
      "div",
      { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "flex-end", paddingBottom: 56 },
      lines,
    ),
    footer(false),
  ]);
};

const contentSlide = (s, i) => {
  const heading = s.heading;
  const headingSize = heading.length > 34 ? 46 : 56;
  return frame(false, [
    header(cover.eyebrow ?? "Blog", no(i + 2)),
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
  header("Na koniec", no(total), true),
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

mkdirSync(dir, { recursive: true });
await render({
  dir,
  dirName,
  nodes: [coverSlide(), ...slides.map(contentSlide), ctaSlide()],
  altLines: [
    `${cover.eyebrow ?? "Blog"}. ${cover.hook.replace(/\n/g, " ")}`,
    ...slides.map((s) => `${s.heading}. ${paragraphs(s.body).join(" ")}`),
    `${ctaLines.join(" ")} ${ctaUrl}`,
  ],
});
console.log(`Gotowe: ${total} slajdów (okładka + ${slides.length} treści + CTA).`);
