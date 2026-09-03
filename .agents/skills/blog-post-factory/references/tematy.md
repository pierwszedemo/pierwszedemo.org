# Tematy zalążkowe

Punkt wyjścia, gdy użytkownik prosi o wpis bez podania tematu. **Plik jest tylko do
odczytu** – nie odhaczaj pozycji, nie dopisuj statusów, nie prowadź tu dziennika.
Deduplikację niesie pole `keyphrase` w opublikowanych wpisach; drugi rejestr rozjechałby
się z pierwszym przy pierwszym ręcznie napisanym tekście.

Kolumna „fraza" to fraza główna do pola `keyphrase`. Przed użyciem sprawdź, czy nie
występuje już w `src/content/blog/*.md`.

## Filary (przewodniki)

| Tytuł roboczy | Kategoria | Fraza |
|---|---|---|
| Great September: jak pojechać tam jako delegat, nie jako widz | Branża | `great september konferencja` |
| Jak aplikować na showcase festival i dlaczego odrzucają | Koncerty | `showcase festiwal zgłoszenie` |
| Spotify for Artists od zera: konfiguracja profilu | Streaming | `spotify for artists konfiguracja` |
| Pitching do playlist edytorskich: co realnie się liczy | Streaming | `pitchowanie utworu spotify` |
| ZAiKS, STOART, SAWP, ZPAV – kto komu płaci | Finanse | `zaiks stoart sawp różnice` |
| Umowa menedżerska: prowizja, czas trwania, zakres | Zarządzanie | `umowa menedżerska artysta` |
| Wybór dystrybutora cyfrowego w Polsce | Wydawnictwa | `dystrybucja muzyki polska` |
| Harmonogram premiery singla: osiem tygodni wstecz | Wydawnictwa | `harmonogram premiery singla` |
| EPK, który otwiera drzwi – pełny przewodnik | Promocja | `jak zrobić epk` |
| Split sheet: dziel prawa, zanim będzie o co | Zarządzanie | `split sheet podział praw` |
| Wytwórnia jako fundusz inwestycyjny – co realnie ocenia | Branża | `co ocenia wytwórnia` |

Ostatni temat ma już zarezerwowane miejsce: wpis o EPK stwierdza, że statystyki i liczba
obserwujących ważą dziś więcej niż samo nagranie, ale świadomie tego nie rozwija. Cała
argumentacja – że wytwórnia lokuje pieniądze i liczy zwrot jak fundusz, a nie ocenia
muzyki w oderwaniu od liczb – należy do tego przewodnika. Przy jego pisaniu zostaw
z wpisu o EPK link tam, a nie odwrotnie.

## Notatki

| Tytuł roboczy | Kategoria | Fraza |
|---|---|---|
| Kiedy artysta naprawdę potrzebuje managera | Zarządzanie | `menedżer artysty kiedy` |
| One-sheet czy EPK – kiedy który | Promocja | `one sheet muzyka` |
| Canvas: jak go zrobić, żeby nie szkodził | Streaming | `spotify canvas` |
| Weryfikacja profilu i Artist's Pick | Streaming | `weryfikacja profilu spotify` |
| EP czy seria singli | Wydawnictwa | `ep czy single` |
| Progi ZPAV: ile trzeba na złotą płytę | Wydawnictwa | `złota płyta ile sprzedaży` |
| Merch: marża, minimum, magazyn | Finanse | `merch zespołu` |
| Rebranding artysty w praktyce – czego uczy zmiana nazwy | Zarządzanie | `zmiana nazwy artysty` |
| Kalendarz polskich wydarzeń branżowych | Branża | `konferencje muzyczne polska` |
| Rider techniczny bez wstydu | Koncerty | `rider techniczny zespół` |
| Do agencji z gotowym pomysłem – co i kiedy podzlecać | Zarządzanie | `agencja dla artysty` |
| Waterfall: single, które składają się na EP | Wydawnictwa | `waterfall wydawnictwo` |

Wpis oznaczony frazą `zmiana nazwy artysty` to naturalne miejsce na przykład Oli Geppert –
niedomknięty rebranding Birim na platformach jest konkretem, nie autopromocją.
Zasady w `ola-geppert.md`.

Temat `agencja dla artysty` zamówił autor (2026-08-19) przy pisaniu wpisu
`poczatkujacy-manager-artysty` – tamten tekst mówi „do agencji przychodzi się z gotowym
pomysłem" i świadomie tego nie rozwija. Przy pisaniu zostaw stamtąd link zwrotny tutaj.
Materiał (co realnie podzlecił i jak wyszło) trzeba wziąć od autora – nie zgaduj.

Temat `waterfall wydawnictwo` zamówił autor (2026-09-03) przy wpisie `ep-czy-seria-singli`.
Tamten tekst kończy się zdaniem „Wtedy wydaj EP albo zrób _waterfall_” i celowo nie
tłumaczy, czym waterfall jest – przy pisaniu podlinkuj stamtąd to słowo. Waterfall to
alternatywa wobec tezy tamtego wpisu (single osobno, EP jako nowy materiał), nie jej
rozwinięcie: EP na końcu zbiera wcześniejsze single i dokłada jeden czy dwa nowe utwory.

## Tematy odrzucone

Nie proponuj ich, dopóki ktoś nie potwierdzi faktów u źródła:

- **„Wielkie Joł" jako konferencja branżowa** – nie udało się potwierdzić, że takie
  wydarzenie w tej formule istnieje.
- **Nouvelle Prague, Tallinn Music Week – terminy i formuła** – niezweryfikowane; jeśli
  wpis ma je wymieniać, najpierw WebFetch ze stron organizatorów.
- **„Ile płaci Spotify za odtworzenie"** – nie ma stawki, którą dałoby się podać uczciwie;
  każda liczba w internecie jest wyliczeniem wstecznym z czyjegoś raportu. Temat da się
  zrobić tylko jako wpis o tym, dlaczego ta liczba nie istnieje.
- **Rankingi dystrybutorów typu „najlepszy w 2027"** – wymagałyby danych o udziałach
  rynkowych, których nikt nie publikuje.
