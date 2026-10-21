/**
 * Kwadratowa grafika z nazwą cyklu „dźwięki efemeryczne.” – do wgrania
 * ręcznie (wydarzenie na Facebooku, post na Instagramie, plakat roboczy).
 * Uruchamiane ręcznie (`bun scripts/generate-dzwieki.mjs`), wynik ląduje
 * w `assets/`, nie w `public/` – to nie jest zasób strony.
 *
 * Osobny układ, nie karta OG wpisu (`renderPostCover()`): ta jest pozioma,
 * z tytułem w wąskiej kolumnie, i w kwadracie zostawiałaby pół pustego płótna. Tu nazwa jest plakatem –
 * dwa wiersze, największy stopień pisma, jaki mieści się w szerokości,
 * dosunięte do dolnej linii. Fonty i zasady jak w `src/og.ts`: satori dostaje
 * TTF wprost i zamienia tekst na ścieżki, bo sharp (librsvg) sięgnąłby po
 * fonty systemowe, a Archivo nie ma ani tu, ani na builderze.
 */
import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";
import { CONCERT_SERIES_NAME, WORDMARK } from "../src/consts.ts";

const SIZE = 1080;
const PADDING = 64;
const INK = "#101010";
const MUTED = "#6f6d68";
const OUTPUT = "assets/dzwieki-efemeryczne-1080.png";

const fonts = [
	{
		name: "Archivo",
		data: readFileSync("src/assets/fonts/Archivo-SemiBold.ttf"),
		weight: 600,
		style: "normal",
	},
	{
		name: "IBM Plex Mono",
		data: readFileSync("src/assets/fonts/IBMPlexMono-Medium.ttf"),
		weight: 500,
		style: "normal",
	},
];

const el = (type, style, children) => ({
	type,
	props: { style, ...(children === undefined ? {} : { children }) },
});

const mono = {
	fontFamily: "IBM Plex Mono",
	fontSize: 22,
	letterSpacing: "0.18em",
	textTransform: "uppercase",
};

// Nazwa łamana ręcznie na słowa: satori nie ma `text-wrap: balance`, a przy
// tym stopniu pisma drugie słowo i tak nie zmieściłoby się obok pierwszego.
const lines = CONCERT_SERIES_NAME.split(" ");

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
			color: INK,
			fontFamily: "Archivo",
		},
		[
			el(
				"div",
				{ ...mono, color: MUTED, padding: `${PADDING}px ${PADDING}px 0` },
				"Cykl koncertów piosenki autorskiej",
			),
			el("div", { display: "flex", flexDirection: "column" }, [
				el(
					"div",
					{
						display: "flex",
						flexDirection: "column",
						padding: `0 ${PADDING}px 48px`,
						// 158 px to największy stopień, przy którym „efemeryczne.” mieści
						// się między marginesami. Światło luźniejsze niż −0.035em z karty
						// OG: przy tej wielkości „r” zlewało się z „y”, a ogonek „ę”
						// wchodził w drugi wiersz – stąd też interlinia 1, nie 0.95.
						fontSize: 158,
						lineHeight: 1,
						letterSpacing: "-0.02em",
					},
					// W Archivo SemiBold ramię „r” styka się z „y” nawet bez kerningu –
					// przy tym stopniu widać to jako zlaną plamę. Wiersz jest więc
					// rozcięty między tymi literami, a druga część dostaje własny
					// odstęp; letter-spacing na całym wierszu rozluźniłby wszystko.
					lines.map((line) =>
						el(
							"div",
							{ display: "flex" },
							line
								.split(/(?<=r)(?=y)/)
								.map((part, index) => el("div", index > 0 ? { marginLeft: "0.045em" } : {}, part)),
						),
					),
				),
				el(
					"div",
					{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderTop: `2px solid ${INK}`,
						padding: `34px ${PADDING}px`,
					},
					[el("div", { fontSize: 26 }, WORDMARK), el("div", { ...mono, color: MUTED }, "Trójmiasto 2027")],
				),
			]),
		],
	),
	{ width: SIZE, height: SIZE, fonts },
);

await Bun.write(OUTPUT, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());

console.log(`Grafika zapisana: ${OUTPUT}`);
