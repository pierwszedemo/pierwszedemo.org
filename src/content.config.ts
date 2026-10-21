import { defineCollection, type ImageFunction, z } from "astro:content";
import { glob } from "astro/loaders";
import { AUTHORS, CATEGORIES, DATE_PREFIX, KINDS, NEWS_KINDS } from "./consts";

/**
 * Dwie kolekcje, nie jedna z polem „dział”: baza wiedzy i aktualności to dwa
 * typy treści w przyszłym CMS-ie (Tina/Decap pracują na katalogach), a dziś
 * dwa katalogi markdownu, które `ls` listuje osobno. Wspólna część schematu
 * jest wyciągnięta niżej, żeby pola o tej samej nazwie znaczyły to samo.
 */

// Szkice są w kolekcji (`draft: true`) i odpada je dopiero `collections.ts`.
// Wcześniej szkic był plikiem z `_` na początku nazwy, ale Tina nie ma akcji
// „zmień nazwę pliku”, więc publikacja z CMS-a byłaby niemożliwa – a checkbox
// jest.
const loader = (base: string) =>
	glob({
		base,
		pattern: "**/*.md",
		// Pliki nazywają się `RRRR-MM-DD-slug.md`, żeby `ls` pokazywał chronologię,
		// ale adresem jest sam slug – data w URL-u postarzałaby wpis i zmuszała do
		// przekierowań przy każdej zmianie nazwy. Źródłem daty pozostaje frontmatter.
		generateId: ({ entry }) => entry.replace(/\.md$/, "").replace(DATE_PREFIX, ""),
	});

/**
 * Data kalendarzowa wpisu. Tina zapisuje pole `datetime` jako chwilę w UTC –
 * 4 października wybrany w Polsce to `2026-10-03T22:00:00.000Z` – a reszta
 * serwisu (plDate, isoDate, prefiks nazwy pliku) czyta datę w UTC. Bez tego
 * każdy wpis z CMS-a cofałby się o dzień. Dzień bierzemy więc w strefie
 * Warszawy, a północ UTC (`date: 2026-08-09` z ręcznie pisanych plików) przechodzi
 * bez zmian.
 */
const warsawDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" });
const calendarDate = z.preprocess((value) => {
	const date = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) return value;
	if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) return date;
	return new Date(warsawDay.format(date));
}, z.coerce.date());

