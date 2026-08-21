# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install       # bun.lock is the lockfile
bun run dev       # astro dev
bun run build     # astro build (also prerenders /blog/<slug>)
bun run preview   # astro preview
```

No test suite, no linter, no formatter. `@astrojs/check` is not a dependency, so
`bun run build` is the only gate in the repo – it is what validates the content
collection schema. Type checking otherwise comes from the editor
(`@typescript/native-preview` is a devDependency); `tsconfig.json` extends
`astro/tsconfigs/base`.

## Architecture

Astro 7, `output: "static"`, Vercel adapter, Tailwind v4 via the Vite plugin
(no `tailwind.config` – theme tokens live in `@theme` inside
`src/styles/global.css`). Polish-language site of an artist manager:
`/`, `/blog`, `/blog/<slug>`, `/polityka-prywatnosci`, `/404`.

The layout is a transcription of a Claude Design canvas project
(`380c6364-c5da-4baf-9ab9-c58a88637086`, file `Michal Miszczyszyn - Manager.dc.html`),
turn 2 – the "Swiss" direction: `2a` strona główna, `2b` lista wpisów,
`2c` pojedynczy wpis. The mock is a fixed 1280×800 absolutely-positioned card;
everything here is the responsive rebuild of it. When changing layout, compare
against that file – it is the spec.

### Two rule weights hold the grid together

Structural borders between major bands are `border-ink` (#101010). Borders
between cells *inside* a band are `border-hairline` (#e4e2dd). Mixing them up is
the fastest way to make the design stop looking like the design. Zero border
radius anywhere.

### `src/consts.ts` is the content database

Site metadata, nav, services, roster, socials and blog categories live here and
are imported by `astro.config.mjs`, `BaseLayout.astro` and the pages. `CATEGORIES`
feeds the zod enum in `src/content.config.ts`, so adding a category is one edit.

`LAST_CONTENT_UPDATE` must be bumped by hand – it drives JSON-LD `dateModified`
and sitemap `lastmod`.

The brand and the person are two constants, not one. `SITE_NAME` („Pierwsze
Demo") is the site: titles, `og:site_name`, RSS, the `WebSite` node.
`PERSON_NAME` („Michał Miszczyszyn") is the human: the `Person` node and the
caption under the hero photo. Collapsing them back into one name makes the
`Person` entity claim the site's name, which is the thing Google reads as the
author. The domain lives in `SITE_URL` alone – `SITE_HOST`, the schema.org
`@id`s, UTM `utm_source` and the OG card badge are all derived from it, so
never type the host anywhere else.

The e-mail address is only ever rendered through `src/components/EmailLink.astro`,
which wraps the `mailto:` in `<!--email_off-->` – the same convention as
olageppert.pl, so a change to how addresses are handled ports between the two
sites without a grep.

### Blog

Posts are markdown in `src/content/blog/`, loaded through a content collection
(`src/content.config.ts`) with a zod schema: `title`, `lead` (the "W skrócie"
column, doubling as the meta description), `category`, `kind`, `date`,
`updated?`, `keyphrase?`, `readingMinutes`, `spotifyTrackId?` (embeds a Spotify
player under the lead in the "W skrócie" column – a frontmatter field, never an
iframe in the body; the player loads without the consent banner on legitimate
interest, same convention as olageppert.pl, and has its row in `PRIVACY_TOOLS`). `src/blog.ts` owns sort order –
`getSortedPosts()` is the single source for both the list page and the prev/next
links, so they can't disagree.

`src/pages/blog/[...slug].astro` sets `prerender = true` and `getStaticPaths()`.
Redundant under `output: "static"`, kept as a guard: in server mode an on-demand
dynamic route cannot be enumerated by `@astrojs/sitemap` and the posts would
silently vanish from the sitemap.

**The site is fully static on purpose.** It was `output: "server"` (copied from
olageppert.pl) until a page rendered on demand made `<Image>` skip build-time
optimisation and emit a runtime `/_image?href=…` URL instead — an endpoint Vercel
does not serve, so the hero photo 404'd in production. Nothing here computes
per request; if that ever changes, prerender the pages that use `<Image>` or turn
on the adapter's `imageService`.

Two post formats, both markdown, distinguished by `kind`: `notatka` (300–500
words, no headings) and `przewodnik` (1200–2000 words, `##` sections plus an FAQ).
`kind` is not just an editorial label – it gates `lg:[column-count:2]` in
`[...slug].astro`. It looks like a redundant condition and is the readability of
every przewodnik: two columns taller than the viewport make the reader scroll to
the bottom of the page and back up for the second one. `readingMinutes` is
`max(2, round(words / 180))`, measured on the body only. `updated` (not `date`)
drives `dateModified`; `keyphrase` is what deduplicates topics across posts.

