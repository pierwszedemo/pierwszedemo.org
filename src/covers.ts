/**
 * Okładki wpisów – system z Claude Design („Okładki — system i generator”,
 * artboard `Cover.dc.html`): 5 szablonów × 8 kolorystyk × lustro × ziarno, więc
 * każdy wpis ma własną grafikę bez rysowania jej ręcznie. Ta sama okładka jest
 * obrazkiem OG wpisu (z tytułem, `renderPostCover` w og.ts) i ilustracją jego
 * karty na liście (bez tytułu, PostCard.astro).
 *
 * Kod to wierny port logiki z artboardu: FNV-1a, ten sam generator liczb
 * (mulberry32), ta sama kolejność losowań i zaokrąglenia – te same parametry
 * dają w Claude Design dokładnie ten sam obrazek, więc okładkę wpisu da się
 * tam odtworzyć z `coverParams()`. Dwie świadome różnice:
 * - parametry liczymy ze sluga, nie z tytułu, żeby poprawka tytułu w Tinie
 *   nie zmieniała okładki;
 * - fala w logotypie jest pomarańczowa, gdy ma na tle kontrast grafiki 3:1
 *   (WCAG 1.4.11) – w praktyce tylko na czerni i granacie; na pozostałych
 *   tłach bierze kolor fali z kolorystyki, a gdy i on nie wystarcza, kolor tekstu.
 *
 * Bez zależności – czyta go i build (satori), i komponent strony.
 */
import { LOGO_COLORS } from "./logo";

const INK = "#15151a";
const CREAM = "#fbfaf7";
const BLUE = LOGO_COLORS.ultramarine;
const LIME = LOGO_COLORS.lime;
const PINK = "#ff8ad8";
const ORANGE = LOGO_COLORS.orange;
const SUN = "#ffc93c";
const NAVY = "#121a6b";

export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

/** Tło, trzy kolory kształtów (a, b, c), tekst, fala logotypu z makiety i ciemne pasy. */
const COLORWAYS = [
	{ name: "Ultramaryna", bg: BLUE, a: LIME, b: PINK, c: ORANGE, text: LIME, wave: PINK, dark: INK },
	{ name: "Seledyn", bg: LIME, a: BLUE, b: ORANGE, c: PINK, text: INK, wave: BLUE, dark: INK },
	{ name: "Róż", bg: PINK, a: INK, b: SUN, c: BLUE, text: INK, wave: BLUE, dark: INK },
	{ name: "Pomarańcz", bg: ORANGE, a: INK, b: CREAM, c: LIME, text: INK, wave: INK, dark: INK },
	{ name: "Czerń", bg: INK, a: ORANGE, b: PINK, c: LIME, text: CREAM, wave: ORANGE, dark: BLUE },
	{ name: "Słonecznik", bg: SUN, a: BLUE, b: PINK, c: INK, text: INK, wave: ORANGE, dark: INK },
	{ name: "Krem", bg: CREAM, a: BLUE, b: ORANGE, c: LIME, text: INK, wave: ORANGE, dark: INK },
	{ name: "Granat", bg: NAVY, a: PINK, b: LIME, c: SUN, text: CREAM, wave: PINK, dark: BLUE },
] as const;

const TEMPLATES = ["Scena", "Fala", "Promienie", "Cytat", "Kolaż"] as const;

export interface CoverParams {
	/** 1–5: Scena, Fala, Promienie, Cytat, Kolaż. */
	template: number;
	/** 1–8, indeks w COLORWAYS od jedynki. */
	colorway: number;
	/** Grafika po lewej, tekst po prawej. Cytat nigdy – cudzysłów nie ma lustra. */
	mirror: boolean;
	seed: number;
}

const fnv1a = (text: string) => {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash >>> 0;
};

/** Parametry okładki ze sluga wpisu – jak `fromTitle` w generatorze. */
export function coverParams(slug: string): CoverParams {
	const hash = fnv1a(slug);
	const template = (hash % 5) + 1;
	return {
		template,
		colorway: ((hash >>> 3) % 8) + 1,
		mirror: ((hash >>> 6) & 1) === 1 && template !== 4,
		seed: (hash >>> 7) % 100000,
	};
}

