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

type Flags = { data: { draft: boolean; unlisted: boolean } };
const published = ({ data }: Flags) => !data.draft;
const listed = ({ data }: Flags) => !data.draft && !data.unlisted;

/** Wpisy widoczne w serwisie: listy, strona główna, prev/next, RSS, llms.txt. */
export async function getSortedArticles(): Promise<Article[]> {
  return (await getCollection("wiedza", listed)).sort(byDateDesc);
}

export async function getSortedNews(): Promise<News[]> {
  return (await getCollection("aktualnosci", listed)).sort(byDateDesc);
}

/**
 * Wszystko, co ma adres – także `unlisted`. Tylko dla tras wpisów i kart OG:
 * wpis niepubliczny na listach nadal musi mieć stronę i obrazek do udostępnień.
 */
export async function getPublishedArticles(): Promise<Article[]> {
  return (await getCollection("wiedza", published)).sort(byDateDesc);
}

export async function getPublishedNews(): Promise<News[]> {
  return (await getCollection("aktualnosci", published)).sort(byDateDesc);
}

/**
 * „Następny” w czytaniu = najbliższy starszy wpis z listy. Liczony względem
 * listy, nie wszystkich opublikowanych, żeby żaden link nie prowadził do wpisu
 * `unlisted`; ten sam wzór daje wpisowi `unlisted` następnika z listy.
 */
export const nextListed = <T extends { id: string; data: { date: Date } }>(entry: T, list: T[]) =>
  list.find((other) => byDateDesc(entry, other) < 0);

/**
 * Czas czytania liczony z treści przy buildzie, nie wpisywany do frontmattera.
 * Pole ręczne rozjeżdżało się z tekstem po każdej redakcji, a w Tinie nikt nie
 * policzy słów przed zapisem. Wzór jak w skillach pierwszedemo.
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

/**
 * Czy w treści stoi obrazek (`![alt](ścieżka)`). Wpis z obrazkiem nie dostaje
 * dwóch łam: obrazek w łamie notatki pękałby na przełomie kolumn albo
 * zostawiał dziurę na dole pierwszej.
 */
export const hasBodyImage = (entry: Article | News) => /!\[[^\]]*\]\(/.test(entry.body ?? "");