Body markdown is deliberately narrow – paragraphs, `##`, `###`, links, nothing
else. `.prose-swiss` styles only those, so a list or a table renders as unstyled
lines that Tailwind Preflight has already stripped of bullets and margins.
A pierwszedemo skill writes to these rules.

### SEO / structured data

`src/layouts/BaseLayout.astro` emits every page's `<head>` and a schema.org
`@graph`: a `Person` node (stable `PERSON_ID`), a `WebSite` node (`WEBSITE_ID`)
and a page node whose `@type` comes from the `schemaPageType` prop – `ProfilePage`
on the homepage (it gets `mainEntity`, the others get `about`), `CollectionPage`
on `/blog`, `WebPage` elsewhere. Pages contribute extra nodes via `extraJsonLd`:
`/blog` adds `Blog` + `ItemList`, a post adds `BlogPosting`, and both add
`BreadcrumbList`. Pages with `robots="noindex"` get no page node.

Breadcrumbs exist only in JSON-LD – the mock's grid has nowhere to put them
visually, but they give Google a path to render under the result instead of a
bare URL. `src/schema.ts` holds `breadcrumbJsonLd()` and `wordCount()`.

Canonical URLs have **no** trailing slash (`trailingSlash: "never"` in Astro,
`trailingSlash: false` + `cleanUrls` in `vercel.json`); the sitemap `serialize()`
hook strips the slash the Vercel adapter's build format adds.

Sitemap `lastmod` is **per URL**, not global. `astro.config.mjs` reads each post's
`updated`/`date` straight out of the frontmatter with a regex, because a content
collection cannot be imported from the config. Without that every URL claimed the
same revision date, which is the same as claiming nothing. The sitemap also
filters out `.png`/`.xml`/`.txt` routes – the OG cards, the feed and `llms.txt`
are resources, not pages.

### OG cards

`/og.png` (homepage) and `/og/<slug>.png` (posts) are drawn at build time by
`src/og.ts` – satori lays the card out and converts text to paths, sharp
rasterises. Two constraints are load-bearing:

- Fonts are vendored as **TTF** in `src/assets/fonts/`. Astro's Fonts API caches
  woff2, which satori cannot read; and handing plain SVG to sharp would render
  through librsvg, which resolves *system* fonts – Archivo exists on neither this
  machine nor the Vercel builder.
- Paths resolve from `process.cwd()`, never `import.meta.url`: Vite bundles the
  module into `dist/server/.prerender/chunks/`, where the TTFs are not.

Posts live under `/og/<slug>.png` rather than `/blog/<slug>/og.png` so they don't
collide with the `[...slug]` catch-all.

### Favicons

`scripts/generate-favicons.mjs` builds `favicon.svg`, the PNGs and a hand-assembled
multi-size `.ico` from one source. Run it by hand (`bun scripts/generate-favicons.mjs`),
not in the build — icons change once every few years and the output is committed.

The „PD" monogram is a **path baked from Archivo**, never `<text>`. The first
version used `<text font-family="Archivo, …">` and every raster came out as an
empty square: sharp rasterises SVG through librsvg, which resolves *system*
fonts. A visitor's browser rendering `favicon.svg` has the same problem. If you
restyle the icon, keep the glyph as an outline.

Two variants come out of the same monogram: `favicon.svg` and the ≥96 px PNGs
keep the mock's frame, the 16/32/48 px entries inside `.ico` drop it. Framed,
two letters at 16 px leave the stems below a pixel and „PD" smears into a grey
block — the frame is what has to go, not the second letter.

### Analytics & consent

Three tools, ported from olageppert.pl with the palette inverted (black on white):

- **Google Analytics 4** – the only one that sets cookies, so the only one behind
  the banner. Consent Mode v2 defaults (all `denied`) are inlined in `<head>`
  *before* `gtag.js`; `src/scripts/consent.ts` raises them after the user decides.
  `send_page_view: false` plus a manual `page_view` on `astro:page-load`, because
  `ClientRouter` navigations are not full page loads. The whole block is gated on
  `GA_ID` in `consts.ts` – blank it and no Google script loads at all.
