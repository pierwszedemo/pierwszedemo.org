#!/usr/bin/env bun
/**
 * Formaty pojedyncze na Instagram – cztery układy na poświacie, które mają się
 * *odróżniać* od karuzeli, żeby profil nie zlewał się w jedną ścianę
 * podobnych kadrów. Ramy (znak u góry, pigułka kategorii w kolorze okładki
 * wpisu na dole) są wspólne z karuzelą i przychodzą z lib.mjs. Różni się para
 * kolorów – stała dla formatu (`GLOWS`), nie z okładki wpisu jak w karuzeli –
 * i środek:
 *
 *   mit     – dwa slajdy: 01 pomarańcz w czerń, mit przekreślony bielą;
 *             02 ultramaryna w ciepłą biel, fakt. Etykiety „Mit”/„Fakt”
 *             w ogromnym serifie.
 *   zapisz  – jeden slajd, limonka w ciepłą biel, numerowane wiersze
 *             oddzielone linią. Lista, której karuzela nie ma.
 *   pytanie – jeden slajd, ultramaryna w limonkę, wielki „?” i pytanie
 *             wyśrodkowane. Karuzela jest zawsze wyrównana do lewej.
 *   liczba  – jeden slajd, limonka w czerń, liczba w seledynie na pół kadru,
 *             zdanie bielą pod nią.
 *
 * Uruchomienie – zawsze z katalogu głównego repo:
 *   bun .agents/skills/instagram-carousel/scripts/format.mjs <slug> <mit|zapisz|pytanie|liczba> [--out <katalog>] [--spec <plik>]
 * Czyta instagram/<data>-<slug>-<format>/spec.json, zapisuje tam (albo do
 * `--out`) NN.png i alt.txt – każdy post na Instagram ma własny katalog.
 */
import {
	BLUE,
	bottom,
	el,
	failOn,
	GLOWS,
	glowFrame,
	glowTone,
	glue,
	INK,
	LIME,
	MUTED_ON_INK,
	makeCheck,
	mono,
	postCover,
	readSpec,
	render,
	requireRepoRoot,
	resolvePostDir,
	serifFit,
	top,
	ULTRAMARINE,
} from "./lib.mjs";

const FORMATS = ["mit", "zapisz", "pytanie", "liczba"];
const [slug, format] = process.argv.slice(2);
requireRepoRoot();
const post = resolvePostDir(slug, format);
if (!post || !FORMATS.includes(format)) {
	console.error(
		`Użycie: bun .agents/skills/instagram-carousel/scripts/format.mjs <slug> <${FORMATS.join("|")}> [--out <katalog>] [--spec <plik>]`,
	);
	process.exit(1);
}
const spec = readSpec(post.specPath);
const errors = [];
const check = makeCheck(errors);
const eyebrow = spec.eyebrow ?? "Blog";
check("eyebrow", eyebrow, 40);
const P = postCover(slug).palette;

