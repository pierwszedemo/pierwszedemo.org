import founders from "./content/strony/fundatorzy.json" with { type: "json" };
import activities from "./content/strony/dzialania.json" with { type: "json" };
import homepage from "./content/strony/strona-glowna.json" with { type: "json" };
import { OLA_ID, PERSON_ID } from "./consts";

/*
 * Treści edytowane w Tinie (src/content/strony/*.json), złożone z polami,
 * które zostają w kodzie. Osobny moduł, nie consts.ts: consts.ts importuje
 * też skrypt banera zgód, a domyślnego importu JSON-a bundler nie przycina –
 * bio i opisy działań lądowały w JavaScripcie wysyłanym do przeglądarki.
 * Tego modułu nie wolno importować z kodu klienckiego (src/scripts/).
 */

/**
 * Fundatorzy i zarazem cały Zarząd. Kolejność = kolejność na stronie.
 * `name` to forma używana w treści, `fullName` – w danych zarządu (jak w KRS).
 *
 * Treść (bio, funkcje, adresy) jest w src/content/strony/fundatorzy.json, bo
 * edytuje ją Tina. Tu zostaje to, czego edytor zmieniać nie może: `id` (kotwica
 * na /fundacja, klucz zdjęcia) i `schemaId` (węzeł Person w JSON-LD). Dlatego
 * JSON to obiekt z kluczami osób, a nie lista – nowej osoby nie da się dodać
 * w CMS-ie bez zdjęcia i węzła schema.org, które są w kodzie.
 */
export const FOUNDERS = [
  { id: "michal", schemaId: PERSON_ID, ...founders.michal },
  { id: "ola", schemaId: OLA_ID, ...founders.ola },
] as const;

/**
 * Działania – § 6 statutu przełożony na programy, którymi fundacja faktycznie
 * mówi o sobie. Etykiety niosą słowo branżowe („koncerty”, „nagrania”), bo
 * trafiają do h3 na /fundacja, do hero i do llms.txt. `href` prowadzi tam,
 * gdzie działanie już się dzieje; bez niego program ma tylko opis. Treść
 * w src/content/strony/dzialania.json (edytuje ją Tina); `id` to kotwica na
 * /fundacja, do której linkują hero i llms.txt – zmiana psuje te linki.
 */
export const ACTIVITIES = activities.activities.map((activity, index) => ({
  ...activity,
  /** Numer porządkowy z kolejności – po przestawieniu w Tinie nie trzeba go poprawiać. */
  no: String(index + 1).padStart(2, "0"),
}));

/**
 * Projekty, którymi fundacja zajmuje się teraz – slot na stronie głównej,
 * w którym wcześniej stał roster managera. Wydawnictw fundatorki tu nie ma,
 * i to jest zasada, nie przeoczenie: projekt fundatora stoi na stronie
 * fundacji tylko wtedy, gdy wynika z celu statutowego (koncert, warsztat)
 * i z jawną rolą, nigdy jako promocja wydawnictwa – patrz AGENTS.md.
 * Linki zewnętrzne dostają UTM-y przez `withUtm()` w miejscu użycia. Lista
 * w src/content/strony/strona-glowna.json (`teraz`), edytuje ją Tina.
 */
export const PROJECTS = homepage.teraz;

/**
 * Teksty strony głównej, które edytuje Tina (src/content/strony/strona-glowna.json).
 * Nagłówek h1 zostaje w kodzie: to fraza pod wyszukiwarkę (patrz AGENTS.md).
 */
export const HOMEPAGE = homepage;
