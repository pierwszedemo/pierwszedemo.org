import type { HastPluginDefinition } from "satteri";
import type { Element } from "hast";

/**
 * Dwie wtyczki do tabel z markdownu, uruchamiane w tej kolejności.
 *
 * 1. `tableLabels` – każda komórka `td` dostaje `data-label` z tekstem
 *    nagłówka swojej kolumny. Poniżej 800 px szerokości łamu CSS
 *    w `[...slug].astro` rozkłada tabelę na bloki „etykieta: wartość"
 *    i etykietę bierze właśnie stąd, bo `thead` jest wtedy ukryty.
 * 2. `tableScroll` – tabela zostaje owinięta w `div.table-scroll`, który
 *    jest kontenerem dla zapytania `@container` i awaryjnie przewija się
 *    w poziomie w przeglądarkach bez container queries.
 *
 * Osobne wtyczki, nie jedna: mutacje wewnątrz poddrzewa, które w tym samym
 * przebiegu zostało owinięte, są przez procesor odrzucane.
 */

const isElement = (node: unknown): node is Element =>
  typeof node === "object" && node !== null && (node as Element).type === "element";

const elementChildren = (node: Element, tagName: string) =>
  node.children.filter((c): c is Element => isElement(c) && c.tagName === tagName);

export const tableLabels: HastPluginDefinition = {
  name: "table-labels",
  element: {
    filter: ["td"],
    visit(node, ctx) {
      const index = ctx.indexOf(node);
      const tr = ctx.parent(node);
      const tbody = isElement(tr) ? ctx.parent(tr) : undefined;
      const table = isElement(tbody) ? ctx.parent(tbody) : undefined;
      if (index === undefined || !isElement(table)) return;
      const headRow = elementChildren(table, "thead").flatMap((t) => elementChildren(t, "tr"))[0];
      if (!headRow) return;
      // Nie `children.indexOf(node)`: węzeł w wizytorze to inny obiekt niż
      // ten w tablicy dzieci rodzica. `ctx.indexOf` liczy też białe znaki
      // między komórkami, więc numer kolumny to liczba `td` przed nim.
      const column = isElement(tr)
        ? tr.children.slice(0, index).filter((c) => isElement(c) && c.tagName === "td").length
        : -1;
      const th = elementChildren(headRow, "th")[column];
      if (!th) return;
      ctx.setProperty(node, "dataLabel", ctx.textContent(th));
    },
  },
};

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
