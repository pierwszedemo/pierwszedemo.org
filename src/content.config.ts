import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES, DATE_PREFIX, KINDS } from "./consts";

const blog = defineCollection({
  // Podkreślnik na początku nazwy = szkic: plik zostaje w repo, ale nie wchodzi
  // do kolekcji, więc nie ma go ani na liście, ani w sitemapie, RSS-ie i llms.txt.
  // Wzorzec musi to wykluczać jawnie — sam loader nie traktuje `_` specjalnie.
  //
  // Wykluczenie jest osobnym wzorcem, nie klasą `[!_]`, bo loader mierzy ten sam
  // wzorzec dwoma silnikami: tinyglobby przy starcie i picomatch w watcherze.
  // picomatch czyta `[!_]` jako klasę znaków `{!, _}`, nie jako negację — więc
  // `onChange` odrzucał każdy plik wpisu i zmiana w `.md` nie przeładowywała
  // dev-serwera (build był poprawny, bo tam pracuje tinyglobby).
  loader: glob({
    base: "./src/content/blog",
    pattern: ["**/*.md", "!**/_*.md"],
    // Pliki nazywają się `RRRR-MM-DD-slug.md`, żeby `ls` pokazywał chronologię,
    // ale adresem jest sam slug – data w URL-u postarzałaby wpis i zmuszała do
    // przekierowań przy każdej zmianie nazwy. Źródłem daty pozostaje frontmatter.
    generateId: ({ entry }) => entry.replace(/\.md$/, "").replace(DATE_PREFIX, ""),
  }),
  schema: z.object({
    title: z.string(),
    /** Akapit „W skrócie" z lewej kolumny wpisu. Jednocześnie meta description. */
    lead: z.string(),
    category: z.enum(CATEGORIES),
    /** Default trzyma wpisy sprzed wprowadzenia formatów przy życiu bez edycji. */
    kind: z.enum(KINDS).default("notatka"),
    date: z.coerce.date(),
    /** Data rewizji faktów – przewodniki starzeją się na liczbach. Zasila dateModified. */
    updated: z.coerce.date().optional(),
    /**
     * Fraza główna wpisu. Bez niej deduplikacja tematów porównywałaby tytuły,
     * a dwa różnie zatytułowane wpisy o tym samym konkurują ze sobą w wyszukiwarce.
     */
    keyphrase: z.string().optional(),
    readingMinutes: z.number().int().positive(),
    /**
     * ID utworu z open.spotify.com/track/<id> – osadza odtwarzacz w kolumnie
     * „W skrócie". Pole zamiast iframe'u w markdownie, bo korpus wpisu
     * dopuszcza tylko akapity, ##, ###, linki, strong i em. Odtwarzacz ładuje
     * się bez banera – uzasadniony interes, wpis w PRIVACY_TOOLS, ta sama
     * konwencja co na olageppert.pl.
     */
    spotifyTrackId: z.string().optional(),
  }),
});

export const collections = { blog };
