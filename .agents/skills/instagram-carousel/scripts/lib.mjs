/**
 * Wspólny język wizualny grafik na Instagram – to, co łączy karuzelę
 * (generate.mjs) z formatami pojedynczymi (format.mjs): kadr 4:5 na
 * „poświacie” – kolorowej ramie, która przez białą (albo żadną) poświatę
 * przechodzi miękko w pole drugiego koloru – duży Instrument Serif
 * w nagłówkach, Instrument Sans w tekście, a ramy jak karty OG (src/og.ts):
 * u góry znak „Fundacja / pierwsze demo” z numerem slajdu, na dole pigułka
 * kategorii w kolorze okładki wpisu. Formaty różnią się parą kolorów
 * i środkiem kadru; ramy mają identyczne, bo to one robią z profilu serię.
 *
 * Kolor karuzeli to kolor okładki wpisu (src/covers.ts): ta sama kolorystyka,
 * którą wpis ma jako obrazek OG i na karcie na stronie. `postCover()` liczy
 * ją tym samym `allocateCovers()` co build – z frontmattera wszystkich
 * wpisów – a `glowPair()` zamienia kolorystykę na parę kolorów poświaty.
 *
 * Dlaczego satori, a nie SVG w sharpie: sharp renderuje SVG librsvg, który
 * sięga po *systemowe* fonty – Instrument Serif nie ma na tej maszynie.
 * Satori dostaje TTF wprost (te same pliki co karty OG, src/assets/fonts)
 * i zamienia tekst na ścieżki.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { DATE_PREFIX, HOME_CITY, SITE_HOST, SITE_TAGLINE } from "../../../../src/consts.ts";
import { allocateCovers, coverPalette } from "../../../../src/covers.ts";
import { LOGO_COLORS } from "../../../../src/logo.ts";
import { lockup, PALETTE } from "../../../../src/og.ts";

// 4:5 – najwyższy kadr, jaki Instagram pokazuje w feedzie bez przycinania;
// kwadrat oddaje ~20% wysokości ekranu sąsiednim postom.
export const WIDTH = 1080;
export const HEIGHT = 1350;
/** Margines treści – tekst nie może wejść na kolorową ramę poświaty. */
export const PAD = 150;
/** Szerokość kolumny tekstu między marginesami. */
export const COLUMN = WIDTH - 2 * PAD;

export const PAPER = PALETTE.paper;
export const INK = PALETTE.ink;
export const MUTED = PALETTE.muted;
export const BODY = "#3a3a42";
export const HAIRLINE = PALETTE.hairline;
export const LIME = LOGO_COLORS.lime;
export const ORANGE = LOGO_COLORS.orange;
export const ULTRAMARINE = LOGO_COLORS.ultramarine;
export const PINK = "#ff8ad8";
export const SUN = "#ffc93c";
export const NAVY = "#121a6b";
/** Odpowiednik muted na negatywie – `fog` z palety strony. */
export const MUTED_ON_INK = "#c9c7c0";
/** Ultramaryna strony (`--color-blue`) – akcent tekstu na bieli, 7:1. */
export const BLUE = PALETTE.blue;

// Ścieżki od process.cwd(): skrypty czytają pliki spoza swojego katalogu
// (fonty OG, wpisy, instagram/<data>-<slug>/), więc i tak wymagają startu
// z korzenia repo – jedna konwencja zamiast dwóch.
const font = (path) => readFileSync(resolve(process.cwd(), path));

export function requireRepoRoot() {
	if (!existsSync(resolve(process.cwd(), "src/assets/fonts/InstrumentSerif-Regular.ttf"))) {
		console.error("Nie widzę src/assets/fonts – uruchom skrypt z katalogu głównego repo.");
		process.exit(1);
	}
}

