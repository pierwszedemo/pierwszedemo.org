import type { APIRoute } from "astro";
import { OG_HEADERS, renderHomeCard } from "../og";
import { HOMEPAGE } from "../strony";

export const prerender = true;

export const GET: APIRoute = async () => {
	// Hero w miniaturze, ze sloganem z Tiny.
	const png = await renderHomeCard({ title: HOMEPAGE.slogan });
	return new Response(png, { headers: OG_HEADERS });
};
