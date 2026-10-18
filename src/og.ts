import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { HOME_CITY, LOGOTYPE, SITE_HOST, SITE_NAME, SITE_TAGLINE, WORDMARK } from "./consts";
import { accentParts } from "./typography";

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
 * Znak z nawigacji (Logo.astro): płyta z pomarańczową naklejką. Jako obrazek
 * z data URI – satori pomija zagnieżdżony element <svg> w drzewie.
 */
export const RECORD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${PALETTE.ink}"/><circle cx="20" cy="20" r="14" fill="none" stroke="#3a3a42" stroke-width="1.5"/><circle cx="20" cy="20" r="7" fill="${PALETTE.orange}"/><circle cx="20" cy="20" r="1.8" fill="${PALETTE.paper}"/></svg>`;

/** SVG jako obrazek z data URI – satori pomija zagnieżdżony element <svg>. */
const svgImg = (svg: string, width: number, height: number, style: Record<string, unknown> = {}) => ({
	type: "img",
	props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height, style },
});

const recordMark = (size: number) => svgImg(RECORD_SVG, size, size);

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
			? [el("div", { width: 16, height: 16, borderRadius: 999, backgroundColor: dot }), el("div", {}, text)]
			: text,
	);

/**
 * Tytuł jako ciąg słów-elementów flex z zawijaniem. Satori nie składa tekstu
 * z kilku stylów w jeden akapit – każde dziecko flexa to osobne pudełko – więc
 * akcent (`*…*`) wymaga rozbicia na słowa. Spójniki są już doklejone twardą
 * spacją (`accentParts` woła `fixHanging`), więc dzielimy tylko po zwykłej.
 */
const titleWords = (title: string) =>
	accentParts(title).flatMap((part) =>
		part.text
			.split(" ")
			.filter(Boolean)
			.map((word) =>
				el("span", { marginRight: "0.24em", color: part.accent ? PALETTE.blue : PALETTE.ink }, word),
			),
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
						recordMark(64),
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
							el("div", { fontSize: 44, letterSpacing: "-0.01em" }, LOGOTYPE),
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
 * Kaseta z hero bez napisu: tekst w SVG wstawionym jako obrazek rasteryzuje
 * librsvg fontem systemowym, więc etykieta to same paski.
 */
const CASSETTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140"><rect width="220" height="140" rx="12" fill="${PALETTE.blue}"/><rect x="14" y="14" width="192" height="74" rx="6" fill="${PALETTE.paper}"/><rect x="14" y="14" width="192" height="16" rx="3" fill="${PALETTE.orange}"/><rect x="24" y="46" width="120" height="7" rx="3.5" fill="${PALETTE.hairline}"/><rect x="24" y="62" width="80" height="7" rx="3.5" fill="${PALETTE.hairline}"/><rect x="58" y="96" width="104" height="32" rx="16" fill="${PALETTE.ink}"/><circle cx="80" cy="112" r="11" fill="${PALETTE.paper}"/><circle cx="80" cy="112" r="4" fill="${PALETTE.ink}"/><circle cx="140" cy="112" r="11" fill="${PALETTE.paper}"/><circle cx="140" cy="112" r="4" fill="${PALETTE.ink}"/></svg>`;

/** Zdjęcie z dysku jako data URI, zmniejszone – inaczej karta ważyłaby megabajty. */
const photoUri = async (file: string) => {
	const jpeg = await sharp(resolve(process.cwd(), file))
		.resize({ width: 400 })
		.jpeg({ quality: 80 })
		.toBuffer();
	return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
};

interface HomeCardOptions {
	/** Slogan z Tiny; `*akcent*` na niebiesko, jak w hero. */
	title: string;
	/** Zdjęcia do polaroidu: plik od korzenia repo i `object-position` w CSS. */
	photos: readonly { file: string; focus: string }[];
	/** Podpis pod zdjęciami, jak w hero („to my – …”). */
	caption: string;
}

/**
 * Karta OG strony głównej – hero w miniaturze: slogan po lewej, polaroid
 * z taśmą, kaseta i naklejka „REC” po prawej, pasek akcentów na dole. Karty
 * wpisów zostają tekstowe (`renderOgCard`): tam tytułem jest wpis, a nie
 * fundacja. Wszystko pozycjonowane absolutnie, bo kolaż nachodzi na siebie.
 */
export async function renderHomeCard({ title, photos, caption }: HomeCardOptions): Promise<Buffer> {
	const sources = await Promise.all(photos.map((photo) => photoUri(photo.file)));
	const at = (style: Record<string, unknown>) => ({ position: "absolute", ...style });
	const sans = { fontFamily: "Instrument Sans", fontWeight: 600 };

	const svg = await satori(
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
			},
			[
				el(
					"div",
					{
						...at({ left: 64, top: 56, width: 600, bottom: 96 }),
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
					},
					[
						el("div", { display: "flex", alignItems: "center", gap: 14 }, [
							recordMark(48),
							el("div", { fontSize: 40, letterSpacing: "-0.01em" }, LOGOTYPE),
						]),
						el(
							"div",
							{ display: "flex", flexWrap: "wrap", fontSize: 92, lineHeight: 0.92, letterSpacing: "-0.02em" },
							titleWords(title),
						),
						el("div", { ...sans, fontSize: 24, color: PALETTE.muted }, `${SITE_NAME} · ${SITE_HOST}`),
					],
				),
				// Kaseta przed polaroidem w drzewie, więc pod nim – wystaje zza prawej krawędzi.
				svgImg(CASSETTE_SVG, 200, 127, at({ left: 1010, top: 250, transform: "rotate(8deg)" })),
				el(
					"div",
					{
						...at({ left: 740, top: 70, width: 340, height: 440 }),
						display: "flex",
						flexDirection: "column",
						padding: "12px 12px 0",
						backgroundColor: "#ffffff",
						borderRadius: 6,
						boxShadow: "0 24px 48px rgba(21,21,26,0.16)",
						transform: "rotate(-3deg)",
					},
					[
						el(
							"div",
							{ display: "flex", gap: 4, height: 360, borderRadius: 3, overflow: "hidden" },
							sources.map((src, index) => ({
								type: "img",
								props: {
									src,
									width: 156,
									height: 360,
									style: { objectFit: "cover", objectPosition: photos[index].focus },
								},
							})),
						),
						el("div", { display: "flex", padding: "16px 8px 0", fontStyle: "italic", fontSize: 30 }, caption),
					],
				),
				el("div", {
					...at({ left: 845, top: 54, width: 130, height: 34 }),
					backgroundColor: "rgba(212,255,58,0.8)",
					transform: "rotate(4deg)",
				}),
				el(
					"div",
					{
						...at({ right: 56, top: 44 }),
						...sans,
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "8px 18px",
						borderRadius: 999,
						border: `2px solid ${PALETTE.ink}`,
						backgroundColor: "#ffffff",
						fontSize: 20,
						letterSpacing: "0.08em",
						transform: "rotate(6deg)",
					},
					[
						el("div", { width: 14, height: 14, borderRadius: 999, backgroundColor: "#ff3b30" }),
						el("div", {}, "REC"),
						el("div", { letterSpacing: 0, color: PALETTE.muted }, "00:01"),
					],
				),
				el(
					"div",
					{ ...at({ left: 64, right: 64, bottom: 40, height: 14 }), display: "flex", gap: 8 },
					STRIPE.map(([color, grow]) =>
						el("div", { flexGrow: grow, borderRadius: 999, backgroundColor: color }),
					),
				),
			],
		),
		{ width: 1200, height: 630, fonts: FONTS },
	);

	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
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
