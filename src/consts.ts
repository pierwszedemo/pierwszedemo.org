export const SITE_URL = "https://pierwszedemo.org";

/** Sama domena – badge kart OG, UTM-y, opisy. Nigdy nie wpisuj jej ręcznie. */
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Serwis jest stroną fundacji, więc marka i podmiot to od października 2026
 * jedno: `SITE_NAME` to pełna nazwa z KRS (tytuły, og:site_name, RSS, węzeł
 * Organization), `SHORT_NAME` – nazwa potoczna do zdań w treści. Ludzie
 * stojący za fundacją mają własne stałe w `FOUNDERS`; encja osoby w schema.org
 * nie może nazywać się jak organizacja, bo Google czyta to jako autora strony.
 */
export const SITE_NAME = "Fundacja Pierwsze Demo";
export const SHORT_NAME = "Pierwsze Demo";
export const PERSON_NAME = "Michał Miszczyszyn";
/**
 * Czym jest fundacja – jedno zdanie do h1 strony głównej, nadtytułu kart OG
 * i `description` węzła Organization. Niesie frazę „twórców muzycznych”,
 * bo to pod nią strona ma być znajdowana; „młodych” zostaje w opisie.
 */
export const SITE_TAGLINE = "Wsparcie młodych twórców muzycznych";
export const SITE_DESCRIPTION =
  "Fundacja Pierwsze Demo wspiera młodych i początkujących twórców muzycznych: koncerty, nagrania i wydawnictwa, wiedza o branży i pomoc w prowadzeniu kariery. Gdańsk, cała Polska.";

export const CONTACT_EMAIL = "fundacja@pierwszedemo.org";
export const DZWIEKI_EMAIL = "dzwieki@pierwszedemo.org";
export const HOME_CITY = "Gdańsk";
export const TYPE_OF_WEB_URL = "https://typeofweb.com";
/** Profil marki (nie osoby) – stąd w stopce i w `sameAs` Organization, nie Person. */
export const INSTAGRAM_URL = "https://www.instagram.com/pierwszedemo/";

/**
 * Stabilne @id węzłów schema.org – wiążą encje między stronami. Jadą z
 * `SITE_URL`, więc zmiana domeny przepina je wszystkie naraz; poza taką
 * przeprowadzką nie ma powodu ich ruszać.
 */
export const PERSON_ID = `${SITE_URL}/#michal`;
export const OLA_ID = `${SITE_URL}/#ola`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORGANIZATION_ID = `${SITE_URL}/#fundacja`;

/** Data ostatniej zmiany treści – trafia do sitemap.lastmod i dateModified. */
export const LAST_CONTENT_UPDATE = "2026-10-04";

/**
 * Identyfikator pomiaru GA4 (G-XXXXXXXXXX). Pusty łańcuch = gtag.js w ogóle
 * się nie ładuje; baner zgody i Consent Mode działają wtedy tak samo, tylko
 * nie mają czego włączyć. Wpisanie ID to jedyna zmiana potrzebna do startu
 * analityki – reszta jest już podpięta.
 */
export const GA_ID = "G-MHM5P6X3TG";

/** Marka w lewej komórce nagłówka. Bez ® – nazwa fundacji nie jest znakiem zarejestrowanym. */
export const WORDMARK = SITE_NAME;

// ---------------------------------------------------------------------------
// Ścieżki stron – jedno miejsce, bo każda pada w nawigacji, okruszkach,
// przekierowaniach i llms.txt naraz.
// ---------------------------------------------------------------------------
export const FOUNDATION_PATH = "/fundacja";
export const KNOWLEDGE_PATH = "/wiedza";
export const NEWS_PATH = "/aktualnosci";
export const SUPPORT_PATH = "/wesprzyj";
export const STATUTE_PATH = "/statut";
export const ACCESSIBILITY_PATH = "/deklaracja-dostepnosci";

/** Strona cyklu koncertów „dźwięki efemeryczne” – poza nawigacją, linkowana z zewnątrz. */
export const CONCERT_SERIES_PATH = "/dzwieki-efemeryczne";
/** Nazwa własna cyklu: małymi literami i z kropką, jak na plakacie. */
export const CONCERT_SERIES_NAME = "dźwięki efemeryczne.";
/** Karta OG strony cyklu – osobny plik obok kart wpisów w /og/. */
export const CONCERT_SERIES_OG = `/og${CONCERT_SERIES_PATH}.png`;

