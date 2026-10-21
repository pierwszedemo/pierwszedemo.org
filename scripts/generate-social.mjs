/**
 * Grafiki do profili fundacji, wgrywane ręcznie: avatary (Instagram, Facebook,
 * LinkedIn) i okładki (strona na Facebooku, strona i profile na LinkedInie).
 * Uruchamiane ręcznie (`bun scripts/generate-social.mjs`), wynik ląduje
 * w `public/social/` – pod pierwszedemo.org/social/, żeby pobrać je z każdego
 * komputera, z którego zarządza się profilami.
 *
 * Avatar to ten z płótna „Logo — wybrane” (`renderAvatarBody`, ten sam co
 * ikony aplikacji i BIMI): pełny kwadrat ultramaryny, bo wszystkie trzy
 * platformy same go kadrują – Instagram i Facebook w koło, LinkedIn
 * w zaokrąglony kwadrat.
 *
 * Okładki (`renderSocialCover`): znak i hasło w prostokącie widocznym
 * w każdym kadrze, grafika Fali po drugiej stronie.
 * - Facebook 1640×856: desktop pokazuje środkowy pas 1640×624 (proporcja
 *   820×312) z cieniem pod przyciskami na dolnych 136 px, telefon środkową
 *   kolumnę ~1522×856 (640×360); zdjęcie profilowe wchodzi na lewy dolny róg.
 *   Tekst więc w x 200–1440, y 116–604.
 * - LinkedIn, strona organizacji 1128×191 (i @2x): logo zachodzi na lewą dolną
 *   część okładki, więc tekst po prawej, a grafika na lewo od środka, za
 *   strefą logo – inaczej logo zasłaniało pół fali.
 * - LinkedIn, profil osobisty 1584×396 (tło profilu fundatorów): zdjęcie
 *   zachodzi na lewy dół – układ jak wyżej.
 * - YouTube 2048×1152: telewizor pokazuje całość, desktop pas 2048×423,
 *   telefon tylko środek 1235×338 (x 406–1641, y 407–745) – i tekst, i grafika
 *   mieszczą się w tym środku, reszta to samo tło.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { renderAvatarBody, renderSocialCover } from "../src/og.ts";

const OUT = "public/social";
mkdirSync(OUT, { recursive: true });

const avatar = async (size) =>
	sharp(
		Buffer.from(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${await renderAvatarBody(size)}</svg>`,
		),
		{ density: 512 },
	)
		.resize(size, size)
		.png({ compressionLevel: 9 })
		.toBuffer();

const files = [
	["instagram-avatar-1080.png", () => avatar(1080)],
	["facebook-avatar-1080.png", () => avatar(1080)],
	["linkedin-avatar-400.png", () => avatar(400)],
	[
		"facebook-cover-1640x856.png",
		() =>
			renderSocialCover({
				width: 1640,
				height: 856,
				safe: { x: 200, y: 116, w: 1240, h: 488 },
				art: { x: 940, y: 116, h: 488 },
				textSide: "left",
				lockupSize: 112,
			}),
	],
	...[1, 2].map((scale) => [
		`linkedin-page-cover-${1128 * scale}x${191 * scale}.png`,
		() =>
			renderSocialCover({
				width: 1128,
				height: 191,
				safe: { x: 320, y: 20, w: 768, h: 151 },
				art: { x: 220, y: 8, h: 175 },
				textSide: "right",
				lockupSize: 54,
				scale,
			}),
	]),
	[
		"youtube-banner-2048x1152.png",
		() =>
			renderSocialCover({
				width: 2048,
				height: 1152,
				// Środek 1235×338 z 40 px zapasu – na telefonie to krawędź ekranu.
				safe: { x: 446, y: 427, w: 1155, h: 298 },
				art: { x: 1298, y: 427, h: 298 },
				textSide: "left",
				lockupSize: 104,
			}),
	],
	[
		"linkedin-profile-cover-1584x396.png",
		() =>
			renderSocialCover({
				width: 1584,
				height: 396,
				safe: { x: 420, y: 40, w: 1104, h: 316 },
				art: { x: 300, y: 24, h: 348 },
				textSide: "right",
				lockupSize: 104,
			}),
	],
];

for (const [name, make] of files) {
	await Bun.write(`${OUT}/${name}`, await make());
	console.log(`${OUT}/${name}`);
}
