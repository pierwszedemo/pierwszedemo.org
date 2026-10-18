import type { MdastPluginDefinition } from "satteri";

/**
 * Polska typografia: jednoliterowy wyraz („a i o u w z") nie może zostać na
 * końcu wiersza (PN-83/P-55366). Zamiast wklejać `&nbsp;` do markdownu ręcznie,
 * spacja po takim wyrazie zamienia się na niełamliwą przy renderowaniu.
 */

// Lookbehind, nie grupa łapiąca: spójniki potrafią stać obok siebie („i o tym").
// Gdyby wzorzec konsumował znak przed literą, drugi z pary wypadłby poza kolejne
// dopasowanie i został bez twardej spacji.
// `\n` jest w klasie celowo – miękki łamacz w markdownie renderuje się jako
// zwykła spacja, więc spójnik na końcu linii źródła to dokładnie ten sam problem.
const HANGING = /(?<![\p{L}\p{N}])([aiouwzAIOUWZ])[ \t\n]+(?=[\p{L}\p{N}„”"'(])/gu;

/** Dokleja spójnik do następnego słowa niełamliwą spacją. */
export const fixHanging = (text: string) => text.replace(HANGING, "$1 ");

/**
 * Ta sama poprawka dla treści wpisu. Wtyczka Sätteri (domyślnego procesora
 * markdownu w Astro 7 – `remarkPlugins` wymagałoby doinstalowania starego
 * potoku unified) odwiedza wyłącznie węzły `text`, więc bloki kodu (`code`,
 * `inlineCode`) i adresy linków (`url` to osobne pole węzła, nie tekst)
 * zostają nietknięte.
 */
export const satteriHanging: MdastPluginDefinition = {
	name: "hanging-conjunctions",
	text(node, ctx) {
		const value = fixHanging(node.value);
		// Węzły są tylko do odczytu – mutacje idą przez kontekst.
		if (value !== node.value) ctx.setProperty(node, "value", value);
	},
};

/**
 * Akcent w nagłówku z Tiny: słowa w `*gwiazdkach*` dostają kursywę albo kolor
 * („Co *robimy*”, „Hej, robimy *fajne rzeczy*…”). Pole w Tinie to zwykły
 * tekst, więc znacznik musi dać się wpisać z klawiatury – gwiazdki znaczą
 * to samo co w markdownie. Spójniki są doklejane przed podziałem, żeby
 * „i *coś*” nie zostawiło „i” na końcu wiersza.
 */
export const accentParts = (text: string) =>
	fixHanging(text.replace(/(?<![\p{L}\p{N}])([aiouwzAIOUWZ]) \*/gu, "$1\u00a0*"))
		.split(/\*([^*]+)\*/)
		.map((part, index) => ({ text: part, accent: index % 2 === 1 }))
		.filter((part) => part.text);
