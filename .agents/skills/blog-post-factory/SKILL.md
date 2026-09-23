---
name: blog-post-factory
description: Pisze wpisy na blog pierwszedemo.com – po polsku, z perspektywy menedżera artystów, całkowicie bez obrazków. Dwa formaty: „notatka" (300–500 słów, bez śródtytułów) i „przewodnik" (1200–2000 słów, sekcje H2 i FAQ). Prowadzi proces: odświeżenie własnych źródeł (olageppert.pl i ten serwis), wybór tematu i deduplikacja, wybór formatu, rejestr faktów ze źródłem dla każdej liczby, tekst, redakcja językowa, linkowanie, publikacja i build. Użyj, gdy pada „napisz wpis na bloga", „nowy wpis", „notatka na bloga", „przewodnik o…", „zaktualizuj wpis", „co napisać na bloga", albo gdy trzeba opisać temat branżowy: wydarzenia (Great September, showcase, konferencja), EPK i materiały prasowe, Spotify for Artists, wydawnictwo i dystrybucję, booking, tantiemy i pieniądze, umowę menedżerską, pracę z Olą Geppert.
---

# blog-post-factory

Piszesz wpisy na blog serwisu pierwszedemo.com. Prowadzi go Michał Miszczyszyn,
menedżer artystów z Gdańska, którego
roster to jedna artystka przed debiutem płytowym, Ola Geppert. Czytelnikiem jest inny
praktyk: muzyk bez wytwórni, początkujący menedżer, osoba prowadząca zespół. Blog nie
tłumaczy, czym jest streaming. Blog mówi, co z tym zrobić w poniedziałek rano.

## Cztery zasady, których nie wolno złamać

1. **Zero obrazków w treści.** Żadnych zrzutów ekranu, infografik, diagramów ani `![...]()`.
   Karta OG wpisu generuje się sama z `/og/<slug>.png` – to jedyny obrazek w okolicy wpisu
   i nie jest częścią treści.
