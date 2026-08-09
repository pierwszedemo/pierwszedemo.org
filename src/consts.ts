export const SITE_URL = "https://miszczyszyn.com";
export const SITE_NAME = "Michał Miszczyszyn";
export const SITE_TAGLINE = "Manager artystów";
export const SITE_DESCRIPTION =
  "Management, wydawnictwa i booking dla artystów alternatywnych. Od pierwszego demo do festiwalowych scen — z planem, nie z przypadku.";

export const CONTACT_EMAIL = "michal@miszczyszyn.com";
export const HOME_CITY = "Warszawa";

/** Stabilne @id węzłów schema.org — nie zmieniaj, wiążą encje między stronami. */
export const PERSON_ID = `${SITE_URL}/#michal`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Data ostatniej zmiany treści — trafia do sitemap.lastmod i dateModified. */
export const LAST_CONTENT_UPDATE = "2026-08-09";

/** Marka w lewej komórce nagłówka — w projekcie zapisana z ®. */
export const WORDMARK = "Miszczyszyn®";

/**
 * Nawigacja. „Artyści" celuje w sekcję rosteru na stronie głównej — osobnej
 * podstrony nie ma, bo roster to na razie jeden artysta.
 */
export const NAV = [
  { label: "Artyści", href: "/#roster" },
  { label: "Blog", href: "/blog" },
] as const;

export const SERVICES = [
  { no: "01", label: "Management" },
  { no: "02", label: "Wydawnictwa" },
  { no: "03", label: "Booking" },
] as const;

export const ROSTER = [
  {
    name: "Ola Geppert",
    genres: "alt-pop / indie / retro",
    href: "https://olageppert.pl",
  },
] as const;

/** Kolejność jak w stopce z makiety: LinkedIn, potem Instagram. */
export const SOCIALS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/mmiszczyszyn/" },
  { name: "Instagram", href: "https://www.instagram.com/typeofweb/" },
] as const;

export const CATEGORIES = [
  "Promocja",
  "Wydawnictwa",
  "Koncerty",
  "Finanse",
] as const;

export type Category = (typeof CATEGORIES)[number];
