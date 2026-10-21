#!/usr/bin/env bun
/**
 * Karuzela na Instagram: okładka z hookiem, 1–4 slajdy treści, CTA – każdy
 * slajd na poświacie. Okładka i treść mają parę kolorów z kolorystyki okładki
 * wpisu (ta sama co obrazek OG i karta na stronie – `postCover`, `glowPair`),
 * CTA – parę karty marki. Wspólne ramy (kadr, poświata, fonty, górny i dolny
 * wiersz, walidacja, zapis) są w lib.mjs; tu jest tylko układ środka kadru.
 *
 * Uruchomienie – zawsze z katalogu głównego repo:
 *   bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug> [--out <katalog>] [--spec <plik>]
 * Czyta instagram/<data>-<slug>-karuzela/spec.json, zapisuje tam (albo do
 * `--out`) NN.png i alt.txt.
 */
import { SITE_HOST } from "../../../../src/consts.ts";
import {
	bottom,
	el,
	failOn,
	GLOWS,
	glowFrame,
	glowPair,
	glowTone,
	glue,
	makeCheck,
	pageNo,
	postCover,
	readSpec,
	render,
	requireRepoRoot,
	resolvePostDir,
	serifFit,
	tagline,
	top,
} from "./lib.mjs";

const slug = process.argv[2];
requireRepoRoot();
const post = resolvePostDir(slug, "karuzela");
if (!post) {
	console.error(
		"Użycie: bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug> [--out <katalog>] [--spec <plik>]",
	);
	process.exit(1);
}
const spec = readSpec(post.specPath);

// ---------------------------------------------------------------------------
// Walidacja.
// ---------------------------------------------------------------------------
const errors = [];
const check = makeCheck(errors);
const cover = spec.cover ?? {};
const slides = Array.isArray(spec.slides) ? spec.slides : [];
const cta = spec.cta ?? {};

// Długie słowo samo zmniejsza stopień (`serifFit`), więc limit tokenu chroni
// już tylko przed hookiem w drobnym druku.
check("cover.hook", cover.hook, 110, { token: 17 });
check("cover.eyebrow", cover.eyebrow, 40, { required: false });
if (slides.length < 1 || slides.length > 4) errors.push(`slajdów treści jest ${slides.length}, ma być 1–4`);

const paragraphs = (body) => (Array.isArray(body) ? body : typeof body === "string" ? [body] : []);
slides.forEach((s, i) => {
	check(`slides[${i}].heading`, s.heading, 64);
	const ps = paragraphs(s.body);
	if (ps.length < 1 || ps.length > 6) errors.push(`slides[${i}].body: 1–6 akapitów`);
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
const ctaUrl = cta.url ?? `${SITE_HOST}/${post.section}/${slug}`;
check("cta.url", ctaUrl, 60, { token: 60 });
// Adres idzie na slajd jako piksele – stary pierwszedemo.com/blog/… z dawnych
// specyfikacji działałby tylko przez przekierowanie.
if (!ctaUrl.startsWith(`${SITE_HOST}/`)) errors.push(`cta.url ma zaczynać się od ${SITE_HOST}/`);
failOn(errors);

// ---------------------------------------------------------------------------
// Rysowanie.
// ---------------------------------------------------------------------------
const total = slides.length + 2;
const no = (i) => pageNo(i, total);
const category = cover.eyebrow ?? "Blog";
const { params, palette: P } = postCover(slug);
const pair = glowPair(params);
const tone = glowTone(pair);
const middle = (children) =>
	el("div", { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center" }, children);

// Hook jak na referencjach – duży, na pół kadru. `\n` to twarde łamanie
// wiersza (np. nazwa wydarzenia w osobnej linii); satori nie honoruje znaku
// nowej linii w tekście, więc każda linia idzie w osobnym divie.
const coverSlide = () => {
	const hook = glue(cover.hook);
	const size = serifFit(hook, [
		[32, 170],
		[50, 140],
		[70, 120],
		[90, 104],
		[110, 92],
	]);
	return glowFrame(pair, [
		top(tone, no(1)),
		middle(hook.split("\n").map((line) => el("div", { ...size, lineHeight: 1.0 }, line))),
		bottom(tone, P, category, { host: false }),
	]);
};

const contentSlide = (s, i) =>
	glowFrame(pair, [
		top(tone, no(i + 2)),
		middle([
			el(
				"div",
				{
					...serifFit(s.heading, [
						[24, 92],
						[40, 80],
						[64, 68],
					]),
					lineHeight: 1.04,
				},
				glue(s.heading),
			),
			// 34 px w kolumnie 780 px to ~14 px na telefonie – mniej wymaga już
			// przybliżania palcami.
			...paragraphs(s.body).map((p) => el("div", { marginTop: 26, fontSize: 34, lineHeight: 1.4 }, glue(p))),
		]),
		bottom(tone, P, category),
	]);

const ctaSlide = () => {
	const brand = glowTone(GLOWS.brand);
	const longest = ctaLines.reduce((a, b) => (b.length > a.length ? b : a));
	const size = serifFit(longest, [
		[12, 120],
		[18, 100],
		[22, 84],
	]);
	return glowFrame(GLOWS.brand, [
		top(brand, no(total)),
		middle([
			...ctaLines.map((line) => el("div", { ...size, lineHeight: 1.04 }, line)),
			// Adres małymi literami: ścieżki na hostingu rozróżniają wielkość liter.
			el("div", { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, marginTop: 40 }, ctaUrl),
		]),
		tagline(brand.text),
	]);
};

await render({
	...post.out,
	nodes: [coverSlide(), ...slides.map(contentSlide), ctaSlide()],
	altLines: [
		`${category}. ${cover.hook.replace(/\n/g, " ")}`,
		...slides.map((s) => `${s.heading}. ${paragraphs(s.body).join(" ")}`),
		`${ctaLines.join(" ")} ${ctaUrl}`,
	],
});
console.log(`Gotowe: ${total} slajdów (okładka + ${slides.length} treści + CTA).`);