/**
 * Nawigacja: marka i trzy pozycje, cztery komórki jak w makiecie. „Wesprzyj”
 * celowo nie jest tu – ma własne pasmo na stronach, a czwarta pozycja
 * wymagałaby przebudowy siatki 2×2 w Nav.astro.
 */
export const NAV = [
  { label: "Fundacja", href: FOUNDATION_PATH },
  { label: "Wiedza", href: KNOWLEDGE_PATH },
  { label: "Aktualności", href: NEWS_PATH },
] as const;

// ---------------------------------------------------------------------------
// Fundacja – dane rejestrowe. Puste pole = fundacja jeszcze przed wpisem do
// KRS; strony pokazują wtedy `REGISTRY_PENDING` zamiast numeru. Po wpisie
// uzupełnij tu i nic więcej nie trzeba zmieniać: stopka, /fundacja, polityka
// prywatności i JSON-LD czytają z tego obiektu.
// ---------------------------------------------------------------------------
export const FOUNDATION = {
  name: SITE_NAME,
  street: "ul. Stolema 6H/2",
  postalCode: "80-177",
  city: HOME_CITY,
  krs: "",
  nip: "",
  regon: "",
  /** Numer rachunku do darowizn – zakładany po wpisie do KRS. */
  iban: "",
  court: "Sąd Rejonowy Gdańsk-Północ w Gdańsku, VII Wydział Gospodarczy KRS",
  minister: "minister właściwy do spraw kultury i ochrony dziedzictwa narodowego",
} as const;

export const REGISTRY_PENDING = "w trakcie rejestracji";

/** Numer z rejestru albo informacja, że go jeszcze nie ma. */
export const registryValue = (value: string) => value || REGISTRY_PENDING;

/** Tytuł przelewu, który pozwala zaksięgować wpłatę jako darowiznę (odliczenie od podatku). */
export const DONATION_TITLE = "Darowizna na cele statutowe";

/**
 * Fundatorzy i zarazem cały Zarząd. Kolejność = kolejność na stronie.
 * `name` to forma używana w treści, `fullName` – w danych zarządu (jak w KRS).
 */
export const FOUNDERS = [
  {
    id: "michal",
    schemaId: PERSON_ID,
    name: PERSON_NAME,
    fullName: "Michał Miszczyszyn",
    role: "Prezes Zarządu",
    jobTitle: "manager muzyczny",
    href: TYPE_OF_WEB_URL,
    bio: [
      "Manager muzyczny i przedsiębiorca. Od lipca 2026 pod marką Pierwsze Demo prowadził bezpłatny management, wydawnictwa i booking artystów alternatywnych – od planu wydawniczego i dystrybucji, przez materiały prasowe i kontakt z mediami, po koncert premierowy. Misję tę kontynuuje w Fundacji.",
      "Od 2013 roku organizuje wydarzenia i wydaje publikacje: współorganizator trzech międzynarodowych konferencji (dla kilkuset osób każda; dochód przekazywany na cele charytatywne) i ponad dwudziestu bezpłatnych spotkań branżowych (nagroda Curly Braces 2016 za najlepiej organizowane spotkania w Polsce). Autor i wydawca książki „TypeScript na poważnie” (2021), współtwórca kursu Next.js Masters dla blisko tysiąca uczestników, szkoleniowiec, wykładowca akademicki i prelegent.",
      "Twórca inicjatywy Type of Web od blisko 20 lat związany z branżą technologiczną.",
      "Pomysłodawca fundacji; odpowiada za produkcję wydarzeń oraz kwestie formalne, finansowe i organizacyjne.",
    ],
  },
  {
    id: "ola",
    schemaId: OLA_ID,
    name: "Ola Geppert",
    fullName: "Aleksandra Geppert",
    role: "Wiceprezeska Zarządu",
    jobTitle: "songwriterka i wokalistka",
    href: "https://olageppert.pl",
    bio: [
      "Songwriterka i wokalistka z Gdańska, na styku alternatywnego popu, indie i brzmień retro. Pisze mroczne, melancholijne piosenki o cierpieniu, autonomii, sensie życia i miłości. Od debiutu w 2022 roku wydała osiem singli, m.in. „To nie ja” i „Delikatnie”. Jesienią 2026 ukazuje się jej debiutancka EP-ka nagrana z producentem Ioannim.",
      "Pięć lat kształcenia wokalnego, koncerty w Toruniu, Łodzi i Gdańsku, udział w międzynarodowym festiwalu chóralnym Mundus Cantat. W 2026 roku jej głos zabrzmiał w filmie dokumentalnym „Sędzia z Auschwitz” z muzyką Ioanniego.",
      "W latach 2022–2025 studiowała projektowanie graficzne na ASP w Łodzi oraz brała udział w Laboratorium Sztuki Performance i Międzynarodowym Festiwalu Sztuk Performatywnych w Płocku.",
      "W fundacji odpowiada za program artystyczny, kierunek, kontakt z artystami i oprawę wizualną.",
    ],
  },
] as const;