/** Opis parametrów do wpisania w generatorze Claude Design. */
export const describeCover = ({ template, colorway, mirror, seed }: CoverParams) =>
	`szablon ${template} ${TEMPLATES[template - 1]} · kolor ${colorway} ${COLORWAYS[colorway - 1].name}${mirror ? " · lustro" : ""} · ziarno ${seed}`;

const luminance = (hex: string) => {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (x: string, y: string) => {
	const [light, dark] = [luminance(x), luminance(y)].sort((p, q) => q - p);
	return (light + 0.05) / (dark + 0.05);
};

export interface CoverPalette {
	bg: string;
	a: string;
	b: string;
	c: string;
	text: string;
	wave: string;
	dark: string;
	chipBg: string;
	chipText: string;
}

export function coverPalette(colorway: number): CoverPalette {
	const base = COLORWAYS[colorway - 1];
	const dark = base.bg === INK || base.bg === NAVY;
	const chipBg = dark ? CREAM : base.bg === CREAM ? INK : CREAM;
	return {
		...base,
		wave: [ORANGE, base.wave, base.text].find((color) => contrast(color, base.bg) >= 3) ?? base.text,
		chipBg,
		chipText: chipBg === CREAM ? INK : CREAM,
	};
}

/** mulberry32 z artboardu, co do bitu – inaczej te same parametry dałyby inny obrazek. */
const random = (seed: number) => {
	let s = seed >>> 0 || 1;
	return () => {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const burst = (cx: number, cy: number, outer: number, inner: number, points: number, rotation: number) =>
	Array.from({ length: 2 * points }, (_, k) => {
		const radius = k % 2 ? inner : outer;
		const angle = rotation + (k * Math.PI) / points;
		return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
	}).join(" ");

/**
 * Rząd zaokrąglonych słupków – w makiecie flex z `justify-content:
 * space-between` i wyśrodkowaniem w pionie, tu przeliczony na prostokąty.
 */
const barRow = (
	left: number,
	width: number,
	top: number,
	height: number,
	bars: { h: number; fill: string }[],
	w: number,
) => {
	const gap = (width - bars.length * w) / (bars.length - 1);
	return bars
		.map(({ h, fill }, i) => {
			const barHeight = Math.max(2, Number(h.toFixed(1)));
			const x = left + i * (w + gap);
			const y = top + (height - barHeight) / 2;
			return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${barHeight}" rx="${w / 2}" fill="${fill}"/>`;
		})
		.join("");
};

/**
 * Cudzysłów szablonu Cytat: w makiecie span 900 px z `line-height: 1` od
 * y = −330. Instrument Serif ma wznoszenie 0,99 i zejście 0,31 em, więc linia
 * bazowa wypada 0,84 em pod górą pudełka – stąd y w wersji SVG.
 */
export const COVER_QUOTE = { x: 600, top: -330, baseline: -330 + 0.84 * 900, size: 900, glyph: "„" } as const;

/**
 * Kształty okładki (bez tekstu) jako elementy SVG w polu 1200×630 – już
 * odbite, gdy `mirror`. Cudzysłów Cytatu to tekst, więc wraca osobno: satori
 * składa go jako tekst, strona jako `<text>` (`coverArtSvg`).
 */
export function coverArt({ template, colorway, mirror, seed }: CoverParams) {
	const P = coverPalette(colorway);
	const rnd = random(seed);
	const r = (a: number, b: number) => a + (b - a) * rnd();

	// Kolejność losowań jak w makiecie: wszystkie szablony po kolei, niezależnie
	// od tego, który się rysuje – inaczej ziarno dawałoby inny obrazek.
	const t1 = {
		sx: r(820, 960).toFixed(0),
		sy: r(150, 200).toFixed(0),
		sr: r(100, 130).toFixed(0),
		cx: r(640, 720).toFixed(0),
		cy: r(90, 180).toFixed(0),
	};
	const crot = `rotate(${r(0, 60).toFixed(0)} ${Number(t1.cx) + 13} ${Number(t1.cy) + 13})`;

	const peak = Math.floor(r(6, 13));
	const t2burst = burst(r(1040, 1110), r(90, 130), 78, 42, 10, r(0, 1));
	const t2bars = Array.from({ length: 14 }, (_, i) =>
		i === peak ? { h: 440, fill: P.c } : { h: r(60, 360), fill: P.a },
	);

	const sk = r(-40, 40);
	const beam = (x1: number, x2: number) => `1260,720 ${(x1 + sk).toFixed(0)},-20 ${(x2 + sk).toFixed(0)},-20`;
	let zig = "";
	for (let x = 520; x <= 1300; x += 24) zig += `${x},${(x / 24) % 2 ? 518 : 530} `;
	const t3 = {
		b1: beam(560, 680),
		b2: beam(780, 880),
		b3: beam(980, 1060),
		zig: `${zig}1300,760 520,760`,
		dx: r(620, 760).toFixed(0),
		dy: r(200, 320).toFixed(0),
	};

	const t4 = { cx: r(1040, 1120).toFixed(0), cy: r(90, 150).toFixed(0), cr: r(30, 56).toFixed(0) };
	const t4bars = Array.from({ length: 20 }, () => ({ h: r(8, 80), fill: P.b }));

	const t5cx = r(700, 820).toFixed(0);
	let band = "M540 630 L540 470";
	for (let x = 540; x < 1200; x += 40) band += ` L${x} 450 L${x + 20} 450 L${x + 20} 470 L${x + 40} 470`;
	band += " L1200 630 Z";
	const t5burst = burst(r(990, 1060), r(240, 300), 150, 82, 11, r(0, 1));

	const shapes = [
		`<circle cx="${t1.sx}" cy="${t1.sy}" r="${t1.sr}" fill="${P.b}"/><path d="M600 630 V440 A290 290 0 0 1 1180 440 V630 Z" fill="${P.a}"/><path d="M730 630 V470 A160 160 0 0 1 1050 470 V630 Z" fill="${P.c}"/><path d="M830 630 V510 A60 60 0 0 1 950 510 V630 Z" fill="${P.bg}"/><rect x="${t1.cx}" y="${t1.cy}" width="26" height="26" transform="${crot}" fill="${P.c}"/>`,
		`<polygon points="${t2burst}" fill="${P.b}"/>${barRow(580, 560, 0, 630, t2bars, 26)}`,
		`<polygon points="${t3.b1}" fill="${P.a}"/><polygon points="${t3.b2}" fill="${P.b}"/><polygon points="${t3.b3}" fill="${P.c}"/><polygon points="${t3.zig}" fill="${P.dark}" transform="rotate(-10 900 560)"/><circle cx="${t3.dx}" cy="${t3.dy}" r="16" fill="${P.c}"/>`,
		`<circle cx="${t4.cx}" cy="${t4.cy}" r="${t4.cr}" fill="${P.c}"/>`,
		`<circle cx="${t5cx}" cy="150" r="230" fill="${P.b}"/><path d="${band}" fill="${P.dark}"/><polygon points="${t5burst}" fill="${P.a}"/>`,
	][template - 1];
	// Słupki Cytatu leżą nad cudzysłowem, więc idą osobno, po nim.
	const front = template === 4 ? barRow(640, 480, 460, 90, t4bars, 8) : "";

	const flip = (svg: string) =>
		mirror && svg ? `<g transform="matrix(-1 0 0 1 ${COVER_WIDTH} 0)">${svg}</g>` : svg;
	return { palette: P, back: flip(shapes), front: flip(front), quote: template === 4 ? P.a : undefined };
}

/**
 * Okładka bez tekstu jako samodzielne SVG – ilustracja karty wpisu na stronie.
 * Cudzysłów Cytatu jako `<text>` w kroju strony (klasa `font-serif`).
 */
export function coverArtSvg(params: CoverParams, attrs = "") {
	const { palette, back, front, quote } = coverArt(params);
	const glyph = quote
		? `<text x="${COVER_QUOTE.x}" y="${COVER_QUOTE.baseline}" font-size="${COVER_QUOTE.size}" class="font-serif" fill="${quote}">${COVER_QUOTE.glyph}</text>`
		: "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" ${attrs}><rect width="${COVER_WIDTH}" height="${COVER_HEIGHT}" fill="${palette.bg}"/>${back}${glyph}${front}</svg>`;
}
