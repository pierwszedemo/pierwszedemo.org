import type { APIRoute } from "astro";
import { OG_HEADERS, renderHomeCard } from "../og";
import { FOUNDER_PHOTOS } from "../photos";
import { FOUNDERS, HOMEPAGE } from "../strony";

export const prerender = true;

export const GET: APIRoute = async () => {
	// Hero w miniaturze: slogan z Tiny i ten sam polaroid z fundatorami.
	const png = await renderHomeCard({
		title: HOMEPAGE.slogan,
		photos: FOUNDERS.map((person) => FOUNDER_PHOTOS[person.id]),
		caption: `to my – ${FOUNDERS.map((person) => person.name.split(" ")[0]).join(" i ")}`,
	});
	return new Response(png, { headers: OG_HEADERS });
};
