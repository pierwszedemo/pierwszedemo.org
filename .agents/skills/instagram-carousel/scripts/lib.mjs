/**
 * Wspólny język wizualny grafik na Instagram – to, co łączy karuzelę
 * (generate.mjs) z formatami pojedynczymi (format.mjs): kadr 4:5, paleta
 * strony, para krojów, nagłówek z etykietą i numeracją, stopka z wordmarkiem.
 * Formaty różnią się układem środka kadru; ramy mają identyczne, bo to one
 * robią z profilu serię.
 *
 * Dlaczego satori, a nie SVG w sharpie: sharp renderuje SVG librsvg, który
 * sięga po *systemowe* fonty – Archivo nie ma na tej maszynie. Satori dostaje
 * TTF wprost i zamienia tekst na ścieżki. Regular jest zvendorowany w assets/
 * obok skryptu, bo src/assets/fonts trzyma tylko odmiany potrzebne kartom OG.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { HOME_CITY, SITE_HOST, SITE_NAME, SITE_TAGLINE, WORDMARK } from "../../../../src/consts.ts";

// 4:5 – najwyższy kadr, jaki Instagram pokazuje w feedzie bez przycinania;
// kwadrat oddaje ~20% wysokości ekranu sąsiednim postom.
export const WIDTH = 1080;
export const HEIGHT = 1350;
export const PAD = 84;

export const INK = "#101010";
export const MUTED = "#6f6d68";
export const BODY = "#3c3a36";
export const HAIRLINE = "#e4e2dd";
export const PANEL = "#f4f2ee";
/** Odpowiednik muted na negatywie – hairline z palety strony. */
export const MUTED_ON_INK = "#a6a49f";

// Ścieżki od process.cwd(): skrypty czytają pliki spoza swojego katalogu
// (fonty OG, instagram/<data>-<slug>/), więc i tak wymagają startu z korzenia
// repo – jedna konwencja zamiast dwóch.
const font = (path) => readFileSync(resolve(process.cwd(), path));

export function requireRepoRoot() {
	if (!existsSync(resolve(process.cwd(), "src/assets/fonts/Archivo-SemiBold.ttf"))) {
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
		name: "Archivo",
		data: font(".agents/skills/instagram-carousel/assets/Archivo-Regular.ttf"),
		weight: 400,
		style: "normal",
	},
	{ name: "Archivo", data: font("src/assets/fonts/Archivo-SemiBold.ttf"), weight: 600, style: "normal" },
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
		el("div", { ...mono, color: onInk ? MUTED_ON_INK : MUTED }, left),
		el("div", { ...mono, color: onInk ? "#ffffff" : INK }, right),
	]);

export const footer = (onInk) =>
	el(
		"div",
		{
			display: "flex",
			justifyContent: "space-between",
			alignItems: "flex-start",
			borderTop: `3px solid ${onInk ? "#ffffff" : INK}`,
			paddingTop: 30,
		},
		[
			el("div", { display: "flex", flexDirection: "column" }, [
				el("div", { fontSize: 30, fontWeight: 600 }, WORDMARK),
				// Podpis człowieka pod marką: mniejszy stopień i ciaśniejsze rozstrzelenie
				// niż w `mono`, bo 46 znaków z trackingiem 0.2em nie mieści się obok adresu.
				el(
					"div",
					{
						...mono,
						fontSize: 17,
						letterSpacing: "0.08em",
						marginTop: 10,
						color: onInk ? MUTED_ON_INK : MUTED,
					},
					`${SITE_NAME} – ${SITE_TAGLINE} – ${HOME_CITY}`,
				),
			]),
			el("div", { ...mono, color: onInk ? MUTED_ON_INK : MUTED }, SITE_HOST),
		],
	);

/** `bg` inne niż biel/ink (np. PANEL) traktujemy jak jasne tło. */
export const frame = (onInk, children, bg) =>
	el(
		"div",
		{
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			width: "100%",
			height: "100%",
			padding: PAD,
			backgroundColor: bg ?? (onInk ? INK : "#ffffff"),
			color: onInk ? "#ffffff" : INK,
			fontFamily: "Archivo",
		},
		children,
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
