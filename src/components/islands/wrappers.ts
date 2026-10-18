/**
 * Elementy, które obejmuje <TinaIsland>. Wyspa może nadać wrapperowi tylko
 * klasę – bez `id` i `aria-*` – więc wyspami są elementy, które ich nie mają:
 * sekcje z `aria-labelledby` i artykuły z kotwicą zostają w stronie, a wyspa
 * obejmuje ich wnętrze. Klasa musi być ta sama na stronie i w odpowiedzi
 * /tina-island/[name], bo bridge podmienia cały element.
 */
export const wrappers = {
	"home-hero": { tag: "div", className: "flex min-w-0 flex-[999_1_32.5rem] flex-col gap-8" },
	"home-o-nas": { tag: "div", className: "flex min-w-0 flex-[1_1_35rem] flex-col gap-8" },
	"home-dzialania": { tag: "div", className: "flex flex-col gap-10 md:gap-14" },
	"home-teraz": { tag: "div", className: "flex flex-col gap-6" },
	"home-dolacz": { tag: "div", className: "wrap flex flex-col gap-12 py-20 md:py-30" },
	"home-kontakt": { tag: "p", className: "text-body" },
	// `contents`: nagłówek rysuje PageHeader z własnym <header>, wrapper
	// wyspy nie może mu dokładać pudełka.
	"fundacja-naglowek": { tag: "div", className: "contents" },
	"fundacja-misja": { tag: "div", className: "flex min-w-0 flex-[1_1_35rem] flex-col gap-6" },
	"fundacja-dzialania": { tag: "ol", className: "border-t-[1.5px] border-ink" },
	fundator: { tag: "div", className: "flex flex-col gap-6 md:pt-2" },
} as const;
