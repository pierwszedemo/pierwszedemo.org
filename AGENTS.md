# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install       # bun.lock is the lockfile
bun run dev       # tinacms dev + astro dev; the CMS is at /admin/index.html, editing local files
bun run build     # tinacms build + astro build (needs PUBLIC_TINA_CLIENT_ID and TINA_TOKEN)
bun run build:local  # the same without TinaCloud – for a build on a machine without the keys
bun run preview   # astro preview
bun run deploy    # astro build + wrangler deploy (Workers Builds does the same on push)
```

No test suite, no linter, no formatter. `@astrojs/check` is not a dependency, so
`bun run build` is the only gate in the repo – it is what validates the content
collection schema. Type checking otherwise comes from the editor
(`@typescript/native-preview` is a devDependency); `tsconfig.json` extends
`astro/tsconfigs/base`.

## Architecture

Astro 7, `output: "static"`, Cloudflare adapter (Workers static assets), Tailwind v4 via the Vite plugin
(no `tailwind.config` – theme tokens live in `@theme` inside
`src/styles/global.css`). Polish-language site of **Fundacja Pierwsze Demo**,
a foundation supporting young musicians (converted in October 2026 from the
site of an artist manager): `/`, `/fundacja` (one long page: mission, goals,
activities, founders, registry data, documents), `/wiedza` + `/wiedza/<slug>`
(knowledge base), `/aktualnosci` + `/aktualnosci/<slug>` (news), `/wesprzyj`,
`/statut`, `/deklaracja-dostepnosci`, `/dzwieki-efemeryczne`,
`/polityka-prywatnosci`, `/404`. Old manager-era URLs (`/o-mnie`,
`/manager-muzyczny`, `/blog`, `/blog/<slug>`) are 301s defined in
`astro.config.mjs` (`redirects`), **not** in `public/_redirects` – the adapter
appends Astro's redirects to `dist/client/_redirects`, and Cloudflare applies
the first matching line, so a hand-written rule would land above them. That
is also why there is no `/blog/*` wildcard: the adapter writes a dynamic
redirect's target as `/wiedza/*/index.html`, so every post dated before
`BLOG_RETIRED_ON` gets its own rule instead. The domain is
`pierwszedemo.org`; the old `.com` redirects at the DNS/Cloudflare level,
outside the repo.

The foundation is not yet in KRS. `FOUNDATION.krs/nip/regon/iban` in
`consts.ts` are empty strings and every page renders `REGISTRY_PENDING`
through `registryValue()` instead; filling them in is the only change needed
after registration (footer, `/fundacja`, `/wesprzyj`, privacy policy, JSON-LD
and `llms.txt` all read that object). Launch to production waits for the KRS
entry.

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

- `--aside` = 5 modules (the mock's 400 px) is the one side column – the
  „Teraz" panel on `/`, founders' photos and section labels on `/fundacja`,
  `/wesprzyj` and the privacy policy, „W skrócie" on a post. Use `grid-aside-left` / `grid-aside-right`,
  never a width typed in place; that is how a 400 px photo column and a 320 px
  nav cell ended up 80 px apart on the same page.
- Nav and footer are `5fr 3fr 3fr 5fr`, not four equal cells, so their outer
  dividers continue down the page as the aside line – on the left or the right.
- Line 8 is the page middle: news/contact on `/`, title/description in the
  lists on `/fundacja` and `/wesprzyj`.
- The post meta bar is 5 / 6 / 5.
- **Exception:** blog list rows keep the mock's content-sized tracks
  (`150px 1fr 190px 70px`). A row is a list item, not a band with a side column;
  on 5 / 7 / 3 / 1 the date sat in 400 px of emptiness and the title lost a
  third of its width. The rows have no vertical rules, so nothing visibly
  misses a line.

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

Site metadata, nav, the foundation's registry data (`FOUNDATION`), founders
(`FOUNDERS`, with bios), statutory goals (`GOALS`, § 5 of the statute
verbatim), programmes (`ACTIVITIES`), current projects (`PROJECTS`), socials,
knowledge-base categories and news kinds (`NEWS_KINDS`) live here and are
imported by `astro.config.mjs`, `BaseLayout.astro` and the pages. `CATEGORIES`
and `NEWS_KINDS` feed the zod enums in `src/content.config.ts`, so adding one
is one edit.

`LAST_CONTENT_UPDATE` must be bumped by hand – it drives JSON-LD `dateModified`
and sitemap `lastmod`.

The organisation and the people are separate entities. `SITE_NAME` („Fundacja
Pierwsze Demo") is the site and the `NGO` node (`ORGANIZATION_ID`): titles,
`og:site_name`, RSS, `WebSite.publisher`. Each founder has a `Person` node
(`PERSON_ID` for Michał, `OLA_ID` for Ola) built from `FOUNDERS`; posts have
`author` = Michał and `publisher` = the foundation, because Google reads an
organisation as author badly. The domain lives in `SITE_URL` alone – `SITE_HOST`, the schema.org
`@id`s, UTM `utm_source` and the OG card badge are all derived from it, so
never type the host anywhere else.

The e-mail address is only ever rendered through `src/components/EmailLink.astro`,
which wraps the `mailto:` in `<!--email_off-->` – the same convention as
olageppert.pl, so a change to how addresses are handled ports between the two
sites without a grep.

### Content: knowledge base and news

Two collections, not one with a „section" field: `wiedza` (evergreen guides,
one chronological list like news – category is the row label, grouping by
category put older posts above newer ones) and
`aktualnosci` (chronological stream; `kind` = `wydarzenie | relacja | rozmowa
| opinia | ogloszenie | sprawozdanie`, optional `eventDate` and `place`). Two
directories are the two Tina collections (see „TinaCMS” below), so keep the
frontmatter flat. `src/content.config.ts` shares
the base schema between them. Both post pages are thin wrappers around
`src/layouts/ArticleLayout.astro`; the markdown styles live in
`src/styles/prose.css` (also used by `/statut`, rendered from
`src/documents/statut.md`). A single `/rss.xml` and `/og/<slug>.png` serve
both collections – slugs share one namespace, and a collision would fail the
build with a duplicate route.

Posts are markdown in `src/content/wiedza/` or `src/content/aktualnosci/`,
named `YYYY-MM-DD-<slug>.md` so the directory lists chronologically. The date prefix is **not** part of the URL:
`generateId` in `content.config.ts` strips it (`DATE_PREFIX` in `consts.ts`,
shared with the sitemap `lastmod` map in `astro.config.mjs`), so `post.id` is
the bare slug. Drafts are `draft: true` in the frontmatter – they stay in the
collection and `collections.ts` drops them, so a draft has no URL and is in no
list, sitemap, RSS or llms.txt (`astro.config.mjs` skips them by the same
field). They used to be `_`-prefixed files, but Tina cannot rename a file, so
publishing from the CMS would have been impossible. Posts are loaded through the content collections
(`src/content.config.ts`) with a zod schema: `title`, `lead` (the "W skrócie"
column, doubling as the meta description), `category` (wiedza only), `kind`, `date`,
`updated?`, `keyphrase?`, `draft`, `spotifyTrackId?` (embeds a Spotify
player under the lead in the "W skrócie" column – a frontmatter field, never an
iframe in the body; the player loads without the consent banner on legitimate
interest, same convention as olageppert.pl, and has its row in `PRIVACY_TOOLS`).
`image?` + `imageAlt?` put a picture in the same slot, under the lead – again a
frontmatter field (`/blog/…`, relative to `src/assets` – the way Tina's media
manager writes it; a zod preprocess turns it into `../../assets/blog/…` for
`image()`, which resolves relative to the post), never
`![]()` in the body: `.prose-swiss` styles no `img`, and a notatka renders in two
columns, which would tear an inline image at the column break. `imageAlt` is
enforced by a zod refine whenever `image` is set. `src/collections.ts` owns sort order –
`getSortedArticles()` / `getSortedNews()` are the single source for the lists,
prev/next links, RSS, llms.txt and OG cards, so they can't disagree.

`src/pages/wiedza/[...slug].astro` and `src/pages/aktualnosci/[...slug].astro` set `prerender = true` and `getStaticPaths()`.
Redundant under `output: "static"`, kept as a guard: in server mode an on-demand
dynamic route cannot be enumerated by `@astrojs/sitemap` and the posts would
silently vanish from the sitemap.

**The site is fully static on purpose.** It was `output: "server"` (copied from
olageppert.pl) until a page rendered on demand made `<Image>` skip build-time
optimisation and emit a runtime `/_image?href=…` URL instead — an endpoint the host (Vercel
back then) did not serve, so the hero photo 404'd in production. Nothing here
computes per request. The Cloudflare adapter is configured to keep it that way:
`imageService: "compile"` (its default, `cloudflare-binding`, transforms images
at runtime through Cloudflare Images), `prerenderEnvironment: "node"` (the
default `workerd` has neither sharp nor the filesystem `src/og.ts` reads TTFs
from) and `session: false` (otherwise the adapter adds a `SESSION` KV binding
a static site has no use for).

Two knowledge-base formats, both markdown, distinguished by `kind`: `notatka` (300–500
words, no headings) and `przewodnik` (1200–2000 words, `##` sections plus an FAQ).
`kind` is not just an editorial label – it gates `lg:[column-count:2]` (passed
as `twoColumns` to `ArticleLayout`; news uses `readingMinutes(entry) <= 4` and never
for `rozmowa`). It looks like a redundant condition and is the readability of
every przewodnik: two columns taller than the viewport make the reader scroll to
the bottom of the page and back up for the second one. Reading time is not
in the frontmatter: `readingMinutes()` in `collections.ts` computes
`max(2, round(words / 180))` from the body at build time, so it cannot drift
after an edit and nobody has to count words before saving in Tina.

