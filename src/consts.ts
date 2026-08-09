export const SITE_URL = "https://miszczyszyn.com";
export const SITE_NAME = "Michał Miszczyszyn";
export const SITE_TAGLINE = "Manager artystów";
export const SITE_DESCRIPTION =
  "Management, wydawnictwa i booking dla artystów alternatywnych. Od pierwszego demo do festiwalowych scen — z planem, nie z przypadku.";

export const CONTACT_EMAIL = "michal@miszczyszyn.com";
export const HOME_CITY = "Gdańsk";

/** Stabilne @id węzłów schema.org — nie zmieniaj, wiążą encje między stronami. */
export const PERSON_ID = `${SITE_URL}/#michal`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Data ostatniej zmiany treści — trafia do sitemap.lastmod i dateModified. */
export const LAST_CONTENT_UPDATE = "2026-08-09";

/** Marka w lewej komórce nagłówka — w projekcie zapisana z ®. */
export const WORDMARK = "Miszczyszyn®";

/**
 * Nawigacja. Makieta ma tu cztery komórki (marka, Artyści, Blog, Kontakt);
 * „Artyści" wypadło, a jego miejsce trzyma pusta komórka w `Nav.astro`, żeby
 * siatka została czterokolumnowa.
 */
export const NAV = [{ label: "Blog", href: "/blog" }] as const;

export const SERVICES = [
  { no: "01", label: "Management" },
  { no: "02", label: "Wydawnictwa" },
  { no: "03", label: "Booking" },
] as const;

/**
 * Linki wychodzące do stron artystów dostają UTM-y, żeby w ich analityce
 * ruch z tej strony dał się odróżnić od wejść bezpośrednich. `href` trzymamy
 * czysty — parametry dokleja `withUtm()` w miejscu użycia, więc kanoniczny
 * adres zostaje jeden (m.in. w JSON-LD, gdyby kiedyś tam trafił).
 */
export const ROSTER = [
  {
    name: "Ola Geppert",
    genres: "alt-pop / indie / retro",
    href: "https://olageppert.pl",
  },
] as const;

export function withUtm(href: string, campaign: string): string {
  const url = new URL(href);
  url.searchParams.set("utm_source", "miszczyszyn.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.href;
}

/** Kolejność jak w stopce z makiety: LinkedIn, potem Instagram. */
export const SOCIALS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/mmiszczyszyn/" },
  { name: "Instagram", href: "https://www.instagram.com/typeofweb/" },
] as const;

/**
 * Kategoria opisuje efekt pracy, o której jest wpis, a nie temat, o który
 * zahacza — „budżet trasy" to Finanse, choć dotyczy koncertów.
 */
export const CATEGORIES = [
  "Promocja",
  "Wydawnictwa",
  "Streaming",
  "Koncerty",
  "Finanse",
  "Zarządzanie",
  "Branża",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Formaty wpisu. To nie jest wyłącznie konwencja redakcyjna: `kind` steruje
 * układem łamów w src/pages/blog/[...slug].astro — patrz komentarz tamże.
 */
export const KINDS = ["notatka", "przewodnik"] as const;

export type Kind = (typeof KINDS)[number];
