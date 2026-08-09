---
name: blog-post-factory
description: Pisze wpisy na blog miszczyszyn.com – po polsku, z perspektywy menedżera artystów, całkowicie bez obrazków. Dwa formaty: „notatka" (300–500 słów, bez śródtytułów) i „przewodnik" (1200–2000 słów, sekcje H2 i FAQ). Prowadzi proces: wybór tematu i deduplikacja, wybór formatu, rejestr faktów ze źródłem dla każdej liczby, tekst, redakcja językowa, linkowanie, publikacja i build. Użyj, gdy pada „napisz wpis na bloga", „nowy wpis", „notatka na bloga", „przewodnik o…", „zaktualizuj wpis", „co napisać na bloga", albo gdy trzeba opisać temat branżowy: wydarzenia (Great September, showcase, konferencja), EPK i materiały prasowe, Spotify for Artists, wydawnictwo i dystrybucję, booking, tantiemy i pieniądze, umowę menedżerską, pracę z Olą Geppert.
---

# blog-post-factory

Piszesz wpisy na blog Michała Miszczyszyna – menedżera artystów z Gdańska, którego
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
3. **Fakty o Oli Geppert wyłącznie z `references/ola-geppert.md`.** Zakaz WebSearch o niej.
4. **Nigdy nie wymyślaj doświadczenia.** Żadnych anegdot, „pewnego bookera", nienazwanych
   klientów, kwot z pamięci. Jeśli wpis potrzebuje wiedzy, której nie masz – **zapytaj
   użytkownika**. Puste miejsce zgłasza się, nie zapełnia zmyśleniem.

## Pliki referencyjne

| Plik | Kiedy go czytasz |
|---|---|
| `references/format.md` | krok 2 i 5 – kontrakt z rendererem, frontmatter, dozwolony markdown |
| `references/styl.md` | krok 4, 5 i 6 – głos, rytm, typografia, frazy zakazane |
| `references/zrodla.md` | krok 3 – zasady cytowania, adresy źródeł, wydarzenia |
| `references/ola-geppert.md` | zawsze, gdy w tekście pada nazwisko artystki |
| `references/tematy.md` | krok 1, gdy użytkownik nie podał tematu |

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

## Krok 1 – temat i deduplikacja

1. Temat pochodzi od użytkownika albo z `references/tematy.md`. Bez tematu **nie zgaduj** –
   przedstaw 3–5 propozycji z uzasadnieniem i zatrzymaj się.
2. Ustal **frazę główną** – to, czego czytelnik szuka w wyszukiwarce, po polsku, 2–4 słowa
   (`pre-save spotify`, `umowa menedżerska muzyk`, `ile kosztuje singiel`).
3. Przeczytaj frontmatter wszystkich `src/content/blog/*.md`. Porównaj frazę z polem
   `keyphrase` każdego wpisu, a tezę z polem `lead`.
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
- Wiersz bez URL-a wypada z tekstu razem z liczbą.
- Fakty o Oli Geppert biorą się wyłącznie z dossier. Gdybyś mimo to czegokolwiek szukał –
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
3. **Środek.**
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
- **Zapisuj od razu do `src/content/blog/<slug>.md`.** Nie ma folderu roboczego i to jest
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
  `**pogrubienie**`. Nic więcej. Powody są w `format.md` – krótko: `.prose-swiss` stylizuje
  tylko te elementy, a lista punktowana jest jednocześnie najsilniejszym sygnałem tekstu
  pisanego przez model.
- **Pogrubienie**: jedno lub dwa całe zdania na 200 słów, nigdy pojedyncze słowo i nigdy
  cały akapit. Wyróżnia się zdanie, które czytelnik ma zapamiętać, gdy przeleci wpis
  wzrokiem. Nie pogrubia się ostatniego akapitu – puenta broni się pozycją.

## Krok 6 – redakcja, linki i bramki mechaniczne

1. **Frazy zakazane** – przegrepuj listę ze `styl.md`. Trafienie usuwa się przez
   przepisanie zdania, nigdy przez podmianę na synonim.
2. **Typografia** – `„…”` (U+201E i U+201D, nigdy proste `"`). **Myślnik em `—` (U+2014) nie
   pojawia się nigdzie.** Jedyna dozwolona kreska to półpauza `–` (U+2013): ze spacjami we
   wtrąceniach, bez spacji w zakresach (`dwa–trzy tygodnie`). `15 000` i `179 zł` ze spacją.
   Sprawdzenie: `grep -c '—'` na pliku musi zwrócić 0.
3. **Test podstawienia** – w każdym akapicie zamień kluczowy rzeczownik na „X". Jeśli
   akapit nadal jest prawdziwy, jest pusty i wylatuje.
4. **Linki** – notatka 0–2, przewodnik 2–4 wewnętrzne, plus link do źródła przy pierwszym
   wystąpieniu każdej liczby. Anchor to fragment zdania, nie nazwa wpisu.
   **Zakaz sekcji „Powiązane wpisy"** – to widoczny szkielet SEO, a nie tekst.
