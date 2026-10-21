---
name: instagram-carousel
description: Generuje grafiki na Instagram z istniejącego wpisu na blogu pierwszedemo.org – karuzelę 1080×1350 (4:5) (okładka z hookiem, 1–4 slajdy teza+konkret, slajd CTA) albo jeden z formatów pojedynczych (mit/fakt, lista „zapisz na później”, pytanie do publiczności, jedna liczba) plus gotowy opis posta. Grafiki rysuje skrypt satori+sharp na „poświacie” – kolorowej ramie przechodzącej miękko w pole drugiego koloru, w barwach okładki wpisu – z dużym Instrument Serif i znakiem „Fundacja / pierwsze demo”; wynik ląduje w instagram/_<data>-<slug>-<typ>/. Użyj, gdy pada „karuzela na Instagram”, „grafiki na IG”, „post na Instagram z wpisu”, „mit i fakt”, „checklista na IG”, „pytanie na Instagram”, „grafika z liczbą”, „promocja wpisu w social mediach”.
---

# instagram-carousel

Zamieniasz opublikowany wpis z bloga pierwszedemo.org na karuzelę na Instagram:
okładka, 1–4 slajdy treści, slajd CTA i opis posta. Karuzela jest zajawką, nie
streszczeniem – ma zostawić jedną myśl i skierować po resztę na blog. Czytelnik
na Instagramie scrolluje; każdy slajd musi bronić się w dwie sekundy.

## Zasady, których nie wolno złamać

1. **Żadnych treści spoza wpisu.** Slajdy kondensują to, co już stoi w tekście –
   nie dopisujesz przykładów, liczb ani tez, których tam nie ma.
2. **Liczba na slajdzie tylko wtedy, gdy we wpisie ma link do źródła.** Na
   grafice nie da się linkować, więc jedynym pokryciem liczby jest wpis. Liczba,
   która we wpisie jest hipotezą, na slajd nie wchodzi wcale.
3. **Hook to nie tytuł.** Okładka ma zatrzymać kciuk: teza wbrew intuicji,
   pytanie albo konkret z wpisu. Przeklejenie `title` z frontmattera to
   ostateczność, nie domyślna droga. Klikbajt tak, kłamstwo nie – hook musi
   wynikać z tekstu wpisu, nie obiecywać rzeczy, których wpis nie dowozi.
4. **Typografia jak na blogu:** cudzysłowy „…” (U+201E/U+201D), jedyna kreska to
   półpauza `–` (U+2013), em dash `—` nie występuje nigdzie – ani na slajdach,
   ani w opisie. `15 000` i `179 zł` ze spacją.
5. **Nie commituj bez prośby.**

## Krok 1 – wybór wpisu

Kandydatami są wyłącznie opublikowane wpisy – `src/content/wiedza/*.md` i
`src/content/aktualnosci/*.md` **bez**
wpisów z `draft: true` (szkic nie ma adresu, więc nie ma czego promować –
skrypt odmówi). Slug to nazwa pliku **bez** prefiksu daty i rozszerzenia:
`2026-08-11-grupa-docelowa-artysty.md` → `grupa-docelowa-artysty`.

- Jeśli użytkownik podał slug albo temat – dopasuj po slugu, `title`,
  `keyphrase` i `lead`. Jedno pewne trafienie: jedź dalej i tylko powiedz, który
  wpis bierzesz.
- Niejednoznacznie albo wcale: wypisz listę (tytuł, kategoria, data) i **zapytaj
  użytkownika** (AskUserQuestion). Nie zgaduj.
- Katalog wynikowy to `instagram/_RRRR-MM-DD-<slug>-<typ>/`, gdzie `<typ>` to
  `karuzela`, `mit`, `zapisz`, `pytanie` albo `liczba` – jeden post na Instagram = jeden
  katalog, w każdym te same pliki: `spec.json`, `NN.png`, `alt.txt`,
  `caption.txt`. Prefiks daty jest z nazwy pliku wpisu, skrypt dobiera go
  sam; `<data>` poniżej oznacza właśnie tę datę. Podkreślenie na początku
  znaczy: jeszcze nieopublikowane na Instagramie. Użytkownik zdejmuje
  je ręcznie, gdy post pójdzie na Instagram – `ls instagram/` pokazuje wtedy,
  co czeka w kolejce. Katalog bez podkreślenia to post już opublikowany;
  skrypt zapisuje do niego, jeśli istnieje, więc regeneracja nie tworzy
  duplikatu obok.
