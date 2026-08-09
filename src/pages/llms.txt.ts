import type { APIRoute } from "astro";
import { getSortedPosts, isoDate } from "../blog";
import {
  CONTACT_EMAIL,
  HOME_CITY,
  ROSTER,
  SERVICES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "../consts";

export const prerender = true;

/**
 * /llms.txt — propozycja konwencji (llmstxt.org), nie standard. Żaden dostawca
 * modeli nie potwierdził, że ją czyta, więc traktujemy to jako tani eksperyment:
 * plik generuje się z tych samych stałych co strona, więc nie ma czego
 * aktualizować ręcznie i nie może się rozjechać z treścią.
 */
export const GET: APIRoute = async () => {
  const posts = await getSortedPosts();

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_TAGLINE} z ${HOME_CITY}a. Kontakt: ${CONTACT_EMAIL}`,
    "",
    "## Zakres pracy",
    "",
    ...SERVICES.map((service) => `- ${service.label}`),
    "",
    "## Artyści",
    "",
    ...ROSTER.map((artist) => `- [${artist.name}](${artist.href}) — ${artist.genres}`),
    "",
    "## Blog",
    "",
    ...posts.map(
      (post) =>
        `- [${post.data.title}](${SITE_URL}/blog/${post.id}) (${post.data.category}, ${isoDate(post.data.date)}): ${post.data.lead}`,
    ),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
