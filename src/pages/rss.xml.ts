import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getSortedPosts } from "../blog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../consts";

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getSortedPosts();

  return rss({
    title: `${SITE_NAME} – blog`,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    // @astrojs/rss domyślnie dokleja ukośnik na końcu adresu, a serwis stoi na
    // `trailingSlash: "never"` – bez tego kanał podawał w <link> i <guid
    // isPermaLink="true"> adresy, które natychmiast przekierowują (308), i tym
    // samym karmił Google drugim wariantem każdego wpisu.
    trailingSlash: false,
    // Treści wpisu nie wysyłamy: kanał ma przyprowadzać na stronę, a nie ją
    // zastępować. `lead` to ten sam akapit, co „W skrócie" i meta description.
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.lead,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
      categories: [post.data.category],
    })),
    customData: "<language>pl-pl</language>",
  });
};