5. **Przykład z własnej praktyki** – co jakiś czas, mniej więcej co trzeci wpis, wpleć link
   do `olageppert.pl` jako **konkretny przykład rzeczy, o której jest akapit**: EPK
   (`/epk`), profil artysty (`/spotify`), kampania singla, przygotowanie EP. Maksymalnie
   jeden taki link na wpis i tylko tam, gdzie zdanie i tak potrzebowało przykładu.
   Nie w każdym wpisie, nigdy dwa razy w jednym i nigdy jako zachęta do odsłuchu –
   to ilustracja tezy, nie promocja. Zasady faktograficzne w `ola-geppert.md`.
5. **Link zwrotny** – najwyżej **jeden w całym blogu** prowadzący do nowego wpisu i tylko
   wtedy, gdy akapit w starym wpisie już mówi o tym temacie. Jeden dobry link zwrotny jest
   wart więcej niż pięć wciśniętych na siłę.
6. Polecenia z sekcji „Bramki mechaniczne" na dole tego pliku muszą przejść na czysto.

## Krok 7 – publikacja

1. Uzupełnij frontmatter (pola i limity w `format.md`).
2. Przelicz `readingMinutes`:
   ```bash
   sed '1,/^---$/d;1,/^---$/d' src/content/blog/<slug>.md | wc -w
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
BODY() { sed '1,/^---$/d;1,/^---$/d' "src/content/blog/$SLUG.md"; }

# 1. Liczba słów – musi mieścić się w widełkach formatu
BODY | wc -w

# 2. Zakazany markdown i em dash – ma nie być żadnego trafienia.
#    `**` jest wycinane przed sprawdzeniem, bo pogrubienie jest dozwolone; każda
#    gwiazdka, która zostanie, to kursywa albo punktor.
BODY | sed 's/\*\*//g' \
  | grep -nE '^[[:space:]]*([-+]|[0-9]+\.)[ ]|^[[:space:]]*>|^[[:space:]]*\||^#[^#]|^####|`|!\[|<[a-zA-Z]|^---$|"|—|\*'

# 3. Frazy zakazane – ma nie być żadnego trafienia
BODY | grep -niE 'w dzisiejszych czasach|nie od dziś|w dobie|warto (pamiętać|zaznaczyć|wiedzieć)|należy pamiętać|podsumowując|reasumując|w tym (artykule|wpisie)|dowiesz się|czy zastanawiał|zanurz|przyjrzyjmy|zapraszam do lektury|kluczem do sukcesu|na koniec dnia|must-have|gamechanger|przełomow|rewolucj'

# 4. Pogrubienia – 1–2 na każde 200 słów treści
BODY | grep -o '\*\*' | wc -l   # podziel przez 2

# 5. Deduplikacja fraz między wpisami – ma być pusto
grep -h '^keyphrase:' src/content/blog/*.md | sort | uniq -d
```

Kolejność w punkcie 2 jest istotna: `sed` wycina pary `**`, więc grep widzi tylko
gwiazdki niesparowane. Wzorzec typu `\*[^*]` bez tego kroku dawałby fałszywy alarm na
każdym `**pogrubieniu**`, bo druga gwiazdka pary też stoi przed literą.

---

## Checklista przed publikacją

- [ ] Liczba słów mieści się w widełkach formatu.
- [ ] `lead` to dokładnie 2 zdania, 120–180 znaków, nie zaczyna się od „W tym wpisie".
- [ ] `title` ma 25–48 znaków, bez roku, bez dwukropka-klikbajtu.
- [ ] `keyphrase` nie powtarza się w żadnym innym wpisie.
- [ ] Każda liczba w tekście ma link do źródła pierwotnego przy pierwszym wystąpieniu.
- [ ] Żaden fakt o Oli Geppert nie wyszedł poza dossier.
- [ ] Zero obrazków, list, tabel, cytatów blokowych i kursywy.
- [ ] Pogrubienia: 1–2 całe zdania na 200 słów, żadnego w ostatnim akapicie.
- [ ] Cudzysłowy `„…”`; `grep -c '—'` zwraca 0 – em dash nie występuje.
- [ ] Żadna fraza z listy zakazanych nie przeszła.
- [ ] Rytm: jest akapit jednozdaniowy, co najmniej co piąte zdanie ma ≤5 słów, żadne >30.
- [ ] Jest co najmniej jedno pytanie i co najmniej jeden kolokwializm albo autoironia.
- [ ] „Ty", „Ci", „Twój" wielką literą; rodzaj męski nie jest jedyną formą osobową.
- [ ] Notatka nie ma śródtytułów; przewodnik ma 4–6 sekcji `##` o różnej długości
      i kończy się sekcją `## Podsumowanie`.
- [ ] Zamknięcie ma jeden z pięciu kształtów i nie powtarza formuły z poprzedniego wpisu.
- [ ] `bun run build` przechodzi.

Na koniec jedno pytanie, ważniejsze niż cała lista:

> **Które zdanie w tym wpisie mógł napisać ktoś, kto nigdy tej pracy nie robił?**

Takie zdania wycina się bez negocjacji. Zwykle to te, które brzmią najbardziej profesjonalnie.