- **Umami** and **Vercel Web Analytics** (`<Analytics />` from `@vercel/analytics/astro`)
  are cookieless, so ePrivacy art. 5(3) does not cover them and they sit outside
  the banner. Do **not** also set `webAnalytics` on the Vercel adapter – either
  route injects the script, both together inject it twice.

`ConsentManager.astro` re-attaches the banner node across View Transitions and
listens for `[data-cc-preferences]` (the footer „Cookies" cell and the button at
the bottom of the privacy policy). Bump `revision` in `consentConfig` when the
categories or wording change – it re-prompts everyone.

`PRIVACY_TOOLS` / `PRIVACY_SECTIONS` in `consts.ts` feed both `/polityka-prywatnosci`
and the wording inside the preferences panel. Adding a third-party script means
adding a row there too, or the policy becomes false.

### Styling conventions

Light Swiss look on `#ffffff`. Tokens in `@theme`: `--color-ink`, `--color-muted`,
`--color-body`, `--color-hairline`, `--color-panel`, plus a fluid type scale
(`--text-hero`, `--text-page`, `--text-post`, `--text-row`, `--text-roster`) whose
`clamp()` maxima are the mock's 1280 px values. Archivo (display + sans) and
IBM Plex Mono are self-hosted through Astro's Fonts API in `astro.config.mjs`;
both need the `latin-ext` subset for Polish diacritics.

Recurring micro-label pattern is the `label` utility in `global.css`
(mono, 12px, `0.2em` tracking, uppercase) – use it instead of respelling those
five utilities.

The global `:focus-visible` outline is inside `@layer base` on purpose: unlayered
rules beat Tailwind utilities, and the blog rows need to override the outline
colour to white on their inverted background.

Fixed pixel columns from the mock (the 400 px photo column, the 432 px title
indent) must not be applied below `lg` – at 768 px they overflow the viewport.
They are expressed as `clamp()`/`minmax()` or gated behind `lg:`.

## Conventions

- **Polish** for user-facing copy, code comments and commit messages. Commits are
  Conventional Commits with a Polish subject, e.g.
  `feat(blog): kolejność wpisów i linki prev/next`.
- Comments explain *why* a non-obvious choice was made (browser quirk, SEO rule,
  layout trap), not what the code does. Keep that bar.
- Skills live in `.agents/skills/`; `.claude/skills/` holds symlinks to them.
  `seo`, `accessibility` and `frontend-design` are vendored from GitHub and
  pinned in `skills-lock.json` – this project cares about all three.
  The pierwszedemo skills and `instagram-carousel` are this repo's own skills and
  are deliberately *not* in `skills-lock.json`: that file pins upstream skills
  by `computedHash`, and a locally authored one would fail every sync.
- `instagram-carousel` turns a published post into a 1080×1080 carousel
  (cover / 1–4 content slides / CTA) plus a caption, written to
  `instagram/<slug>/`. Its `scripts/generate.mjs` mirrors `src/og.ts`
  (satori + sharp, same palette and footer); it vendors its own
  `Archivo-Regular.ttf` because `src/assets/fonts/` holds only what the OG
  cards use. `instagram/` output is committed – it is the promotion history
  of a post.

## Not built yet

Cookie consent + analytics, an `/artysci` page if the roster grows past one
artist.

The homepage `<h1>` is the mono eyebrow „(Manager artystów – Gdańsk)", not the
slogan – the slogan carries no keywords and the h1 is the strongest on-page
signal. Visually nothing changed: the h1 stays a small label and „Kariera to
strategia." is still the largest text on the page, as a `<p>`. Don't "fix" this
back by promoting the slogan.

`src/assets/michal.jpg` is a phone snapshot, not a press portrait – it is what
the design's placeholder slot got filled with, and it is the obvious thing to
replace when a proper shot exists. Anything dropped in there must be
pre-rotated and metadata-stripped first (the original carried an EXIF
orientation tag and GPS coordinates).

The nav is four cells (marka / pusta / Blog / Kontakt) – the mock's "Artyści"
item was dropped but its cell stays, hidden below `md`, so the grid keeps the
mock's proportions. Outbound links to artists go through `withUtm()`.

The footer is exactly four cells (`© / LinkedIn / Instagram / Cookies`) and its
border logic is computed from cell index – adding a fifth entry to `SOCIALS`
breaks the 2×2 mobile layout, so rework `Footer.astro` rather than pushing one
more item in. The city used to hold the fourth cell; it lost it to „Cookies",
because withdrawing consent has to be as easy as giving it and Gdańsk is already
in the hero eyebrow.
