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
    type: "boolean",
    name: "unlisted",
    label: "Ukryty na listach",
    description: "Wpis ma adres i jest w sitemapie, ale nie ma go na listach, stronie głównej, w RSS ani llms.txt. Link do niego trzeba podać samemu.",
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
    // Korpus wpisu to akapity, ##, ###, linki, pogrubienie, kursywa, listy,
    // tabele, cytaty i obrazki – .prose-swiss nie styluje niczego więcej
    // (patrz AGENTS.md). Obrazek idzie przez media manager do src/assets/blog,
    // a pole „Caption” zostaje podpisem pod nim (src/images.ts).
    overrides: {
      toolbar: ["heading", "link", "bold", "italic", "ul", "ol", "quote", "table", "image"],
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

/**
 * Pojedyncze dokumenty JSON w src/content/strony – teksty, które wcześniej
 * siedziały w consts.ts i index.astro. consts.ts importuje te pliki, więc
 * JSON-LD, llms.txt i stopka czytają to samo, co strona. Edytor może zmieniać
 * treść, ale nie dodawać ani usuwać dokumentów: pola kodowe (id, schemaId,
 * zdjęcia) są w consts.ts.
 */
const singleton = (
  name: string,
  label: string,
  file: string,
  // Strona, którą edytor otwiera w podglądzie obok formularza – z wyspami
  // edycji wizualnej (src/islands.ts) zmiany widać na niej od razu.
  preview: string,
  fields: TinaField[],
): Collection => ({
  name,
  label,
  path: "src/content/strony",
  format: "json",
  match: { include: file },
  ui: { allowedActions: { create: false, delete: false }, router: () => preview },
  fields,
});

const paragraphs = (name: string, label: string, description?: string): TinaField => ({
  type: "string",
  name,
  label,
  description,
  required: true,
  ui: { component: "textarea" },
});

/**
 * Lista akapitów – każdy we własnym polu tekstowym. `ui.component` przy
 * `list: true` podmienia cały widżet listy (schema-tools rozkłada `ui` na
 * `{ component: "list", field: { component: "text" } }`), więc samo
 * `component: "textarea"` dawało jedno pole na całą tablicę. Widżet
 * pojedynczego elementu ustawia się przez `ui.field`, a lista zostaje listą.
 */
// Typy `ui` dla listy nie znają `field`, choć schema-tools go przekazuje dalej.
const paragraphList = (name: string, label: string, description?: string) =>
  ({
    type: "string",
    name,
    label,
    description,
    list: true,
    ui: { component: "list", field: { component: "textarea" } },
  }) as unknown as TinaField;

const person = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "string", name: "name", label: "Imię i nazwisko w treści", required: true },
    { type: "string", name: "fullName", label: "Imię i nazwisko jak w KRS", required: true },
    { type: "string", name: "role", label: "Funkcja w Zarządzie", required: true },
    { type: "string", name: "jobTitle", label: "Zawód", required: true },
    { type: "string", name: "email", label: "E-mail", required: true },
    { type: "string", name: "href", label: "Strona własna (pełny adres)", required: true },
    paragraphList(
      "bio",
      "Bio – akapity",
      "Pierwszy akapit idzie też do opisu osoby w danych dla Google.",
    ),
  ],
});

const stronaGlowna = singleton("stronaGlowna", "Strona główna", "strona-glowna", "/", [
  paragraphs(
    "slogan",
    "Slogan",
    "Największy tekst na stronie. Nowa linia = złamanie wiersza na szerokim ekranie.",
  ),
  paragraphs("intro", "Akapit pod sloganem"),
  {
    type: "object",
    name: "teraz",
    label: "Panel „Teraz”",
    description: "Projekty fundacji. Wydawnictwa fundatorów tu nie trafiają – patrz zasady w AGENTS.md.",
    list: true,
    ui: { itemProps: (item) => ({ label: item?.name }) },
    fields: [
      { type: "string", name: "name", label: "Nazwa", required: true },
      { type: "string", name: "meta", label: "Podpis", required: true },
      {
        type: "string",
        name: "href",
        label: "Link",
        description: "Ścieżka na stronie (/wiedza) albo pełny adres – zewnętrzne dostają UTM-y.",
        required: true,
      },
    ],
  },
  paragraphs("contact", "Tekst w sekcji „Kontakt”"),
]);

const fundacja = singleton("fundacja", "Strona Fundacja", "fundacja", "/fundacja", [
  {
    type: "string",
    name: "heading",
    label: "Nagłówek (h1)",
    description: "Największy tekst na /fundacja.",
    required: true,
  },
  { type: "string", name: "tagline", label: "Podtytuł obok nagłówka", required: true },
  paragraphs(
    "missionLead",
    "Misja – pierwszy akapit (pogrubiony)",
    "Najważniejsze zdanie o fundacji – czyta je ten, kto nie przeczyta reszty.",
  ),
  paragraphList("mission", "Misja – kolejne akapity"),
]);

const fundatorzy = singleton("fundatorzy", "Fundatorzy i Zarząd", "fundatorzy", "/fundacja", [
  person("michal", "Michał"),
  person("ola", "Ola"),
]);

const dzialania = singleton("dzialania", "Działania", "dzialania", "/fundacja", [
  {
    type: "object",
    name: "activities",
    label: "Działania",
    description: "Kolejność = numeracja (01, 02…) na stronie głównej i /fundacja.",
    list: true,
    ui: { itemProps: (item) => ({ label: item?.label }) },
    fields: [
      {
        type: "string",
        name: "id",
        label: "Kotwica",
        description: "Adres sekcji: /fundacja#<kotwica>. Po publikacji nie zmieniaj – linkują do niej hero i llms.txt.",
        required: true,
      },
      { type: "string", name: "label", label: "Nazwa", required: true },
      paragraphs("description", "Opis"),
      { type: "string", name: "href", label: "Link (opcjonalny)" },
      { type: "string", name: "linkLabel", label: "Tekst linku" },
    ],
  },
]);

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
    collections: [wiedza, aktualnosci, stronaGlowna, fundacja, fundatorzy, dzialania],
  },
});
