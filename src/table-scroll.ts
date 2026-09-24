import type { HastPluginDefinition } from "satteri";

/**
 * Owija każdą tabelę z markdownu w `div.table-scroll`, żeby na telefonie
 * przewijała się w poziomie zamiast ściskać komórki.
 *
 * Samo CSS na `table` tego nie załatwia: `display: block; overflow-x: auto`
 * na tabeli sprawia, że wiersze układają się w anonimową tabelę dopasowaną do
 * szerokości bloku – pięć kolumn ściska się do 15 px każda i nic nie wystaje,
 * więc nie ma czego przewijać. Przewijać musi się element NAD tabelą,
 * a tabela pod nim musi mieć `min-width`. W markdownie nie ma jak wpisać
 * wrappera, stąd wtyczka; klasa dostaje style w `[...slug].astro`.
 */
export const tableScroll: HastPluginDefinition = {
  name: "table-scroll",
  element: {
    filter: ["table"],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [],
      });
    },
  },
};
