import { defineConfig, type Collection, type TinaField } from "tinacms";
import { CATEGORIES, KINDS, NEWS_KINDS } from "../src/consts";

// Gałąź, na którą Tina commituje. Workers Builds podaje ją w WORKERS_CI_BRANCH,
// więc podgląd gałęzi edytuje tę samą gałąź, z której jest zbudowany. Domyślnie
// `fundacja`: do startu to ona jest produkcją, a `main` to jeszcze serwis
// managera bez Tiny. W dniu startu, po merge'u, wraca tu "main".
const branch =
  process.env.GITHUB_BRANCH || process.env.WORKERS_CI_BRANCH || "fundacja";

/**
 * Slug z polskiego tekstu: „Skąd wziąć pieniądze” → „skad-wziac-pieniadze”.
 * `ł` nie rozkłada się w NFD na literę i znak diakrytyczny, stąd osobna zamiana.
 */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Dzień w Warszawie, `RRRR-MM-DD` – ta sama data co w content.config.ts. */
const warsawDay = (value?: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(
    value ? new Date(value) : new Date(),
  );

/**
 * Pola wspólne obu kolekcji – lustro `base()` z src/content.config.ts.
 * Zmieniasz jedno, zmieniasz drugie: zod jest źródłem prawdy przy buildzie,
 * to tutaj jest tylko formularz.
 */
const headFields: TinaField[] = [
  { type: "string", name: "title", label: "Tytuł", isTitle: true, required: true },
  {
    type: "string",
    name: "lead",
    label: "W skrócie",
    description: "Lewa kolumna wpisu, a zarazem meta description.",
    required: true,
    ui: { component: "textarea" },
  },
];

const tailFields: TinaField[] = [
  {
    type: "datetime",
    name: "date",
    label: "Data publikacji",
    required: true,
    ui: { dateFormat: "YYYY-MM-DD", timeFormat: false },
  },
  {
    type: "datetime",
    name: "updated",
    label: "Data aktualizacji",
    description: "Ustaw, gdy zmieniają się fakty – zasila dateModified i sitemapę.",
    ui: { dateFormat: "YYYY-MM-DD", timeFormat: false },
  },
  {
    type: "boolean",
    name: "draft",
    label: "Szkic",
    description: "Szkic nie ma adresu: nie trafia na listy, do sitemapy, RSS ani llms.txt.",
  },
  {
    type: "string",
    name: "keyphrase",
    label: "Fraza główna",
    description: "Po niej deduplikujemy tematy – dwa wpisy o tym samym konkurują w Google.",
  },
  {
    type: "string",
    name: "pullquote",
    label: "Wyimek",
    description: "Zdanie z treści powtórzone jako pasmo pod tytułem.",
    ui: { component: "textarea" },
  },
  { type: "string", name: "pullquoteAuthor", label: "Autor wyimka" },
  {
    type: "string",
    name: "spotifyTrackId",
    label: "Spotify – ID utworu",
    description: "Z adresu open.spotify.com/track/<id>. Odtwarzacz w kolumnie „W skrócie”.",
  },
  {
    type: "image",
    name: "image",
    label: "Grafika",
    description: "Pod leadem w kolumnie „W skrócie”. Nigdy w treści wpisu.",
  },
  {
    type: "string",
    name: "imageAlt",
    label: "Tekst alternatywny grafiki",
    ui: {
      validate: (value, values) =>
        values?.image && !value ? "Wpis z grafiką musi mieć tekst alternatywny." : undefined,
    },
  },
  {
    type: "rich-text",
    name: "body",
    label: "Treść",
    isBody: true,
    // Parser markdownowy zamiast domyślnego MDX – pliki są `.md`. Domyślne
    // escapowanie zostaje: Tina zapisze `A\&R` i `\[…]`, co renderuje się
    // tak samo, a wpisany w edytorze `_` czy `*` nie zamieni się w kursywę.
    parser: { type: "markdown" },
    // Korpus wpisu to tylko akapity, ##, ###, linki, pogrubienie i kursywa –
    // .prose-swiss nie styluje niczego więcej (patrz AGENTS.md).
    overrides: {
      toolbar: ["heading", "link", "bold", "italic"],
      headingLevels: ["h2", "h3"],
    },
  },
];

/**
 * Nazwa pliku `RRRR-MM-DD-<slug>.md`, jak dla wpisów pisanych ręcznie: data
 * dla `ls`, slug (z frazy głównej, a bez niej z tytułu) jako adres. Ustalana
 * raz, przy tworzeniu – opublikowanego sluga się nie zmienia.
 */
const postUi: Collection["ui"] = {
  filename: {
    showFirst: true,
    description: "RRRR-MM-DD-slug. Slug to adres wpisu – po publikacji go nie zmieniaj.",
    slugify: (values) =>
      `${warsawDay(values.date)}-${slugify(values.keyphrase || values.title || "")}`,
  },
};

const wiedza: Collection = {
  name: "wiedza",
  label: "Baza wiedzy",
  path: "src/content/wiedza",
  format: "md",
  ui: postUi,
  defaultItem: () => ({ draft: true, kind: "notatka", date: new Date().toISOString() }),
  fields: [
    ...headFields,
    {
      type: "string",
      name: "category",
      label: "Kategoria",
      required: true,
      options: [...CATEGORIES],
    },
    {
      type: "string",
      name: "kind",
      label: "Format",
      description: "Notatka: 300–500 słów, bez śródtytułów, dwie łamy. Przewodnik: 1200–2000, sekcje ## i FAQ.",
      required: true,
      options: [...KINDS],
    },
    ...tailFields,
  ],
};

const aktualnosci: Collection = {
  name: "aktualnosci",
  label: "Aktualności",
  path: "src/content/aktualnosci",
  format: "md",
  ui: postUi,
  defaultItem: () => ({ draft: true, date: new Date().toISOString() }),
  fields: [
    ...headFields,
    {
      type: "string",
      name: "kind",
      label: "Rodzaj",
      required: true,
      options: Object.entries(NEWS_KINDS).map(([value, label]) => ({ value, label })),
    },
    {
      type: "datetime",
      name: "eventDate",
      label: "Data wydarzenia",
      description: "Gdy wpis zapowiada albo relacjonuje wydarzenie – nie data publikacji.",
      ui: { dateFormat: "YYYY-MM-DD", timeFormat: false },
    },
    { type: "string", name: "place", label: "Miejsce", description: "Miasto albo sala." },
    ...tailFields,
  ],
};

export default defineConfig({
  branch,
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  // Grafiki wpisów leżą w src/assets, nie w public/ – tylko stamtąd Astro je
  // optymalizuje. Tina zapisuje ścieżkę `/blog/…` względem `publicFolder`,
  // a content.config.ts zamienia ją na ścieżkę względem wpisu.
  media: {
    tina: {
      publicFolder: "src/assets",
      mediaRoot: "blog",
    },
  },
  schema: {
    collections: [wiedza, aktualnosci],
  },
});