- Jeśli `instagram/_<data>-<slug>-karuzela/` już istnieje, powiedz o tym –
  ponowne uruchomienie nadpisuje grafiki, a użytkownik mógł chcieć wariant,
  nie podmianę.

## Krok 2 – lektura i plan slajdów

Przeczytaj **cały wpis**, nie sam frontmatter. Z lektury wynoś:

- **hook** na okładkę – najmocniejsze zdanie albo najbardziej przewrotna teza
  wpisu, przepisana na 40–110 znaków. Dobre hooki tego bloga brzmią jak lead:
  konkret, zaskoczenie, czasem pytanie.
- **1–4 punkty** na slajdy treści – po jednej myśli na slajd. **Notatka
  dostaje 1–2 slajdy treści, przewodnik 2–4** (po jednym na najważniejsze
  sekcje `##`). Liczba slajdów rośnie z długością wpisu, nie z liczbą
  argumentów: notatka na 400 słów rozpisana na trzy pełne slajdy jest
  przepisaną notatką, a nie zajawką. Punkt, który nie mieści się w limicie,
  jest kandydatem do wycięcia, nie do skrócenia w bełkot.
- **Parafrazuj, nie cytuj.** Zdania na slajdzie mają być krótsze i ostrzejsze
  niż w tekście – własne streszczenie myśli, nie akapit przeklejony z wpisu.
  Jeśli `body` da się odnaleźć we wpisie słowo w słowo, przepisz je od nowa.
- **Slajd = teza + jeden konkret, bez wniosku.** Celuj w 80–160 znaków
  `body` przy notatce, 120–220 przy przewodniku. Konkret (scena, liczba ze
  źródłem, kontrast) jest obowiązkowy – to on zatrzymuje kciuk; sama teza
  w jednym zdaniu czyta się jak slogan i nie angażuje. Wniosek, uzasadnienie
  i „co z tym zrobić” zostają we wpisie – to one są powodem kliknięcia.
  Limit 440 znaków w walidatorze to geometria kadru, nie cel.
- **Test proporcji:** cały tekst karuzeli (hook + wszystkie `body`) ma być
  wyraźnie krótszy niż jedna czwarta wpisu. Jeśli ktoś po przeczytaniu
  slajdów nie ma już po co wchodzić na blog, karuzela jest za długa –
  ma zaciekawić, nie zastąpić tekst.
- Ostatni slajd treści kończy się niedopowiedzeniem albo pytaniem („Co, jeśli
  przegra?”) – powód, żeby wejść na blog, ma zostać.

Styl tekstu na slajdach = styl bloga: krótkie zdania, „Ty/Ci/Twój” wielką
literą, opinia oznajmująco, zero fraz w rodzaju „w dzisiejszych czasach”,
„kluczem do sukcesu”, „gamechanger”.

## Krok 3 – specyfikacja `spec.json`

Zapisz do `instagram/_<data>-<slug>-karuzela/spec.json`:

```json
{
  "cover": {
    "eyebrow": "Promocja",
    "hook": "Grupa docelowa to zakład. Z terminem rozliczenia."
  },
  "slides": [
    {
      "heading": "ICP przed premierą to hipoteza",
      "body": ["Akapit pierwszy.", "Opcjonalny akapit drugi."]
    }
  ],
  "cta": {
    "lines": ["Obserwuj.", "Zapisz.", "Wróć po więcej."],
    "url": "pierwszedemo.org/wiedza/<slug>"
  }
}
```

- `cover.eyebrow` – kategoria wpisu z frontmattera; ≤40 znaków. Bez niej
  skrypt wstawi „Blog”, ale kategoria mówi więcej – podawaj ją zawsze.
- `cover.hook` – 40–110 znaków (dolną granicę pilnujesz sam, skrypt egzekwuje
  tylko górną); stopień pisma dobiera się do długości, 170→92 px, i maleje
  sam, gdy najdłuższe słowo nie zmieściłoby się w kolumnie. `\n` w hooku
  to twarde łamanie wiersza – przydaje się, gdy nazwa wydarzenia albo
  produktu ma stać w osobnej linii („Great September 2026.\nKoncerty…”).
  W `alt.txt` zamienia się na spację.
