import { getCollection, type CollectionEntry } from "astro:content";
import { wordCount } from "./schema";

export type Article = CollectionEntry<"wiedza">;
export type News = CollectionEntry<"aktualnosci">;

/**
 * Jedno źródło kolejności dla obu kolekcji: listy, linki prev/next, RSS,
 * llms.txt i karty OG czytają stąd, więc nie mogą się rozjechać. Najnowsze
 * pierwsze; przy tej samej dacie – alfabetycznie po id, żeby build był
 * deterministyczny.
 */
const byDateDesc = <T extends { id: string; data: { date: Date } }>(a: T, b: T) =>
  b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id);

const published = ({ data }: { data: { draft: boolean } }) => !data.draft;

export async function getSortedArticles(): Promise<Article[]> {
  return (await getCollection("wiedza", published)).sort(byDateDesc);
}

export async function getSortedNews(): Promise<News[]> {
  return (await getCollection("aktualnosci", published)).sort(byDateDesc);
}

/**
 * Czas czytania liczony z treści przy buildzie, nie wpisywany do frontmattera.
 * Pole ręczne rozjeżdżało się z tekstem po każdej redakcji, a w Tinie nikt nie
 * policzy słów przed zapisem. Wzór jak w skillu blog-post-factory.
 */
export const readingMinutes = (entry: Article | News) =>
  Math.max(2, Math.round(wordCount(entry.body ?? "") / 180));

/** `YYYY-MM-DD` – do atrybutu datetime, sitemapy i widocznych dat. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** `YYYY-MM` – do grupowania list po miesiącu. */
export const isoMonth = (date: Date) => isoDate(date).slice(0, 7);

/** Data po polsku: „4 października 2026”. */
export const plDate = (date: Date) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
