# Format wpisu – kontrakt z rendererem

## Dlaczego to kontrakt, a nie styl

Ograniczenia w tym pliku nie są preferencją redakcyjną. Wynikają z tego, jak
`src/pages/blog/[...slug].astro` renderuje treść.

Blok `<style>` w tym pliku stylizuje **wyłącznie** `p`, `h2`, `h3` i `a`. Wszystko inne
wpada w Tailwind Preflight, który kasuje punktory i marginesy list, zeruje marginesy
`blockquote`, `pre` i `hr`. Lista markdownowa **nie zepsuje buildu** – wyrenderuje się jako
ciąg linijek bez punktorów i bez odstępów, czyli jako coś, co wygląda na błąd. Dlatego
zakaz jest egzekwowany grepem z sekcji „Weryfikacja" w `SKILL.md`, a nie nadzieją.

Drugie sprzężenie: pole `kind` steruje układem łamów.

```astro
<div
  class:list={[
    "prose-swiss px-5 py-9 text-body md:px-10",
    post.data.kind === "notatka" &&
      "lg:[column-count:2] lg:[column-gap:40px]",
  ]}
>
```

Wygląda na zbędny warunek. Jest warunkiem czytelności każdego przewodnika: przy 1500
słowach łama jest wyższa niż ekran, więc czytelnik musiałby zjechać na sam dół strony
i wrócić na górę po drugą. Notatka mieści się w ekranie i dwie łamy są tam całym pomysłem
na typografię. Jeśli ktoś kiedyś zrefaktoryzuje ten warunek jako „martwy kod", przewodniki
staną się nieczytelne i nikt nie połączy tego z commitem.

Do tego jedna reguła odstępu:

```css
.prose-swiss :global(p + h2),
.prose-swiss :global(p + h3) {
  margin-top: 30px;
}
```

`p + h2` zamiast `:not(:first-child)` – omija wojnę o specyficzność z Tailwindem i nie
rozdziela pary `h2` + `h3`, gdy sekcja zaczyna się od podsekcji.

Trzecia reguła dotyczy pogrubień:

```css
.prose-swiss :global(strong) {
  font-weight: 600;
  color: var(--color-ink);
}
```

Bez niej Preflight ustawia `font-weight: bolder`, co z akapitu o wadze 400 daje 700 –
czyli wyróżnione zdanie byłoby cięższe niż tytuł wpisu. W całym projekcie mocniejszy
tekst to 600; `font-bold` ma wyłącznie wordmark w nawigacji.

## `kind: notatka`

| | |
|---|---|
| Długość | **300–500 słów** treści (bez frontmattera) |
| Struktura | 5–8 akapitów po 1–4 zdania, **zero śródtytułów** |
| Rytm | co najmniej jeden akapit jednozdaniowy, co najmniej co piąte zdanie ≤5 słów |
| Markdown | akapity, `[tekst](url)`, `**pogrubienie**` |
| Linki | 0–2; zero jest stanem domyślnym |
| `readingMinutes` | 2–3 |

Cztery najstarsze wpisy (`jak-przygotowac-epk`, `pre-save-to-nie-strategia`,
`booking-festiwalowy-od-kuchni`, `ile-kosztuje-niezalezny-singiel`) mają 103–193 słowa.
Są wzorcem **głosu i rytmu**, nie długości – widełki 300–500 są decyzją redakcyjną
podjętą później i to one obowiązują.

## `kind: przewodnik`

| | |
|---|---|
| Długość | **1200–2000 słów** treści |
| Struktura | 2–3 akapity wstępu bez śródtytułu → 4–6 sekcji `##` po 200–350 słów → `## Najczęstsze pytania` → `## Podsumowanie` |
| FAQ | 3–5 pytań jako `###`, odpowiedź 40–70 słów |
| Markdown | akapity, `##`, `###`, `[tekst](url)`, `**pogrubienie**` |
| Linki | 2–4 wewnętrzne + źródło przy pierwszym wystąpieniu każdej liczby |
| `readingMinutes` | 7–11 |

Nagłówków jest **6–10 na wpis**, licząc `##` i `###` razem – w korpusie autora nawet
700-wyrazowy tekst dostaje 5–7 śródtytułów, więc rzadkie nagłówki brzmią nie jak on.

