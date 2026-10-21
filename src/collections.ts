import { type CollectionEntry, getCollection } from "astro:content";
import { allocateCovers, type CoverParams } from "./covers";
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
const listed = ({ data }: Flags) => !data.draft && !data.unlisted;

/** Wpisy widoczne w serwisie: listy, strona główna, prev/next, RSS, llms.txt. */
export async function getSortedArticles(): Promise<Article[]> {
	return (await getCollection("wiedza", listed)).sort(byDateDesc);
}

export async function getSortedNews(): Promise<News[]> {
	return (await getCollection("aktualnosci", listed)).sort(byDateDesc);
}

/**
 * Każdy wpis ma adres – także `unlisted` i szkic. Tylko dla tras wpisów i kart
 * OG: wpisu spoza list nikt nie znajdzie bez linku, ale z linkiem musi mieć
 * stronę i obrazek do udostępnień. Szkic to podgląd do wysłania komuś przed
 * publikacją – z banerem i noindex (ArticleLayout), bez sitemapy
 * (astro.config.mjs).
 */
export async function getRoutedArticles(): Promise<Article[]> {
	return (await getCollection("wiedza")).sort(byDateDesc);
}

export async function getRoutedNews(): Promise<News[]> {
	return (await getCollection("aktualnosci")).sort(byDateDesc);
}

/**
 * Okładki wszystkich wpisów – przydział bez powtórek zależy od kolejności
 * publikacji w obu kolekcjach naraz (src/covers.ts), więc liczy się go
 * z pełnej listy, nie per wpis. Bez cache'u: to mniej niż milisekunda,
 * a pamięć modułu przeżywałaby w `astro dev` zmianę daty we wpisie.
 */
export async function getCovers(): Promise<Map<string, CoverParams>> {
	const entries = [...(await getRoutedArticles()), ...(await getRoutedNews())];
	return allocateCovers(entries.map(({ id, data }) => ({ slug: id, date: data.date, cover: data.cover })));
}

/**
 * „Następny” w czytaniu = najbliższy starszy wpis z listy. Liczony względem
 * listy, nie wszystkich opublikowanych, żeby żaden link nie prowadził do wpisu
 * `unlisted` ani do szkicu; ten sam wzór daje im następnika z listy.
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
