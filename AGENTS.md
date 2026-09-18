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
`/`, `/o-mnie`, `/manager-muzyczny`, `/blog`, `/blog/<slug>`, `/polityka-prywatnosci`,
`/404`.

The layout is a transcription of a Claude Design canvas project
(`380c6364-c5da-4baf-9ab9-c58a88637086`, file `Michal Miszczyszyn - Manager.dc.html`),
turn 2 – the "Swiss" direction: `2a` strona główna, `2b` lista wpisów,
`2c` pojedynczy wpis. The mock is a fixed 1280×800 absolutely-positioned card;
everything here is the responsive rebuild of it. When changing layout, compare
against that file – it is the spec.

### One 16-column grid

The mock is 1280 px wide and every measure in it is a multiple of 80 px, so the
site runs on 16 modules: `--col: 6.25cqw` in `global.css`, with `<main>` as the
container. `cqw` and not `%`/`vw`: a percentage inside a nested grid resolves
against the parent, and `vw` includes the scrollbar gutter, so only `cqw` gives
the same module at every nesting depth. The container is `<main>`, never
`<body>` – `container-type` implies layout containment, which would turn body
into the containing block for the fixed cookie banner. Nav, footer and the
post's prev/next bar sit outside `<main>`; they are full-width bands, so `fr`
and `%` are exact there.

Vertical lines may only fall on **5, 8 and 11**:

- `--aside` = 5 modules (the mock's 400 px) is the one side column – photo on
  `/` and `/o-mnie`, section labels on `/manager-muzyczny` and the privacy
  policy, „W skrócie" on a post. Use `grid-aside-left` / `grid-aside-right`,
  never a width typed in place; that is how a 400 px photo column and a 320 px
  nav cell ended up 80 px apart on the same page.
- Nav and footer are `5fr 3fr 3fr 5fr`, not four equal cells, so their outer
  dividers continue down the page as the aside line – on the left or the right.
- Line 8 is the page middle: roster/contact on `/`, label/body on `/o-mnie`,
  title/description in the lists on `/manager-muzyczny`.
- Blog list rows are 5 / 7 / 3 / 1, the post meta bar 5 / 6 / 5.

Four modules would be a tidy quarter, but 320 px minus the column padding is
256 px and the Spotify player needs 280. For the same reason the post's aside
has a floor (`--post-aside: max(21.5rem + 1px, --aside)`): below ~1100 px the
player wins over the grid. Text starts 2 rem (2.5 rem in body columns) after
its line – title, pullquote and list titles all share that axis.

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

Posts are markdown in `src/content/blog/`, named `YYYY-MM-DD-<slug>.md` so the
directory lists chronologically. The date prefix is **not** part of the URL:
`generateId` in `content.config.ts` strips it (`DATE_PREFIX` in `consts.ts`,
shared with the sitemap `lastmod` map in `astro.config.mjs`), so `post.id` is
the bare slug. Drafts are `_YYYY-MM-DD-<slug>.md`. Posts are loaded through a content collection
(`src/content.config.ts`) with a zod schema: `title`, `lead` (the "W skrócie"
column, doubling as the meta description), `category`, `kind`, `date`,
`updated?`, `keyphrase?`, `readingMinutes`, `spotifyTrackId?` (embeds a Spotify
player under the lead in the "W skrócie" column – a frontmatter field, never an
iframe in the body; the player loads without the consent banner on legitimate
interest, same convention as olageppert.pl, and has its row in `PRIVACY_TOOLS`).
`image?` + `imageAlt?` put a picture in the same slot, under the lead – again a
frontmatter field (path relative to the post, `../../assets/blog/…`), never
`![]()` in the body: `.prose-swiss` styles no `img`, and a notatka renders in two
columns, which would tear an inline image at the column break. `imageAlt` is
enforced by a zod refine whenever `image` is set. `src/blog.ts` owns sort order –
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

`public/bimi.svg` (BIMI logo for DMARC) comes out of the same script: SVG Tiny PS
(`version="1.2"`, `baseProfile="tiny-ps"`, `<title>` first, no `x`/`y` on the
root, no scripts/styles/images/external refs – validators reject each of these).
Mail clients crop it to a circle, so the ring sits inside the edge; never hand
it a transparent background. Referenced from the DNS `default._bimi` TXT record,
which is outside the repo.

Monogram padding is counted from the frame's *inner* edge (`FRAME + GAP`), not
the viewBox — the stroke sits at x=2 with width 4, so a padding equal to the
frame thickness puts the letters flush against it.

### Social assets (`assets/`)

Files uploaded by hand to Facebook/Instagram, not served by the site – hence
outside `public/`. `generate-favicons.mjs` also writes `assets/profile-1080.png`:
the monogram in a **circular** ring (platforms show the profile picture as a
circle, so a square frame would lose its corners) with a wider margin than the
icons. `scripts/generate-social.mjs` (`bun scripts/generate-social.mjs`) writes
`assets/facebook-cover-1640x856.png` through `renderOgCard()` – `src/og.ts`
takes `width`/`height`/`paddingX` for that. Facebook shows two crops of one
cover: desktop the centre 1640×624 band, mobile the centre ~1522×856 column, so
the card is drawn at 1640×624 with 200 px side margins and padded to 856 with
white bands – desktop gets the card pixel-for-pixel, mobile the same card with
breathing room.

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

The mock's fixed pixel columns (the 400 px photo column, the 432 px title
indent) are never typed as pixels – they are multiples of the grid module below.

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
- `instagram-carousel` turns a published post into Instagram graphics: a
  1080×1350 (4:5) carousel (cover / 1–4 content slides / CTA) or one of three
  single-post formats (`mit` / `zapisz` / `pytanie` / `liczba`) whose layouts deliberately
  differ from the carousel so the feed does not blur into one wall of white
  cards. Every post gets its own directory `instagram/YYYY-MM-DD-<slug>-<type>/`
  (`type` = `karuzela` | `mit` | `zapisz` | `pytanie` | `liczba`) holding the same four
  things: `spec.json`, `NN.png`, `alt.txt` (one line of alt text per slide,
  derived from the spec) and `caption.txt`. The date prefix is copied from the
  post filename, so `ls instagram/` lists in the same order as the posts.
  A leading `_` means the same as on a blog post: not published yet. The
  scripts write fresh output to `_…` and the user drops the underscore by hand
  once the post is up, so `ls instagram/` doubles as the queue; an existing
  bare directory is reused on regeneration so a posted post never gets a
  duplicate next to it.
  `scripts/lib.mjs` holds the shared frame and mirrors `src/og.ts` (satori +
  sharp, same palette and footer); `generate.mjs` draws the carousel,
  `format.mjs` the single formats. The skill vendors its own
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