- `slides` – 1–4 pozycje; `heading` ≤64 znaki, `body` to string albo tablica
  1–6 akapitów, łącznie ≤440 znaków **licząc spację między akapitami** (górna
  granica geometrii; redakcyjnie celuj w 80–160 przy notatce, 120–220 przy
  przewodniku – patrz krok 2).
- `cta` jest opcjonalne – domyślne wartości (powyżej) są dobre w 90% przypadków;
  `lines` to tablica 1–4 linii po ≤22 znaki, `url` ≤60 znaków i musi zaczynać
  się od `pierwszedemo.org/` (stare specyfikacje mają `pierwszedemo.com/blog/…`
  – skrypt je odrzuci). Najlepiej nie podawać `url` wcale: skrypt składa go
  sam z działu i sluga. Adres renderuje się małymi literami – ścieżki na
  hostingu rozróżniają wielkość liter.
- Żadne słowo nie może być dłuższe niż: 17 znaków w hooku, 26 w nagłówku, 30
  w akapicie, 16 w linii CTA – satori nie dzieli wyrazów. Nagłówki serifem
  same zmniejszają stopień pod najdłuższe słowo (`serifFit`), ale długie słowo
  ściąga wtedy cały hook w dół; akapitów to nie dotyczy. Długi adres albo
  hashtag w treści slajdu to zły pomysł także z tego powodu.

Limity to geometria, nie sugestia: satori nie zmniejsza tekstu i nadmiar
wyjeżdża poza kadr. Walidacja w skrypcie je egzekwuje i wypisuje wszystkie
błędy naraz. Slug musi wskazywać istniejący `src/content/{wiedza,aktualnosci}/RRRR-MM-DD-<slug>.md` –
(skrypt sam znajduje dział i wstawia go do adresu na slajdzie CTA);
adres wpisu trafia na slajd CTA jako piksele, więc literówki nie da się
później poprawić. Wariant karuzeli dla tego samego wpisu (bez nadpisywania)
zrób pod nazwą `<slug>-v2` – skrypt odmówi, bo pod takim slugiem nie ma wpisu;
skopiuj wtedy gotowy katalog ręcznie, nie obchodź walidacji.

## Krok 4 – generacja

Z katalogu głównego repo:

```bash
bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>
```

Powstaje `instagram/_<data>-<slug>-karuzela/01.png` (okładka), `02.png…`
(treść), ostatni numer to CTA. Każdy slajd stoi na **poświacie**: kolor przy
krawędzi kadru przechodzi przez białą poświatę w jasne pole drugiego koloru,
a czarny tekst stoi na tym polu.

- **Para kolorów karuzeli** wynika z okładki wpisu – tej samej kolorystyki,
  którą wpis ma jako obrazek OG i na karcie na stronie (`postCover()` liczy ją
  tym samym `allocateCovers()` co build, z frontmattera wszystkich wpisów,
  z ręczną okładką z /admin, jeśli jest). Pula ma 12 par; czterem
  kolorystykom przysługują po dwie, a wybiera je okładka wpisu. Pigułka
  kategorii ma kolor tej kolorystyki.
- **01 – hook** w ogromnym serifie (do 170 px), na środku kadru.
- **Treść** – nagłówek serifem (92→68 px) i akapity Instrument Sans 34 px.
- **CTA** – para karty marki (ultramaryna w limonkę), linie CTA serifem,
  adres, hasło fundacji.

Każdy kadr ma te same ramy: u góry znak „Fundacja / pierwsze demo” i numer
slajdu, na dole pigułka kategorii i (poza okładką i CTA) adres serwisu. Tekst
trzyma się 150 px od krawędzi – nie wchodzi na kolorową ramę. Obok ląduje `alt.txt` – jedna
linia na slajd (`NN: nagłówek. akapity`), do wklejenia w pole tekstu
alternatywnego przy publikacji; powstaje z `spec.json`, więc nie edytuj go
ręcznie. Skrypt najpierw usuwa stare `NN.png` z katalogu, więc
po skróceniu karuzeli nie zostają slajdy z nieaktualną numeracją.

