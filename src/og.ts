import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { HOME_CITY, LOGOTYPE, type PAGE_HEADERS, SITE_HOST, SITE_TAGLINE, WORDMARK } from "./consts";
import { COVER_HEIGHT, COVER_QUOTE, COVER_WIDTH, type CoverParams, coverArt } from "./covers";
import { LOGO_COLORS, WAVE, waveRadius, waveSvg } from "./logo";
import { accentParts, fixHanging } from "./typography";

/**
 * Karty OG 1200×630 w języku strony („Wersja 2”): ciepła biel, pigułka nad
 * tytułem, tytuł w Instrument Serif, logotyp i pasek akcentów u dołu – jak
 * stopka strony. Karta cyklu koncertów zostaje przy starym, szwajcarskim
 * układzie (`renderSwissCard`), bo ta strona ma własną tożsamość.
 *
 * Dlaczego satori, a nie samo SVG w sharpie: sharp renderuje SVG librsvg,
 * który sięga po *systemowe* fonty – Instrument Serif nie ma ani na tej
 * maszynie, ani na builderze Cloudflare, więc tekst wyszedłby zastępczym
 * krojem. Satori dostaje pliki TTF wprost i zamienia tekst na ścieżki, więc
 * sharp rasteryzuje już gotowe kształty. Stąd też wersje TTF
 * w `src/assets/fonts` – Fonts API Astro cachuje woff2, którego satori nie czyta.
 *
 * Ścieżki liczymy od `process.cwd()`, a nie od `import.meta.url`: Vite bundluje
 * ten moduł do `dist/server/.prerender/chunks/`, obok którego plików TTF już
 * nie ma. Kod wykonuje się wyłącznie przy buildzie (endpointy mają
 * `prerender = true`), więc cwd to katalog repo.
 */
const font = (path: string) => readFileSync(resolve(process.cwd(), path));

const FONTS = [
	{
		name: "Instrument Serif",
		data: font("src/assets/fonts/InstrumentSerif-Regular.ttf"),
		weight: 400 as const,
		style: "normal" as const,
	},
	{
		name: "Instrument Serif",
		data: font("src/assets/fonts/InstrumentSerif-Italic.ttf"),
		weight: 400 as const,
		style: "italic" as const,
	},
	{
		name: "Instrument Sans",
		data: font("src/assets/fonts/InstrumentSans-Regular.ttf"),
		weight: 400 as const,
		style: "normal" as const,
	},
	{
		name: "Instrument Sans",
		data: font("src/assets/fonts/InstrumentSans-SemiBold.ttf"),
		weight: 600 as const,
		style: "normal" as const,
	},
];

/** Paleta z `@theme` w global.css – satori nie czyta zmiennych CSS. */
export const PALETTE = {
	paper: "#fbfaf7",
	ink: "#15151a",
	muted: "#4a4a53",
	hairline: "#e6e3dc",
	blue: "#2230e0",
	orange: "#ff7d40",
	lime: "#d4ff3a",
	pink: "#ff8ad8",
	sun: "#ffc93c",
} as const;

// Satori bez JSX: element to zwykły obiekt {type, props}. Każdy div z wieloma
// dziećmi musi mieć jawny `display: flex` – satori nie zakłada blokowego układu.
const el = (type: string, style: Record<string, unknown>, children?: unknown) =>
	({ type, props: { style, ...(children === undefined ? {} : { children }) } }) as const;

/**
 * Satori typuje drzewo jako ReactNode, a dostaje te same obiekty {type, props},
 * które daje JSX – bez @types/react typ był `any`, z nim trzeba to powiedzieć.
 */
const render = (node: unknown, options: Parameters<typeof satori>[1]) =>
	satori(node as Parameters<typeof satori>[0], options);

/**
 * Napis z kropkami „ · ” jak Middot.astro na stronie: spacja Instrument Sans
 * ma 0,19 em i kropka kleiła się do słów, więc człony i kropki to osobne
 * pudełka, a kropka ma 0,44 em marginesu – tyle co spacja plus margines na
 * stronie.
 */