2. **Żadnej cyfry bez linku do źródła pierwotnego.** Liczba, próg, stawka, termin, data –
   każda ma link przy pierwszym wystąpieniu. Brak źródła oznacza, że liczba wypada
   z tekstu. Nie wolno jej złagodzić („szacuje się", „podobno", „kilka tygodni").
   **Nie dotyczy to hipotez o mechanizmach** – te wolno stawiać i są najciekawszą
   częścią bloga, o ile są oznaczone słowem „prawdopodobnie", „podejrzewam",
   „wygląda na to, że". Szczegóły w `zrodla.md`.
3. **Fakty o Oli Geppert tylko z olageppert.pl i z `references/ola-geppert.md`.** Strony
   artystki czytasz w kroku 0 zawsze; WebSearch o niej jest zakazany.
4. **Nigdy nie wymyślaj doświadczenia.** Żadnych anegdot, „pewnego bookera", nienazwanych
   klientów, kwot z pamięci. Jeśli wpis potrzebuje wiedzy, której nie masz – **zapytaj
   użytkownika**. Puste miejsce zgłasza się, nie zapełnia zmyśleniem.

## Pliki referencyjne

| Plik | Kiedy go czytasz |
|---|---|
| `references/format.md` | krok 2 i 5 – kontrakt z rendererem, frontmatter, dozwolony markdown |
| `references/styl.md` | krok 4, 5 i 6 – głos, rytm, typografia, frazy zakazane |
| `references/zrodla.md` | krok 3 – zasady cytowania, adresy źródeł, wydarzenia |
| `references/ola-geppert.md` | krok 0 (odświeżenie z olageppert.pl) i zawsze, gdy pada nazwisko artystki |
| `references/tematy.md` | krok 1, gdy użytkownik nie podał tematu |

`ola-geppert.md` jest jedynym plikiem referencyjnym, który **sam się aktualizuje** –
krok 0 nanosi na niego różnice ze strony artystki. Pozostałe zmieniasz tylko wtedy,
gdy prosi o to użytkownik.

## Warunek wstępny

```bash
grep -q "kind" src/content.config.ts && echo OK
```

Brak trafienia oznacza, że repo nie przeszło migracji formatów. Zatrzymaj się i poproś
o wykonanie sekcji „Migracja repo" z `references/format.md`. Nie pisz wpisu na starym
schemacie – `bun run build` odrzuci frontmatter z polem `kind`.

## Tryby

**Nowy wpis** (domyślny) – kroki 1–7.

**Aktualizacja** – użytkownik prosi o odświeżenie istniejącego wpisu. Przelicz wszystkie
liczby od nowa (krok 3), sprawdź, czy linki żyją, podmień to, co się zdezaktualizowało,
ustaw `updated` na dzisiejszą datę. **Nie ruszaj `date` ani sluga** – data publikacji
porządkuje listę i prev/next, a zmiana sluga psuje adres, który ktoś mógł zapisać.
Commit `fix(blog): …`.

**Sam temat** – użytkownik pyta „co napisać na bloga". Wykonaj krok 1 i zatrzymaj się
na propozycjach. Nie pisz nic dalej bez potwierdzenia.

---

## Krok 0 – synchronizacja źródeł własnych

Wykonujesz **zawsze**, przed wyborem tematu, w każdym trybie. Dwa własne serwisy są
jedynymi źródłami, które wolno traktować jak prawdę bez dodatkowego potwierdzenia –
i jedynymi, które zmieniają się bez uprzedzenia.

### olageppert.pl

1. WebFetchem pobierz `https://olageppert.pl`, `https://olageppert.pl/bio`
   i `https://olageppert.pl/epk`.
2. Porównaj z `references/ola-geppert.md`: dyskografia, plany wydawnicze, opis gatunku,
   występy, kontakt, nazwa pliku PDF z EPK, wersja EPK, czego artystka aktualnie szuka.
3. **Jeśli cokolwiek się różni albo doszło – zaktualizuj `references/ola-geppert.md`**,
   zanim napiszesz pierwsze zdanie wpisu. Zmieniasz treść, podbijasz datę w nagłówku
   pliku („stan na …") i wypisujesz użytkownikowi, co się zmieniło. Twarde zakazy z góry
   dossier zostają nietknięte – aktualizujesz fakty, nie reguły.
4. Jeśli nic się nie zmieniło, nic nie zapisujesz. Nie podbijaj daty „na wszelki wypadek",
   bo wtedy przestaje ona cokolwiek znaczyć.
5. Strona jest ważniejsza niż dossier. Dossier istnieje po to, żeby nie zgadywać, gdy
   strona jest niedostępna, a nie po to, żeby ją zastępować.

Jeśli WebFetch zawiedzie, pracujesz na dossier i **mówisz o tym wprost w raporcie** –
razem z informacją, że fakty o artystce nie zostały odświeżone.

### pierwszedemo.com – ten serwis

Nie zgaduj, co jest na stronie, dla której piszesz. Przeczytaj:

- `src/consts.ts` – roster, usługi, tagline, miasto, kontakt, profile, kategorie;
- `src/pages/index.astro` – copy strony głównej, czyli jak serwis sam siebie opisuje;
- **treść wszystkich `src/content/blog/*.md`, nie sam frontmatter.**

Ostatni punkt jest ważniejszy, niż wygląda, i robi się go **przed** napisaniem czegokolwiek.
Frontmatter mówi, o czym są wpisy; dopiero treść mówi, **które argumenty już padły**.
Bez tego drugi tekst powtarza tezę pierwszego innymi słowami, obydwa robią się przez to
płytsze, a w wyszukiwarce konkurują ze sobą.

Z lektury wynoszysz dwie rzeczy:

- **czego nie powtarzać** – jeśli argument jest już rozwinięty gdzie indziej, w nowym
  wpisie zostaje po nim jedno zdanie i link;
- **gdzie linkować** – konkretne akapity w starych wpisach, które dotykają nowego tematu
  i przyjmą link zwrotny (krok 6).

Wpisy z podkreśleniem na początku nazwy (`_slug.md`) są niepublikowane – czytasz je,
żeby nie dublować treści, ale **nigdy do nich nie linkujesz**, bo nie mają adresu.

Repo jest źródłem prawdy o tym serwisie, bo to ono trafia na produkcję. Jeśli coś tam
doszło – nowa artystka w rosterze, nowa usługa, zmiana miasta, nowy kanał kontaktu –
**używasz tego w tekście i nie powtarzasz nieaktualnych sformułowań z wcześniejszych
wpisów**. Sprzeczność między starym wpisem a `consts.ts` rozstrzygasz na korzyść
`consts.ts` i zgłaszasz ją użytkownikowi jako kandydata do aktualizacji.

---

## Krok 1 – temat i deduplikacja

1. Temat pochodzi od użytkownika albo z `references/tematy.md`. Bez tematu **nie zgaduj** –
   przedstaw 3–5 propozycji z uzasadnieniem i zatrzymaj się.
2. Ustal **frazę główną** – to, czego czytelnik szuka w wyszukiwarce, po polsku, 2–4 słowa
   (`pre-save spotify`, `umowa menedżerska muzyk`, `ile kosztuje singiel`).
3. Masz już przeczytane wpisy z kroku 0. Porównaj frazę z polem `keyphrase` każdego
   z nich, tezę z polem `lead`, a planowane argumenty z tym, co faktycznie stoi w treści.
4. **Kolizja frazy albo pokrycie tezy → zaproponuj tryb aktualizacji zamiast nowego wpisu.**
   Dwa wpisy o tym samym konkurują ze sobą w wyszukiwarce; przy blogu tej wielkości to
   czysta strata.
5. Zaproponuj slug: małe litery ASCII bez polskich znaków, myślniki, 3–5 słów, zawiera
   rdzeń frazy. `ile-kosztuje-niezalezny-singiel`, nie `ile-naprawdę-kosztuje-singiel`.
6. Ustal kategorię według reguły z `format.md`: *kategoria opisuje efekt pracy, o której
   jest wpis, a nie temat, o który zahacza.*
7. Wypisz użytkownikowi cztery linijki – **temat / fraza / kategoria / slug** – i poczekaj
   na potwierdzenie, jeśli cokolwiek z tego zgadywałeś.

Analizy konkurencji nie robisz jako osobnego kroku. Wynik jest znany z góry: polskie teksty
o biznesie muzycznym są albo ogólnikowe, albo pisane przez dystrybutora sprzedającego
własną usługę. Przewaga tego bloga to operacyjność i liczby ze źródłem – i to jest cała
strategia wobec konkurencji.

## Krok 2 – wybór formatu

Przewodnik, gdy spełnione są **co najmniej dwa** z czterech warunków:

1. procedura ma ≥4 rozłączne kroki albo ≥4 nazwane byty do rozróżnienia
   (ZAiKS / ZPAV / STOART / SAWP);
2. odpowiedź zależy od liczb wymagających źródła (stawki, progi, terminy);
3. zapytanie jest evergreen (`jak…`, `ile…`, `czym różni się…`);
4. temat jest filarem swojej kategorii, a filaru jeszcze nie ma.

Notatka zawsze, gdy: to opinia albo jedna teza, reakcja na wydarzenie, wpis o Oli Geppert,
albo dopisek do istniejącego filaru.

**Twardy rozstrzygacz:** naszkicuj konspekt. Jeśli nie ma w nim czterech sekcji, z których
każda uczciwie potrzebuje ≥250 słów – to notatka rozdmuchana do przewodnika. Remis → notatka.

**Kadencja:** najwyżej jeden przewodnik na trzy wpisy, najwyżej jeden wpis o Oli Geppert
na sześć. Blog menedżera, który co drugi tekst pisze o własnej artystce, przestaje być
blogiem branżowym.

## Krok 3 – rejestr faktów (przed pierwszym zdaniem)

Załaduj `references/zrodla.md`. **Zanim napiszesz pierwsze zdanie**, wypisz każdą liczbę,
datę, próg, stawkę i nazwę instytucji, która ma trafić do tekstu, i zbuduj tabelę roboczą
(nie zapisujesz jej do repo):

```
twierdzenie | liczba/data | URL źródła pierwotnego | data odczytu
```

- Kolejność jest istotna. Pisanie najpierw, a szukanie źródła potem, kończy się dobieraniem
  źródła pod gotową tezę i lądowaniem w streszczeniach zamiast w komunikatach.
- Strony wydarzeń, naborów i cenniki pobierz **WebFetchem teraz**. `zrodla.md` podaje
  wyłącznie adresy – nigdy dat, cen ani terminów, bo taki plik starzeje się szybciej,
  niż ktokolwiek go poprawia.
- Linkuj źródło pierwotne (`zpav.pl`), nigdy portalu streszczającego komunikat.
- Wiersz bez URL-a wypada z tekstu razem z liczbą. Ale jeśli to, co chciałeś powiedzieć,
  jest hipotezą o mechanizmie, a nie liczbą – zostaw ją i oznacz jako przypuszczenie.
  Nie zamieniaj ciekawej obserwacji w truizm tylko dlatego, że nie ma do niej linku.
- Fakty o Oli Geppert biorą się z dossier odświeżonego w kroku 0. Gdybyś mimo to szukał –
  **nigdy zapytanie o samo „Ola Geppert"**; zawsze z `Birim`, `olageppert.pl` albo
  `dark pop`, bo inaczej wyniki zdominuje Edyta Geppert.

## Krok 4 – szkielet: lead, zamknięcie, środek

Pisz w tej kolejności – środek napisany jako pierwszy zawsze rozjeżdża się z tezą.

1. **`lead`** – 2–3 zdania, 120–180 znaków, teza wbrew intuicji. Może kończyć się pytaniem
   i u autora bardzo często tak robi. Jest jednocześnie meta description i widocznym
   akapitem „W skrócie" w lewej kolumnie, więc musi bronić się jako zdanie, nie jako meta
   tag. Nie zaczyna się od „W tym wpisie".
2. **Ostatni akapit** – jeden z pięciu kształtów z `styl.md`. Jeśli nie umiesz go teraz
   napisać, nie masz tezy i wracasz do kroku 1.
3. **Pierwszy akapit** – jeden z sześciu kształtów otwarcia z `styl.md`. Zanim wybierzesz,
   spójrz na pierwsze akapity opublikowanych wpisów (masz je przeczytane z kroku 0)
   i **wykreśl kształt, którym zaczyna się poprzedni wpis**. Anegdota „Dostałem kiedyś…"
   jest najwygodniejsza i dlatego najszybciej się zużywa.
4. **Środek.**
   - Notatka: 5–10 „beatów", po jednym fakcie albo obserwacji na akapit, bez powtórzeń.
     Zdecyduj z góry, który akapit będzie jednozdaniowy – on niesie puentę środka.
   - Przewodnik: 4–6 nagłówków `##` (krótkie frazy rzeczownikowe, mniej więcej co dziesiąty
     to prawdziwe pytanie czytelnika), przy każdym przypisz konkretne wiersze z rejestru
     faktów. Ostatnia sekcja to `## Podsumowanie`. Sekcje muszą różnić się długością –
     najkrótsza ≤60% najdłuższej. Równe sekcje to sygnał, że treść była wypełniana do
     szablonu, a nie pisana.

## Krok 5 – tekst

Załaduj `references/styl.md` i `references/format.md`.

- **Pisz od razu po polsku.** Nigdy nie tłumacz z angielskiego szkicu – składnia zostaje
  angielska i tekst brzmi jak tłumaczenie maszynowe.
- **Zapisuj od razu do `src/content/blog/<data>-<slug>.md`** (`2026-08-11-grupa-docelowa-artysty.md`;
  data = `date` z frontmattera, adres to sam slug – reguły w `format.md`). Nie ma folderu roboczego i to jest
  celowe: `bun run build` w kroku 7 jest realnym testem schematu.
- **Rytm decyduje o tym, czy tekst brzmi jak człowiek.** Akapit 1–4 zdania, przynajmniej
  jeden jednozdaniowy na wpis. Mediana zdania 10–14 słów, **co najmniej co piąte zdanie
  ma ≤5 słów**, co najmniej jedno ma ≥20 słów, żadne nie przekracza 30. Pilnuj obu końców:
  sama niska mediana daje tekst posiekany. Równoważniki bez czasownika są w domu.
  Maks. jedna półpauza na akapit, maks. jedna konstrukcja „to nie X – to Y" na wpis.
- Co kilka akapitów przełam powagę kolokwializmem albo autoironią – bez tego zostaje
  referat. Pytanie retoryczne jest w domu, może być całym akapitem. „Ty", „Ci", „Twój"
  zawsze wielką literą. Opinię wypowiadaj oznajmująco, bez „moim zdaniem".
- **Dozwolony markdown, wyczerpująco:** akapity, `##`, `###`, `[tekst](url)`,
  `**pogrubienie**`, `_kursywa_` i lista `- ` – ta ostatnia tylko na dane (kalendarz,
  terminy, kwoty), najwyżej jedna na wpis. Nic więcej. Powody są w `format.md` –
  krótko: `.prose-swiss` stylizuje tylko te elementy, a lista punktowana zamiast
  akapitów jest najsilniejszym sygnałem tekstu pisanego przez model.
- **Pogrubienie**: jedno lub dwa całe zdania na 200 słów, nigdy pojedyncze słowo.
  Wyróżnia się zdanie, które czytelnik ma zapamiętać, gdy przeleci wpis wzrokiem.
  Akapit jednozdaniowy wolno pogrubić w całości; wielozdaniowego nie. Nie pogrubia się
  ostatniego akapitu – puenta broni się pozycją.
- **Kursywa**: termin obcy, którego zdanie nie wchłonęło z polską odmianą („to jest
  _bet_"). Nie emfaza – od tego jest pogrubienie.

## Krok 6 – redakcja, linki i bramki mechaniczne

1. **Frazy zakazane** – przegrepuj listę ze `styl.md`. Trafienie usuwa się przez
   przepisanie zdania, nigdy przez podmianę na synonim.
2. **Typografia** – `„…”` (U+201E i U+201D, nigdy proste `"`). **Myślnik em `—` (U+2014) nie
   pojawia się nigdzie.** Jedyna dozwolona kreska to półpauza `–` (U+2013): ze spacjami we
   wtrąceniach, bez spacji w zakresach (`dwa–trzy tygodnie`). `15 000` i `179 zł` ze spacją.
   Sprawdzenie: `grep -c '—'` na pliku musi zwrócić 0.
3. **Test podstawienia** – w każdym akapicie zamień kluczowy rzeczownik na „X". Jeśli
   akapit nadal jest prawdziwy, jest pusty i wylatuje.
4. **Linkuj do własnych wpisów – to jest pożądane, nie tolerowane.** Notatka 1–3 linków
   wewnętrznych, przewodnik 3–6, plus link do źródła przy pierwszym wystąpieniu każdej
   liczby. Blog, w którym teksty się nawzajem nie znają, czyta się jak zbiór luźnych
   notatek; blog, w którym się znają, wygląda jak wiedza jednej osoby.
   Reguły są dwie i obie łatwo sprawdzić:
   - link wychodzi ze **zdania, które i tak trzeba było napisać** – zamiast rozwijać
     wątek należący do innego wpisu, mówisz jedno zdanie i linkujesz;
   - anchor to **fragment zdania**, nigdy tytuł wpisu ani „tutaj";
   - **anchor ma 2–5 słów**: sama liczba, termin, nazwa („do 10 000 zł", „zamknął się
     18 września", „wszystko oprócz muzyki"). Nigdy całe zdanie ani pół zdania z liczbą
     i kontekstem – podkreślony wiersz wygląda jak spam SEO. Dotyczy tak samo linków
     do źródeł i do własnych wpisów. Autor zgłaszał to wielokrotnie; bramka nr 6 niżej
     wyłapuje anchory dłuższe niż 5 słów.

   **Zakaz sekcji „Powiązane wpisy"** na końcu – to widoczny szkielet SEO, a nie tekst.
   Linki mają siedzieć w akapitach.
5. **Przykład z własnej praktyki** – co jakiś czas, mniej więcej co trzeci wpis, wpleć link
   do `olageppert.pl` jako **konkretny przykład rzeczy, o której jest akapit**: EPK
   (`/epk`), profil artysty (`/spotify`), kampania singla, przygotowanie EP. Maksymalnie
   jeden taki link na wpis i tylko tam, gdzie zdanie i tak potrzebowało przykładu.
   Nie w każdym wpisie, nigdy dwa razy w jednym i nigdy jako zachęta do odsłuchu –
   to ilustracja tezy, nie promocja. Zasady faktograficzne w `ola-geppert.md`.
6. **Linki zwrotne – domknij ruch w drugą stronę.** Nowy wpis nie może być ślepą uliczką,
   do której nic nie prowadzi. Przejrzyj opublikowane teksty i tam, gdzie akapit **już
   mówi** o temacie nowego wpisu, wstaw link do niego. Zwykle wychodzi to w jednym lub
   dwóch wpisach, czasem w trzech. Najwyżej jeden link zwrotny na istniejący wpis
   i nigdy kosztem przepisania cudzego akapitu pod link – jeśli trzeba dopisać zdanie,
   żeby link miał sens, to znaczy, że tam nie pasuje.
7. Polecenia z sekcji „Bramki mechaniczne" na dole tego pliku muszą przejść na czysto.

## Krok 7 – publikacja

1. Uzupełnij frontmatter (pola i limity w `format.md`).
2. Przelicz `readingMinutes`:
   ```bash
   sed '1,/^---$/d;1,/^---$/d' src/content/blog/<data>-<slug>.md | wc -w
   ```
   `readingMinutes = max(2, round(słowa / 180))`.
3. Podbij `LAST_CONTENT_UPDATE` w `src/consts.ts`. Uwaga na pułapkę: `serialize()`
   w `astro.config.mjs` wpisuje tę wartość jako `lastmod` **każdego** adresu w sitemapie,
   natomiast `dateModified` samego wpisu bierze się z `updated ?? date`.
4. `bun run build` – jedyna bramka schematu i typów w tym repo.
5. **Raport dla użytkownika, maksymalnie 12 linijek:** wybrany format i dlaczego, liczba
   słów, `readingMinutes`, lista faktów z linkami, **lista rzeczy świadomie pominiętych
   z braku potwierdzenia**, pytania, na które tylko użytkownik zna odpowiedź.
6. Zaproponuj commit `feat(blog): <polski temat>`. **Nie commituj bez prośby.**

---

## Bramki mechaniczne

Uruchamiane w kroku 6, wszystkie na treści bez frontmattera – frontmatter ma własne
myślniki i cudzysłowy, więc grepowanie całego pliku daje fałszywe trafienia.

```bash
SLUG=<slug>
BODY() { sed '1,/^---$/d;1,/^---$/d' src/content/blog/*-"$SLUG".md; }

# 1. Liczba słów – musi mieścić się w widełkach formatu
BODY | wc -w

# 2. Zakazany markdown i em dash – ma nie być żadnego trafienia.
#    `**` jest wycinane przed sprawdzeniem, bo pogrubienie jest dozwolone; każda
#    gwiazdka, która zostanie, to kursywa albo punktor `*` (lista używa `-`).
BODY | sed 's/\*\*//g' \
  | grep -nE '^[[:space:]]*>|^[[:space:]]*\||^#[^#]|^####|`|!\[|<[a-zA-Z]|^---$|"|—|\*'

# 2a. Listy – dozwolona najwyżej jedna na wpis i tylko na dane; liczy bloki list
BODY | awk '/^[[:space:]]*(-|[0-9]+\.) /{if(!in_l){n++;in_l=1}; next} {in_l=0} END{print n+0}'

# 3. Frazy zakazane – ma nie być żadnego trafienia
BODY | grep -niE 'w dzisiejszych czasach|nie od dziś|w dobie|warto (pamiętać|zaznaczyć|wiedzieć)|należy pamiętać|podsumowując|reasumując|w tym (artykule|wpisie)|dowiesz się|czy zastanawiał|zanurz|przyjrzyjmy|zapraszam do lektury|kluczem do sukcesu|na koniec dnia|must-have|gamechanger|przełomow|rewolucj'

# 4. Pogrubienia – 1–2 na każde 200 słów treści
BODY | grep -o '\*\*' | wc -l   # podziel przez 2

# 5. Deduplikacja fraz między wpisami – ma być pusto
grep -h '^keyphrase:' src/content/blog/*.md | sort | uniq -d

# 6. Anchory linków – każdy 2–5 słów; wypisuje dłuższe, ma być pusto
BODY | grep -o '\[[^]]*\]([^)]*)' | sed 's/\](.*//; s/^\[//' | awk 'NF>5'
```

Kolejność w punkcie 2 jest istotna: `sed` wycina pary `**`, więc grep widzi tylko
gwiazdki niesparowane. Wzorzec typu `\*[^*]` bez tego kroku dawałby fałszywy alarm na
każdym `**pogrubieniu**`, bo druga gwiazdka pary też stoi przed literą.

---

## Checklista przed publikacją

- [ ] Liczba słów mieści się w widełkach formatu.
- [ ] `lead` to 2–3 zdania, 120–180 znaków, nie zaczyna się od „W tym wpisie".
- [ ] `title` ma 25–60 znaków, bez roku, bez klikbajtowego wyliczenia.
- [ ] `keyphrase` nie powtarza się w żadnym innym wpisie.
- [ ] Treść opublikowanych wpisów przeczytana; żaden argument nie jest powtórzony za
      tekstem, który już go rozwija – zamiast tego jedno zdanie i link.
- [ ] Notatka ma 1–3 linki wewnętrzne, przewodnik 3–6; każdy wychodzi ze zdania, a anchor
      jest fragmentem zdania, nie tytułem ani „tutaj".
- [ ] Żaden anchor nie ma więcej niż 5 słów – link siedzi na liczbie, terminie albo nazwie,
      nie na całym zdaniu (bramka nr 6).
- [ ] Do nowego wpisu prowadzi link zwrotny z co najmniej jednego starego – o ile jest
      akapit, który i tak o tym mówi.
- [ ] Każda liczba w tekście ma link do źródła pierwotnego przy pierwszym wystąpieniu.
- [ ] Każda hipoteza o mechanizmie jest nazwana hipotezą („prawdopodobnie", „podejrzewam").
- [ ] Krok 0 wykonany: strony artystki pobrane, dossier zgodne albo zaktualizowane.
- [ ] Żaden fakt o Oli Geppert nie wyszedł poza dossier.
- [ ] Tekst nie przeczy temu, co mówi o serwisie `src/consts.ts`.
- [ ] Zero obrazków, tabel i cytatów blokowych; najwyżej jedna lista i tylko na dane.
- [ ] Kursywa (jeśli jest) niesie termin obcy, nie emfazę.
- [ ] Pogrubienia: 1–2 całe zdania na 200 słów, żadnego w ostatnim akapicie; pogrubiony
      w całości bywa tylko akapit jednozdaniowy.
- [ ] Cudzysłowy `„…”`; `grep -c '—'` zwraca 0 – em dash nie występuje.
- [ ] Żadna fraza z listy zakazanych nie przeszła.
- [ ] Rytm: jest akapit jednozdaniowy, co najmniej co piąte zdanie ma ≤5 słów, żadne >30.
- [ ] Jest co najmniej jedno pytanie i co najmniej jeden kolokwializm albo autoironia.
- [ ] „Ty", „Ci", „Twój" wielką literą; rodzaj męski nie jest jedyną formą osobową.
- [ ] Notatka nie ma śródtytułów; przewodnik ma 4–6 sekcji `##` o różnej długości
      i kończy się sekcją `## Podsumowanie`.
- [ ] Otwarcie ma jeden z sześciu kształtów i **nie powtarza kształtu poprzedniego wpisu**;
      krótkie uderzenie („Cóż.", „Serio.") nie powtarza się dwa wpisy z rzędu.
- [ ] Zamknięcie ma jeden z pięciu kształtów i nie powtarza formuły z poprzedniego wpisu.
- [ ] `bun run build` przechodzi.

Na koniec jedno pytanie, ważniejsze niż cała lista:

> **Które zdanie w tym wpisie mógł napisać ktoś, kto nigdy tej pracy nie robił?**

Takie zdania wycina się bez negocjacji. Zwykle to te, które brzmią najbardziej profesjonalnie.
