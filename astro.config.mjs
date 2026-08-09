// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { LAST_CONTENT_UPDATE, SITE_URL } from "./src/consts";

export default defineConfig({
  site: SITE_URL,
  output: "server",
  trailingSlash: "never",
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [
    sitemap({
      serialize(item) {
        // Astro dokleja ukośnik na końcu, `trailingSlash: "never"` go nie
        // zdejmuje w sitemapie — bez tego każdy adres w mapie przekierowuje.
        const url = new URL(item.url);
        if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
        item.url = url.href;
        item.lastmod = new Date(LAST_CONTENT_UPDATE).toISOString();
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Archivo",
      cssVariable: "--font-archivo",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
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