/**
 * Slug + typ → katalog `instagram/_RRRR-MM-DD-slug-typ` (typ: karuzela, mit,
 * zapisz, pytanie, liczba). Każdy post na Instagram ma własny katalog z `spec.json`,
 * `NN.png`, `alt.txt` i `caption.txt` – jedna konwencja plików niezależnie od
 * formatu. Adres wpisu trafia na grafikę jako piksele, więc slug musi
 * wskazywać istniejący, opublikowany wpis; data katalogu jest z nazwy pliku
 * wpisu, żeby `ls instagram/` układał się jak `ls src/content/<dział>/`.
 * Wpis może leżeć w bazie wiedzy albo w aktualnościach – stąd `section`
 * w wyniku: to on decyduje o adresie na slajdzie CTA.
 *
 * Podgląd do akceptacji bez nadpisywania grafik, które już poszły na
 * Instagram: `--out <katalog>` zapisuje PNG-i i alt.txt gdzie indziej,
 * `--spec <plik>` czyta specyfikację z innego pliku niż spec.json posta.
 */
const SECTIONS = ["wiedza", "aktualnosci"];
export function resolvePostDir(slug, type) {
	if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
	const postFile = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${slug}\\.md$`);
	const found = SECTIONS.map((section) => ({
		section,
		postName: readdirSync(resolve(process.cwd(), "src/content", section)).find((f) => postFile.test(f)),
	})).find((candidate) => candidate.postName);
	if (!found) {
		console.error(`Nie ma opublikowanego wpisu src/content/{wiedza,aktualnosci}/RRRR-MM-DD-${slug}.md.`);
		return null;
	}
	const { section, postName } = found;
	const raw = readFileSync(resolve(process.cwd(), "src/content", section, postName), "utf8");
	if (/^draft:\s*true\b/m.test(raw)) {
		console.error("Szkic (draft: true) nie ma adresu – najpierw opublikuj wpis.");
		return null;
	}
	const base = `${postName.replace(/\.md$/, "")}-${type}`;
	// Świeże grafiki jeszcze nie poszły na Instagram, więc katalog dostaje `_`
	// jak szkic wpisu; prefiks znika ręcznie po publikacji posta. Katalog bez
	// prefiksu to post już opublikowany – regeneracja trafia tam, nie obok.
	const dirName = existsSync(resolve(process.cwd(), "instagram", base)) ? base : `_${base}`;
	const dir = resolve(process.cwd(), "instagram", dirName);
	const flag = (name) => {
		const index = process.argv.indexOf(name);
		return index > -1 ? process.argv[index + 1] : undefined;
	};
	const out = flag("--out");
	const spec = flag("--spec");
	return {
		dirName,
		dir,
		section,
		specPath: spec ? resolve(process.cwd(), spec) : resolve(dir, "spec.json"),
		out: out ? { dir: resolve(process.cwd(), out), dirName: out } : { dir, dirName: `instagram/${dirName}` },
	};
}

export function readSpec(path) {
	if (!existsSync(path)) {
		console.error(`Brak ${path} – najpierw zapisz specyfikację (schemat w SKILL.md).`);
		process.exit(1);
	}
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (e) {
		console.error(`${path} nie jest poprawnym JSON-em: ${e.message}`);
		process.exit(1);
	}
}

/**
 * Okładka wpisu – parametry z `allocateCovers()` po wszystkich wpisach (obie
 * kolekcje, także szkice i ukryte, jak `getCovers()` w src/collections.ts),
 * z ręczną okładką z /admin (`cover` we frontmatterze), jeśli ją ustawiono,
 * i jej paleta (kolor pigułki kategorii). Skrypt nie ma dostępu do kolekcji
 * Astro, więc czyta frontmatter sam.
 */
export function postCover(slug) {
	const posts = SECTIONS.flatMap((section) =>
		readdirSync(resolve(process.cwd(), "src/content", section))
			.filter((name) => name.endsWith(".md"))
			.map((name) => {
				const raw = readFileSync(resolve(process.cwd(), "src/content", section, name), "utf8");
				const data = Bun.YAML.parse(raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "") ?? {};
				return {
					slug: name.replace(/\.md$/, "").replace(DATE_PREFIX, ""),
					date: data.date,
					cover: data.cover,
				};
			}),
	);
	const params = allocateCovers(posts).get(slug);
	return { params, palette: coverPalette(params.colorway, params.roles) };
}

// ---------------------------------------------------------------------------
// Walidacja. Limity znaków to nie stylistyka, tylko geometria: satori nie
// zmniejsza tekstu, który się nie mieści – wyjechałby poza kadr.
// ---------------------------------------------------------------------------
export const isText = (v) => typeof v === "string" && v.trim().length > 0;
/** Satori nie łamie w środku słowa – jeden długi token wyjedzie poza kadr. */
export const longestToken = (s) => Math.max(0, ...s.split(/\s+/).map((t) => t.length));
export const makeCheck =
	(errors) =>
	(name, value, max, { required = true, token = 26 } = {}) => {
		if (value === undefined || value === null || value === "") {
			if (required) errors.push(`${name} jest wymagany`);
			return;
		}
		if (!isText(value)) return errors.push(`${name} musi być niepustym tekstem`);
		if (value.length > max) errors.push(`${name} ma ${value.length} znaków, limit ${max}`);
		if (longestToken(value) > token)
			errors.push(`${name}: słowo dłuższe niż ${token} znaków nie złamie się w wierszu`);
	};
export function failOn(errors) {
	if (!errors.length) return;
	console.error("Specyfikacja nie przeszła walidacji:");
	for (const e of errors) console.error(`  – ${e}`);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Rysowanie.
// ---------------------------------------------------------------------------
export const FONTS = [
	{
		name: "Instrument Serif",
		data: font("src/assets/fonts/InstrumentSerif-Regular.ttf"),
		weight: 400,
		style: "normal",
	},
	{
		name: "Instrument Serif",
		data: font("src/assets/fonts/InstrumentSerif-Italic.ttf"),
		weight: 400,
		style: "italic",
	},
	{
		name: "Instrument Sans",
		data: font("src/assets/fonts/InstrumentSans-Regular.ttf"),
		weight: 400,
		style: "normal",
	},
	{
		name: "Instrument Sans",
		data: font("src/assets/fonts/InstrumentSans-SemiBold.ttf"),
		weight: 600,
		style: "normal",
	},
	{
		name: "IBM Plex Mono",
		data: font("src/assets/fonts/IBMPlexMono-Medium.ttf"),
		weight: 500,
		style: "normal",
	},
];

// Satori bez JSX: element to obiekt {type, props}. Każdy div z wieloma dziećmi
// musi mieć jawny `display: flex` – satori nie zakłada blokowego układu.
export const el = (type, style, children) => ({
	type,
	props: { style, ...(children === undefined ? {} : { children }) },
});

const svgImg = (svg, width, height, style = {}) => ({
	type: "img",
	props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height, style },
});

/**
 * Stopień nagłówka w Instrument Serif dla kolumny `width`: z progów długości
 * (`tiers` – pary [maks. znaków, px], rosnąco), ale nie większy, niż pozwala
 * najdłuższe słowo – satori nie łamie wyrazów, więc słowo szersze niż kolumna
 * wyjechałoby poza kadr. 0,5 em to szerokość znaku tego kroju z zapasem
 * (średnio ~0,42 em, „m” i „w” szersze).
 */
export const serifFit = (text, tiers, width = COLUMN) => {
	const byLength = (tiers.find(([max]) => text.length <= max) ?? tiers.at(-1))[1];
	const byWord = width / (0.5 * Math.max(1, longestToken(text)));
	return {
		fontFamily: "Instrument Serif",
		fontWeight: 400,
		fontSize: Math.floor(Math.min(byLength, byWord)),
		letterSpacing: "-0.02em",
	};
};

/** Etykieta jak utility `label` na stronie: Instrument Sans półgruby, wersaliki. */
export const label = {
	fontFamily: "Instrument Sans",
	fontWeight: 600,
	fontSize: 24,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
};

/** Mono zostaje tylko przy liczbach (numer slajdu, numery na liście). */
export const mono = {
	fontFamily: "IBM Plex Mono",
	fontWeight: 500,
	fontSize: 24,
	letterSpacing: "0.12em",
};

// Wiszące spójniki: „i", „w", „z", „a", „o", „u" na końcu wiersza to błąd
// polskiej typografii. Twarda spacja (U+00A0) po nich – satori jej nie łamie.
export const glue = (s) => s.replace(/(^|[\s(„])([aiouwzAIOUWZ])\s+/g, "$1$2 ");

export const pageNo = (i, total) => `${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

/**
 * Górny wiersz: znak „Fundacja / pierwsze demo” po lewej, po prawej numer
 * slajdu (mono) albo etykieta formatu (`label`).
 */
export const top = (tone, right) =>
	el("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, [
		lockup(56, tone.mark, tone.mark, { wave: tone.wave }),
		el(
			"div",
			/^\d/.test(right)
				? { ...mono, color: tone.text, paddingTop: 6 }
				: { ...label, color: tone.text, paddingTop: 8 },
			right,
		),
	]);

/**
 * Pigułka kategorii w kolorze okładki wpisu – na każdym kadrze, jak na kartach
 * OG. Gdy okładka ma kolor środka poświaty, pigułka jest biała z obwódką, jak
 * pigułki na stronie.
 */
export const pill = (text, tone, P) => {
	const same = P.bg === tone.bg;
	return el(
		"div",
		{
			display: "flex",
			padding: "12px 26px",
			borderRadius: 999,
			backgroundColor: same ? "#ffffff" : P.bg,
			color: same ? INK : P.text,
			border: same ? `2px solid ${HAIRLINE}` : "none",
			fontFamily: "Instrument Sans",
			fontWeight: 600,
			fontSize: 26,
			lineHeight: 1.2,
		},
		text,
	);
};

/** Dolny wiersz: pigułka kategorii i (bez `host: false`) adres serwisu. */
export const bottom = (tone, P, category, { host = true } = {}) =>
	el(
		"div",
		{
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
		},
		[
			pill(category, tone, P),
			...(host
				? [
						el(
							"div",
							{ fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 26, color: tone.muted },
							SITE_HOST,
						),
					]
				: []),
		],
	);

/** Hasło fundacji z kropką jak na stronie (Middot.astro) – dół kart marki. */
export const tagline = (color) =>
	el("div", { display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 28, color }, [
		el("div", {}, SITE_TAGLINE),
		el("div", { margin: "0 0.44em" }, "·"),
		el("div", {}, HOME_CITY),
	]);

// Padding na dziecku, nie na korzeniu: satori liczy `100%` korzenia bez
// paddingu, więc stopka i prawa krawędź wyjeżdżały poza kadr. Poświata idzie
// warstwą absolutną przed treścią.
export const frame = (tone, children, layers = [], pad = PAD) =>
	el(
		"div",
		{
			display: "flex",
			position: "relative",
			width: "100%",
			height: "100%",
			backgroundColor: tone.bg,
			color: tone.text,
			fontFamily: "Instrument Sans",
			overflow: "hidden",
		},
		[
			...layers,
			el(
				"div",
				{
					// `relative`: warstwy absolutne malują się nad treścią w przepływie
					// niezależnie od kolejności – pozycjonowana treść wraca na wierzch.
					position: "relative",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					flexGrow: 1,
					padding: pad,
				},
				children,
			),
		],
	);

/**
 * Poświata: kolor na krawędzi kadru przechodzi przez białą poświatę w pole
 * drugiego koloru – rozmyte prostokąty (`feGaussianBlur`) w warstwie SVG;
 * librsvg je renderuje, satori tylko wkleja obrazek. Środek jasny niesie
 * czarny tekst; ciemny (`dark`: czerń w środku, bez białej poświaty) – biały.
 *
 * Karuzela bierze parę z kolorystyki okładki wpisu (`glowPair`), więc wpis
 * zachowuje swój kolor; formaty pojedyncze i CTA mają pary stałe (`GLOWS`),
 * żeby odróżniały się od karuzel w siatce profilu.
 *
 * Pula karuzel to 12 par: po jednej na kolorystykę i po drugiej dla czterech
 * z nich – wybiera ją `roles` okładki (z hasha sluga), więc dwa wpisy w tej
 * samej kolorystyce nie muszą wyglądać tak samo. Pary z czarnym środkiem są
 * zarezerwowane dla formatów („mit”, „liczba”).
 */
const GLOW_PAIRS = {
	1: [
		[ULTRAMARINE, ORANGE],
		[ULTRAMARINE, PINK],
	],
	2: [
		[ULTRAMARINE, LIME],
		[NAVY, LIME],
	],
	3: [
		[PINK, SUN],
		[PINK, ORANGE],
	],
	4: [[ORANGE, PINK]],
	5: [[INK, ORANGE]],
	6: [
		[ORANGE, SUN],
		[SUN, PINK],
	],
	7: [[LIME, PAPER]],
	8: [[NAVY, PINK]],
};
export const glowPair = ({ colorway, roles }) => {
	const pairs = GLOW_PAIRS[colorway] ?? [GLOWS.brand];
	return pairs[roles % pairs.length];
};

export const GLOWS = {
	/** Karta marki – CTA karuzeli. */
	brand: [ULTRAMARINE, LIME],
	mit: [ORANGE, INK],
	fakt: [ULTRAMARINE, PAPER],
	zapisz: [LIME, PAPER],
	pytanie: [ULTRAMARINE, LIME],
	liczba: [LIME, INK],
};

const isDark = (inner) => inner === INK;

/**
 * Kolory ram na poświacie: tekst, „Fundacja” i logotyp, fala, adres; `bg` to
 * środek – z nim porównuje się pigułkę. Fala na jasnym środku czarna (pomarańcz
 * nie ma tam 3:1), na czerni pomarańczowa.
 */
export const glowTone = ([, inner]) =>
	isDark(inner)
		? { bg: inner, text: "#ffffff", mark: "#ffffff", wave: ORANGE, muted: MUTED_ON_INK }
		: { bg: inner, text: INK, mark: INK, wave: INK, muted: INK };

export const glowLayer = ([outer, inner]) => {
	// Na czerni biała poświata dawała szary pierścień – ciemny środek przechodzi
	// prosto w kolor ramy. Jest też szerszy i ostrzejszy: biały znak u góry i adres
	// na dole stoją na krawędzi kolumny, a na rozmytej limonce czy pomarańczu
	// biel znikała.
	const dark = isDark(inner);
	const core = dark ? 100 : 150;
	const halo = dark
		? ""
		: `<rect x="64" y="64" width="${WIDTH - 128}" height="${HEIGHT - 128}" rx="48" fill="#ffffff" opacity="0.92" filter="url(#halo)"/>`;
	return svgImg(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><defs><filter id="halo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="56"/></filter><filter id="core" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${dark ? 50 : 40}"/></filter></defs><rect width="${WIDTH}" height="${HEIGHT}" fill="${outer}"/>${halo}<rect x="${core}" y="${core}" width="${WIDTH - 2 * core}" height="${HEIGHT - 2 * core}" rx="28" fill="${inner}" filter="url(#core)"/></svg>`,
		WIDTH,
		HEIGHT,
		{ position: "absolute", left: 0, top: 0 },
	);
};

/** Kadr na poświacie z parą `pair` – ramy, warstwa i ton w jednym. */
export const glowFrame = (pair, children) => frame(glowTone(pair), children, [glowLayer(pair)]);

/**
 * Rasteryzuje węzły do `<dir>/NN.png` i pisze `alt.txt`. Najpierw usuwa stare
 * NN.png: poprzedni przebieg mógł mieć więcej slajdów i pliki z inną
 * numeracją poszłyby razem na Instagram.
 */
export async function render({ dir, dirName, nodes, altLines }) {
	mkdirSync(dir, { recursive: true });
	for (const f of readdirSync(dir)) {
		if (/^\d{2}\.png$/.test(f)) rmSync(resolve(dir, f));
	}
	for (let i = 0; i < nodes.length; i++) {
		const svg = await satori(nodes[i], { width: WIDTH, height: HEIGHT, fonts: FONTS });
		const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
		const name = `${String(i + 1).padStart(2, "0")}.png`;
		writeFileSync(resolve(dir, name), png);
		console.log(`✓ ${dirName}/${name}`);
	}
	// Tekst alternatywny z tej samej specyfikacji co piksele, więc nie może się
	// od nich różnić. Ramy są na każdym slajdzie identyczne – w alcie byłyby
	// szumem, więc zostaje tylko treść.
	const alt = altLines.map((line, i) => `${String(i + 1).padStart(2, "0")}: ${line}`);
	writeFileSync(resolve(dir, "alt.txt"), `${alt.join("\n")}\n`);
	console.log(`✓ ${dirName}/alt.txt`);
}
