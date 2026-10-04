import type { APIRoute } from "astro";
import { getSortedArticles, getSortedNews, isoDate } from "../collections";
import {
  ACTIVITIES,
  CONCERT_SERIES_PATH,
  CONTACT_EMAIL,
  FOUNDATION,
  FOUNDATION_PATH,
  FOUNDERS,
  GOALS,
  HOME_CITY,
  KNOWLEDGE_PATH,
  NEWS_KINDS,
  NEWS_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  STATUTE_PATH,
  SUPPORT_PATH,
  registryValue,
} from "../consts";

export const prerender = true;

/**
 * /llms.txt – propozycja konwencji (llmstxt.org), nie standard. Żaden dostawca
 * modeli nie potwierdził, że ją czyta, więc traktujemy to jako tani eksperyment:
 * plik generuje się z tych samych stałych co strona, więc nie ma czego
 * aktualizować ręcznie i nie może się rozjechać z treścią.
 */
export const GET: APIRoute = async () => {
  const articles = await getSortedArticles();
  const news = await getSortedNews();
  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Fundacja z siedzibą w ${HOME_CITY}u (${FOUNDATION.street}, ${FOUNDATION.postalCode} ${FOUNDATION.city}), KRS ${registryValue(FOUNDATION.krs)}, NIP ${registryValue(FOUNDATION.nip)}. Kontakt: ${CONTACT_EMAIL}`,
    "",
    `## Fundacja (${SITE_URL}${FOUNDATION_PATH})`,
    "",
    ...FOUNDERS.map(
      (person) => `- ${person.fullName} – ${person.role}, ${person.jobTitle}`,
    ),
    `- Statut: ${SITE_URL}${STATUTE_PATH}`,
    `- Jak wesprzeć: ${SITE_URL}${SUPPORT_PATH}`,
    "",
    "## Cele statutowe",
    "",
    ...GOALS.map((goal) => `- ${goal}`),
    "",
    "## Działania",
    "",
    ...ACTIVITIES.map(
      (activity) =>
        `- [${activity.label}](${SITE_URL}${FOUNDATION_PATH}#${activity.id}): ${activity.description}`,
    ),
    "",
    "## Koncerty",
    "",
    `- [dźwięki efemeryczne](${SITE_URL}${CONCERT_SERIES_PATH}): cykl trzech kameralnych koncertów piosenki autorskiej w Trójmieście (Gdańsk, Sopot, Gdynia), kwiecień–wrzesień 2027, wstęp wolny.`,
    "",
    `## Baza wiedzy (${SITE_URL}${KNOWLEDGE_PATH})`,
    "",
    ...articles.map(
      (entry) =>
        `- [${entry.data.title}](${SITE_URL}${KNOWLEDGE_PATH}/${entry.id}) (${entry.data.category}, ${isoDate(entry.data.updated ?? entry.data.date)}): ${entry.data.lead}`,
    ),
    "",
    `## Aktualności (${SITE_URL}${NEWS_PATH})`,
    "",
    ...news.map(
      (entry) =>
        `- [${entry.data.title}](${SITE_URL}${NEWS_PATH}/${entry.id}) (${NEWS_KINDS[entry.data.kind]}, ${isoDate(entry.data.date)}): ${entry.data.lead}`,
    ),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
