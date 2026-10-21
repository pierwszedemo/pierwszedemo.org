import type { APIRoute } from "astro";
import { OG_HEADERS, renderHomeCard } from "../og";

export const prerender = true;

export const GET: APIRoute = async () => {
	// Karta marki: „Fundacja” i logotyp, bez sloganu – ten nie mówi, kim jesteśmy.
	const png = await renderHomeCard();
	return new Response(png, { headers: OG_HEADERS });
};
