# pierwszedemo.org

Strona [Fundacji Pierwsze Demo](https://pierwszedemo.org) – fundacji z Gdańska,
która wspiera młodych twórców muzycznych: koncerty, nagrania, warsztaty,
baza wiedzy i aktualności.

## Stos

- [Astro](https://astro.build) 7, w całości statyczny (`output: "static"`)
- Tailwind CSS v4 (motyw w `@theme` w `src/styles/global.css`)
- [TinaCMS](https://tina.io) z TinaCloud jako edytor treści (`/admin`)
- Cloudflare Workers (static assets), budowane przez Workers Builds
- Bun, Biome

## Uruchomienie

```bash
bun install
cp .env.example .env   # klucze TinaCloud – potrzebne tylko do `bun run build`
bun run dev            # strona i CMS na lokalnych plikach, CMS pod /admin/index.html
```

| Polecenie | Co robi |
|---|---|
| `bun run dev` | `tinacms dev` + `astro dev` |
| `bun run build` | panel Tiny + `astro build` (wymaga kluczy z `.env`) |
| `bun run build:local` | to samo bez TinaCloud – build bez kluczy |
| `bun run preview` | podgląd zbudowanej strony |
| `bun run check` | Biome (lint + format), tylko odczyt |
| `bun run lint` | Biome z poprawkami |

Testów nie ma – bramką schematu treści jest `bun run build`.

## Gdzie co jest

| Ścieżka | Zawartość |
|---|---|
| `src/content/wiedza/`, `src/content/aktualnosci/` | wpisy, `YYYY-MM-DD-<slug>.md`; data w nazwie nie trafia do adresu |
| `src/content/strony/*.json` | copy strony głównej, `/fundacja`, fundatorzy, działania – edytowane w Tinie |
| `src/consts.ts` | dane rejestrowe fundacji, cele statutowe, nawigacja, kategorie |
| `src/documents/statut.md` | statut (`/statut`) |
| `src/pages/` | strony i generowane zasoby: karty OG, `rss.xml`, `llms.txt` |
| `tina/config.ts` | schemat CMS-a – zgodny pole w pole z `src/content.config.ts` |
| `scripts/` | generatory favikon i grafik do profili, uruchamiane ręcznie |

Wpis może być opublikowany (domyślnie), `unlisted: true` (ma adres, ale nie ma
go na listach) albo `draft: true` (podgląd z `noindex`, do wysłania linkiem).

## Wdrożenie

Push na `main` buduje i wdraża produkcję. Każda inna gałąź dostaje podgląd
pod `<gałąź>.pierwszedemo.org` z `noindex`.

## Dla współpracowników i agentów

Architektura, decyzje i pułapki są opisane w [`AGENTS.md`](AGENTS.md)
(`CLAUDE.md` tylko go importuje) – przeczytaj przed większą zmianą.

- Repo jest publiczne razem z historią: klucze tylko w `.env`, zdjęcia bez
  metadanych przed pierwszym commitem, a szkic (`draft: true`) jest jawny od
  chwili pushu.
- Commity w Conventional Commits, temat po polsku, np.
  `feat(wiedza): kategorie „Twórczość” i „Zdrowie”`.
- Skille dla agentów leżą w `.agents/skills/`. Prywatne skille redakcyjne
  fundacji są w osobnym repo, włączonym w `.claude/settings.json` – bez
  dostępu do niego Claude Code po prostu je pomija.
