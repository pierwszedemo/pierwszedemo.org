---
name: instagram-carousel
description: Generuje karuzelę na Instagram z istniejącego wpisu na blogu pierwszedemo.com – pionowe grafiki 1080×1350 (4:5) (okładka z hookiem, 1–4 slajdy z esencją wpisu, slajd CTA) plus gotowy opis posta. Grafiki rysuje skrypt satori+sharp w języku wizualnym strony (biel, twarda linia, Archivo, IBM Plex Mono); wynik ląduje w instagram/<slug>/. Użyj, gdy pada „karuzela na Instagram”, „grafiki na IG”, „post na Instagram z wpisu”, „instagramowa wersja wpisu”, „promocja wpisu w social mediach”.
---

# instagram-carousel

Zamieniasz opublikowany wpis z bloga pierwszedemo.com na karuzelę na Instagram:
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

Kandydatami są wyłącznie opublikowane wpisy – `src/content/blog/*.md` **bez**
plików zaczynających się podkreśleniem (`_szkic.md` nie ma adresu, więc nie ma
czego promować). Slug to nazwa pliku **bez** prefiksu daty i rozszerzenia:
`2026-08-11-grupa-docelowa-artysty.md` → `grupa-docelowa-artysty`.

- Jeśli użytkownik podał slug albo temat – dopasuj po slugu, `title`,
  `keyphrase` i `lead`. Jedno pewne trafienie: jedź dalej i tylko powiedz, który
  wpis bierzesz.
- Niejednoznacznie albo wcale: wypisz listę (tytuł, kategoria, data) i **zapytaj
  użytkownika** (AskUserQuestion). Nie zgaduj.
- Jeśli `instagram/<slug>/` już istnieje, powiedz o tym – ponowne uruchomienie
  nadpisuje grafiki, a użytkownik mógł chcieć wariant, nie podmianę.

## Krok 2 – lektura i plan slajdów

Przeczytaj **cały wpis**, nie sam frontmatter. Z lektury wynoś:

- **hook** na okładkę – najmocniejsze zdanie albo najbardziej przewrotna teza
  wpisu, przepisana na 40–110 znaków. Dobre hooki tego bloga brzmią jak lead:
  konkret, zaskoczenie, czasem pytanie.
- **1–4 punkty** na slajdy treści – po jednej myśli na slajd. Notatka zwykle
  niesie 2–3, przewodnik 3–4 (po jednym na najważniejsze sekcje `##`). Nie
  upychaj wszystkiego: punkt, który nie mieści się w limicie znaków, jest
  kandydatem do wycięcia, nie do skrócenia w bełkot.
- Ostatni slajd treści może kończyć się niedopowiedzeniem – powód, żeby wejść
  na blog, ma zostać.

Styl tekstu na slajdach = styl bloga: krótkie zdania, „Ty/Ci/Twój” wielką
literą, opinia oznajmująco, zero fraz w rodzaju „w dzisiejszych czasach”,
„kluczem do sukcesu”, „gamechanger”.

## Krok 3 – specyfikacja `slides.json`