Dates go through `calendarDate` in `content.config.ts`: Tina saves a
`datetime` as an instant in UTC, so 4 October picked in Poland arrives as
`2026-10-03T22:00:00.000Z`, and everything downstream reads dates in UTC.
Anything that is not UTC midnight is reduced to its Europe/Warsaw day. `updated` (not `date`)
drives `dateModified`; `keyphrase` is what deduplicates topics across posts.

Body markdown is deliberately narrow – paragraphs, `##`, `###`, links, nothing
else. `.prose-swiss` styles only those, so a list or a table renders as unstyled
lines that Tailwind Preflight has already stripped of bullets and margins.
`.claude/skills/blog-post-factory/` is the skill that writes to these rules.

### TinaCMS

Tina edits the markdown in place and commits to the repo through **TinaCloud**
(auth + content index; keys `PUBLIC_TINA_CLIENT_ID` / `TINA_TOKEN` in `.env`
and in the Workers Builds settings). It is only an editor: the site still
renders through Astro content collections, the zod schema and the satteri
plugins – Tina's own data layer and `TinaMarkdown` are not used for pages.
`tina/config.ts` mirrors `base()` from `content.config.ts` field for field;
change one, change the other (zod is what the build enforces). `/admin` is
built by `tinacms build` into `public/admin` (gitignored) and served as static
files; React exists only there.

