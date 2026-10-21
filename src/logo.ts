/**
 * Znak fundacji z płótna „Logo — wybrane”: logotyp „pierwsze demo” z falą
 * dźwięku pod „demo” i ikona – słupki fali na ultramarynie. Bez zależności,
 * bo czyta go i Logo.astro (strona), i src/og.ts (karty, ikony, Instagram).
 *
 * Kolory to kolory znaku, nie tokeny strony: `--color-blue` i `--color-orange`
 * są o krok ciemniejsze od makiety dla kontrastu 7:1 *tekstu*, a fala i ikona
 * tekstem nie są. Róż na ultramarynie daje 3,1:1, czyli próg dla grafiki
 * (WCAG 1.4.11), seledyn 5,7:1.
 */
export const LOGO_COLORS = {
	ultramarine: "#2b3bff",
	lime: "#d4ff3a",
	pink: "#ff8ad8",
	orange: "#ff5a1f",
} as const;

/**
 * Fala pod „demo”: 20 słupków szerokości 4 w polu 160×28, każdy wyśrodkowany
 * na osi y = 14 – [x, y, wysokość]. Rozciągana na szerokość słowa
 * (`preserveAspectRatio="none"`), więc pasuje do każdego kroju i rozmiaru.
 */
export const WAVE = [
	[0, 12, 4],
	[8, 10, 8],
	[16, 11, 6],
	[24, 7, 14],
	[32, 4, 20],
	[40, 9, 10],
	[48, 11, 6],
	[56, 5, 18],
	[64, 1, 26],
	[72, 6, 16],
	[80, 11, 6],
	[88, 8, 12],
	[96, 3, 22],
	[104, 7, 14],
	[112, 11, 6],
	[120, 9, 10],
	[128, 5, 18],
	[136, 10, 8],
	[144, 12, 4],
	[152, 13, 2],
] as const;

export const waveRadius = (height: number) => Math.min(2, height / 2);

/** Fala jako samodzielny plik SVG – obrazek dla satori (pomija zagnieżdżony <svg>). */
export const waveSvg = (fill: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 28" preserveAspectRatio="none"><g fill="${fill}">${WAVE.map(
		([x, y, h]) => `<rect x="${x}" y="${y}" width="4" height="${h}" rx="${waveRadius(h)}"/>`,
	).join("")}</g></svg>`;

/**
 * Ikona (favikona, znak na kartach OG): sześć słupków z fali na kaflu
 * ultramaryny. Wysokości to ułamki boku; słupek ma 3/32 boku, odstęp połowę
 * tego, róg kafla 7/32 – wymiary favikony 32 px z makiety.
 */
const ICON_BARS = [0.25, 0.15, 0.45, 0.65, 0.4, 0.15] as const;
const ICON_BAR_WIDTH = 3 / 32;
const ICON_BAR_GAP = 1.5 / 32;
const ICON_RADIUS = 7 / 32;

/**
 * Słupki w pełnych pikselach pola `size`×`size`. Przy 16 px makieta ma słupek
 * 1,5 px – po rasteryzacji to dwa szare piksele zamiast różowego, więc szerokość,
 * odstęp i wysokość są zaokrąglane, a wysokości mają parzystość boku, żeby
 * środek wypadał na granicy pikseli. Gdy słupki zajęłyby więcej niż 85% boku
 * (16 px: 2 + 1 daje 17), słupek chudnie. Grupa może stać pół piksela
 * w lewo od środka – lepsze niż rozmyte krawędzie.
 */
const iconBars = (size: number) => {
	const count = ICON_BARS.length;
	const gap = Math.max(1, Math.round(ICON_BAR_GAP * size - 0.01));
	let width = Math.max(1, Math.round(ICON_BAR_WIDTH * size));
	while (width > 1 && count * width + (count - 1) * gap > 0.85 * size) width -= 1;
	const left = Math.floor((size - (count * width + (count - 1) * gap)) / 2);
	return ICON_BARS.map((fraction, index) => {
		const height = Math.max(width, Math.round((fraction * size - (size % 2)) / 2) * 2 + (size % 2));
		return { x: left + index * (width + gap), y: (size - height) / 2, width, height };
	});
};

/**
 * Ikona jako SVG o boku `size` px – rysowana osobno dla każdego rozmiaru, nie
 * skalowana. Same prostokąty, bez tekstu: sharp rasteryzuje SVG librsvg, a ten
 * sięga po fonty systemowe.
 */
export const iconSvg = (size: number) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${ICON_RADIUS * size}" fill="${LOGO_COLORS.ultramarine}"/>${iconBars(
		size,
	)
		.map(
			(bar) =>
				`<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${bar.width / 2}" fill="${LOGO_COLORS.pink}"/>`,
		)
		.join("")}</svg>`;
