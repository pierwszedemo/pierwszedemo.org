import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES, KINDS } from "./consts";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Akapit „W skrócie" z lewej kolumny wpisu. Jednocześnie meta description. */
    lead: z.string(),
    category: z.enum(CATEGORIES),
    /** Default trzyma wpisy sprzed wprowadzenia formatów przy życiu bez edycji. */
    kind: z.enum(KINDS).default("notatka"),
    date: z.coerce.date(),
    /** Data rewizji faktów — przewodniki starzeją się na liczbach. Zasila dateModified. */
    updated: z.coerce.date().optional(),
    /**
     * Fraza główna wpisu. Bez niej deduplikacja tematów porównywałaby tytuły,
     * a dwa różnie zatytułowane wpisy o tym samym konkurują ze sobą w wyszukiwarce.
     */
    keyphrase: z.string().optional(),
    readingMinutes: z.number().int().positive(),
  }),
});

export const collections = { blog };