const base = (image: ImageFunction) => ({
	title: z.string(),
	/** Akapit „W skrócie" z lewej kolumny wpisu. Jednocześnie meta description. */
	lead: z.string(),
	date: calendarDate,
	/**
	 * Kto podpisuje wpis – klucze fundatorów, w kolejności podpisu. Bez
	 * domyślnej wartości: wpis bez autora to błąd buildu, nie ciche „Michał”.
	 */
	authors: z.array(z.enum(AUTHORS)).min(1, "Wpis musi mieć co najmniej jednego autora."),
	/** Data rewizji faktów – przewodniki starzeją się na liczbach. Zasila dateModified. */
	updated: calendarDate.optional(),
	/**
	 * Wyimek – zdanie, w które ma wpaść ktoś przelatujący stronę wzrokiem.
	 * Renderuje się jako pasmo pod tytułem i zostaje też w treści, bo wyimek
	 * ma powtarzać, a nie zastępować. Osobne pole zamiast znacznika w markdownie:
	 * korpus wpisu dopuszcza tylko akapity, ##, ###, linki, strong i em, więc
	 * odblokowanie `>` pod cytaty otworzyłoby element, którego Preflight nie
	 * stylizuje i który jest sygnałem tekstu pisanego przez model.
	 */
	pullquote: z.string().optional(),
	/** Kto to powiedział. Bez tego wyimek czyta się jak głos autora wpisu. */
	pullquoteAuthor: z.string().optional(),
	/**
	 * Szkic: plik jest w repo i w kolekcji, ale `collections.ts` nie wypuszcza
	 * go na listy, do sitemapy, RSS-u, llms.txt ani pod własny adres.
	 */
	draft: z.boolean().default(false),
	/**
	 * Opublikowany, ale niewidoczny: ma adres, kartę OG i jest w sitemapie,
	 * tylko nie trafia na listy, stronę główną, prev/next, RSS ani llms.txt –
	 * dostanie się tu tylko ktoś z bezpośrednim linkiem albo z wyszukiwarki.
	 */
	unlisted: z.boolean().default(false),
	/**
	 * ID utworu z open.spotify.com/track/<id> – osadza odtwarzacz w kolumnie
	 * „W skrócie". Pole zamiast iframe'u w markdownie, bo korpus wpisu
	 * dopuszcza tylko akapity, ##, ###, linki, strong i em. Odtwarzacz ładuje
	 * się bez banera – uzasadniony interes, wpis w PRIVACY_TOOLS, ta sama
	 * konwencja co na olageppert.pl.
	 */
	spotifyTrackId: z.string().optional(),
	/**
	 * Grafika w kolumnie „W skrócie", pod leadem – ten sam slot co odtwarzacz.
	 * Pole zamiast `![]()` w treści z tego samego powodu co wyżej: korpus
	 * wpisu zostaje tekstowy, a obrazek dostaje własne miejsce w siatce
	 * zamiast łamać dwie łamy notatki. Astro optymalizuje ją przy buildzie.
	 *
	 * Ścieżka `/blog/…` jest względem `src/assets` – tak zapisuje ją media
	 * manager Tiny (`publicFolder: "src/assets"` w tina/config.ts). `image()`
	 * szuka pliku względem wpisu, więc zamieniamy ją tu na `../../assets/blog/…`.
	 * Ścieżka względna od razu przechodzi bez zmian.
	 */
	image: z
		.preprocess(
			(path) => (typeof path === "string" && path.startsWith("/") ? `../../assets${path}` : path),
			image(),
		)
		.optional(),
	imageAlt: z.string().optional(),
	/**
	 * Okładka ustawiona ręcznie w /admin (pole „Okładka”, tina/cover-field.tsx).
	 * Bez niej okładkę przydziela `allocateCovers` (src/covers.ts) – ze sluga,
	 * bez powtórek. Tina zapisuje pole dopiero, gdy ktoś coś w nim zmieni.
	 */
	cover: z
		.object({
			template: z.number().int().min(1).max(5),
			colorway: z.number().int().min(1).max(8),
			mirror: z.boolean(),
			seed: z.number().int().min(0).max(99999),
			roles: z.number().int().min(0).max(5).default(0),
		})
		.nullish(),
});

const requireAlt = {
	check: (d: { image?: unknown; imageAlt?: string }) => !d.image || !!d.imageAlt,
	message: "Wpis z `image` musi mieć `imageAlt`.",
	path: ["imageAlt"],
};

/** Baza wiedzy: poradniki bez daty ważności, grupowane kategorią. */
const wiedza = defineCollection({
	loader: loader("./src/content/wiedza"),
	schema: ({ image }) =>
		z
			.object({
				...base(image),
				category: z.enum(CATEGORIES),
				/** Default trzyma wpisy sprzed wprowadzenia formatów przy życiu bez edycji. */
				kind: z.enum(KINDS).default("notatka"),
				/**
				 * Fraza główna wpisu. Bez niej deduplikacja tematów porównywałaby tytuły,
				 * a dwa różnie zatytułowane wpisy o tym samym konkurują ze sobą w wyszukiwarce.
				 */
				keyphrase: z.string().optional(),
			})
			.refine(requireAlt.check, requireAlt),
});

/** Aktualności: jeden strumień chronologiczny, `kind` mówi, co to za wpis. */
const aktualnosci = defineCollection({
	loader: loader("./src/content/aktualnosci"),
	schema: ({ image }) =>
		z
			.object({
				...base(image),
				kind: z.enum(Object.keys(NEWS_KINDS) as [keyof typeof NEWS_KINDS]),
				/** Data wydarzenia, gdy wpis je zapowiada lub relacjonuje – nie data publikacji. */
				eventDate: calendarDate.optional(),
				/** Miejsce wydarzenia – miasto albo sala, w formie do wyświetlenia. */
				place: z.string().optional(),
				keyphrase: z.string().optional(),
			})
			.refine(requireAlt.check, requireAlt),
});

export const collections = { wiedza, aktualnosci };
