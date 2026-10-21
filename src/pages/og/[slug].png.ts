import type { APIRoute } from "astro";
import { type Article, getCovers, getRoutedArticles, getRoutedNews, type News } from "../../collections";
import { NEWS_KINDS } from "../../consts";
import { type CoverParams, coverParams } from "../../covers";
import { OG_HEADERS, renderPostCover } from "../../og";

export const prerender = true;

// Osobny katalog `/og/`, nie `/wiedza/<slug>/og.png` – ten drugi wpadłby w
// catch-all `[...slug]` strony wpisu i trasy zaczęłyby się gryźć. Obie
// kolekcje dzielą jedną przestrzeń slugów; gdyby kiedyś się zderzyły, build
// zgłosi zduplikowaną trasę.
export async function getStaticPaths() {
	const articles = await getRoutedArticles();
	const news = await getRoutedNews();
	const covers = await getCovers();
	return [
		...articles.map((entry) => ({
			params: { slug: entry.id },
			props: {
				title: entry.data.title,
				badge: entry.data.category,
				cover: covers.get(entry.id) ?? coverParams(entry.id),
			},
		})),
		...news.map((entry) => ({
			params: { slug: entry.id },
			props: {
				title: entry.data.title,
				badge: NEWS_KINDS[entry.data.kind],
				cover: covers.get(entry.id) ?? coverParams(entry.id),
			},
		})),
	];
}

export const GET: APIRoute<{ title: string; badge: string; cover: CoverParams }> = async ({ props }) => {
	const png = await renderPostCover({ params: props.cover, title: props.title, badge: props.badge });
	return new Response(png, { headers: OG_HEADERS });
};

// Typy trzymane w jednym miejscu, żeby endpoint nie importował kolekcji
// tylko po to, by je nazwać.
export type { Article, News };
