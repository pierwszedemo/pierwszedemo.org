# Domeny .com — burza mózgów

Notatka robocza, 2026-08-09.

## Decyzja (2026-08-09)

Padło na `pierwszedemo.com` — wbrew rekomendacji niżej, która stawiała na
`dlugagra.com`. Serwis jest przepięty: `SITE_URL`, marka („Pierwsze Demo"
jako `SITE_NAME`, nazwisko zostaje w `PERSON_NAME`), kontakt, favicon (monogram
„PD"). Reszta notatki zostaje jako zapis rozważań, nie jako plan.

Do zrobienia poza repo: 301 z `miszczyszyn.com` na nowy host i nowa własność
w Search Console — bez tego dorobek w wyszukiwarce zostaje pod starym adresem.

Dostępność sprawdzana przez `dig NS` — brak delegacji NS to mocna
poszlaka, że domena jest wolna, ale **nie dowód**: domena zarejestrowana
i niedelegowana wygląda tak samo. Przed zakupem potwierdzić u rejestratora.

## Punkt wyjścia

`miszczyszyn.com` już działa i wokół niego zbudowana jest cała warstwa SEO
(sitemap, JSON-LD, karty OG, kanoniczne adresy). Druga domena albo go
zastępuje — wtedy stary adres przekierowujemy 301, żeby nie stracić
dorobku — albo rozbija ruch na dwa serwisy. Warto zdecydować, który
wariant, zanim cokolwiek kupimy.

Zmiana domeny w kodzie to jedna stała: `SITE_URL` w `src/consts.ts`.
Reszta (kanoniczne adresy, sitemap, JSON-LD, OG, RSS, llms.txt) jedzie
z niej automatycznie. Zgromadzona historia w wyszukiwarce — już nie.

## Wolne (brak NS)

| Domena | Trop | Ocena |
| --- | --- | --- |
| `dlugagra.com` | „długa gra” | **Najlepsza.** To jest wprost pozycjonowanie: kariery, które trwają dłużej niż jeden sezon. Krótka, bez pułapek ortograficznych, nadaje się też na bloga albo newsletter. |
| `zplanem.com` | z hasła „z planem, nie z przypadku” | Zwięzła, 8 liter. Minus: zaczyna się od przyimka, samodzielnie czyta się dziwnie. |
| `planartysty.com` | opisowa | Jasna, mówi co sprzedajesz, wciąż da się z niej zrobić markę. Liczba pojedyncza zawęża, jeśli roster urośnie. |
| `managerartystow.com` | fraza kluczowa 1:1 | Zero marki, realne SEO. Raczej jako przekierowanie zasilające główny serwis niż jako tożsamość. |
| `pierwszedemo.com` | „od pierwszego demo” | Świetna na treści — blog, newsletter, podcast. Słaba jako front firmy managerskiej. |
| `demodosceny.com` | cały łuk historii | Opowiada wszystko jednym hasłem. Trzy słowa to już dużo do wpisania. |
| `karierastrategia.com` | hasło dosłownie | Mówi to co trzeba, ale brzmi jak zderzenie dwóch rzeczowników. |
| `nadlugo.com` | wariant „długiej gry” | Do rozważenia, jeśli `dlugagra.com` odpadnie. |
| `pelnascena.com` | koncertowy | Poprawna, nie wybija się. |
| `scenaiplan.com` | koncerty + strategia | Poprawna, nie wybija się. |
| `studiokariery.com` | opisowa | Poprawna, lekko korporacyjna. |
| `artystiplan.com` | opisowa | Poprawna, zbitka „artystiplan” gorzej się czyta. |

## Zajęte

| Domena | Kto/co |
| --- | --- |
| `miszcz.com` | Cloudflare — realnie używana |
| `kariery.com` | parking Sedo — do kupienia, pewnie drogo |
| `rosterhouse.com` | Afternic — wystawiona na sprzedaż |
| `mmartists.com` | NameBright |
| `amberartists.com` | używana |
| `backstageplan.com` | GoDaddy |
| `naglosnienie.com` | home.pl |

## Rekomendacja

`dlugagra.com` jako marka managementu, `miszczyszyn.com` zostaje jako
domena osobista. Przeżyje rozrost rosteru poza Olę, zapada w pamięć
w sali pełnej ludzi mówiących „management”, i jest jedynym hasłem, którym
i tak już opisujesz tę pracę.

## Do rozważenia przed decyzją

- **Polska nazwa zamyka na polskojęzycznych artystów.** Przy rozmowie
  z zespołem z Berlina albo ze Skandynawii `dlugagra` trzeba tłumaczyć.
  Nazwisko podróżuje bez tłumaczenia.
- **Jeden kanoniczny host.** Cokolwiek kupimy, reszta na 301. Dwa
  serwisy z tą samą treścią to rozbity ruch i kanibalizacja fraz.

## Niesprawdzone

Nie robiliśmy jeszcze wariantów anglojęzycznych ani neutralnych wobec
rosteru. Do zrobienia, jeśli żaden z powyższych nie chwyci.
