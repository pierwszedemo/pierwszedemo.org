// Klasy wierszy /fundacja – wspólne dla strony i wysp edycji wizualnej
// (src/components/islands), które renderują te same listy na żądanie.

// Lewa kolumna etykiet to kolumna boczna siatki (5 z 16 modułów). Opisy
// pozycji zaczynają się na linii 8 (środek strony), stąd w listach tor
// `3 moduły − 2 rem`: padding listy (2.5 rem) + tor + gap (2 rem) = linia 8
// + 2.5 rem, oś tekstu jak w treści.
export const row = "grid border-b border-hairline md:grid-aside-left";
export const rowLabel =
  "label px-5 pt-7 text-muted md:border-r md:border-hairline md:px-8 md:py-10";
export const rowBody = "px-5 py-7 md:px-8 md:py-10 lg:px-10";
export const prose =
  "flex max-w-[62ch] flex-col gap-5 text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.6] text-body";
export const list = "divide-y divide-hairline px-5 py-3 md:px-8 lg:px-10";
export const item =
  "grid gap-2 py-6 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[calc(var(--col)*3_-_2rem)_minmax(0,1fr)]";
export const itemText =
  "max-w-[52ch] text-[clamp(1rem,1.4vw,1.125rem)] leading-[1.6] text-body";
export const link = "underline decoration-1 underline-offset-4";
