import type { APIRoute } from "astro";
import { PAGE_HEADERS } from "../../../consts";
import { OG_HEADERS, renderOgCard } from "../../../og";
import { FOUNDATION_PAGE_DOC } from "../../../strony";

export const prerender = true;

interface Card {
	eyebrow: string;
	title: string;
	intro: string;
}

// Te same słowa co nagłówek strony (PageHeader); /fundacja bierze tytuł
// i akapit z Tiny, jak jej nagłówek.
export function getStaticPaths() {
	const cards: Record<keyof typeof PAGE_HEADERS, Card> = {
		...PAGE_HEADERS,
		fundacja: {
			...PAGE_HEADERS.fundacja,
			title: FOUNDATION_PAGE_DOC.heading,
			intro: FOUNDATION_PAGE_DOC.tagline,
		},
	};
	return Object.entries(cards).map(([page, card]) => ({ params: { page }, props: card }));
}

export const GET: APIRoute<Card> = async ({ props }) => {
	const png = await renderOgCard(props);
	return new Response(png, { headers: OG_HEADERS });
};
