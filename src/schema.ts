import { SITE_URL } from "./consts";

/**
 * Okruszki nawigacyjne. Serwis nie pokazuje ich wizualnie – siatka z makiety
 * nie ma na nie miejsca – ale Google buduje z nich ścieżkę pod wynikiem
 * wyszukiwania zamiast gołego adresu URL.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[], pageId: string) {
	return {
		"@type": "BreadcrumbList",
		"@id": `${pageId}#breadcrumb`,
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: new URL(item.path, SITE_URL).href,
		})),
	};
}

/**
 * Data dla schema.org. Sam dzień („2026-08-09") Google odrzuca komunikatem
 * „Invalid datetime value”, więc każda data w JSON-LD wychodzi jako pełne
 * ISO 8601 z Z – tym samym zapisem co lastmod w sitemapie (astro.config.mjs).
 */
export const isoDateTime = (value: string | Date) => new Date(value).toISOString();

/**
 * Liczba słów treści wpisu. Markdown jest tu wąski (akapity, nagłówki, linki),
 * więc wystarczy zdjąć składnię linków i znaczniki nagłówków – bez parsera.
 */
export function wordCount(markdown: string): number {
	return markdown
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/^#{1,6}\s+/gm, "")
		.split(/\s+/)
		.filter(Boolean).length;
}
