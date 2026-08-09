import type { APIRoute } from "astro";
import { getSortedPosts, type Post } from "../../blog";
import { OG_HEADERS, renderOgCard } from "../../og";

export const prerender = true;

// Osobny katalog `/og/`, nie `/blog/<slug>/og.png` — ten drugi wpadłby w
// catch-all `[...slug]` strony wpisu i trasy zaczęłyby się gryźć.
export async function getStaticPaths() {
  const posts = await getSortedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute<{ post: Post }> = async ({ props }) => {
  const { post } = props;
  const png = await renderOgCard({
    title: post.data.title,
    badge: post.data.category,
  });
  return new Response(png, { headers: OG_HEADERS });
};
