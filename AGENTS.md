# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install       # bun.lock is the lockfile
bun run dev       # astro dev
bun run build     # astro build (also prerenders /blog/<slug>)
bun run preview   # astro preview
```

No test suite, no linter, no formatter. Type checking comes from `astro check` /
the editor (`@typescript/native-preview` is a devDependency); `tsconfig.json`
extends `astro/tsconfigs/base`.

## Architecture

Astro 7, `output: "server"`, Vercel adapter, Tailwind v4 via the Vite plugin
(no `tailwind.config` — theme tokens live in `@theme` inside
`src/styles/global.css`). Polish-language site of an artist manager:
`/`, `/blog`, `/blog/<slug>`, `/404`.

The layout is a transcription of a Claude Design canvas project
(`380c6364-c5da-4baf-9ab9-c58a88637086`, file `Michal Miszczyszyn - Manager.dc.html`),
turn 2 — the "Swiss" direction: `2a` strona główna, `2b` lista wpisów,
`2c` pojedynczy wpis. The mock is a fixed 1280×800 absolutely-positioned card;
everything here is the responsive rebuild of it. When changing layout, compare
against that file — it is the spec.

### Two rule weights hold the grid together

Structural borders between major bands are `border-ink` (#101010). Borders
between cells *inside* a band are `border-hairline` (#e4e2dd). Mixing them up is
the fastest way to make the design stop looking like the design. Zero border
radius anywhere.

### `src/consts.ts` is the content database

Site metadata, nav, services, roster, socials and blog categories live here and
are imported by `astro.config.mjs`, `BaseLayout.astro` and the pages. `CATEGORIES`
feeds the zod enum in `src/content.config.ts`, so adding a category is one edit.

`LAST_CONTENT_UPDATE` must be bumped by hand — it drives JSON-LD `dateModified`
and sitemap `lastmod`.

### Blog

Posts are markdown in `src/content/blog/`, loaded through a content collection
(`src/content.config.ts`) with a zod schema: `title`, `lead` (the "W skrócie"
column), `category`, `date`, `readingMinutes`. `src/blog.ts` owns sort order —
`getSortedPosts()` is the single source for both the list page and the prev/next
links, so they can't disagree.

`src/pages/blog/[...slug].astro` sets `prerender = true` and `getStaticPaths()`.
That is load-bearing: with `output: "server"` an on-demand dynamic route cannot
be enumerated by `@astrojs/sitemap`, and the posts would silently vanish from the
sitemap.

### SEO / structured data

`src/layouts/BaseLayout.astro` emits every page's `<head>` and a schema.org
`@graph`: a `Person` node (stable `PERSON_ID`), a `WebSite` node (`WEBSITE_ID`)
and a page node. Pages contribute extra nodes via `extraJsonLd` — the post page
adds `BlogPosting`. Pages with `robots="noindex"` get no page node.

Canonical URLs have **no** trailing slash (`trailingSlash: "never"` in Astro,
`trailingSlash: false` + `cleanUrls` in `vercel.json`); the sitemap `serialize()`
hook strips the slash the Vercel adapter's build format adds.

### Styling conventions

Light Swiss look on `#ffffff`. Tokens in `@theme`: `--color-ink`, `--color-muted`,
`--color-body`, `--color-hairline`, `--color-panel`, plus a fluid type scale
(`--text-hero`, `--text-page`, `--text-post`, `--text-row`, `--text-roster`) whose
`clamp()` maxima are the mock's 1280 px values. Archivo (display + sans) and
IBM Plex Mono are self-hosted through Astro's Fonts API in `astro.config.mjs`;
both need the `latin-ext` subset for Polish diacritics.

Recurring micro-label pattern is the `label` utility in `global.css`
(mono, 12px, `0.2em` tracking, uppercase) — use it instead of respelling those
five utilities.

The global `:focus-visible` outline is inside `@layer base` on purpose: unlayered
rules beat Tailwind utilities, and the blog rows need to override the outline
colour to white on their inverted background.

Fixed pixel columns from the mock (the 400 px photo column, the 432 px title
indent) must not be applied below `lg` — at 768 px they overflow the viewport.
They are expressed as `clamp()`/`minmax()` or gated behind `lg:`.

## Conventions

- **Polish** for user-facing copy, code comments and commit messages. Commits are
  Conventional Commits with a Polish subject, e.g.
  `feat(blog): kolejność wpisów i linki prev/next`.
- Comments explain *why* a non-obvious choice was made (browser quirk, SEO rule,
  layout trap), not what the code does. Keep that bar.
- `.agents/skills` and `.claude/skills` vendor the `seo`, `accessibility` and
  `frontend-design` skills (pinned in `skills-lock.json`) — this project cares
  about all three.

## Not built yet

Real hero photograph (`HeroPhoto.astro` ships the mock's grey placeholder panel),
`og.png` endpoint, cookie consent + analytics, an `/artysci` page if the roster
grows past one artist.

The footer is exactly four cells (`© / LinkedIn / Instagram / miasto`) and its
border logic is computed from cell index — adding a fifth entry to `SOCIALS`
breaks the 2×2 mobile layout, so rework `Footer.astro` rather than pushing one
more item in.
