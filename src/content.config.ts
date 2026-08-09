import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./consts";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Akapit „W skrócie" z lewej kolumny wpisu. */
    lead: z.string(),
    category: z.enum(CATEGORIES),
    date: z.coerce.date(),
    readingMinutes: z.number().int().positive(),
  }),
});

export const collections = { blog };
