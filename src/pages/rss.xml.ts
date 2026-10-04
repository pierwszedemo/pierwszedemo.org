import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getSortedArticles, getSortedNews } from "../collections";
import {
  KNOWLEDGE_PATH,
  NEWS_KINDS,
  NEWS_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "../consts";

export const prerender = true;

/**
 * Jeden kanał dla obu kolekcji – adres /rss.xml zostaje ten sam co przed
 * przebudową, więc nikt, kto go subskrybował, nie wypada. Kategoria
 * pozycji mówi, z którego działu jest wpis.
 */
export const GET: APIRoute = async () => {
  const articles = await getSortedArticles();
  const news = await getSortedNews();
  const items = [
    ...articles.map((entry) => ({
      title: entry.data.title,
      description: entry.data.lead,
      pubDate: entry.data.date,
      link: `${KNOWLEDGE_PATH}/${entry.id}`,
      categories: ["Wiedza", entry.data.category],
    })),
    ...news.map((entry) => ({
      title: entry.data.title,
      description: entry.data.lead,
      pubDate: entry.data.date,
      link: `${NEWS_PATH}/${entry.id}`,
      categories: ["Aktualności", NEWS_KINDS[entry.data.kind]],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    // @astrojs/rss domyślnie dokleja ukośnik na końcu adresu, a serwis stoi na
    // `trailingSlash: "never"` – bez tego kanał podawał w <link> i <guid
    // isPermaLink="true"> adresy, które natychmiast przekierowują (308), i tym
    // samym karmił Google drugim wariantem każdego wpisu.
    trailingSlash: false,
    // Treści wpisu nie wysyłamy: kanał ma przyprowadzać na stronę, a nie ją
    // zastępować. `lead` to ten sam akapit, co „W skrócie" i meta description.
    items,
    customData: "<language>pl-pl</language>",
  });
};
