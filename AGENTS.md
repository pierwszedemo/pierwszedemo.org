# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install       # bun.lock is the lockfile
bun run dev       # tinacms dev + astro dev; the CMS is at /admin/index.html, editing local files
bun run build     # Tina admin (cached, scripts/build-tina.mjs) + astro build (needs PUBLIC_TINA_CLIENT_ID and TINA_TOKEN)
bun run build:local  # the same without TinaCloud – for a build on a machine without the keys
bun run preview   # astro preview
bun run deploy    # astro build + wrangler deploy (Workers Builds does the same on push)
bun run check     # biome check (lint + format), read-only
bun run lint      # biome check --write --unsafe – fixes what it can
```

Biome lints and formats (`biome.json`, copied from splitwiser: tabs, 110
columns, organised imports). A husky `pre-commit` hook runs it through
lint-staged on staged files only. In `.astro` files Biome sees only the
frontmatter, never the template, so `noUnusedImports` is off there – an import
used only in the markup looked unused, and the unsafe fix would have deleted
it. Excluded on purpose: `src/content/strony/` (Tina writes those JSON files in
its own format, see „TinaCMS”), `tina/tina-lock.json`, `skills-lock.json` and
`instagram/` (generated output). No test suite. `@astrojs/check` is not a
dependency, so `bun run build` is the only gate for the content collection
schema. Type checking otherwise comes from the editor
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
`pierwszedemo.org`. The old `.com` (and `www.`, http or https) is handled by
Single Redirect rules on the `.com` zone, outside the repo, and every old URL
must reach its final `.org` address in **one** 301 – never `.com/blog/x` →
`.org/blog/x` → `.org/wiedza/x`. So the `.com` rules duplicate the mapping
above instead of deferring to it: `/o-mnie` and `/manager-muzyczny` →
`/fundacja`, `/blog` → `/wiedza`, each old `/blog/<slug>` (listed by name, with
and without a trailing slash) → `/wiedza/…` or `/aktualnosci/…`, any other path
ending in `/` → the same path without it, everything else → the same path.
Query strings are preserved. The list is closed – no post dated after
`BLOG_RETIRED_ON` ever lived under `/blog/` – so it never needs updating. A
test of these must assert the hop count, not only the final URL.

The foundation is in KRS since 2026-10-15 (KRS 0001272868, NIP 9571207822,
REGON 545957931 – the 9-digit form; GUS also prints it as 14 digits ending in
`00000`, which is the local-unit format). The donation account (Nest Bank,
since 2026-10-20) is `FOUNDATION.iban`, written as a Polish NRB in groups of
four digits. Every page reads the registry from that object (footer,
`/fundacja`, `/wesprzyj`, privacy policy, JSON-LD and `llms.txt`); an empty
field would render `REGISTRY_PENDING` through `registryValue()` (an empty
`iban`: „w trakcie zakładania” on `/wesprzyj`).
`FOUNDATION.supervision` is copied from the KRS extract, which names the
mayor of Gdańsk next to the minister – the statute names only the minister.
The site went live a week before the entry (see „Launch”).

The design is **„Wersja 2”** – the Claude Design canvas „Pierwsze Demo —
redesign” (`https://claude.ai/artifact/8Mmnxoays3QZQmRpP9LjLh`, artboard
`Wersja-2.dc.html`, „Wersja 2 — Instrument Serif”). It draws only the
homepage; every other page is built from the same parts (below), so when
changing layout, compare against that artboard – it is the spec. The one
exception is `/dzwieki-efemeryczne`, the concert series' own page, which keeps
the earlier „Swiss” look (Claude Design project
`380c6364-c5da-4baf-9ab9-c58a88637086`, file `Michal Miszczyszyn - Manager.dc.html`)
on purpose – the series has its own poster identity.

### Building blocks

Every page is a stack of full-bleed bands with the content in `wrap` (80rem,
the same side padding everywhere), so text starts on one line on every page.
Parts, in `src/components/`:

