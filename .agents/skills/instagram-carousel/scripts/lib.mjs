/**
 * Wspólny język wizualny grafik na Instagram – to, co łączy karuzelę
 * (generate.mjs) z formatami pojedynczymi (format.mjs): kadr 4:5, paleta
 * strony („Wersja 2”), Instrument Serif w nagłówkach i Instrument Sans
 * w tekście, nagłówek z etykietą i numeracją, stopka z logotypem (fala pod
 * „demo”) i paskiem akcentów – jak stopka strony i karty OG (src/og.ts, skąd
 * idą paleta, pasek i logotyp). Formaty różnią się układem środka kadru; ramy mają
 * identyczne, bo to one robią z profilu serię.
 *
 * Dlaczego satori, a nie SVG w sharpie: sharp renderuje SVG librsvg, który
 * sięga po *systemowe* fonty – Instrument Serif nie ma na tej maszynie.
 * Satori dostaje TTF wprost (te same pliki co karty OG, src/assets/fonts)
 * i zamienia tekst na ścieżki.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { SITE_HOST } from "../../../../src/consts.ts";
import { PALETTE, STRIPE, wordmark } from "../../../../src/og.ts";

// 4:5 – najwyższy kadr, jaki Instagram pokazuje w feedzie bez przycinania;
// kwadrat oddaje ~20% wysokości ekranu sąsiednim postom.
export const WIDTH = 1080;
export const HEIGHT = 1350;
export const PAD = 84;

export const PAPER = PALETTE.paper;
export const INK = PALETTE.ink;
export const MUTED = PALETTE.muted;
export const BODY = "#3a3a42";
export const HAIRLINE = PALETTE.hairline;
/** Tło formatu „zapisz” – limonka, żeby lista odstawała od białych kadrów w siatce profilu. */
export const PANEL = PALETTE.lime;
/** Odpowiednik muted na negatywie – `fog` z palety strony. */
export const MUTED_ON_INK = "#c9c7c0";

// Ścieżki od process.cwd(): skrypty czytają pliki spoza swojego katalogu
// (fonty OG, instagram/<data>-<slug>/), więc i tak wymagają startu z korzenia
// repo – jedna konwencja zamiast dwóch.
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
 */
const SECTIONS = { wiedza: "wiedza", aktualnosci: "aktualnosci" };
export function resolvePostDir(slug, type) {
	if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
	const postFile = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${slug}\\.md$`);
	const found = Object.keys(SECTIONS)
		.map((section) => ({
			section,
			postName: readdirSync(resolve(process.cwd(), "src/content", section)).find((f) => postFile.test(f)),
		}))
		.find((candidate) => candidate.postName);
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
	return { dirName, dir: resolve(process.cwd(), "instagram", dirName), section };
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

/**
 * Nagłówek w Instrument Serif. Krój ma małe oczko, więc stopień rośnie o 18%
 * względem wartości, na które skalibrowano limity znaków (dawne Archivo
 * półgrube) – serif jest też o tyle węższy, więc wiersze łamią się podobnie.
 */
export const serif = (px) => ({
	fontFamily: "Instrument Serif",
	fontWeight: 400,
	fontSize: Math.round(px * 1.18),
});

/** Etykieta jak utility `label` na stronie: Instrument Sans półgruby, wersaliki. */
export const label = {
	fontFamily: "Instrument Sans",
	fontWeight: 600,
	fontSize: 24,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
};

/** Mono zostaje tylko przy liczbach (numer slajdu, adres na CTA). */
export const mono = {
	fontFamily: "IBM Plex Mono",
	fontWeight: 500,
	fontSize: 23,
	letterSpacing: "0.18em",
	textTransform: "uppercase",
};

// Wiszące spójniki: „i", „w", „z", „a", „o", „u" na końcu wiersza to błąd
// polskiej typografii. Twarda spacja (U+00A0) po nich – satori jej nie łamie.
export const glue = (s) => s.replace(/(^|[\s(„])([aiouwzAIOUWZ])\s+/g, "$1$2 ");

export const pageNo = (i, total) => `${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")}`;

/** Nagłówek i stopka są wspólne dla wszystkich grafik – to one robią serię. */
export const header = (left, right, onInk) =>
	el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
		el("div", { ...label, color: onInk ? MUTED_ON_INK : MUTED }, left),
		el("div", { ...mono, color: onInk ? "#ffffff" : INK }, right),
	]);

export const footer = (onInk) =>
	el("div", { display: "flex", flexDirection: "column", gap: 30 }, [
		el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
			wordmark(44, onInk ? "#ffffff" : INK),
			el(
				"div",
				{ fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, color: onInk ? MUTED_ON_INK : MUTED },
				SITE_HOST,
			),
		]),
		// Pasek akcentów ze stopki strony – na każdym kadrze, jak podpis serii.
		el(
			"div",
			{ display: "flex", gap: 8, height: 14 },
			STRIPE.map(([color, grow]) => el("div", { flexGrow: grow, borderRadius: 999, backgroundColor: color })),
		),
	]);

/** `bg` inne niż paper/ink (np. PANEL) traktujemy jak jasne tło. */
// Padding na dziecku, nie na korzeniu: satori liczy `100%` korzenia bez
// paddingu, więc stopka i prawa krawędź wyjeżdżały poza kadr.
export const frame = (onInk, children, bg) =>
	el(
		"div",
		{
			display: "flex",
			width: "100%",
			height: "100%",
			backgroundColor: bg ?? (onInk ? INK : PAPER),
			color: onInk ? "#ffffff" : INK,
			fontFamily: "Instrument Sans",
		},
		el(
			"div",
			{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				flexGrow: 1,
				padding: PAD,
			},
			children,
		),
	);

/**
 * Rasteryzuje węzły do `<dir>/NN.png` i pisze `alt.txt`. Najpierw usuwa stare
 * NN.png: poprzedni przebieg mógł mieć więcej slajdów i pliki z inną
 * numeracją poszłyby razem na Instagram.
 */
export async function render({ dir, dirName, nodes, altLines }) {
	for (const f of readdirSync(dir)) {
		if (/^\d{2}\.png$/.test(f)) rmSync(resolve(dir, f));
	}
	for (let i = 0; i < nodes.length; i++) {
		const svg = await satori(nodes[i], { width: WIDTH, height: HEIGHT, fonts: FONTS });
		const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
		const name = `${String(i + 1).padStart(2, "0")}.png`;
		writeFileSync(resolve(dir, name), png);
		console.log(`✓ instagram/${dirName}/${name}`);
	}
	// Tekst alternatywny z tej samej specyfikacji co piksele, więc nie może się
	// od nich różnić. Stopka jest na każdym slajdzie identyczna – w alcie byłaby
	// szumem, więc zostaje tylko treść.
	const alt = altLines.map((line, i) => `${String(i + 1).padStart(2, "0")}: ${line}`);
	writeFileSync(resolve(dir, "alt.txt"), alt.join("\n") + "\n");
	console.log(`✓ instagram/${dirName}/alt.txt`);
}