Podgląd bez ruszania `instagram/` (np. do akceptacji albo dla posta, który
już poszedł): `--out <katalog>` zapisuje PNG-i i `alt.txt` gdzie indziej,
`--spec <plik>` czyta specyfikację z innego pliku – oba działają też
w `format.mjs`. PNG 1080×1350 (4:5) – Instagram i tak przekompresuje je do
JPG, ale gładkie przejścia poświaty wychodzą z PNG najczyściej.

## Krok 5 – kontrola wzrokowa

Obejrzyj (Read) **każdy** wygenerowany PNG. Walidacja łapie długości, ale nie
łamania wierszy:

- tekst nie dotyka krawędzi ani stopki, nic nie jest przycięte;
- tekst stoi na jasnym (albo, w formatach mit i liczba, czarnym) polu, nie na
  kolorowej ramie;
- hook łamie się w 2–5 wierszy, bez pojedynczego słowa-sieroty w ostatnim
  (skrypt skleja jednoliterowe spójniki z następnym słowem, ale sierotę
  na końcu akapitu usuwa się tylko przeredagowaniem);
- polskie znaki (ą, ś, ż…) wyglądają poprawnie;
- numeracja `NN/MM` zgadza się z liczbą plików.

Coś nie gra → popraw copy w `spec.json` i wygeneruj ponownie. Nie akceptuj
slajdu „na styk”.

## Krok 6 – opis posta (`caption.txt`)

Zapisz `instagram/_<data>-<slug>-karuzela/caption.txt`:

1. **Pierwsza linia ≤125 znaków** – tyle widać przed „więcej”. Wariacja hooka,
   nie jego kopia słowo w słowo.
2. Pusta linia, potem 2–4 zdania rozwinięcia – co czytelnik wynosi z wpisu.
   Rytm bloga: krótkie zdania, przynajmniej jedno bardzo krótkie.
3. Pusta linia, potem CTA – te same trzy rzeczy, co na slajdzie CTA: obserwuj
   profil, zapisz post na później, cały tekst na pierwszedemo.org (adres
   słowem – w opisie posta linki i tak nie są klikalne, więc nie udawaj linku).