- `PageHeader` – pill eyebrow, a huge serif h1 with an `*accent*`, a short
  paragraph or an `aside` slot on the right. The pill is a `<p>`; on subpages
  the h1 carries the phrase. (The homepage is the reverse – see „Not built
  yet”.)
- `Section` – a band (`tone`: paper, white or ink) with a serif h2 and an
  optional sentence next to it. The anchor `id` sits on the `<section>`, not on
  the h2 (which gets `<id>-naglowek` for `aria-labelledby`), so a jump to
  `/fundacja#dane` leaves the band's padding above the heading. Anchored items
  inside a section (`#michal`, `#sprawozdania`, the activities) get
  `scroll-mt-6`.
- `ContactBlock` – „Po prostu *napisz.*” and the address, as on `/`.
- `PostCard` – the illustrated card (three compositions, chosen by position);
  `ListRow` – the index row (mono date, serif title, pill, arrow; the title
  underlines on hover – italic changed its width and the row jumped). Lists show the three newest as cards and the rest as rows.
- `HeroPhoto` – a rounded photo card with a pill caption; `SupportBand` – the
  orange „Wesprzyj” card above the footer.

Bands alternate so two neighbours never share a background. On `/` that is
paper (hero), ink („Kim jesteśmy”), white („Co robimy”), panel („Co się
dzieje”), ink („Teraz” – the blue card sits on it), white („Dołącz”), panel
(contact), ink (footer). White against paper is a hair's difference, so the
alternation with white uses `panel`.

Rounded corners, pills and colour cards are the language; the one structural
rule left is a 1.5 px ink line on top of an index list (activities, goals,
registry data, rows) with hairlines between items – the same as „Co robimy”.

### The 16-column grid (concert page only)

`/dzwieki-efemeryczne` still runs on the Swiss mock's 16 modules: `--col:
6.25cqw` in `global.css`, with `<main>` as the container. `cqw` and not
`%`/`vw`: a percentage inside a nested grid resolves against the parent, and
`vw` includes the scrollbar gutter. The container is `<main>`, never `<body>` –
`container-type` implies layout containment, which would turn body into the
containing block for the fixed cookie banner. `--aside` = 5 modules and the
`grid-aside-left` / `grid-aside-right` utilities exist for that page alone;
vertical lines fall only on 5, 8 and 11, borders between bands are ink and
inside a band hairline.

### `src/consts.ts` is the content database

Site metadata, nav, the foundation's registry data (`FOUNDATION`), statutory
goals (`GOALS`, § 5 of the statute verbatim), socials, knowledge-base
categories and news kinds (`NEWS_KINDS`) live here and are imported by
`astro.config.mjs`, `BaseLayout.astro` and the pages. `CATEGORIES` and
`NEWS_KINDS` feed the zod enums in `src/content.config.ts`, so adding one is
one edit.

What Tina edits lives as JSON in `src/content/strony/` – homepage copy, the
„Teraz” band and the three „Dołącz” cards (`strona-glowna.json`), the
`/fundacja` heading and mission
(`fundacja.json`), founders with bios (`fundatorzy.json`), programmes
(`dzialania.json`) – and is assembled in `src/strony.ts` into
`HOMEPAGE`, `PROJECTS`, `FOUNDERS` and `ACTIVITIES`, together with the fields
an editor must not touch: `id` (the `/fundacja#…` anchor and photo key),
`schemaId` (the `Person` node) and the activity number (from list order).
Founders are an object keyed by person, not a list, so the CMS cannot add a
person who has no photo or schema.org node in code. `strony.ts` is separate
from `consts.ts` on purpose: the consent banner script imports `consts.ts`,
and a default JSON import is not tree-shaken – the bios ended up in browser
JavaScript. Never import `strony.ts` from `src/scripts/`. JSON text has plain
spaces; templates run `fixHanging()` on it, because a hand-typed `&nbsp;`
does not survive an edit in Tina. Homepage headings mark their accent word with
`*asterisks*` („Hej, robimy *fajne rzeczy*…”) – `accentParts()` in
`typography.ts` and `Accent.astro` turn it into `<em>` (italic or colour, the
page decides). The fields say so in their Tina description. `GOALS` (the statute), `FOUNDATION` and
`PRIVACY_*` (legal text) stay in code deliberately.