- Body: `parser: { type: "markdown" }`, toolbar cut to heading/link/bold/italic,
  headings to h2/h3 – the same narrow markdown as the rule below. Default
  escaping stays on, so a Tina save writes `A\&R`, `*x*` for `_x_` and `*` list
  bullets; it renders identically. The first save of a hand-written file
  rewrites its frontmatter (quoted strings, ISO dates) – a one-off diff.
- File name comes from `ui.filename.slugify`: `YYYY-MM-DD-<slug>` from `date`
  and `keyphrase` (or the title). Set once, at creation. New documents start
  as `draft: true`.
- Media: `publicFolder: "src/assets"`, `mediaRoot: "blog"` – uploads land
  where Astro optimises them, never in `public/`.
- `astro dev` backgrounds itself when there is no TTY (an agent's shell), and
  `tinacms dev -c` then sees its child exit and shuts down. In a terminal it
  runs in the foreground and works.

### SEO / structured data

`src/layouts/BaseLayout.astro` emits every page's `<head>` and a schema.org
`@graph`: a `Person` node (stable `PERSON_ID`), a `WebSite` node (`WEBSITE_ID`)
and a page node whose `@type` comes from the `schemaPageType` prop – `ProfilePage`
on the homepage (it gets `mainEntity` = the NGO, the others get `about`), `CollectionPage`
on `/wiedza` and `/aktualnosci`, `WebPage` elsewhere. Pages contribute extra nodes via `extraJsonLd`:
the lists add `Blog` + `ItemList`, a post adds `BlogPosting`, and all add
`BreadcrumbList`. Pages with `robots="noindex"` get no page node.

Breadcrumbs exist only in JSON-LD – the mock's grid has nowhere to put them
visually, but they give Google a path to render under the result instead of a
bare URL. `src/schema.ts` holds `breadcrumbJsonLd()`, `isoDateTime()` and `wordCount()`.

Canonical URLs have **no** trailing slash (`trailingSlash: "never"` in Astro,
`assets.html_handling: "drop-trailing-slash"` in `wrangler.jsonc`, which serves
`/fundacja/index.html` at `/fundacja` and sends `/fundacja/` there with a 307);
the sitemap `serialize()` hook strips the slash Astro's directory build format
adds.

Sitemap `lastmod` is **per URL**, not global. `astro.config.mjs` reads each post's
`updated`/`date` straight out of the frontmatter with a regex (both content
directories, `CONTENT_DIRS`), because a content collection cannot be imported
from the config; the same scan builds the per-post `/blog/<slug>` redirects. Without that every URL claimed the
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
  machine nor the Cloudflare builder.
- Paths resolve from `process.cwd()`, never `import.meta.url`: Vite bundles the
  module into `dist/server/.prerender/chunks/`, where the TTFs are not.

Posts live under `/og/<slug>.png` rather than `/wiedza/<slug>/og.png` so they don't
collide with the `[...slug]` catch-all. The eyebrow is the foundation's name,
not a person's.

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
- **Umami** and **Cloudflare Web Analytics** (the beacon in `BaseLayout.astro`,
  gated on `CF_BEACON_TOKEN`, `spa: true` for `ClientRouter` navigations) are
  cookieless, so ePrivacy art. 5(3) does not cover them and they sit outside
  the banner. Do **not** also turn on automatic injection in the Cloudflare
  dashboard – the beacon would load twice, and a script the repo does not show
  is one the privacy policy forgets.

`ConsentManager.astro` re-attaches the banner node across View Transitions and
listens for `[data-cc-preferences]` (the footer „Cookies" cell and the button at
the bottom of the privacy policy). Bump `revision` in `consentConfig` when the
categories or wording change – it re-prompts everyone.

`PRIVACY_TOOLS` / `PRIVACY_SECTIONS` in `consts.ts` feed both `/polityka-prywatnosci`
and the wording inside the preferences panel. Adding a third-party script means
adding a row there too, or the policy becomes false. The data controller is the
foundation (`FOUNDATION`), from day one – there is no JDG-era variant.

`/wesprzyj` has no form and no payment gateway on purpose: a bank transfer is
not a „zbiórka publiczna" and needs no registration, while a form would add an
art. 13 GDPR clause and a `PRIVACY_TOOLS` row. `/deklaracja-dostepnosci` exists
before the law requires it – the first municipal grant makes it mandatory.

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
  `blog-post-factory` and `instagram-carousel` are this repo's own skills and
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
  A leading `_` means: not posted on Instagram yet. The
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

Annual reports (the first, for 2026, is due in 2027 – `/fundacja#sprawozdania`
already has the slot and the sentence), a grant-logo band („Dofinansowano ze
środków…" is mandatory on the site from the day a MKiDN or city grant is
signed), visual editing of the homepage and `/fundacja` (`@tinacms/astro`
islands), a new visual design (the current
Swiss layout was kept on purpose for the conversion).

The homepage `<h1>` is the mono eyebrow „(Fundacja Pierwsze Demo – Wsparcie
młodych twórców muzycznych – Gdańsk)", not the slogan – the slogan carries no
keywords and the h1 is the strongest on-page signal. Visually nothing changed:
the h1 stays a small label and „Pierwsze demo to początek." is still the
largest text on the page, as a `<p>`. Don't "fix" this back by promoting the
slogan.

`src/assets/michal.jpg` is a phone snapshot and
`src/assets/dzwieki-efemeryczne/ola-geppert.jpg` a 670 px stage shot – both
fill the founders' slots on `/fundacja` until proper portraits exist. Anything
dropped in there must be pre-rotated and metadata-stripped first (the original
carried an EXIF orientation tag and GPS coordinates). `HeroPhoto.astro` takes
`src`/`alt`/`caption` props and clips `widths` to the source size, because
Astro refuses to upscale.

The nav is four cells (marka / Fundacja / Wiedza / Aktualności), same count as
the mock, on 5/3/3/5 tracks (see the 16-column grid above). „Wesprzyj" is
deliberately not a nav item: it is the `SupportBand.astro` band above the
footer on the pages that make sense as a donor's entry point. There is no
Kontakt cell; the address is shown verbatim in the „Kontakt" sections of `/`,
`/fundacja` and `/wesprzyj` instead. `Nav.astro` lays out 2×2 on mobile with
borders computed from the item index – a fourth entry in `NAV` means reworking
it. Outbound links to artists and projects go through `withUtm()`.

### Keyword positioning (2026-10-04)

Target phrases: „fundacja pierwsze demo", „wsparcie młodych twórców
muzycznych", „fundacja muzyczna gdańsk", plus the knowledge-base queries the
posts already rank for (ZAiKS/STOART, EPK, dystrybutor, dofinansowanie
muzyki). The homepage is the entity (name + `SITE_TAGLINE` in h1 and
`<title>`), `/fundacja` carries the formal vocabulary (cele statutowe, zarząd,
KRS, statut, sprawozdania), `/wesprzyj` the donor intent (darowizna,
odliczenie, wolontariat). `ACTIVITIES` labels carry the industry word
(„Koncerty i wydarzenia", „Nagrania i wydawnictwa") because they land in h3s
and `llms.txt`. Say „twórcy muzyczni" / „muzycy i zespoły", not „artyści"
alone – „artysta" reads as a painter to a search engine. The manager-era
commercial page is gone: paid management is one of the foundation's
programmes (§ 7 of the statute, odpłatna działalność pożytku publicznego),
described on `/fundacja#kariera`, never as a company offer.

**Founders' own projects on the foundation's site.** Ola is both Vice-President
and a young artist the foundation can legitimately support (statute § 5 covers
her; § 9 allows using the foundation's assets for a founder only when it
follows directly from a statutory goal). The line is drawn by purpose, not by
person: a founder's project appears here only when it *is* a foundation
activity (the concert series she hosts, a workshop she runs) and only with the
role stated next to her name. Never as promotion of a release – the interview
about her single was moved to a draft (`2026-09-18-ola-geppert-ioanni-wywiad.md`, `draft: true`)
for that reason, the EP left the „Teraz" panel, and Michał's bio mentions the
single in one clause. A grant assessor reading „foundation = the founder's
promotion vehicle" is the risk this guards against.

The footer is two rows. The top row carries what a Polish foundation must show
on every page – name, registered address, KRS / NIP / REGON, e-mail – on the
same 5/3/3/5 tracks as the nav; the bottom row is the four-cell band (`© /
Instagram / Cookies / Statut · Prywatność · Dostępność`) with borders computed
from cell index, so a fifth cell means reworking `Footer.astro`, not pushing
one more item in.
