import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { HOME_CITY, LOGOTYPE, SITE_HOST, SITE_NAME, SITE_TAGLINE, WORDMARK } from "./consts";
import { iconSvg, LOGO_COLORS, WAVE, waveRadius, waveSvg } from "./logo";
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

/** Pasek akcentów ze stopki strony – te same proporcje. */
export const STRIPE = [
	[PALETTE.orange, 3],
	[PALETTE.sun, 1],
	[PALETTE.pink, 2],
	[PALETTE.blue, 4],
	[PALETTE.lime, 2],
] as const;

interface CardOptions {
	/**
	 * Pigułka u góry karty: nazwa fundacji i czym jest. Kartę widać
	 * w podglądzie linku, gdzie stopka z logotypem bywa przycięta.
	 */
	eyebrow?: string;
	/** Tytuł; słowa w `*gwiazdkach*` dostają niebieski akcent jak w hero. */
	title: string;
	/** Pigułka w stopce karty – kategoria wpisu; bez niej adres serwisu. */
	badge?: string;
	/** Wymiary płótna; domyślnie karta OG 1200×630. */
	width?: number;
	height?: number;
	/**
	 * Poziomy margines treści. Okładka na Facebooku jest kadrowana inaczej na
	 * desktopie (820×312) i w telefonie (640×360), więc treść musi siedzieć
	 * w środkowym pasie – stąd większy margines niż w karcie OG.
	 */
	paddingX?: number;
}

// Satori bez JSX: element to zwykły obiekt {type, props}. Każdy div z wieloma
// dziećmi musi mieć jawny `display: flex` – satori nie zakłada blokowego układu.
const el = (type: string, style: Record<string, unknown>, children?: unknown) =>
	({ type, props: { style, ...(children === undefined ? {} : { children }) } }) as const;

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

/** Ikona znaku (kafel ultramaryny ze słupkami) – ta sama co favikona. */
const iconMark = (size: number) => svgImg(iconSvg(size), size, size);

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

const pill = (text: string, background: string, dot?: string) =>
	el(
		"div",
		{
			display: "flex",
			alignItems: "center",
			gap: 12,
			padding: dot ? "10px 22px 10px 16px" : "10px 22px",
			borderRadius: 999,
			backgroundColor: background,
			border: background === "#ffffff" ? `2px solid ${PALETTE.hairline}` : "none",
			fontFamily: "Instrument Sans",
			fontWeight: 600,
			fontSize: 24,
			color: PALETTE.ink,
		},
		dot
			? [el("div", { width: 16, height: 16, borderRadius: 999, backgroundColor: dot }), dotted(text)]
			: dotted(text),
	);

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

export async function renderOgCard({
	eyebrow = `${SITE_NAME} · ${SITE_TAGLINE.toLowerCase()} · ${HOME_CITY}`,
	title,
	badge,
	width = 1200,
	height = 630,
	paddingX = 64,
}: CardOptions): Promise<Buffer> {
	// Długie tytuły wpisów muszą zmieścić się w trzech wierszach – bez tego
	// satori pozwoliłby im wyjechać poza kartę. Instrument Serif ma małe oczko,
	// więc stopnie są większe niż przy dawnym Archivo.
	// Niższe płótno (okładka FB) skaluje stopień proporcjonalnie do wysokości.
	const length = title.replace(/\*/g, "").length;
	const size = Math.round((length > 64 ? 82 : length > 40 ? 98 : 118) * Math.min(1, height / 630));

	const svg = await satori(
		el(
			"div",
			{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: PALETTE.paper,
				color: PALETTE.ink,
				fontFamily: "Instrument Serif",
			},
			// Padding na dziecku, nie na korzeniu: satori liczy `100%` korzenia
			// bez paddingu i stopka wyjeżdżała poza kartę.
			el(
				"div",
				{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					flexGrow: 1,
					padding: `56px ${paddingX}px 40px`,
				},
				[
					el("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32 }, [
						pill(eyebrow, "#ffffff"),
						iconMark(64),
					]),
					el(
						"div",
						{
							display: "flex",
							flexWrap: "wrap",
							fontSize: size,
							lineHeight: 0.95,
							letterSpacing: "-0.02em",
							// Satori nie ma `text-wrap: balance`; węższa kolumna trzyma
							// wiersze w podobnej proporcji, co nagłówki na stronie.
							maxWidth: Math.min(1000, width - 2 * paddingX),
						},
						titleWords(title),
					),
					el("div", { display: "flex", flexDirection: "column", gap: 28 }, [
						el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
							wordmark(44),
							badge
								? pill(badge, PALETTE.lime)
								: el(
										"div",
										{ fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, color: PALETTE.muted },
										SITE_HOST,
									),
						]),
						el(
							"div",
							{ display: "flex", gap: 8, height: 14 },
							STRIPE.map(([color, grow]) =>
								el("div", { flexGrow: grow, borderRadius: 999, backgroundColor: color }),
							),
						),
					]),
				],
			),
		),
		{ width, height, fonts: FONTS },
	);

	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Karty marki – strona główna i podstrony – na ultramarynie, w barwach ikon
 * (seledynowy logotyp z pomarańczową falą). Obie zaczynają się tym samym
 * znakiem: „Fundacja” nad logotypem, więc czytają się jako jedna rodzina
 * i słowo „fundacja” widać w każdej miniaturze podglądu linku. Karty wpisów
 * (`renderOgCard`) zostają na ciepłej bieli – tam tytułem jest wpis.
 */
