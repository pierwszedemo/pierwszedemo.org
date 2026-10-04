import { defineCollection, z, type ImageFunction } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES, DATE_PREFIX, KINDS, NEWS_KINDS } from "./consts";

/**
 * Dwie kolekcje, nie jedna z polem „dział”: baza wiedzy i aktualności to dwa
 * typy treści w przyszłym CMS-ie (Tina/Decap pracują na katalogach), a dziś
 * dwa katalogi markdownu, które `ls` listuje osobno. Wspólna część schematu
 * jest wyciągnięta niżej, żeby pola o tej samej nazwie znaczyły to samo.
 */

// Podkreślnik na początku nazwy = szkic: plik zostaje w repo, ale nie wchodzi
// do kolekcji, więc nie ma go ani na liście, ani w sitemapie, RSS-ie i llms.txt.
// Wzorzec musi to wykluczać jawnie — sam loader nie traktuje `_` specjalnie.
//
// Wykluczenie jest osobnym wzorcem, nie klasą `[!_]`, bo loader mierzy ten sam
// wzorzec dwoma silnikami: tinyglobby przy starcie i picomatch w watcherze.
// picomatch czyta `[!_]` jako klasę znaków `{!, _}`, nie jako negację — więc
// `onChange` odrzucał każdy plik wpisu i zmiana w `.md` nie przeładowywała
// dev-serwera (build był poprawny, bo tam pracuje tinyglobby).
const loader = (base: string) =>
  glob({
    base,
    pattern: ["**/*.md", "!**/_*.md"],
    // Pliki nazywają się `RRRR-MM-DD-slug.md`, żeby `ls` pokazywał chronologię,
    // ale adresem jest sam slug – data w URL-u postarzałaby wpis i zmuszała do
    // przekierowań przy każdej zmianie nazwy. Źródłem daty pozostaje frontmatter.
    generateId: ({ entry }) => entry.replace(/\.md$/, "").replace(DATE_PREFIX, ""),
  });

const base = (image: ImageFunction) => ({
  title: z.string(),
  /** Akapit „W skrócie" z lewej kolumny wpisu. Jednocześnie meta description. */
  lead: z.string(),
  date: z.coerce.date(),
  /** Data rewizji faktów – przewodniki starzeją się na liczbach. Zasila dateModified. */
  updated: z.coerce.date().optional(),
  /**
   * Wyimek – zdanie, w które ma wpaść ktoś przelatujący stronę wzrokiem.
   * Renderuje się jako pasmo pod tytułem i zostaje też w treści, bo wyimek
   * ma powtarzać, a nie zastępować. Osobne pole zamiast znacznika w markdownie:
   * korpus wpisu dopuszcza tylko akapity, ##, ###, linki, strong i em, więc
   * odblokowanie `>` pod cytaty otworzyłoby element, którego Preflight nie
   * stylizuje i który jest sygnałem tekstu pisanego przez model.
   */
  pullquote: z.string().optional(),
  /** Kto to powiedział. Bez tego wyimek czyta się jak głos autora wpisu. */
  pullquoteAuthor: z.string().optional(),
  readingMinutes: z.number().int().positive(),
  /**
   * ID utworu z open.spotify.com/track/<id> – osadza odtwarzacz w kolumnie
   * „W skrócie". Pole zamiast iframe'u w markdownie, bo korpus wpisu
   * dopuszcza tylko akapity, ##, ###, linki, strong i em. Odtwarzacz ładuje
   * się bez banera – uzasadniony interes, wpis w PRIVACY_TOOLS, ta sama
   * konwencja co na olageppert.pl.
   */
  spotifyTrackId: z.string().optional(),
  /**
   * Grafika w kolumnie „W skrócie", pod leadem – ten sam slot co odtwarzacz.
   * Pole zamiast `![]()` w treści z tego samego powodu co wyżej: korpus
   * wpisu zostaje tekstowy, a obrazek dostaje własne miejsce w siatce
   * zamiast łamać dwie łamy notatki. Ścieżka względem pliku wpisu
   * (`../../assets/blog/…`), Astro optymalizuje ją przy buildzie.
   */
  image: image().optional(),
  imageAlt: z.string().optional(),
});

const requireAlt = {
  check: (d: { image?: unknown; imageAlt?: string }) => !d.image || !!d.imageAlt,
  message: "Wpis z `image` musi mieć `imageAlt`.",
  path: ["imageAlt"],
};

/** Baza wiedzy: poradniki bez daty ważności, grupowane kategorią. */
const wiedza = defineCollection({
  loader: loader("./src/content/wiedza"),
  schema: ({ image }) =>
    z
      .object({
        ...base(image),
        category: z.enum(CATEGORIES),
        /** Default trzyma wpisy sprzed wprowadzenia formatów przy życiu bez edycji. */
        kind: z.enum(KINDS).default("notatka"),
        /**
         * Fraza główna wpisu. Bez niej deduplikacja tematów porównywałaby tytuły,
         * a dwa różnie zatytułowane wpisy o tym samym konkurują ze sobą w wyszukiwarce.
         */
        keyphrase: z.string().optional(),
      })
      .refine(requireAlt.check, requireAlt),
});

/** Aktualności: jeden strumień chronologiczny, `kind` mówi, co to za wpis. */
const aktualnosci = defineCollection({
  loader: loader("./src/content/aktualnosci"),
  schema: ({ image }) =>
    z
      .object({
        ...base(image),
        kind: z.enum(Object.keys(NEWS_KINDS) as [keyof typeof NEWS_KINDS]),
        /** Data wydarzenia, gdy wpis je zapowiada lub relacjonuje – nie data publikacji. */
        eventDate: z.coerce.date().optional(),
        /** Miejsce wydarzenia – miasto albo sala, w formie do wyświetlenia. */
        place: z.string().optional(),
        keyphrase: z.string().optional(),
      })
      .refine(requireAlt.check, requireAlt),
});

export const collections = { wiedza, aktualnosci };