const dotted = (text: string, style: Record<string, unknown> = {}) =>
	el(
		"div",
		{ display: "flex", ...style },
		text
			.split(" · ")
			.flatMap((part, index) => [
				...(index > 0 ? [el("div", { margin: "0 0.44em" }, "·")] : []),
				el("div", {}, part),
			]),
	);

/** SVG jako obrazek z data URI – satori pomija zagnieżdżony element <svg>. */
const svgImg = (svg: string, width: number, height: number, style: Record<string, unknown> = {}) => ({
	type: "img",
	props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height, style },
});

/** Fala bez stałej szerokości – rozciąga ją rodzic (kolumna flex). */
const waveImg = (fill: string, height: number) => ({
	type: "img",
	props: {
		src: `data:image/svg+xml;base64,${Buffer.from(waveSvg(fill)).toString("base64")}`,
		style: { height, alignSelf: "stretch" },
	},
});

/**
 * Logotyp z Logo.astro: „pierwsze ” i kolumna z „demo” nad falą. Kolumna flex
 * rozciąga falę na szerokość słowa, proporcje w `em` jak na stronie. Twarda
 * spacja, bo satori obcina zwykłą na końcu pudełka.
 */
export const wordmark = (size: number, color: string = PALETTE.ink, wave: string = LOGO_COLORS.orange) => {
	const split = LOGOTYPE.lastIndexOf(" ");
	return el(
		"div",
		{
			display: "flex",
			alignItems: "flex-start",
			fontFamily: "Instrument Serif",
			fontSize: size,
			lineHeight: 1,
			letterSpacing: "-0.015em",
			color,
		},
		[
			el("div", {}, `${LOGOTYPE.slice(0, split)}\u00a0`),
			el("div", { display: "flex", flexDirection: "column", gap: size * 0.12 }, [
				el("div", {}, LOGOTYPE.slice(split + 1)),
				waveImg(wave, size * 0.33),
			]),
		],
	);
};

/**
 * Znak na każdej karcie: „Fundacja” nad logotypem, u góry. Słowo „fundacja”
 * ma być czytelne w każdej miniaturze podglądu linku, a karty mają czytać się
 * jako jedna rodzina – na ciepłej bieli (strona główna, podstrony, wpisy)
 * w czerni, jak logotyp w nawigacji, na ultramarynie okładek profili w bieli
 * i seledynie. Fala zawsze pomarańczowa.
 */
export const lockup = (
	size: number,
	color = "#ffffff",
	wordmarkColor: string = LOGO_COLORS.lime,
	{ wave = LOGO_COLORS.orange as string, align = "flex-start" }: { wave?: string; align?: string } = {},
) =>
	el("div", { display: "flex", flexDirection: "column", alignItems: align, gap: size * 0.05 }, [
		// Krój wprost, nie z rodzica: na kadrach z Instrument Sans jako bazą
		// (Instagram) „Fundacja” wychodziła bezszeryfowa.
		el(
			"div",
			{
				fontFamily: "Instrument Serif",
				fontSize: size * 0.58,
				lineHeight: 1,
				letterSpacing: "-0.02em",
				color,
			},
			"Fundacja",
		),
		wordmark(size, wordmarkColor, wave),
	]);

/**
 * Tytuł jako ciąg słów-elementów flex z zawijaniem. Satori nie składa tekstu
 * z kilku stylów w jeden akapit – każde dziecko flexa to osobne pudełko – więc
 * akcent (`*…*`) wymaga rozbicia na słowa. Spójniki są już doklejone twardą
 * spacją (`accentParts` woła `fixHanging`), więc dzielimy tylko po zwykłej.
 */
const titleWords = (title: string, color: string = PALETTE.ink, accent: string = PALETTE.blue) =>
	accentParts(title).flatMap((part) =>
		part.text
			.split(" ")
			.filter(Boolean)
			.map((word) => el("span", { marginRight: "0.24em", color: part.accent ? accent : color }, word)),
	);

/**
 * Skala grafiki od prawej krawędzi i punktu `originY` (domyślnie środek
 * wysokości – dolna krawędź trzyma przy niej kształty stojące na dole), potem
 * przesunięcie w prawo o `dx`.
 */
interface ArtFit {
	dx?: number;
	scale?: number;
	originY?: number;
}

