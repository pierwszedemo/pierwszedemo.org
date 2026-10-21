import type { APIRoute } from "astro";
import { PAGE_HEADERS } from "../../../consts";
import { OG_HEADERS, renderPageCard } from "../../../og";
import { FOUNDATION_PAGE_DOC } from "../../../strony";

export const prerender = true;

interface Card {
	title: string;
	intro: string;
}

// Te same słowa co nagłówek strony (PageHeader), bez pigułki – nazwę niesie
// znak na karcie. /fundacja bierze tytuł i akapit z Tiny, jak jej nagłówek.
export function getStaticPaths() {
	const cards: Record<keyof typeof PAGE_HEADERS, Card> = {
		...PAGE_HEADERS,
		fundacja: { title: FOUNDATION_PAGE_DOC.heading, intro: FOUNDATION_PAGE_DOC.tagline },
	};
	return Object.entries(cards).map(([page, card]) => ({ params: { page }, props: card }));
}

export const GET: APIRoute<Card> = async ({ props }) => {
	const png = await renderPageCard({ title: props.title, intro: props.intro });
	return new Response(png, { headers: OG_HEADERS });
};