Domyślny kształt nagłówka to **krótka fraza rzeczownikowa**, często jedno- lub
dwuwyrazowa („Sól", „Pieprz", „Cena i podsumowanie"). Mniej więcej **co dziesiąty
nagłówek jest pytaniem czytelnika** – prawdziwym, nie retorycznym ozdobnikiem:
„Po co w ogóle rejestrować utwór?", „Skąd się to bierze?", „Co zrobić, jak żyć?".

`## Podsumowanie` jako ostatnia sekcja **jest kanonem tego autora**, nie kliszą – kończy
tak niemal każdy dłuższy tekst. Zakazane zostają `Wstęp`, `Wnioski` i `Kluczowe wnioski`.

**Bez sekcji `## Źródła` na końcu.** Blok „Nazwa – [tytuł](URL), sprawdzone DD.MM.RRRR"
to aparat naukowy w blogu praktyka i renderuje się jako kilka nierozróżnialnych akapitów
15,5 px. Cytatem jest link inline przy pierwszym wystąpieniu liczby.

## Wybór formatu

Przewodnik, gdy spełnione **co najmniej dwa** z czterech:

1. procedura ma ≥4 rozłączne kroki albo ≥4 nazwane byty do rozróżnienia;
2. odpowiedź zależy od liczb wymagających źródła;
3. zapytanie jest evergreen (`jak…`, `ile…`, `czym różni się…`);
4. temat jest filarem swojej kategorii, a filaru jeszcze nie ma.

Twardy rozstrzygacz: konspekt bez czterech sekcji, z których każda uczciwie potrzebuje
≥250 słów, to notatka. Remis → notatka. Wpis o Oli Geppert → zawsze notatka.

## Frontmatter pole po polu

```yaml
---
title: Pre-save to nie strategia. To narzędzie
lead: Kampania singla nie zaczyna się od linku do pre-save. Zaczyna się od pytania, kto ma go kliknąć – i dlaczego akurat teraz.
category: Streaming
kind: notatka
date: 2026-06-11
keyphrase: pre-save spotify
readingMinutes: 2
---
```

- **`title`** – 25–48 znaków (korpus: 29–40). Do `<title>` doklejane jest
  ` – Michał Miszczyszyn`, czyli +22 znaki. Bez roku, bez dwukropka-klikbajtu
  („Pre-save: 7 rzeczy, które musisz wiedzieć" jest poza stylem tego bloga).
  Nagłówek `h1` ma `max-w-[18ch]`, więc długi tytuł łamie się na cztery linijki.
- **`lead`** – dokładnie 2 zdania, 120–180 znaków (korpus: 122/134/139/152). Trafia
  jednocześnie do `<meta name="description">`, `og:description`, pola `description`
  w `BlogPosting` **i** do widocznej kolumny „W skrócie". Musi bronić się jako zdanie.
- **`category`** – jedna z siedmiu wartości `CATEGORIES` w `src/consts.ts`.
- **`kind`** – `notatka` albo `przewodnik`. Ma default `notatka`, ale w nowych wpisach
  wpisuj jawnie.
- **`date`** – data publikacji, `YYYY-MM-DD`. Porządkuje listę i linki prev/next.
  Przy aktualizacji **nie ruszasz** tego pola.
- **`updated`** – opcjonalna, data rewizji faktów. Zasila `dateModified` w JSON-LD.
- **`keyphrase`** – fraza główna, 2–4 słowa po polsku. Jedyny mechanizm deduplikacji
  tematów: bez niej porównywalibyśmy tytuły, a dwa różnie zatytułowane wpisy o pitchingu
  konkurują ze sobą w wyszukiwarce.
- **`readingMinutes`** – liczba całkowita dodatnia, wzór niżej.

**Pułapka YAML:** wartość zawierająca `: ` (dwukropek ze spacją), zaczynająca się od `-`,
`#`, `[`, `{` albo `*`, musi być w cudzysłowie – inaczej `getCollection` rzuca błąd przy
buildzie. Tytuł „Spotify for Artists: konfiguracja" **musi** być zacytowany.

## `readingMinutes`

```
readingMinutes = max(2, round(słowa / 180))
```

```bash
sed '1,/^---$/d;1,/^---$/d' src/content/blog/<slug>.md | wc -w
```

180 słów na minutę, nie zwyczajowe 200–250: polski jest bardziej fleksyjny, a to teksty
z liczbami i nazwami instytucji, których się nie przelatuje wzrokiem. Podłoga 2, bo
„1 min czyt." w pasku metadanych czyta się jak przyznanie, że wpis jest pusty.

## Dozwolony i zakazany markdown

**Dozwolone:** akapity oddzielone pustą linią, `##`, `###`, `[tekst](url)`,
`**pogrubienie**`.

Pogrubienie ma własną regułę, bo łatwo je przedawkować: **jedno lub dwa całe zdania na
200 słów**. Nigdy pojedyncze słowo (wygląda jak zaznaczenie w podręczniku), nigdy cały
akapit, nigdy w ostatnim akapicie – puenta broni się pozycją, a nie grubością. Wyróżnia
się zdanie, które ma zostać w głowie kogoś, kto przeleciał wpis wzrokiem. Szablon
renderuje `strong` jako 600 w kolorze `--color-ink`, czyli tak samo jak śródtytuły –
wyróżnienie ma być czytelne, nie krzykliwe.

**Zakazane bezwzględnie**, z powodem:

| Element | Dlaczego |
|---|---|
| `- ` / `1. ` (listy) | Preflight kasuje punktory i marginesy – renderuje się jako zlepione linijki. Do tego lista punktowana jest najsilniejszym sygnałem tekstu pisanego przez model. |
| tabele | brak stylów; w łamie 15,5 px i tak nie mieszczą się szerokością |
| `>` (cytat blokowy) | Preflight zeruje marginesy – cytat wygląda jak zwykły akapit z wciętym tekstem |
| ` ``` ` i `` ` `` | brak stylów `pre`/`code`; to nie jest blog techniczny |
| `*kursywa*` | brak stylów; w korpusie nie występuje ani razu |
| `—` (em dash, U+2014) | jedyna dozwolona kreska w tekście to półpauza `–`; szczegóły w `styl.md` |
| `#` i `####`+ | `h1` należy do szablonu, głębsze poziomy nie mają stylów |
| `---` (linia pozioma) | Preflight zeruje marginesy, a w treści kolidowałaby wizualnie z krawędziami pasm |
| `![...]()` | blog jest wyłącznie tekstowy |
| surowy HTML, przypisy, emoji, wykrzykniki | poza stylem; emoji i wykrzyknik to sygnał contentu generowanego |

## Slug

Małe litery ASCII bez polskich znaków, myślniki, 3–5 słów, zawiera rdzeń frazy głównej.
Nazwa pliku **jest** adresem (`post.id` to nazwa pliku bez rozszerzenia), więc raz
opublikowanego sluga się nie zmienia.

## Kategorie i reguła rozstrzygania

| Kategoria | Zakres |
|---|---|
| **Promocja** | materiały i widoczność: EPK, one-sheet, bio, zdjęcia prasowe, praca z mediami |
| **Wydawnictwa** | sam akt wydania: dystrybutor, metadane ISRC/UPC, harmonogram premiery, EP vs singiel |
| **Streaming** | operacje na platformach: Spotify for Artists, pitching, Canvas, weryfikacja profilu, pre-save |
| **Koncerty** | booking, rider, aplikacje na showcase, trasy |
| **Finanse** | przepływ pieniędzy: OZZ i tantiemy, koszty, budżety, merch, sync, dotacje |
| **Zarządzanie** | praca menedżera: umowa, prowizja, podział ról, split sheet, roster |
| **Branża** | branża jako system: wydarzenia i konferencje, instytucje, eksport, kalendarz roku |

**Reguła:** *kategoria opisuje efekt pracy, o której jest wpis, a nie temat, o który
zahacza.* „Budżet trasy" to Finanse, choć dotyczy koncertów. „Jak aplikować na showcase"
to Koncerty (chodzi o zagranie), ale „Great September z perspektywy delegata" to Branża
(chodzi o bycie tam).

Siedem etykiet mieści się w kolumnie 190 px listingu – najdłuższe, „Wydawnictwa"
i „Zarządzanie", mają po 11 znaków. Dłuższa nazwa kategorii złamałaby wiersz.

## Migracja repo

Gdyby ktoś pracował na klonie sprzed wprowadzenia formatów, potrzebne są cztery zmiany.

1. **`src/consts.ts`** – siedem wartości `CATEGORIES` (jak w tabeli wyżej) plus
   `export const KINDS = ["notatka", "przewodnik"] as const;` i `export type Kind`.
2. **`src/content.config.ts`** – import `KINDS`, pola `kind: z.enum(KINDS).default("notatka")`,
   `updated: z.coerce.date().optional()`, `keyphrase: z.string().optional()`.
3. **`src/pages/blog/[...slug].astro`** – `const modified = isoDate(post.data.updated ?? post.data.date);`
   użyte w `blogPostingJsonLd.dateModified` i w propie `dateModified`; `class:list`
   z bramką `kind` na `column-count`; reguła CSS `p + h2, p + h3 { margin-top: 30px }`.
4. **`bun run build`** musi przejść.

## Świadomie odłożone

- **`FAQPage` w JSON-LD** – wymagałby pola `faq` we frontmatterze (kruchy YAML: dwukropki
  i cudzysłowy w pytaniach) albo parsowania treści. Duplikowałby też tekst widoczny na
  stronie. Pytania FAQ żyją jako `###` pod `## Najczęstsze pytania`; węzeł można dodać
  później, parsując wyrenderowany HTML.
- **Style dla `ul`/`ol`/`table`/`strong`** – ich dodanie zaprasza do używania znaczników,
  których zakaz jest jednocześnie najsilniejszą dźwignią przeciw tekstowi generycznemu.
- **`rel="noopener"` na linkach zewnętrznych** – Astro nie dodaje go automatycznie,
  a linki w treści nie mają `target="_blank"`, więc dziś nie ma czego zabezpieczać.