/**
 * Grafika okładki jako warstwy satori: kształty pod spodem, „ szablonu Cytat
 * (tekst, nie ścieżka – patrz COVER_QUOTE) i kształty na wierzchu. `fit`
 * odsuwa ją od tekstu na kartach marki; okładki wpisów rysują ją bez zmian.
 */
const coverLayers = (
	{ back, front, quote }: ReturnType<typeof coverArt>,
	{ dx = 0, scale = 1, originY = COVER_HEIGHT / 2 }: ArtFit = {},
) => {
	const tx = COVER_WIDTH * (1 - scale) + dx;
	const ty = originY * (1 - scale);
	const layer = (shapes: string) =>
		svgImg(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}">${
				tx || ty ? `<g transform="translate(${tx} ${ty}) scale(${scale})">${shapes}</g>` : shapes
			}</svg>`,
			COVER_WIDTH,
			COVER_HEIGHT,
			{ position: "absolute", left: 0, top: 0 },
		);
	return [
		layer(back),
		...(quote
			? [
					el(
						"div",
						{
							position: "absolute",
							left: COVER_QUOTE.x * scale + tx,
							top: COVER_QUOTE.top * scale + ty,
							fontSize: COVER_QUOTE.size * scale,
							lineHeight: 1,
							color: quote,
						},
						COVER_QUOTE.glyph,
					),
				]
			: []),
		layer(front),
	];
};

/**
 * Karta OG wpisu = jego okładka (src/covers.ts): grafika z generatora
 * Claude Design w kolorystyce i szablonie liczonych ze sluga, a w kolumnie
 * po drugiej stronie znak „Fundacja / pierwsze demo” u góry, tytuł i pigułka
 * kategorii na dole. Kolumna 500 px jak w makiecie; przy lustrze grafika
 * idzie na lewo, a tekst na prawo, wyrównany do prawej krawędzi.
 */
export async function renderPostCover({
	params,
	title,
	badge,
}: {
	/** `resolveCover()` – ręczne z /admin albo ze sluga. */
	params: CoverParams;
	title: string;
	badge: string;
}): Promise<Buffer> {
	const art = coverArt(params);
	const P = art.palette;
	const side = params.mirror ? { right: 64, alignItems: "flex-end" } : { left: 64, alignItems: "flex-start" };
	const length = title.length;

	const svg = await render(
		el(
			"div",
			{
				display: "flex",
				position: "relative",
				width: "100%",
				height: "100%",
				backgroundColor: P.bg,
				color: P.text,
				fontFamily: "Instrument Serif",
				overflow: "hidden",
			},
			[
				...coverLayers(art),
				el(
					"div",
					{
						position: "absolute",
						top: 56,
						bottom: 56,
						width: 500,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						gap: 24,
						...side,
					},
					[
						lockup(72, P.text, P.text, { wave: P.wave, align: side.alignItems }),
						el(
							"div",
							{
								fontSize: length > 48 ? 54 : 62,
								lineHeight: 1,
								letterSpacing: "-0.015em",
								textAlign: params.mirror ? "right" : "left",
							},
							fixHanging(title),
						),
						el(
							"div",
							{
								display: "flex",
								padding: "10px 22px",
								borderRadius: 999,
								backgroundColor: P.chipBg,
								color: P.chipText,
								fontFamily: "Instrument Sans",
								fontWeight: 600,
								fontSize: 24,
								lineHeight: 1.2,
							},
							badge,
						),
					],
				),
			],
		),
		{ width: COVER_WIDTH, height: COVER_HEIGHT, fonts: FONTS },
	);

	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Karty marki – strona główna i podstrony – w kolorystyce „Krem” z systemu
 * okładek: ciepła biel, czerń, a po prawej grafika z okładek w niebieskim,
 * pomarańczu i limonce, każda strona w innym szablonie. Ultramaryna na całą
 * kartę krzyczała w podglądzie linku; sama biel z tekstem była za grzeczna.
 * Wszystkie mają układ strony głównej: duży znak u góry kolumny 440 px, na
 * dole zdanie w Instrument Sans i adres w limonkowej pigułce. Znak przy tej
 * wielkości wychodzi poza kolumnę (do x ≈ 550), a Fala i Kolaż zaczynają się
 * przy x = 500–580 – fala z okładki stała tuż przy fali logotypu. Stąd `fit`:
 * grafika zmniejszona albo przesunięta tak, że żaden kształt nie podchodzi
 * do liter bliżej niż na 125 px (Fala, Kolaż; reszta szablonów ma tyle
 * i bez tego).
 * Karty wpisów to ich okładki (`renderPostCover`) – tam tytułem jest wpis,
 * a nie fundacja.
 */
const KREM = 7;
export type BrandPage = keyof typeof PAGE_HEADERS;
const BRAND_ART = {
	home: { params: { template: 2, colorway: KREM, mirror: false, seed: 13, roles: 0 }, fit: { scale: 0.85 } },
	fundacja: { params: { template: 1, colorway: KREM, mirror: false, seed: 12, roles: 0 }, fit: {} },
	wiedza: { params: { template: 3, colorway: KREM, mirror: false, seed: 14, roles: 0 }, fit: {} },
	aktualnosci: { params: { template: 4, colorway: KREM, mirror: false, seed: 15, roles: 0 }, fit: {} },
	wesprzyj: {
		params: { template: 5, colorway: KREM, mirror: false, seed: 16, roles: 0 },
		fit: { dx: 10, scale: 0.76, originY: COVER_HEIGHT },
	},
} satisfies Record<BrandPage | "home", { params: CoverParams; fit: ArtFit }>;

/** Adres w limonkowej pigułce, jak pigułka kategorii nad tytułem wpisu. */
const hostPill = (path = "") =>
	el(
		"div",
		{
			fontFamily: "Instrument Sans",
			fontWeight: 600,
			fontSize: 24,
			lineHeight: 1,
			color: PALETTE.ink,
			backgroundColor: PALETTE.lime,
			borderRadius: 999,
			padding: "0.4em 0.75em",
		},
		`${SITE_HOST}${path}`,
	);

const brandCard = async (
	{ params, fit }: { params: CoverParams; fit: ArtFit },
	text: unknown[],
	path?: string,
) => {
	const svg = await render(
		el(
			"div",
			{
				display: "flex",
				position: "relative",
				width: "100%",
				height: "100%",
				backgroundColor: PALETTE.paper,
				color: PALETTE.ink,
				fontFamily: "Instrument Serif",
				overflow: "hidden",
			},
			[
				...coverLayers(coverArt(params), fit),
				el(
					"div",
					{
						position: "absolute",
						left: 64,
						top: 56,
						bottom: 56,
						width: 440,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: "flex-start",
						gap: 24,
					},
					[
						lockup(100, PALETTE.ink, PALETTE.ink),
						el("div", { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }, [
							el(
								"div",
								{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									fontFamily: "Instrument Sans",
									fontSize: 30,
									lineHeight: 1.2,
								},
								text,
							),
							hostPill(path),
						]),
					],
				),
			],
		),
		{ width: COVER_WIDTH, height: COVER_HEIGHT, fonts: FONTS },
	);
	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
};

/** Strona główna: znak, a na dole czym się zajmujemy, gdzie i adres. */
export const renderHomeCard = () =>
	brandCard(BRAND_ART.home, [el("div", { fontWeight: 600 }, fixHanging(`${SITE_TAGLINE} – ${HOME_CITY}`))]);

/**
 * Podstrona: ten sam układ, a na dole tytuł strony, akapit z jej nagłówka
 * i adres strony w pigułce.
 */
export const renderPageCard = ({ page, title, intro }: { page: BrandPage; title: string; intro: string }) =>
	brandCard(
		BRAND_ART[page],
		[
			el(
				"div",
				{ display: "flex", flexWrap: "wrap", fontWeight: 600 },
				titleWords(title, PALETTE.ink, PALETTE.blue),
			),
			el("div", { fontSize: 24, lineHeight: 1.3, color: PALETTE.muted }, fixHanging(intro)),
		],
		`/${page}`,
	);

/** Akapit na ultramarynie okładek profili – biel przygaszona, żeby znak został wyżej w hierarchii. */
const ON_BLUE_MUTED = "#dde1ff";

/**
 * Okładki profili (Facebook, LinkedIn) – rodzina kart marki: ultramaryna,
 * po jednej stronie znak „Fundacja / pierwsze demo” z hasłem, po drugiej
 * grafika z systemu okładek wpisów (szablon Fala – fala jak w logotypie).
 * Każda platforma kadruje okładkę inaczej i kładzie na nią zdjęcie
 * profilowe, więc tekst siedzi w `safe` – prostokącie widocznym w każdym
 * kadrze – a grafika (`art`) tam, gdzie zdjęcie nie zasłoni nic ważnego.
 * `scale` mnoży wszystko – wersja @2x dla ekranów o dużej gęstości.
 */
export async function renderSocialCover({
	width,
	height,
	safe,
	art,
	textSide,
	lockupSize,
	scale = 1,
}: {
	width: number;
	height: number;
	safe: { x: number; y: number; w: number; h: number };
	/** Lewy górny róg i wysokość grafiki; szerokość wynika z kadru 640×630. */
	art: { x: number; y: number; h: number };
	textSide: "left" | "right";
	lockupSize: number;
	scale?: number;
}): Promise<Buffer> {
	const mirror = textSide === "right";
	const { back, front } = coverArt({ template: 2, colorway: 1, mirror, seed: 7, roles: 0 });
	// Fala zajmuje w okładce 1200×630 prawe 640 px; przy lustrze – lewe.
	const view = mirror ? "0 0 640 630" : `${COVER_WIDTH - 640} 0 640 630`;
	const artH = art.h * scale;
	const artW = (artH * 640) / 630;
	const align = textSide === "left" ? "flex-start" : "flex-end";
	const s = (value: number) => value * scale;

	const svg = await render(
		el(
			"div",
			{
				display: "flex",
				position: "relative",
				width: "100%",
				height: "100%",
				backgroundColor: LOGO_COLORS.ultramarine,
				color: "#ffffff",
				fontFamily: "Instrument Serif",
			},
			[
				svgImg(
					`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${back}${front}</svg>`,
					artW,
					artH,
					{ position: "absolute", left: s(art.x), top: s(art.y) },
				),
				el(
					"div",
					{
						position: "absolute",
						top: s(safe.y),
						height: s(safe.h),
						...(textSide === "left" ? { left: s(safe.x) } : { right: s(width - safe.x - safe.w) }),
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: align,
						gap: s(lockupSize * 0.22),
					},
					[
						lockup(s(lockupSize), "#ffffff", LOGO_COLORS.lime, { align }),
						dotted(`${SITE_TAGLINE} · ${HOME_CITY}`, {
							fontFamily: "Instrument Sans",
							fontWeight: 600,
							fontSize: s(lockupSize * 0.24),
							color: ON_BLUE_MUTED,
						}),
					],
				),
			],
		),
		{ width: width * scale, height: height * scale, fonts: FONTS },
	);
	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Avatar z płótna „Logo — wybrane”: „demo” w seledynie nad pomarańczową falą, na
 * ultramarynie na całe pole – platformy i systemy same kadrują w koło albo
 * w zaokrąglony kafel. Zwraca wnętrze SVG (bez <svg>) z samych ścieżek
 * i prostokątów: litery zamienia na krzywe satori (librsvg wziąłby font
 * systemowy), a falę liczymy od pudełka, które satori dla niej rozłożył. Bez
 * <image>, masek i transformacji – to samo wnętrze idzie do PNG i do BIMI
 * (SVG Tiny PS). Proporcje jak na stronie: fala na szerokość słowa, odstęp
 * 0,12 em, wysokość 0,3 em. Stopień 0,34 boku: najdalszy piksel znaku sięga
 * ~3/4 promienia koła, w które kadrują go Instagram, Facebook i skrzynki
 * pocztowe. Przy 0,3 (2/3 promienia) znak tonął w ultramarynie, przy 0,38
 * (83%) dotykał krawędzi.
 */
export async function renderAvatarBody(size: number): Promise<string> {
	const fontSize = size * 0.34;
	// Kolor-znacznik: po nim znajdujemy w wyniku pudełko fali.
	const marker = "#010101";
	const svg = await render(
		el(
			"div",
			{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
			el(
				"div",
				{
					display: "flex",
					flexDirection: "column",
					gap: fontSize * 0.12,
					// Linia tekstu ma nad „d” pusty zapas kroju, więc wyśrodkowane
					// pudełko stawiało litery i falę ~0,045 em za nisko. Margines
					// pod spodem podnosi je o połowę swojej wysokości.
					marginBottom: fontSize * 0.09,
					fontFamily: "Instrument Serif",
					fontSize,
					lineHeight: 1,
					color: LOGO_COLORS.lime,
				},
				[
					el("div", {}, LOGOTYPE.slice(LOGOTYPE.lastIndexOf(" ") + 1)),
					el("div", { height: fontSize * 0.3, backgroundColor: marker }),
				],
			),
		),
		{ width: size, height: size, fonts: FONTS },
	);
	const glyphs = svg.match(new RegExp(`<path fill="${LOGO_COLORS.lime}" d="[^"]+"/>`, "g"));
	const box = svg.match(
		new RegExp(`<rect x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" fill="${marker}"/>`),
	);
	if (!glyphs || !box) throw new Error("Satori zmienił format SVG: brak ścieżki słowa albo pudełka fali.");
	const [left, top, width, height] = box.slice(1).map(Number);
	const sx = width / 160;
	const sy = height / 28;
	const n = (value: number) => Number(value.toFixed(2));
	const wave = WAVE.map(
		([x, y, h]) =>
			`<rect x="${n(left + x * sx)}" y="${n(top + y * sy)}" width="${n(4 * sx)}" height="${n(h * sy)}" rx="${n(waveRadius(h) * sx)}" ry="${n(waveRadius(h) * sy)}" fill="${LOGO_COLORS.orange}"/>`,
	);
	return [
		`<rect width="${size}" height="${size}" fill="${LOGO_COLORS.ultramarine}"/>`,
		...glyphs,
		...wave,
	].join("");
}