The nav is four cells (marka / Współpraca / O mnie / Blog), same count as the
mock, on 5/3/3/5 tracks (see the 16-column grid above). There is no Kontakt
cell; the address is shown verbatim in the „Kontakt" sections of `/`, `/o-mnie`
and `/manager-muzyczny` instead. `Nav.astro` lays out 2×2 on mobile with borders
computed from the item index – a fourth entry in `NAV` means reworking it.
Outbound links to artists go through `withUtm()`.

### Keyword positioning (2026-08-27)

Target phrases: „manager muzyczny", „manager artystów", „menedżer/menadżer
muzyczny". Each page owns one form and one intent, so they don't cannibalise:
the homepage is the entity (name + `SITE_TAGLINE` „Manager muzyczny" in h1 and
`<title>`), `/manager-muzyczny` is the commercial intent (title „Współpraca z
managerem muzycznym…", h1 „Manager muzyczny dla artystów alternatywnych", FAQ
carries „menedżer/menadżer" and „ile kosztuje"), `/o-mnie` is the biography
(no job title in `<title>` – it used to share the homepage title and dropped
out of the name query; body uses the Polish spelling „menedżer muzyczny").
`SERVICES` labels carry the industry word („Wydawnictwa muzyczne", „Booking
koncertowy") because they land in h3s, `OfferCatalog` and `llms.txt`; the
catalog is one node (`OFFER_CATALOG_ID`, `offerCatalogJsonLd()` in
`src/schema.ts`) referenced by both `Person` and `Service`. Say „muzycy i
zespoły", not „artyści", where the copy allows – „artysta" alone reads as a
painter to a search engine.

The footer is exactly four cells (`© / LinkedIn / Instagram / Cookies`) and its
border logic is computed from cell index – adding a fifth entry to `SOCIALS`
breaks the 2×2 mobile layout, so rework `Footer.astro` rather than pushing one
more item in. The city used to hold the fourth cell; it lost it to „Cookies",
because withdrawing consent has to be as easy as giving it and Gdańsk is already
in the hero eyebrow.