`LAST_CONTENT_UPDATE` must be bumped by hand – it drives JSON-LD `dateModified`
and sitemap `lastmod`.

The organisation and the people are separate entities. `SITE_NAME` („Fundacja
Pierwsze Demo") is the site and the `NGO` node (`ORGANIZATION_ID`): titles,
`og:site_name`, RSS, `WebSite.publisher`. Each founder has a `Person` node
(`PERSON_ID` for Michał, `OLA_ID` for Ola) built from `FOUNDERS`; posts have
`author` = the people in their `authors` frontmatter (one or both founders)
and `publisher` = the foundation, because Google reads an organisation as
author badly. The domain lives in `SITE_URL` alone – `SITE_HOST`, the schema.org
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
the bare slug. Three visibility states, all set in the frontmatter:

- **listed** (default) – lists, homepage, prev/next, RSS, llms.txt, sitemap.
- **`unlisted: true`** – own URL, OG card and sitemap entry, indexable, but no
  list, homepage, prev/next link, RSS or llms.txt points to it.
- **`draft: true`** – a preview to send by link before publishing: own URL and
  OG card, but `noindex, nofollow`, no JSON-LD, an orange „To jest podgląd”
  band above the nav (`--color-preview`, the one colour outside the mock), and
  it is in no list, sitemap (`draftPaths` in `astro.config.mjs`), RSS or
  llms.txt, nor in the `/blog/*` redirects.

`getSortedArticles()` / `getSortedNews()` return listed posts only;
`getRoutedArticles()` / `getRoutedNews()` (post routes and OG cards) return
everything, and `nextListed()` picks the next link from the listed set so no
page links to an unlisted post or a draft. Drafts used to be `_`-prefixed files,
but Tina cannot rename a file, so publishing from the CMS would have been
impossible. Posts are loaded through the content collections
(`src/content.config.ts`) with a zod schema: `title`, `lead` (the "W skrócie"
column, doubling as the meta description), `authors` (required list of
founder keys from `AUTHORS` in `consts.ts` – no default, an empty list fails
the build; drives the byline and JSON-LD `author`), `category` (wiedza only), `kind`, `date`,
`updated?`, `keyphrase?`, `draft`, `spotifyTrackId?` (embeds a Spotify
player under the lead in the "W skrócie" card – a frontmatter field, never an
iframe in the body; the player loads without the consent banner on legitimate
interest, same convention as olageppert.pl, and has its row in `PRIVACY_TOOLS`).
`image?` + `imageAlt?` put a picture in the same slot, under the lead – again a
frontmatter field (`/blog/…`, relative to `src/assets` – the way Tina's media
manager writes it; a zod preprocess turns it into `../../assets/blog/…` for
`image()`, which resolves relative to the post). This slot is for the post's
one illustration; pictures that belong to the text go in the body (below).
`imageAlt` is
enforced by a zod refine whenever `image` is set. `src/collections.ts` owns sort order –
`getSortedArticles()` / `getSortedNews()` are the single source for the lists,
prev/next links, RSS, llms.txt and OG cards, so they can't disagree.

`src/pages/wiedza/[...slug].astro` and `src/pages/aktualnosci/[...slug].astro` set `prerender = true` and `getStaticPaths()`.
Redundant under `output: "static"`, kept as a guard: in server mode an on-demand
dynamic route cannot be enumerated by `@astrojs/sitemap` and the posts would
silently vanish from the sitemap.

**Every page is prerendered on purpose.** It was `output: "server"` (copied from
olageppert.pl) until a page rendered on demand made `<Image>` skip build-time
optimisation and emit a runtime `/_image?href=…` URL instead — an endpoint the host (Vercel
back then) did not serve, so the hero photo 404'd in production. Nothing here
computes per request. The Cloudflare adapter is configured to keep it that way:
`imageService: "compile"` (its default, `cloudflare-binding`, transforms images
at runtime through Cloudflare Images), `prerenderEnvironment: "node"` (the
default `workerd` has neither sharp nor the filesystem `src/og.ts` reads TTFs
from) and `session: false` (otherwise the adapter adds a `SESSION` KV binding
a static site has no use for).

The one exception is `/tina-island/[name]` (`prerender = false`), Tina's
visual-editing endpoint – see „Visual editing” below. It makes the build emit
a real Worker (`dist/server/entry.mjs`, `nodejs_compat` for AsyncLocalStorage),
but static assets are still served before it, so visitors never reach it:
it answers only a same-origin POST with the bridge's content type.

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

Body markdown is deliberately narrow – paragraphs, `##`, `###`, links, bold,
italic, lists and tables (both styled in `prose.css`, tables wrapped by
`src/table-scroll.ts`), quotes and images. Anything else renders as unstyled
lines that Tailwind Preflight has already stripped. Tina's toolbar offers
exactly these (`overrides.toolbar` in `tina/config.ts`) – adding a button
there means adding its styles to `prose.css` in the same change. A `>` quote
is someone else's words inside the text, quieter than the `pullquote` card
(same size as a paragraph, ink colour, hairline rule on the left).

Images in the body (`src/images.ts`, two satteri plugins):

- `assetImages` (mdast) rewrites Tina's `/blog/x.jpg` (relative to
  `src/assets`) to `../../assets/blog/x.jpg`. A path starting with `/` is a
  `public/` file to Astro – not optimised, and not there – the same reason
  the frontmatter `image` has its zod preprocess.