/** Cele statutowe – § 5 statutu, dosłownie. Zmiana tu = zmiana statutu. */
export const GOALS = [
  "wspieranie rozwoju młodych i początkujących twórców muzycznych, w szczególności artystów i zespołów na początku drogi artystycznej",
  "wspieranie artystów w rozwoju kariery, w tym w zakresie managementu, promocji i dystrybucji ich twórczości",
  "wspieranie twórczości fonograficznej młodych artystów i powstawania ich nagrań",
  "upowszechnianie kultury, w szczególności muzyki, oraz poszerzanie dostępu publiczności do nowej twórczości muzycznej",
  "tworzenie warunków do prezentowania twórczości muzycznej, przede wszystkim przez organizowanie koncertów",
  "edukacja muzyczna",
  "edukacja w zakresie funkcjonowania w branży muzycznej, w szczególności managementu, działalności wydawniczej i fonograficznej, promocji i dystrybucji muzyki oraz organizacji koncertów",
  "wspieranie rozwoju muzyki i środowiska muzycznego, w tym współpracy artystów, organizatorów, wydawców i innych osób zawodowo związanych z muzyką",
] as const;

/**
 * Działania – § 6 statutu przełożony na programy, którymi fundacja faktycznie
 * mówi o sobie. Etykiety niosą słowo branżowe („koncerty”, „nagrania”), bo
 * trafiają do h3 na /fundacja, do hero i do llms.txt. `href` prowadzi tam,
 * gdzie działanie już się dzieje; bez niego program ma tylko opis.
 */
export const ACTIVITIES = [
  {
    no: "01",
    id: "koncerty",
    label: "Koncerty i wydarzenia",
    description:
      "Kameralne koncerty, showcase’y i przeglądy, na których młodzi twórcy grają własny repertuar dla publiczności. Pierwszy cykl: „dźwięki efemeryczne” w Trójmieście.",
    href: CONCERT_SERIES_PATH,
    linkLabel: "dźwięki efemeryczne.",
  },
  {
    no: "02",
    id: "nagrania",
    label: "Nagrania i wydawnictwa",
    description:
      "Pomoc w nagraniu, wydaniu i promocji pierwszych singli i EP-ek: od planu wydawniczego, przez dystrybucję cyfrową i materiały prasowe, po kontakt z mediami i playlistami.",
  },
  {
    no: "03",
    id: "wiedza",
    label: "Wiedza o branży",
    description:
      "Baza wiedzy, warsztaty i konsultacje o tym, jak działa branża muzyczna: tantiemy i organizacje zbiorowego zarządzania, dystrybucja, booking, press kit, stypendia i dotacje.",
    href: KNOWLEDGE_PATH,
    linkLabel: "Baza wiedzy",
  },
  {
    no: "04",
    id: "kariera",
    label: "Wsparcie w karierze",
    description:
      "Management, promocja i dystrybucja dla artystów, którzy mają materiał i chcą pracować regularnie.",
  },
] as const;

/**
 * Projekty, którymi fundacja zajmuje się teraz – slot na stronie głównej,
 * w którym wcześniej stał roster managera. Wydawnictw fundatorki tu nie ma,
 * i to jest zasada, nie przeoczenie: projekt fundatora stoi na stronie
 * fundacji tylko wtedy, gdy wynika z celu statutowego (koncert, warsztat)
 * i z jawną rolą, nigdy jako promocja wydawnictwa – patrz AGENTS.md.
 * Linki zewnętrzne dostają UTM-y przez `withUtm()` w miejscu użycia.
 */
export const PROJECTS = [
  {
    name: CONCERT_SERIES_NAME,
    meta: "cykl koncertów – Trójmiasto 2027",
    href: CONCERT_SERIES_PATH,
  },
  {
    name: "Baza wiedzy",
    meta: "jak działa branża – bez skrótów",
    href: KNOWLEDGE_PATH,
  },
] as const;

export function withUtm(href: string, campaign: string): string {
  const url = new URL(href);
  url.searchParams.set("utm_source", SITE_HOST);
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.href;
}

