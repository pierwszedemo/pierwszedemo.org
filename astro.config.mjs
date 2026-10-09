// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import tina from "@tinacms/astro/integration";
import { DATE_PREFIX, LAST_CONTENT_UPDATE, SITE_URL } from "./src/consts";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriHanging } from "./src/typography";
import { tableLabels, tableScroll } from "./src/table-scroll";
import { assetImages, figures } from "./src/images";

// Data rewizji każdego wpisu, czytana wprost z frontmattera. Kolekcji treści
// nie da się zaimportować w configu, a bez tego wszystkie adresy w sitemapie
// dostawały jedną globalną datę – czyli komunikat „cały serwis zmienił się
// tego samego dnia", który nie niesie żadnej informacji. Dwa katalogi, dwa
// prefiksy adresów – ta sama pętla.
const CONTENT_DIRS = {
  "/wiedza": "./src/content/wiedza",
  "/aktualnosci": "./src/content/aktualnosci",
};
// Wartość pola z frontmattera bez cudzysłowów – Tina zapisuje daty jako
// łańcuchy ISO i YAML może je wziąć w apostrofy.
/** @param {string} raw @param {string} key */
const frontmatter = (raw, key) =>
  raw.match(new RegExp(`^${key}:\\s*['"]?([^'"\\s]+)`, "m"))?.[1];
const entries = Object.entries(CONTENT_DIRS).flatMap(([prefix, dir]) =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ file, raw: readFileSync(`${dir}/${file}`, "utf8") }))
    // Szkic to `draft: true` (patrz content.config.ts) – bez adresu, więc ani
    // w sitemapie, ani w przekierowaniach.
    .filter(({ raw }) => frontmatter(raw, "draft") !== "true")
    .map(({ file, raw }) => {
      const slug = file.replace(/\.md$/, "").replace(DATE_PREFIX, "");
      return {
        slug,
        path: `${prefix}/${slug}`,
        date: file.match(DATE_PREFIX)?.[0].slice(0, 10) ?? "",
        lastmod:
          frontmatter(raw, "updated") ??
          frontmatter(raw, "date") ??
          LAST_CONTENT_UPDATE,
      };
    }),
);
const postLastmod = Object.fromEntries(
  entries.map((entry) => [entry.path, entry.lastmod]),
);

// Przekierowania ze starych adresów (serwis managera) na stronę fundacji.
// Tu, nie w public/_redirects: adapter Cloudflare dopisuje je do _redirects
// przy buildzie, więc wychodzą jako prawdziwe 301. Bez adaptera statyczny
// build Astro zrobiłby z nich strony z <meta refresh>.
//
// Stary /blog/ rozszedł się na dwa katalogi, więc każdy wpis sprzed przebudowy
// dostaje własną regułę. Bez wzorca /blog/[...slug]: adapter zapisuje go jako
// cel „/wiedza/*/index.html”, a ręcznej reguły w public/_redirects nie da się
// postawić za regułami per wpis (Cloudflare bierze pierwszą pasującą, adapter
// dopisuje swoje na końcu). Wpisy z późniejszą datą nigdy nie miały adresu
// pod /blog/, więc reguł dla nich nie ma.
const BLOG_RETIRED_ON = "2026-10-03";
/** @type {Record<string, { status: 301, destination: string }>} */
const redirects = {
  "/o-mnie": { status: 301, destination: "/fundacja" },
  "/manager-muzyczny": { status: 301, destination: "/fundacja" },
  "/blog": { status: 301, destination: "/wiedza" },
  ...Object.fromEntries(
    entries
      .filter((entry) => entry.date < BLOG_RETIRED_ON)
      .map((entry) => [
        `/blog/${entry.slug}`,
        { status: 301, destination: entry.path },
      ]),
  ),
};

export default defineConfig({
  site: SITE_URL,
  // Cały serwis to treść z repo — nic nie liczy się per request. Przy
  // `output: "server"` strona główna renderowała się na żądanie, a wtedy
  // <Image> nie optymalizuje przy buildzie, tylko wystawia adres do runtime'owego
  // endpointu /_image, którego na hostingu nie było → 404 na zdjęciu w hero.
  output: "static",
  trailingSlash: "never",
  redirects,
  // Adapter Cloudflare domyślnie włącza sesje w KV i dokłada binding SESSION
  // do konfiguracji workera. Statyczna strona nie ma czego w nich trzymać.
  session: false,
  adapter: cloudflare({
    // Domyślnie adapter optymalizuje obrazy przez binding Cloudflare Images
    // w runtime – czyli znowu adres /_image liczony na żądanie. „compile”
    // robi wszystko przy buildzie, jak dotąd.
    imageService: "compile",
    // Domyślnie prerender biegnie w workerd, a karty OG (src/og.ts) potrzebują
    // sharp i czytają TTF z dysku przez process.cwd() – w workerd nie ma ani
    // jednego, ani drugiego.
    prerenderEnvironment: "node",
  }),
  integrations: [
    // Edycja wizualna w /admin: middleware dla trasy /tina-island/[name]
    // i bridge.js podawany do iframe'a edytora. Strony zostają statyczne –
    // patrz src/islands.ts.
    tina(),
    sitemap({
      // Sitemapa jest listą stron. Kanał RSS, karty OG i llms.txt to zasoby
      // pomocnicze – w indeksie tylko rozmywają to, co ma trafić do wyników.
      filter: (page) => !/\.(png|xml|txt)$/.test(new URL(page).pathname),
      serialize(item) {
        // Astro dokleja ukośnik na końcu, `trailingSlash: "never"` go nie
        // zdejmuje w sitemapie – bez tego każdy adres w mapie przekierowuje.
        const url = new URL(item.url);
        if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
        item.url = url.href;
        item.lastmod = new Date(
          postLastmod[url.pathname] ?? LAST_CONTENT_UPDATE,
        ).toISOString();
        return item;
      },
    }),
  ],
  // `satteri()` bez opcji to i tak domyślny procesor Astro 7 – tu dostaje dwie
  // wtyczki więcej: spójniki (mdast) i wrapper przewijanej tabeli (hast).
  // Tytuły i leady nie idą przez markdown, więc tam funkcja od spójników jest
  // wołana wprost w szablonach wpisu i listy.
  markdown: {
    processor: satteri({
      mdastPlugins: [satteriHanging, assetImages],
      hastPlugins: [tableLabels, tableScroll, figures],
    }),
  },
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Archivo",
      cssVariable: "--font-archivo",
      weights: [400, 500, 600, 700],
      // `italic` jest tu dla kursywy w treści wpisu. Bez tego wariantu
      // przeglądarka pochyla Archivo syntetycznie – to skos nałożony na krój
      // prosty, nie prawdziwa kursywa. Przeglądarka pobiera tylko te pliki,
      // które faktycznie są użyte, więc wpis bez kursywy nic nie płaci.
      styles: ["normal", "italic"],
      subsets: ["latin", "latin-ext"], // latin-ext = polskie diakrytyki
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
});
