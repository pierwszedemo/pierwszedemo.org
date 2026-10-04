import type { APIRoute } from "astro";
import {
  getSortedArticles,
  getSortedNews,
  type Article,
  type News,
} from "../../collections";
import { NEWS_KINDS } from "../../consts";
import { OG_HEADERS, renderOgCard } from "../../og";

export const prerender = true;

// Osobny katalog `/og/`, nie `/wiedza/<slug>/og.png` – ten drugi wpadłby w
// catch-all `[...slug]` strony wpisu i trasy zaczęłyby się gryźć. Obie
// kolekcje dzielą jedną przestrzeń slugów; gdyby kiedyś się zderzyły, build
// zgłosi zduplikowaną trasę.
export async function getStaticPaths() {
  const articles = await getSortedArticles();
  const news = await getSortedNews();
  return [
    ...articles.map((entry) => ({
      params: { slug: entry.id },
      props: { title: entry.data.title, badge: entry.data.category },
    })),
    ...news.map((entry) => ({
      params: { slug: entry.id },
      props: { title: entry.data.title, badge: NEWS_KINDS[entry.data.kind] },
    })),
  ];
}

export const GET: APIRoute<{ title: string; badge: string }> = async ({
  props,
}) => {
  const png = await renderOgCard({ title: props.title, badge: props.badge });
  return new Response(png, { headers: OG_HEADERS });
};

// Typy trzymane w jednym miejscu, żeby endpoint nie importował kolekcji
// tylko po to, by je nazwać.
export type { Article, News };
