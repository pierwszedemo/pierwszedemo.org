import type { APIRoute } from "astro";
import { CONCERT_SERIES_NAME } from "../../consts";
import { OG_HEADERS, renderOgCard } from "../../og";

export const prerender = true;

// Statyczna trasa obok `[slug].png.ts`: Astro daje jej pierwszeństwo przed
// dynamiczną, więc karta cyklu nie wymaga wpisu w kolekcji bloga. Nadtytuł
// podmieniony – domyślny to byline managera, a ta karta zapowiada wydarzenie.
export const GET: APIRoute = async () => {
	const png = await renderOgCard({
		eyebrow: "Cykl koncertów piosenki autorskiej – Trójmiasto 2027",
		title: CONCERT_SERIES_NAME,
		badge: "Wstęp wolny",
	});
	return new Response(png, { headers: OG_HEADERS });
};
