# Format wpisu – kontrakt z rendererem

## Dlaczego to kontrakt, a nie styl

Ograniczenia w tym pliku nie są preferencją redakcyjną. Wynikają z tego, jak
`src/pages/blog/[...slug].astro` renderuje treść.

Blok `<style>` w tym pliku stylizuje **wyłącznie** `p`, `h2`, `h3`, `a`, `strong` i `em`.
Wszystko inne
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
| Struktura | 5–10 akapitów po 1–4 zdania, **zero śródtytułów** |
| Rytm | co najmniej jeden akapit jednozdaniowy; co piąte zdanie ≤5 słów; co najmniej jedno ≥20 słów |
| Markdown | akapity, `[tekst](url)`, `**pogrubienie**`, `_kursywa_` |
| Linki | 1–3 wewnętrzne; linkowanie do własnych wpisów jest pożądane |
| `readingMinutes` | 2–3 |

Widełki 300–500 słów są decyzją redakcyjną, nie wnioskiem z istniejących wpisów.
Wpisy leżące w `src/content/blog/` nie są wzorcem niczego – powstały wcześniej z pomocą
modelu i nie oddają stylu autora. Wzorzec głosu i rytmu jest wyłącznie w `styl.md`.

## `kind: przewodnik`

| | |
|---|---|
| Długość | **1200–2000 słów** treści |
| Struktura | 2–3 akapity wstępu bez śródtytułu → 4–6 sekcji `##` po 200–350 słów → `## Najczęstsze pytania` → `## Podsumowanie` |
| FAQ | 3–5 pytań jako `###`, odpowiedź 40–70 słów |
| Markdown | akapity, `##`, `###`, `[tekst](url)`, `**pogrubienie**`, `_kursywa_` |
| Linki | 3–6 wewnętrznych + źródło przy pierwszym wystąpieniu każdej liczby |
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

- **`title`** – 25–60 znaków. Górna granica bierze się z układu, nie ze stylu: `h1` ma
  `max-w-[18ch]`, a do `<title>` doklejane jest ` – Michał Miszczyszyn`, czyli +22 znaki.
  Tytuł może być pytaniem („Czy pre-save w ogóle coś daje?") albo mieć formę
  „temat – doprecyzowanie" z półpauzą, bo obie występują u autora. Bez roku
  i bez klikbajtowego wyliczenia („7 rzeczy, które musisz wiedzieć").
- **`lead`** – 2–3 zdania, 120–180 znaków. Trafia jednocześnie do
  `<meta name="description">`, `og:description`, pola `description` w `BlogPosting`
  **i** do widocznej kolumny „W skrócie", więc musi bronić się jako zdanie, nie jako meta
  tag. Górna granica znaków jest twarda – dłuższy opis i tak zostanie ucięty w wynikach
  wyszukiwania. Lead **może kończyć się pytaniem** i u autora bardzo często tak robi.
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
sed '1,/^---$/d;1,/^---$/d' src/content/blog/<data>-<slug>.md | wc -w
```

180 słów na minutę, nie zwyczajowe 200–250: polski jest bardziej fleksyjny, a to teksty
z liczbami i nazwami instytucji, których się nie przelatuje wzrokiem. Podłoga 2, bo
„1 min czyt." w pasku metadanych czyta się jak przyznanie, że wpis jest pusty.

## Dozwolony i zakazany markdown

**Dozwolone:** akapity oddzielone pustą linią, `##`, `###`, `[tekst](url)`,
`**pogrubienie**`, `_kursywa_`.

Pogrubienie ma własną regułę, bo łatwo je przedawkować: **jedno lub dwa całe zdania na
200 słów**. Nigdy pojedyncze słowo – wygląda jak zaznaczenie w podręczniku. Nigdy
w ostatnim akapicie – puenta broni się pozycją, a nie grubością. Wyróżnia się zdanie,
które ma zostać w głowie kogoś, kto przeleciał wpis wzrokiem. Szablon renderuje `strong`
jako 600 w kolorze `--color-ink`, czyli tak samo jak śródtytuły – wyróżnienie ma być
czytelne, nie krzykliwe.

**Akapit jednozdaniowy wolno pogrubić w całości.** To ta sama figura co akapit
jednozdaniowy bez pogrubienia, tylko mocniejsza: zdanie stojące samo, niosące tezę
środka. Liczy się do limitu 1–2 na 200 słów jak każde inne wyróżnienie. Zakaz dotyczy
akapitu wielozdaniowego – tam pogrubienie przestaje wskazywać zdanie i zamienia w blok
całą myśl.

Kursywa jest dla terminu obcego, którego zdanie nie wchłonęło jako polskiego słowa
(„to jest _bet_"). Nie służy do emfazy – od tego jest pogrubienie – i nie stawia się jej
przy anglicyzmach, które odmieniają się normalnie (`pre-save'u`, `na showcase'ie`,
`playlisty`). Krój ma wczytany wariant `italic`, więc to prawdziwa kursywa, nie skos.

**Zakazane bezwzględnie**, z powodem:

| Element | Dlaczego |
|---|---|
| `- ` / `1. ` (listy) | Preflight kasuje punktory i marginesy – renderuje się jako zlepione linijki. Do tego lista punktowana jest najsilniejszym sygnałem tekstu pisanego przez model. |
| tabele | brak stylów; w łamie 15,5 px i tak nie mieszczą się szerokością |
| `>` (cytat blokowy) | Preflight zeruje marginesy – cytat wygląda jak zwykły akapit z wciętym tekstem |
| ` ``` ` i `` ` `` | brak stylów `pre`/`code`; to nie jest blog techniczny |
| `—` (em dash, U+2014) | jedyna dozwolona kreska w tekście to półpauza `–`; szczegóły w `styl.md` |
| `#` i `####`+ | `h1` należy do szablonu, głębsze poziomy nie mają stylów |
| `---` (linia pozioma) | Preflight zeruje marginesy, a w treści kolidowałaby wizualnie z krawędziami pasm |
| `![...]()` | blog jest wyłącznie tekstowy |
| surowy HTML, przypisy, emoji, wykrzykniki | poza stylem; emoji i wykrzyknik to sygnał contentu generowanego |

## Slug

Małe litery ASCII bez polskich znaków, myślniki, 3–5 słów, zawiera rdzeń frazy głównej.
Plik nazywa się `RRRR-MM-DD-<slug>.md` (data = `date` z frontmattera – żeby `ls`
pokazywał chronologię), a adresem jest sam slug: `generateId` w `content.config.ts`
zdejmuje prefiks daty, `post.id` to czysty slug. Raz opublikowanego sluga się nie
zmienia; prefiks również zostaje, bo `date` się nie zmienia (patrz tryb aktualizacji).
Szkic: `_RRRR-MM-DD-<slug>.md` – podkreślenie na początku, przed datą.

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
- **Style dla `ul`/`ol`/`table`** – ich dodanie zaprasza do używania znaczników, których
  zakaz jest jednocześnie najsilniejszą dźwignią przeciw tekstowi generycznemu. `strong`
  i `em` mają już swoje reguły w `[...slug].astro`, bo jedno niesie tezę, a drugie termin
  obcy – żadne z nich nie jest listą przebraną za akapit.
- **`rel="noopener"` na linkach zewnętrznych** – Astro nie dodaje go automatycznie,
  a linki w treści nie mają `target="_blank"`, więc dziś nie ma czego zabezpieczać.