/**
 * Karta cyklu koncertów w dawnym, szwajcarskim układzie: biel, twarda linia,
 * Archivo w tytule, IBM Plex Mono w etykietach. Strona cyklu nie przeszła na
 * „Wersję 2” – ma własną tożsamość plakatu – więc jej karta też nie.
 */
const SWISS_FONTS = [
	{
		name: "Archivo",
		data: font("src/assets/fonts/Archivo-SemiBold.ttf"),
		weight: 600 as const,
		style: "normal" as const,
	},
	{
		name: "IBM Plex Mono",
		data: font("src/assets/fonts/IBMPlexMono-Medium.ttf"),
		weight: 500 as const,
		style: "normal" as const,
	},
];

const SWISS_INK = "#101010";
const SWISS_MUTED = "#6f6d68";

const mono = {
	fontFamily: "IBM Plex Mono",
	fontSize: 22,
	letterSpacing: "0.18em",
	textTransform: "uppercase" as const,
};

export async function renderSwissCard({
	eyebrow,
	title,
	badge,
}: {
	eyebrow: string;
	title: string;
	badge: string;
}): Promise<Buffer> {
	const size = title.length > 64 ? 66 : title.length > 40 ? 78 : 94;

	const svg = await render(
		el(
			"div",
			{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				width: "100%",
				height: "100%",
				backgroundColor: "#ffffff",
				color: SWISS_INK,
				fontFamily: "Archivo",
			},
			[
				el("div", { display: "flex", flexDirection: "column", padding: "64px 64px 0" }, [
					el("div", { ...mono, color: SWISS_MUTED }, eyebrow),
					el(
						"div",
						{ marginTop: 36, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: 1000 },
						title,
					),
				]),
				el(
					"div",
					{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderTop: `2px solid ${SWISS_INK}`,
						padding: "34px 64px",
					},
					[el("div", { fontSize: 26 }, WORDMARK), el("div", { ...mono, color: SWISS_MUTED }, badge)],
				),
			],
		),
		{ width: 1200, height: 630, fonts: SWISS_FONTS },
	);

	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** Nagłówki wspólne dla obu endpointów z kartami. */
export const OG_HEADERS = {
	"Content-Type": "image/png",
	"Cache-Control": "public, max-age=31536000, immutable",
};
