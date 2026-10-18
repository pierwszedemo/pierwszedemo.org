import type { APIRoute } from "astro";
import { OG_HEADERS, renderOgCard } from "../og";
import { HOMEPAGE } from "../strony";

export const prerender = true;

export const GET: APIRoute = async () => {
	// Slogan z Tiny, z akcentem jak w hero. Bez `badge` – w stopce adres serwisu.
	const png = await renderOgCard({ title: HOMEPAGE.slogan });
	return new Response(png, { headers: OG_HEADERS });
};
