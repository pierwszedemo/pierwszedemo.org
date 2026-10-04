/**
 * Elementy, które obejmuje <TinaIsland>. Wyspa może nadać wrapperowi tylko
 * klasę – bez `id` i `aria-*` – więc wyspami są elementy, które ich nie mają:
 * sekcje z `aria-labelledby` i artykuły z kotwicą zostają w stronie, a wyspa
 * obejmuje ich wnętrze. Klasa musi być ta sama na stronie i w odpowiedzi
 * /tina-island/[name], bo bridge podmienia cały element.
 */
export const wrappers = {
  "home-hero": {
    tag: "div",
    className:
      "flex min-w-0 flex-col justify-between gap-14 border-b border-ink px-5 py-12 md:border-r md:border-b-0 md:px-8 md:pt-16 md:pb-11",
  },
  "home-teraz": { tag: "ul", className: "flex flex-col gap-6" },
  "home-kontakt": { tag: "p", className: "mt-2 max-w-[40ch] text-sm leading-[1.6] text-body" },
  "fundacja-dzialania": { tag: "ul", className: "divide-y divide-hairline px-5 py-3 md:px-8 lg:px-10" },
  fundator: { tag: "div", className: "flex flex-col gap-5 px-5 py-7 md:px-8 md:py-10 lg:px-10" },
} as const;
