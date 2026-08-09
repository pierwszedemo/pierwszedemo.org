import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/** Wpisy od najnowszego. Jedno źródło kolejności – lista i prev/next muszą się zgadzać. */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog");
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** ISO bez czasu – w projekcie daty są zapisane jako 2026-08-02 / 2026-08. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
export const isoMonth = (date: Date) => date.toISOString().slice(0, 7);