- `figures` (hast) turns a paragraph holding only an image into `<figure>`
  and the image title (`![alt](path "Caption")`, Tina's „Caption” field) into
  `<figcaption>`, styled like the photo captions on `/fundacja`.
- A post with an image in the body never gets two columns (`hasBodyImage()`
  in `collections.ts`, checked in `ArticleLayout`): the image would tear at
  the column break or leave a hole at the bottom of the first column.

The content layer caches rendered markdown by file content, not by plugin
code: after changing a satteri plugin run `astro build --force` once, and
clear the Workers Builds cache if CI renders the old output.

A pierwszedemo skill writes to these rules;
posts it writes stay without images.

### TinaCMS

Tina edits the markdown in place and commits to the repo through **TinaCloud**
(auth + content index; keys `PUBLIC_TINA_CLIENT_ID` / `TINA_TOKEN` in `.env`
and in the Workers Builds settings). It is only an editor: the site still
renders through Astro content collections, the zod schema and the satteri
plugins – Tina's own data layer and `TinaMarkdown` are not used for pages.
`tina/config.ts` mirrors `base()` from `content.config.ts` field for field;
change one, change the other (zod is what the build enforces). Any change to `tina/config.ts` (or to `consts.ts` values it reads) must
ship with a regenerated `tina/tina-lock.json` in the same push – TinaCloud
indexes the schema from that file, and a stale lock makes the editor report
„GraphQL Schema Mismatch”. Neither `tinacms build` nor `build:local` rewrites
it; `tinacms dev` does (`bunx tinacms dev -c "sleep 8"` is enough). `/admin` is
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
- Four singleton collections over `src/content/strony/*.json`
  (`stronaGlowna`, `fundacja`, `fundatorzy`, `dzialania`) – create/delete
  disabled. Each activity has a one-line `summary` (the homepage „Co robimy”
  row) next to the full `description` (/fundacja). The „Dołącz” cards are an
  object keyed `muzycy` / `organizatorzy` / `darczyncy`, not a list, because
  each has a different exit in code: musicians and organisers `EmailLink`,
  donors `/wesprzyj` + statute + a tax-deduction line. On the page the
  donors' card comes first and biggest (orange, two columns by two rows) –
  without donors the foundation does neither of the other two. A list of paragraphs is `paragraphList()`: with `list: true`,
  `ui.component` replaces the whole list widget (one textarea for the array,
  and a save would turn it into a string), so the per-item widget goes in
  `ui.field`. Tina
  writes JSON in its own field order and without a trailing newline; the files
  are kept in that format so a save does not churn the diff.
- Media: `publicFolder: "src/assets"`, `mediaRoot: "blog"` – uploads land
  where Astro optimises them, never in `public/`.
- Visual editing („Visual editing” below) covers the JSON documents;
  posts are edited through the form only, by design – their body renders
  through `render()` and the satteri plugins, which `TinaMarkdown` would
  replace.
- `bun run build` goes through `scripts/build-tina.mjs`: the admin app and the
  generated client depend only on the Tina config, `consts.ts`, the packages,
  the branch and the project – not on content – so they are cached in
  `node_modules/.astro/tina-admin/<hash>` (the only directory Workers Builds
  carries between Astro builds) and rebuilt only when one of those changes.
  `--skip-cloud-checks` because the check waits ~45 s for TinaCloud to index
  the commit just pushed, and nothing in the site build queries TinaCloud.
  Workers Builds runs Bun from `BUN_VERSION` (a build variable, 1.4.0) – the
  image default was 1.2.15.
- Workers Builds skips commits that touch only files the site never reads
  (build watch paths, set in the dashboard/API, not in the repo):
  `instagram/*`, `.agents/*`, `.claude/*`, `assets/*`, `AGENTS.md`,
  `CLAUDE.md`, `skills-lock.json`, `.env.example`, `scripts/generate-*`. A new
  directory the build does read must not land under one of these.
- `astro dev` backgrounds itself when there is no TTY (an agent's shell), and
  `tinacms dev -c` then sees its child exit and shuts down. In a terminal it
  runs in the foreground and works.

### Visual editing

`@tinacms/astro` (integration in `astro.config.mjs`) lets the admin preview
`/` and `/fundacja` live while a form is edited. Editable regions are
`<TinaIsland>`s registered in `src/islands.ts`; their markup lives in
`src/components/islands/` and is rendered two ways:

- At build, by the pages, from the JSON in `src/strony.ts` – no Tina query, so
  the build does not depend on TinaCloud. Without Tina metadata `tinaField()`
  returns `""`; `field()` turns that into `undefined` so production HTML has no
  empty `data-tina-field`.
- In the editor, by `POST /tina-island/<name>` on the Worker, from the
  generated Tina client (`tina/__generated__/client`, read-only token baked in
  server-side) with the unsaved form values overlaid. The bridge swaps the
  whole wrapper element.

`<TinaIsland>` can give its wrapper only a class – no `id`, no `aria-*` – so
islands wrap elements that need neither (`wrappers.ts`), and a section with an
anchor or `aria-labelledby` stays in the page with the island *inside* it (the
`h2` it points to may live in the island). Homepage: hero text column, „Kim
jesteśmy”, „Co robimy”, „Teraz”, „Dołącz”, the contact sentence. `/fundacja`:
header, mission body, activities list, each founder's text column. Photos stay
outside – the founders' slots and the homepage collage: an `<Image>` rendered on
demand in the Worker has no build-time optimised file. Each island adds one inline bootstrap
`<script>` that does nothing outside the `/admin` iframe; that is the only
production HTML cost. `src/astro-modules.d.ts` exists because bare `tsgo`
cannot resolve a `.astro` import from `islands.ts`.

### SEO / structured data

`src/layouts/BaseLayout.astro` emits every page's `<head>` and a schema.org
`@graph`: a `Person` node (stable `PERSON_ID`), a `WebSite` node (`WEBSITE_ID`)
and a page node whose `@type` comes from the `schemaPageType` prop – `ProfilePage`
on the homepage (it gets `mainEntity` = the NGO, the others get `about`), `CollectionPage`
on `/wiedza` and `/aktualnosci`, `WebPage` elsewhere. Pages contribute extra nodes via `extraJsonLd`:
the lists add `Blog` + `ItemList`, a post adds `BlogPosting`, and all add
`BreadcrumbList`. Pages with `robots="noindex"` get no page node.

Breadcrumbs are JSON-LD; on a post the section pill above the title (a link
to the list) is their visible half. They give Google a path to render under
the result instead of a bare URL. `src/schema.ts` holds `breadcrumbJsonLd()`, `isoDateTime()` and `wordCount()`.

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
rasterises. The card is the site in miniature: paper background, the eyebrow
pill, the title in Instrument Serif (`*accent*` in blue, as in the hero – the
homepage card takes the slogan from Tina), the record mark, the logotype, a
category pill and the accent stripe from the footer. `PALETTE`, `STRIPE` and
`RECORD_SVG` there are the one copy every generated image reads – favicons,
the Facebook cover and the Instagram frames import them. Satori quirks that
bite: padding on the root element is added *outside* `100%` (it pushed the
footer off the card – pad a child instead), a nested `<svg>` element is
dropped (the record goes in as a data-URI `img`), and text with two styles
must be split into word boxes (`titleWords`). Two constraints are load-bearing:

- Fonts are vendored as **TTF** in `src/assets/fonts/`. Astro's Fonts API caches
  woff2, which satori cannot read; and handing plain SVG to sharp would render
  through librsvg, which resolves *system* fonts – Instrument Serif exists on
  neither this machine nor the Cloudflare builder. Static instances only
  (`InstrumentSerif-Regular/Italic`, `InstrumentSans-Regular/SemiBold`):
  satori does not read variable fonts.
- Paths resolve from `process.cwd()`, never `import.meta.url`: Vite bundles the
  module into `dist/server/.prerender/chunks/`, where the TTFs are not.

Posts live under `/og/<slug>.png` rather than `/wiedza/<slug>/og.png` so they don't
collide with the `[...slug]` catch-all. The eyebrow is the foundation's name,
not a person's. `/og/dzwieki-efemeryczne.png` alone keeps the Swiss card
(`renderSwissCard`, Archivo + IBM Plex Mono) – like its page; so does
`scripts/generate-dzwieki.mjs`. Those two are the only reason the Archivo TTF
is still in `src/assets/fonts/`.

### Favicons

`scripts/generate-favicons.mjs` builds `favicon.svg`, the PNGs and a hand-assembled
multi-size `.ico` from one source. Run it by hand (`bun scripts/generate-favicons.mjs`),
not in the build — icons change once every few years and the output is committed.

The icon is the record from the nav (`RECORD_SVG`): circles only, no text.
The old „PD" monogram had to be a path baked from the font – sharp rasterises
SVG through librsvg, which resolves *system* fonts, and so does a visitor's
browser rendering `favicon.svg` – and at 16 px its stems fell below a pixel.
A dark disc with an orange centre has neither problem. If the icon ever gets
letters again, bake them as outlines, never `<text>`.

The tab icons (`favicon.svg`, `.ico`, 96 px) are the bare disc on
transparency; the „app" icons (`apple-touch-icon`, manifest 192/512) put it on
the paper colour with a margin, because iOS fills transparency with black and
masks the corners.

`public/bimi.svg` (BIMI logo for DMARC) comes out of the same script: SVG Tiny PS
(`version="1.2"`, `baseProfile="tiny-ps"`, `<title>` first, no `x`/`y` on the
root, no scripts/styles/images/external refs – validators reject each of these;
the circles are computed directly rather than through a `<g transform>`).
Mail clients crop it to a circle, so the disc sits inside the edge; never hand
it a transparent background. Referenced from the DNS `default._bimi` TXT record,
which is outside the repo.

### Social assets (`assets/`)

Files uploaded by hand to Facebook/Instagram, not served by the site – hence
outside `public/`. `generate-favicons.mjs` also writes `assets/profile-1080.png`:
the record on the paper colour with a wide margin (platforms crop the profile
picture to a circle). `scripts/generate-social.mjs` (`bun scripts/generate-social.mjs`) writes
`assets/facebook-cover-1640x856.png` through `renderOgCard()` – `src/og.ts`
takes `width`/`height`/`paddingX` for that. Facebook shows two crops of one
cover: desktop the centre 1640×624 band, mobile the centre ~1522×856 column, so
the card is drawn at 1640×624 with 200 px side margins and padded to 856 with
paper-coloured bands – desktop gets the card pixel-for-pixel, mobile the same
card with breathing room. Its title is the homepage slogan from Tina.

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

„Wersja 2” on warm white (`--color-paper`, #fbfaf7 – `bg-white` is for cards
that must stand off the page). Tokens in `@theme`: `ink`, `body`, `muted`
(#4a4a53, darker than the canvas's #55555f, which gives only 6.4:1 on `panel`
– the accessibility statement promises text above 7:1), `hairline`, `panel`,
`fog` (secondary text on ink), and six accents – `blue` (also the link colour,
6.3:1 on paper), `orange`, `lime`, `pink`, `sun`, `mint`. Text on an accent is
ink, except white on blue. A fluid type scale (`--text-hero`, `-page`, `-band`,
`-post`, `-item`, `-row`) with the 1440 px mock's values as `clamp()` maxima.

Type: **Instrument Serif** (400 only, with italic) for every heading and the
logotype – the accent inside a heading is italic, never bold, because the
browser would fake a bold. **Instrument Sans** for text, **IBM Plex Mono** only
for numbers (activity numbers, dates in lists). All three are self-hosted
through Astro's Fonts API in `astro.config.mjs` with the `latin-ext` subset for
Polish diacritics.

Utilities in `global.css`: `label` (sans 600, 13 px, `0.08em`, uppercase – use
it instead of respelling those five utilities), `wrap` (the 80rem content box
with the grid's side padding), `btn` + `btn-ink` / `btn-ghost` / `btn-light`
(+ `btn-lg`) for the pill buttons – sizes go through `--btn-px`/`--btn-py`,
because two utilities setting `padding` are ordered by the stylesheet, not by
the class attribute.

The global `:focus-visible` outline is inside `@layer base` on purpose: unlayered
rules beat Tailwind utilities, so a page could not override the outline colour
on a dark band.

## Conventions

- **The repo is public** (`github.com/pierwszedemo/pierwszedemo.org`), history
  included. Never commit secrets – keys go in `.env` (gitignored) and the
  Workers Builds settings, `.env.example` holds only names. Images must be
  metadata-stripped before the first commit (see the founders' photos below),
  because removing EXIF later leaves the original in history. A `draft: true`
  post is readable in the repo the moment it is pushed, before anyone gets
  the preview link – anything that must stay private until publication does
  not belong in a commit.
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
  A leading `_` means: not posted on Instagram yet. The
  scripts write fresh output to `_…` and the user drops the underscore by hand
  once the post is up, so `ls instagram/` doubles as the queue; an existing
  bare directory is reused on regeneration so a posted post never gets a
  duplicate next to it.
  `scripts/lib.mjs` holds the shared frame and imports palette, stripe and
  record mark from `src/og.ts` (satori + sharp, same fonts and footer);
  `generate.mjs` draws the carousel, `format.mjs` the single formats.
  `instagram/` output is committed – it is the promotion history of a post,
  so graphics already posted in the Swiss look stay as they are; only new
  ones come out in „Wersja 2”.

## Launch

Live and indexable since 2026-10-09, a week **before** the KRS entry
(2026-10-15). Worker `pierwszedemo`, account
„Fundacja Pierwsze Demo”, `custom_domain` route in `wrangler.jsonc`, built by
Workers Builds from `main`; `fundacja` was fast-forwarded into it and the Tina
branch fallback says `main`. `public/_headers` keeps only `/admin` out of the
index (a header, not `Disallow`: a crawler blocked by `robots.txt` never sees
the noindex and can still index the bare URL).

`pierwszedemo.com` redirects to `.org` (see Architecture); the manager site's
Vercel project and domain are gone. The `.com` zone's BIMI record points at
`.org/bimi.svg`, because a BIMI fetcher does not follow redirects. Never remove
the `.com` rule – Search Console's change of address depends on its 301s.

Registry data is complete since 2026-10-20 (KRS, NIP, REGON, account).

## Not built yet

Annual reports (the first, for 2026, is due in 2027 – `/fundacja#sprawozdania`
already has the slot and the sentence), a grant-logo band („Dofinansowano ze
środków…" is mandatory on the site from the day a MKiDN or city grant is
signed), a joint photo of the founders for the hero polaroid (it holds the
two portraits from /fundacja side by side until then).

The homepage `<h1>` is the pill above the slogan, „Fundacja Pierwsze Demo ·
wsparcie młodych twórców muzycznych · Gdańsk", not the slogan – the slogan
carries no keywords and the h1 is the strongest on-page signal. Visually the
h1 is a small label and „Hej, robimy fajne rzeczy dla młodej muzyki." is the
largest text on the page, as a `<p>`. The canvas draws the slogan as the h1;
don't "fix" this back by promoting it.

`src/assets/michal.jpg` is a phone snapshot and
`src/assets/dzwieki-efemeryczne/ola-geppert.jpg` a 670 px stage shot – both
fill the founders' slots on `/fundacja` and the homepage polaroid until proper
portraits exist. `src/photos.ts` (`FOUNDER_PHOTOS`) holds them with their alt
text and crop, for both places and the JSON-LD `Person.image`. Anything
dropped in there must be pre-rotated and metadata-stripped first (the original
carried an EXIF orientation tag and GPS coordinates). `HeroPhoto.astro` takes
`src`/`alt`/`caption` props and clips `widths` to the source size, because
Astro refuses to upscale.

The nav is the logotype (`Logo.astro` + „pierwsze demo” in serif), four links
(O nas → /fundacja, Co robimy → /fundacja#dzialania, Wiedza, Aktualności) and
the „Dołącz” pill (`JOIN_PATH`, the homepage section). On a phone the pill
stays in the logotype's row and the links drop below. „Wesprzyj” is
deliberately not a nav item: it is the `SupportBand.astro` card above the
footer on the pages that make sense as a donor's entry point, and the third
„Dołącz” card on `/`. The e-mail address is shown verbatim in the „Kontakt"
sections of `/`, `/fundacja` and `/wesprzyj`. Outbound links to artists and
projects go through `withUtm()`.

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

**Avoid conflict of interest.** Ola is both Vice-President and a young artist
of the kind the foundation exists to support (statute § 5). § 9 allows using
the foundation's assets for a founder only when it follows directly from a
statutory goal, so the line is drawn by purpose, not by person: a founder's
project appears here only when it *is* a foundation activity (the concert
series she hosts, a workshop she runs), and always with her role stated next
to her name. The site does not promote founders' own releases: the interview
about her single (`2026-09-18-ola-geppert-ioanni-wywiad.md`) is
`unlisted: true` – it has its own URL but no list or panel features it – her
EP is not in the „Teraz" band, and Michał's bio mentions the single in one
clause.

The footer is the dark band from the canvas: logotype, „Dane fundacji” (KRS /
NIP / REGON), „Dokumenty” (statute, privacy, the Cookies button, accessibility
statement) and „Kontakt”, then the accent-colour stripe and ©. The registered
address is not there on purpose: art. 5 of the e-services act wants it
„bezpośrednio dostępny”, not on every page, so the footer links „Dane
rejestrowe” to `/fundacja#dane` instead.