/** Publiczne profile, które identyfikują tę samą osobę w danych schema.org. */
export const PERSON_PROFILES = [
  { name: "Type of Web", href: TYPE_OF_WEB_URL },
  { name: "LinkedIn", href: "https://linkedin.com/in/mmiszczyszyn" },
  { name: "Instagram", href: "https://www.instagram.com/typeofweb/" },
  { name: "Facebook", href: "https://facebook.com/typeofweb" },
  { name: "YouTube", href: "https://www.youtube.com/typeofweb" },
  { name: "X", href: "https://x.com/typeofweb" },
] as const;

/**
 * Kategorie bazy wiedzy. Kategoria opisuje efekt pracy, o której jest wpis,
 * a nie temat, o który zahacza – „budżet trasy" to Finanse, choć dotyczy
 * koncertów.
 */
export const CATEGORIES = [
  "Promocja",
  "Wydawnictwa",
  "Streaming",
  "Koncerty",
  "Finanse",
  "Zarządzanie",
  "Branża",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Formaty wpisu w bazie wiedzy. To nie jest wyłącznie konwencja redakcyjna:
 * `kind` steruje układem łamów na stronie wpisu – patrz komentarz tamże.
 */
export const KINDS = ["notatka", "przewodnik"] as const;

export type Kind = (typeof KINDS)[number];

/**
 * Rodzaje aktualności. Jeden strumień chronologiczny, a `kind` mówi, co to
 * jest: zapowiedź wydarzenia, relacja po nim, rozmowa, felieton, komunikat
 * albo sprawozdanie z projektu. Klucz jest bez diakrytyków, bo pada w
 * frontmatterze i w przyszłym CMS-ie; etykieta – do wyświetlania.
 */
export const NEWS_KINDS = {
  wydarzenie: "Wydarzenie",
  relacja: "Relacja",
  rozmowa: "Rozmowa",
  opinia: "Opinia",
  ogloszenie: "Ogłoszenie",
  sprawozdanie: "Sprawozdanie",
} as const;

export type NewsKind = keyof typeof NEWS_KINDS;

/**
 * Prefiks daty w nazwach plików wpisów (`2026-08-11-slug.md`). Zdejmują go
 * content.config.ts (id wpisu) i astro.config.mjs (lastmod w sitemapie) –
 * jedno wyrażenie, żeby oba miejsca nie mogły się rozjechać.
 */
export const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

// ---------------------------------------------------------------------------
// Polityka prywatności – jedno źródło dla strony /polityka-prywatnosci
// i dla linków w banerze cookies (src/scripts/consent.ts).
// ---------------------------------------------------------------------------
export const PRIVACY_POLICY_PATH = "/polityka-prywatnosci";
export const PRIVACY_POLICY_UPDATED = "2026-10-04";

/** Nazwa cookie z decyzją użytkownika – pada też w treści polityki. */
export const CONSENT_COOKIE = "mm_consent";
export const CONSENT_COOKIE_DAYS = 182;

/** Narzędzia zewnętrzne działające na stronie – tabela w polityce. */
export const PRIVACY_TOOLS = [
  {
    name: "Vercel (hosting)",
    provider: "Vercel Inc., USA",
    purpose: "Serwowanie strony, logi serwera, ochrona przed nadużyciami.",
    storage: "Brak cookies",
    basis: "Uzasadniony interes (art. 6 ust. 1 lit. f RODO)",
  },
  {
    name: "Vercel Web Analytics",
    provider: "Vercel Inc., USA",
    purpose:
      "Zliczanie odwiedzin i kliknięć w linki, bez identyfikowania użytkowników.",
    storage: "Brak cookies",
    basis: "Uzasadniony interes (art. 6 ust. 1 lit. f RODO)",
  },
  {
    name: "Umami",
    provider: "Umami Software, Inc., USA",
    purpose:
      "Statystyki odwiedzin i kliknięć w linki, bez profilowania i bez identyfikatorów.",
    storage: "Brak cookies",
    basis: "Uzasadniony interes (art. 6 ust. 1 lit. f RODO)",
  },
  {
    name: "Google Analytics 4",
    provider: "Google Ireland Limited, Irlandia",
    purpose:
      "Statystyki odwiedzin: oglądane podstrony, źródła wejść i kliknięcia w linki.",
    storage: "Cookies _ga, _ga_* (2 lata)",
    basis: "Zgoda (art. 6 ust. 1 lit. a RODO)",
  },
  {
    name: "Odtwarzacz Spotify",
    provider: "Spotify AB, Szwecja",
    purpose:
      "Osadzony odtwarzacz utworu w niektórych wpisach – odsłuch bez wychodzenia ze strony.",
    storage: "Cookies i localStorage Spotify",
    basis: "Uzasadniony interes (art. 6 ust. 1 lit. f RODO)",
  },
] as const;

export const PRIVACY_SECTIONS = [
  {
    title: "Kto jest administratorem",
    paragraphs: [
      `Administratorem danych zbieranych przez stronę ${SITE_URL} jest ${FOUNDATION.name}, ${FOUNDATION.street}, ${FOUNDATION.postalCode} ${FOUNDATION.city}, KRS ${registryValue(FOUNDATION.krs)}, NIP ${registryValue(FOUNDATION.nip)}.`,
      `We wszystkich sprawach dotyczących danych osobowych napisz na ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "Jakie dane zbieramy",
    paragraphs: [
      "Strona nie ma formularzy, logowania ani koszyka – nie proszę o żadne dane i nie zakładam kont.",
      "Zbierane są wyłącznie dane techniczne związane z odwiedzinami: adres IP, typ przeglądarki i urządzenia, adres odwiedzonej podstrony, źródło wejścia oraz przybliżona lokalizacja na poziomie kraju. Trafiają do narzędzi statystycznych wymienionych niżej.",
      `Jeśli napiszesz na ${CONTACT_EMAIL}, przetwarzamy dane zawarte w wiadomości wyłącznie po to, żeby na nią odpowiedzieć.`,
    ],
  },
  {
    title: "Cookies i zgoda",
    paragraphs: [
      "Przy pierwszej wizycie widzisz baner z pytaniem o cookies. Do momentu Twojej decyzji Google Analytics nie zapisuje niczego na Twoim urządzeniu – działa w trybie Google Consent Mode v2 z domyślnie odrzuconymi zgodami.",
      "Odmowa jest tak samo łatwa jak zgoda: oba przyciski są tej samej wielkości i dostępne jednym kliknięciem. Nic nie jest zaznaczone z góry.",
      "Decyzję zmienisz w każdej chwili – link „Cookies” w stopce otwiera panel ustawień. Po cofnięciu zgody zapisane wcześniej cookies analityczne są usuwane.",
      `Umami i Vercel Web Analytics nie zapisują niczego na Twoim urządzeniu i nie tworzą profili – liczą odwiedziny i kliknięcia w linki w postaci zbiorczych statystyk, bez wiązania ich z konkretną osobą – dlatego działają niezależnie od banera. Cookie z Twoją decyzją o zgodach (${CONSENT_COOKIE}, ${CONSENT_COOKIE_DAYS} dni) jest niezbędne do działania samego mechanizmu zgody.`,
      "Kroje pisma są serwowane z tego samego serwera co strona – przeglądanie serwisu nie wysyła żadnego zapytania do Google Fonts.",
      "W niektórych wpisach osadzony jest odtwarzacz Spotify. Wczytuje się razem ze stroną i Spotify zapisuje wtedy własne cookies oraz dane w localStorage, na zasadach opisanych w polityce prywatności Spotify. Jeśli tego nie chcesz, zablokuj cookies stron trzecich w ustawieniach przeglądarki.",
    ],
  },
  {
    title: "Przekazywanie danych poza EOG",
    paragraphs: [
      "Google, Vercel i Umami mogą przetwarzać dane w Stanach Zjednoczonych. Odbywa się to na podstawie decyzji Komisji Europejskiej o odpowiednim stopniu ochrony (EU–U.S. Data Privacy Framework) lub standardowych klauzul umownych.",
    ],
  },
  {
    title: "Jak długo przechowujemy dane",
    paragraphs: [
      "Dane w Google Analytics są przechowywane maksymalnie 14 miesięcy. Statystyki Umami i Vercela są zagregowane i nie pozwalają na identyfikację. Korespondencja mailowa – przez czas potrzebny do obsługi sprawy i ewentualnych roszczeń.",
    ],
  },
  {
    title: "Twoje prawa",
    paragraphs: [
      "Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, prawo do przenoszenia danych, prawo sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie oraz prawo do cofnięcia zgody w dowolnym momencie – bez wpływu na zgodność z prawem przetwarzania sprzed cofnięcia.",
      `Żeby skorzystać z tych praw, napisz na ${CONTACT_EMAIL}. Przysługuje Ci też skarga do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).`,
    ],
  },
] as const;
