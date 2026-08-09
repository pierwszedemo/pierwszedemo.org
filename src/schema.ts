import { SITE_URL } from "./consts";

/**
 * Okruszki nawigacyjne. Serwis nie pokazuje ich wizualnie – siatka z makiety
 * nie ma na nie miejsca – ale Google buduje z nich ścieżkę pod wynikiem
 * wyszukiwania zamiast gołego adresu URL.
 */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  pageId: string,
) {
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