const lockup = (size: number) =>
	el("div", { display: "flex", flexDirection: "column", gap: size * 0.05 }, [
		el(
			"div",
			{ fontSize: size * 0.58, lineHeight: 1, letterSpacing: "-0.02em", color: "#ffffff" },
			"Fundacja",
		),
		wordmark(size, LOGO_COLORS.lime),
	]);

/** Akapit na ultramarynie – biel przygaszona, żeby tytuł i znak zostały wyżej w hierarchii. */
const ON_BLUE_MUTED = "#dde1ff";

// Padding na dziecku, nie na korzeniu – jak w renderOgCard.
const brandCard = async (children: unknown[]) => {
	const svg = await satori(
		el(
			"div",
			{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: LOGO_COLORS.ultramarine,
				color: "#ffffff",
				fontFamily: "Instrument Serif",
			},
			el(
				"div",
				{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					flexGrow: 1,
					padding: "52px 72px 56px",
				},
				children,
			),
		),
		{ width: 1200, height: 630, fonts: FONTS },
	);
	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
};

/** Strona główna: sam znak, duży, a na dole czym się zajmujemy i adres. */
export const renderHomeCard = () =>
	brandCard([
		lockup(208),
		el(
			"div",
			{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-end",
				fontFamily: "Instrument Sans",
				fontWeight: 600,
				fontSize: 30,
			},
			[dotted(`${SITE_TAGLINE} · ${HOME_CITY}`), el("div", { color: LOGO_COLORS.lime }, SITE_HOST)],
		),
	]);

/**
 * Podstrona: znak mały u góry (obok adres), na dole tytuł strony i akapit
 * z jej nagłówka. Bez pigułki z nazwą i hasłem – nazwę niesie znak.
 */
export const renderPageCard = ({ title, intro }: { title: string; intro: string }) => {
	const length = title.replace(/\*/g, "").length;
	return brandCard([
		el("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, [
			lockup(104),
			el(
				"div",
				{ fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 26, color: LOGO_COLORS.lime },
				SITE_HOST,
			),
		]),
		el("div", { display: "flex", flexDirection: "column", gap: 22 }, [
			el(
				"div",
				{
					display: "flex",
					flexWrap: "wrap",
					fontSize: length > 32 ? 92 : 112,
					lineHeight: 0.95,
					letterSpacing: "-0.02em",
					maxWidth: 1000,
				},
				titleWords(title, "#ffffff", LOGO_COLORS.lime),
			),
			el(
				"div",
				{ fontFamily: "Instrument Sans", fontSize: 30, lineHeight: 1.3, color: ON_BLUE_MUTED, maxWidth: 880 },
				fixHanging(intro),
			),
		]),
	]);
};

/**
 * Avatar z płótna „Logo — wybrane”: „demo” w seledynie nad pomarańczową falą, na
 * ultramarynie na całe pole – platformy i systemy same kadrują w koło albo
 * w zaokrąglony kafel. Zwraca wnętrze SVG (bez <svg>) z samych ścieżek
 * i prostokątów: litery zamienia na krzywe satori (librsvg wziąłby font
 * systemowy), a falę liczymy od pudełka, które satori dla niej rozłożył. Bez
 * <image>, masek i transformacji – to samo wnętrze idzie do PNG i do BIMI
 * (SVG Tiny PS). Proporcje jak na stronie: fala na szerokość słowa, odstęp
 * 0,12 em, wysokość 0,3 em.
 */
export async function renderAvatarBody(size: number): Promise<string> {
	const fontSize = size * 0.3;
	// Kolor-znacznik: po nim znajdujemy w wyniku pudełko fali.
	const marker = "#010101";
	const svg = await satori(
		el(
			"div",
			{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
			el(
				"div",
				{
					display: "flex",
					flexDirection: "column",
					gap: fontSize * 0.12,
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

	const svg = await satori(
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