Zapisz do `instagram/<slug>/slides.json`:

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
    "url": "pierwszedemo.com/blog/<slug>"
  }
}
```

- `cover.eyebrow` – kategoria wpisu z frontmattera; ≤40 znaków. Bez niej
  skrypt wstawi „Blog”, ale kategoria mówi więcej – podawaj ją zawsze.
- `cover.hook` – 40–110 znaków (dolną granicę pilnujesz sam, skrypt egzekwuje
  tylko górną); stopień pisma dobiera się do długości, 96→64 px.
- `slides` – 1–4 pozycje; `heading` ≤64 znaki, `body` to string albo tablica
  1–3 akapitów, łącznie ≤440 znaków **licząc spację między akapitami**.
- `cta` jest opcjonalne – domyślne wartości (powyżej) są dobre w 90% przypadków;
  `lines` to tablica 1–4 linii po ≤22 znaki, `url` ≤60 znaków. Adres renderuje
  się małymi literami – ścieżki na Vercelu rozróżniają wielkość liter.
- Żadne słowo nie może być dłuższe niż: 17 znaków w hooku, 26 w nagłówku, 30
  w akapicie, 16 w linii CTA – satori nie dzieli wyrazów i taki token wyjechałby
  poza kadr. Długi adres albo hashtag w treści slajdu to zły pomysł także z
  tego powodu.

Limity to geometria, nie sugestia: satori nie zmniejsza tekstu i nadmiar
wyjeżdża poza kadr. Walidacja w skrypcie je egzekwuje i wypisuje wszystkie
błędy naraz. Slug musi wskazywać istniejący `src/content/blog/RRRR-MM-DD-<slug>.md` –
adres wpisu trafia na slajd CTA jako piksele, więc literówki nie da się
później poprawić. Wariant karuzeli dla tego samego wpisu (bez nadpisywania)
zrób pod nazwą `<slug>-v2` – skrypt odmówi, bo pod takim slugiem nie ma wpisu;
skopiuj wtedy gotowy katalog ręcznie, nie obchodź walidacji.

## Krok 4 – generacja

Z katalogu głównego repo:

```bash
bun .agents/skills/instagram-carousel/scripts/generate.mjs <slug>
```

Powstaje `instagram/<slug>/01.png` (okładka), `02.png…` (treść), ostatni numer
to CTA na czarnym tle. Obok ląduje `alt.txt` – jedna linia na slajd
(`NN: nagłówek. akapity`), do wklejenia w pole tekstu alternatywnego przy
publikacji; powstaje z `slides.json`, więc nie edytuj go ręcznie. Skrypt najpierw usuwa stare `NN.png` z katalogu, więc
po skróceniu karuzeli nie zostają slajdy z nieaktualną numeracją. PNG 1080×1350 (4:5) – Instagram i tak przekompresuje je do
JPG, ale płaskie plamy i ostre krawędzie tej estetyki wychodzą z PNG najczyściej.

## Krok 5 – kontrola wzrokowa

Obejrzyj (Read) **każdy** wygenerowany PNG. Walidacja łapie długości, ale nie
łamania wierszy:

- tekst nie dotyka krawędzi ani stopki, nic nie jest przycięte;
- hook łamie się w 2–4 wiersze, bez pojedynczego słowa-sieroty w ostatnim
  (skrypt skleja jednoliterowe spójniki z następnym słowem, ale sierotę
  na końcu akapitu usuwa się tylko przeredagowaniem);
- polskie znaki (ą, ś, ż…) wyglądają poprawnie;
- numeracja `NN/MM` zgadza się z liczbą plików.

Coś nie gra → popraw copy w `slides.json` i wygeneruj ponownie. Nie akceptuj
slajdu „na styk”.

## Krok 6 – opis posta (`caption.txt`)

Zapisz `instagram/<slug>/caption.txt`:

1. **Pierwsza linia ≤125 znaków** – tyle widać przed „więcej”. Wariacja hooka,
   nie jego kopia słowo w słowo.
2. Pusta linia, potem 2–4 zdania rozwinięcia – co czytelnik wynosi z wpisu.
   Rytm bloga: krótkie zdania, przynajmniej jedno bardzo krótkie.
3. Pusta linia, potem CTA – te same trzy rzeczy, co na slajdzie CTA: obserwuj
   profil, zapisz post na później, cały tekst na pierwszedemo.com (adres
   słowem – w opisie posta linki i tak nie są klikalne, więc nie udawaj linku).
4. Pusta linia, potem 3–6 hashtagów po polsku, niszowych, zgodnych z tematem
   (np. #muzykaniezalezna #managerartysty #wydawaniemuzyki). Bez #fyp,
   #instagood i innego spamu zasięgowego.

Zasady faktograficzne i typograficzne z sekcji „Zasady” obowiązują też tutaj.
Bramka: `grep -c '"' instagram/<slug>/caption.txt` i `grep -c '—'` muszą
zwrócić 0 – prosty cudzysłów i em dash nie mają prawa przejść.

## Krok 7 – raport

Maksymalnie 10 linijek: który wpis, ile slajdów i dlaczego tyle, hook, pierwsza
linia opisu, lista plików. Zaproponuj commit
`feat(ig): karuzela <slug>` – **bez commitowania bez prośby**.

## Pliki i konwencje

- `scripts/generate.mjs` – rysuje slajdy (satori + sharp, zależności już są w
  devDependencies repo). Layout celowo trzyma się `src/og.ts`: te same kolory,
  ta sama stopka z wordmarkiem, ta sama para krojów.
- `assets/Archivo-Regular.ttf` – odmiana do akapitów na slajdach, zvendorowana
  tu, bo `src/assets/fonts/` trzyma tylko to, czego używają karty OG, a satori
  czyta wyłącznie statyczne TTF.
- `instagram/` w korzeniu repo to katalog wynikowy – po podkatalogu na wpis.
  Pliki się commituje: są częścią historii promocji wpisu.
