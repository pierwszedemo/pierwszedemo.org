// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { DATE_PREFIX, LAST_CONTENT_UPDATE, SITE_URL } from "./src/consts";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriHanging } from "./src/typography";
import { tableLabels, tableScroll } from "./src/table-scroll";

// Data rewizji każdego wpisu, czytana wprost z frontmattera. Kolekcji treści
// nie da się zaimportować w configu, a bez tego wszystkie adresy w sitemapie
// dostawały jedną globalną datę – czyli komunikat „cały serwis zmienił się
// tego samego dnia", który nie niesie żadnej informacji.
const BLOG_DIR = "./src/content/blog";
const postLastmod = Object.fromEntries(
  readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = readFileSync(`${BLOG_DIR}/${file}`, "utf8");
      const updated = raw.match(/^updated:\s*(\S+)/m)?.[1];
      const published = raw.match(/^date:\s*(\S+)/m)?.[1];
      return [
        `/blog/${file.replace(/\.md$/, "").replace(DATE_PREFIX, "")}`,
        updated ?? published ?? LAST_CONTENT_UPDATE,
      ];
    }),
);

export default defineConfig({
  site: SITE_URL,
  // Cały serwis to treść z repo — nic nie liczy się per request. Przy
  // `output: "server"` strona główna renderowała się na żądanie, a wtedy
  // <Image> nie optymalizuje przy buildzie, tylko wystawia adres do runtime'owego
  // endpointu /_image, którego na Vercelu nie ma → 404 na zdjęciu w hero.
  output: "static",
  trailingSlash: "never",
  // Bez `webAnalytics` w adapterze – skrypt wstrzykuje komponent <Analytics />
  // z @vercel/analytics w BaseLayout. Obie drogi naraz wstawiłyby go dwa razy.
  adapter: vercel(),
  integrations: [
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
      mdastPlugins: [satteriHanging],
      hastPlugins: [tableLabels, tableScroll],
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
