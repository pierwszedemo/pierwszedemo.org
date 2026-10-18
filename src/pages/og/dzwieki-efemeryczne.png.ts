import type { APIRoute } from "astro";
import { CONCERT_SERIES_NAME } from "../../consts";
import { OG_HEADERS, renderSwissCard } from "../../og";

export const prerender = true;

// Statyczna trasa obok `[slug].png.ts`: Astro daje jej pierwszeństwo przed
// dynamiczną, więc karta cyklu nie wymaga wpisu w kolekcji bloga. Układ
// szwajcarski, jak strona cyklu – patrz `renderSwissCard`.
export const GET: APIRoute = async () => {
	const png = await renderSwissCard({
		eyebrow: "Cykl koncertów piosenki autorskiej – Trójmiasto 2027",
		title: CONCERT_SERIES_NAME,
		badge: "Wstęp wolny",
	});
	return new Response(png, { headers: OG_HEADERS });
};