4. Pusta linia, potem 3–6 hashtagów po polsku, niszowych, zgodnych z tematem
   (np. #muzykaniezalezna #managerartysty #wydawaniemuzyki). Bez #fyp,
   #instagood i innego spamu zasięgowego.

Zasady faktograficzne i typograficzne z sekcji „Zasady” obowiązują też tutaj.
Bramka: `grep -c '"' instagram/_<data>-<slug>-karuzela/caption.txt` i `grep -c '—'` muszą
zwrócić 0 – prosty cudzysłów i em dash nie mają prawa przejść.

## Krok 7 – raport

Maksymalnie 10 linijek: który wpis, ile slajdów i dlaczego tyle, hook, pierwsza
linia opisu, lista plików. Zaproponuj commit
`feat(ig): karuzela <slug>` – **bez commitowania bez prośby**.

## Formaty pojedyncze – mit / zapisz / pytanie / liczba

Trzy formaty obok karuzeli, do recyklingu tego samego wpisu w odstępie kilku
tygodni. Zasady z sekcji „Zasady” obowiązują w całości – treść wyłącznie
z wpisu, liczby tylko ze źródłem, typografia bloga. Wybór wpisu jak w kroku 1.
Każdy format dostaje własny katalog `instagram/_<data>-<slug>-<format>/`
z tym samym zestawem plików co karuzela (`spec.json`, `NN.png`, `alt.txt`,
`caption.txt`) – `ls instagram/` pokazuje od razu, co z danego wpisu już
poszło.

**Design celowo odbiega od karuzeli**, żeby profil nie zlał się w ścianę
podobnych kadrów. Ramy (poświata, znak u góry z etykietą formatu, pigułka
kategorii w kolorze okładki wpisu i adres na dole, kadr 4:5) są wspólne – to
one robią serię. Różni się para kolorów – stała dla formatu (`GLOWS`
w `lib.mjs`), a nie z okładki wpisu jak w karuzeli – i środek. Tego nie
ujednolicaj z powrotem:

- **mit** – dwa slajdy: 01 pomarańcz w czerń, „Mit” w ogromnym serifie,
  zdanie przekreślone bielą; 02 ultramaryna w ciepłą biel, „Fakt”
  w ultramarynie, teza wpisu, opcjonalne rozwinięcie. Spec:
  `{ "eyebrow", "mit" (≤110), "fakt" (≤140), "rozwiniecie"? (≤220) }`.
  Mit ma być zdaniem, które ktoś naprawdę mówi („Wytwórnia szuka talentów”),
  nie słomianą kukłą. Fakt to teza wpisu, nie jej zaprzeczenie słowo w słowo.
- **zapisz** – jeden slajd, limonka w ciepłą biel, tytuł i 3–6 numerowanych
  wierszy oddzielonych linią. Spec:
  `{ "eyebrow", "tytul" (≤60), "punkty": [3–6 × ≤90] }`. Punkty to rzeczy do
  *zrobienia* albo *sprawdzenia*, wzięte z wpisu – format działa, bo ktoś chce
  do niego wrócić; opinia bez instrukcji nie nadaje się na listę.
- **pytanie** – jeden slajd, ultramaryna w limonkę, wielki ultramarynowy „?”
  w serifie, pytanie wyśrodkowane. Spec:
  `{ "eyebrow", "pytanie" (≤120), "podpis"? (≤60, domyślnie „Odpowiedz
  w komentarzu”) }`. Pytanie ma mieć odpowiedź, którą da się wpisać w jednym
  słowie albo liczbie – „Ile rolek leży Ci na dysku?” działa, „Co sądzisz
  o strategii w socialach?” nie. Najlepsze pytanie to takie, które wpis już
  zadaje na końcu.
- **liczba** – jeden slajd, limonka w czerń: liczba w seledynowym serifie na
  pół kadru (do 5 znaków 300 px, dłuższe mniej), pod nią zdanie bielą. Spec:
  `{ "eyebrow", "liczba" (≤9, np. „0 zł”, „24,99 $”, „28 dni”), "zdanie"
  (≤170), "zrodlo"? (≤60, drobnym drukiem pod zdaniem) }`. Zasada 2 obowiązuje
  podwójnie: liczba ze statystyki wchodzi tylko z linkiem we wpisie
  (i wtedy podaj `zrodlo`); liczba będąca tezą wpisu („0 zł”) – tylko jeśli
  zdanie pod nią mówi dokładnie to, co wpis, bez zaokrąglenia w wygodną
  stronę.

Generacja i kontrola jak w krokach 4–5:

```bash
bun .agents/skills/instagram-carousel/scripts/format.mjs <slug> <mit|zapisz|pytanie|liczba>
```

Opis (`caption.txt`) jak w kroku 6, ale krótszy: pierwsza linia,
2–3 zdania, adres słowem, 3–5 hashtagów. Dla `pytanie` opis powtarza pytanie
i zaprasza do komentarza; dla `zapisz` mówi wprost „zapisz tę listę”.
Te same bramki na cudzysłów i em dash.

## Pliki i konwencje

- `scripts/lib.mjs` – wspólne ramy: kadr, poświata (`glowLayer` – rozmyte
  prostokąty SVG, które renderuje librsvg; `glowPair` – para z okładki wpisu;
  `GLOWS` – pary formatów i CTA; `glowTone` – kolory tekstu na jasnym albo
  czarnym środku), fonty, górny wiersz (`top` – znak `lockup()` z `src/og.ts`
  i numer albo etykieta), dolny (`bottom` – pigułka kategorii i adres),
  okładka wpisu (`postCover`), stopień serifu (`serifFit` – z długości tekstu,
  ale nie większy, niż pozwala najdłuższe słowo), walidacja, zapis PNG + alt.
- `scripts/generate.mjs` – karuzela; `scripts/format.mjs` – formaty
  pojedyncze. Oba tylko składają środek kadru z klocków `lib.mjs`. Nowy
  format = nowa gałąź w `format.mjs`, nie nowy skrypt.
- Fonty to statyczne TTF z `src/assets/fonts/` (te same co karty OG) –
  satori nie czyta woff2 ani fontów zmiennych.
- `instagram/` w korzeniu repo to katalog wynikowy – po podkatalogu na
  każdy post (`<data>-<slug>-<typ>`, z `_` na początku dopóki post nie
  poszedł na Instagram). Pliki się commituje: są częścią historii promocji
  wpisu.