const middle = (children, style = {}) =>
	el(
		"div",
		{ display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center", ...style },
		children,
	);

/** Wielka etykieta w serifie – znak rozpoznawczy formatów, nieobecny w karuzeli. */
const bigLabel = (text, color, size = 200) =>
	el(
		"div",
		{ fontFamily: "Instrument Serif", fontSize: size, lineHeight: 0.9, letterSpacing: "-0.02em", color },
		text,
	);

let nodes;
let altLines;

if (format === "mit") {
	// Mit ma być zdaniem, które ktoś naprawdę mówi; fakt – tezą wpisu.
	check("mit", spec.mit, 110, { token: 17 });
	check("fakt", spec.fakt, 140, { token: 17 });
	check("rozwiniecie", spec.rozwiniecie, 220, { required: false, token: 30 });
	failOn(errors);
	const tiers = [
		[60, 84],
		[110, 72],
		[140, 64],
	];
	const dark = glowTone(GLOWS.mit);
	const light = glowTone(GLOWS.fakt);
	nodes = [
		glowFrame(GLOWS.mit, [
			top(dark, "01/02"),
			middle([
				bigLabel("Mit", MUTED_ON_INK),
				el(
					"div",
					{
						marginTop: 40,
						...serifFit(spec.mit, tiers),
						lineHeight: 1.06,
						textDecoration: "line-through",
						textDecorationColor: MUTED_ON_INK,
					},
					glue(spec.mit),
				),
			]),
			bottom(dark, P, eyebrow),
		]),
		glowFrame(GLOWS.fakt, [
			top(light, "02/02"),
			middle([
				bigLabel("Fakt", BLUE),
				el("div", { marginTop: 40, ...serifFit(spec.fakt, tiers), lineHeight: 1.06 }, glue(spec.fakt)),
				...(spec.rozwiniecie
					? [el("div", { marginTop: 28, fontSize: 32, lineHeight: 1.4 }, glue(spec.rozwiniecie))]
					: []),
			]),
			bottom(light, P, eyebrow),
		]),
	];
	altLines = [`Mit: ${spec.mit}`, `Fakt: ${spec.fakt}${spec.rozwiniecie ? ` ${spec.rozwiniecie}` : ""}`];
}

if (format === "zapisz") {
	check("tytul", spec.tytul, 60, { token: 20 });
	const items = Array.isArray(spec.punkty) ? spec.punkty : [];
	if (items.length < 3 || items.length > 6) errors.push(`punkty: ${items.length}, ma być 3–6`);
	// Wiersz ma zmieścić się w dwóch–trzech linijkach przy 32 px obok numeru.
	items.forEach((p, i) => check(`punkty[${i}]`, p, 90, { token: 26 }));
	failOn(errors);
	const tone = glowTone(GLOWS.zapisz);
	// Linia między wierszami: czerń przygaszona – na ciepłej bieli i limonkowej
	// poświacie hairline strony znika.
	const rule = "2px solid rgba(21, 21, 26, 0.2)";
	nodes = [
		glowFrame(GLOWS.zapisz, [
			top(tone, "Zapisz na później"),
			middle([
				el(
					"div",
					{
						...serifFit(spec.tytul, [
							[30, 84],
							[60, 68],
						]),
						lineHeight: 1.04,
						marginBottom: 32,
					},
					glue(spec.tytul),
				),
				...items.map((p, i) =>
					el(
						"div",
						{
							display: "flex",
							alignItems: "flex-start",
							gap: 28,
							paddingTop: 20,
							paddingBottom: 20,
							borderTop: rule,
							borderBottom: i === items.length - 1 ? rule : "none",
						},
						[
							el(
								"div",
								{ ...mono, fontSize: 24, color: INK, paddingTop: 6, width: 52, flexShrink: 0 },
								String(i + 1).padStart(2, "0"),
							),
							el("div", { fontSize: 32, lineHeight: 1.35, flexGrow: 1 }, glue(p)),
						],
					),
				),
			]),
			bottom(tone, P, eyebrow),
		]),
	];
	altLines = [`${spec.tytul}. ${items.map((p, i) => `${i + 1}. ${p}`).join(" ")}`];
}

if (format === "pytanie") {
	check("pytanie", spec.pytanie, 120, { token: 17 });
	check("podpis", spec.podpis, 60, { required: false });
	failOn(errors);
	const tone = glowTone(GLOWS.pytanie);
	const podpis = spec.podpis ?? "Odpowiedz w komentarzu";
	nodes = [
		glowFrame(GLOWS.pytanie, [
			top(tone, "Pytanie"),
			middle(
				[
					bigLabel("?", ULTRAMARINE, 340),
					el(
						"div",
						{
							marginTop: 16,
							...serifFit(spec.pytanie, [
								[60, 84],
								[90, 72],
								[120, 64],
							]),
							lineHeight: 1.06,
						},
						glue(spec.pytanie),
					),
					el("div", { marginTop: 40, fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 28 }, podpis),
				],
				{ alignItems: "center", textAlign: "center" },
			),
			bottom(tone, P, eyebrow),
		]),
	];
	altLines = [`Pytanie: ${spec.pytanie} ${podpis}`];
}

if (format === "liczba") {
	check("liczba", spec.liczba, 9, { token: 9 });
	check("zdanie", spec.zdanie, 170, { token: 26 });
	check("zrodlo", spec.zrodlo, 60, { required: false, token: 30 });
	failOn(errors);
	const tone = glowTone(GLOWS.liczba);
	nodes = [
		glowFrame(GLOWS.liczba, [
			top(tone, "Liczba"),
			middle([
				// Liczba to jeden token – `serifFit` pilnuje, żeby zmieściła się w kolumnie.
				el(
					"div",
					{
						...serifFit(spec.liczba, [
							[5, 300],
							[7, 230],
							[9, 180],
						]),
						lineHeight: 0.95,
						marginLeft: -6,
						color: LIME,
					},
					spec.liczba,
				),
				el(
					"div",
					{
						marginTop: 36,
						...serifFit(spec.zdanie, [
							[100, 52],
							[170, 44],
						]),
						lineHeight: 1.15,
					},
					glue(spec.zdanie),
				),
				...(spec.zrodlo
					? [el("div", { fontSize: 24, marginTop: 24, color: MUTED_ON_INK }, spec.zrodlo)]
					: []),
			]),
			bottom(tone, P, eyebrow),
		]),
	];
	altLines = [`${spec.liczba}. ${spec.zdanie}${spec.zrodlo ? ` Źródło: ${spec.zrodlo}` : ""}`];
}

await render({ ...post.out, nodes, altLines });
console.log(`Gotowe: ${format}, ${nodes.length} ${nodes.length === 1 ? "slajd" : "slajdy"}.`);
