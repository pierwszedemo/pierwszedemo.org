export const SITE_URL = "https://pierwszedemo.com";

/** Sama domena – badge kart OG, UTM-y, opisy. Nigdy nie wpisuj jej ręcznie. */
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Marka serwisu (tytuły, og:site_name, RSS) i osoba, która za nim stoi, to od
 * rebrandu dwie różne rzeczy. `SITE_NAME` idzie tam, gdzie mowa o serwisie;
 * `PERSON_NAME` tam, gdzie o człowieku – przede wszystkim w węźle Person
 * schema.org, bo encja osoby nie może nazywać się jak strona.
 */
export const SITE_NAME = "Pierwsze Demo";
export const PERSON_NAME = "Michał Miszczyszyn";
/**
 * Tytuł zawodowy jedzie do h1 strony głównej, `jobTitle` i `hasOccupation`.
 * „Manager muzyczny” zamiast „manager artystów”: „artysta” Google czyta też
 * jako malarza, a fraza z „muzyczny” jest tą, pod którą strona ma się
 * wyświetlać. „Manager artystów” zostaje w treści jako drugi wariant.
 */
export const SITE_TAGLINE = "Manager muzyczny";
export const SITE_DESCRIPTION =
  "Manager muzyczny: management artystów, wydawnictwa i booking dla muzyków alternatywnych. Od pierwszego demo do festiwalowych scen – z planem, nie z przypadku.";

export const CONTACT_EMAIL = "michal@pierwszedemo.com";
export const HOME_CITY = "Gdańsk";
export const TYPE_OF_WEB_URL = "https://typeofweb.com";
/** Profil marki (nie osoby) – stąd w stopce i w `sameAs` Organization, nie Person. */
export const INSTAGRAM_URL = "https://www.instagram.com/pierwszedemo/";

/**
 * Stabilne @id węzłów schema.org – wiążą encje między stronami. Jadą z
 * `SITE_URL`, więc zmiana domeny przepina je wszystkie naraz; poza taką
 * przeprowadzką nie ma powodu ich ruszać.
 */
export const PERSON_ID = `${SITE_URL}/#michal`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORGANIZATION_ID = `${SITE_URL}/#firma`;
/** Katalog usług – jeden węzeł, do którego odsyłają Person i Service. */
export const OFFER_CATALOG_ID = `${SITE_URL}/#uslugi`;

/** Data ostatniej zmiany treści – trafia do sitemap.lastmod i dateModified. */
export const LAST_CONTENT_UPDATE = "2026-09-29";

/**
 * Identyfikator pomiaru GA4 (G-XXXXXXXXXX). Pusty łańcuch = gtag.js w ogóle
 * się nie ładuje; baner zgody i Consent Mode działają wtedy tak samo, tylko
 * nie mają czego włączyć. Wpisanie ID to jedyna zmiana potrzebna do startu
 * analityki – reszta jest już podpięta.
 */
export const GA_ID = "G-MHM5P6X3TG";

/** Marka w lewej komórce nagłówka – w projekcie zapisana z ®. */
export const WORDMARK = `${SITE_NAME}®`;

/** Strona usługowa – cel linków z listy usług w hero i z nawigacji. */
export const SERVICE_PATH = "/manager-muzyczny";

/** Strona cyklu koncertów „dźwięki efemeryczne” – poza nawigacją, linkowana z zewnątrz. */
export const CONCERT_SERIES_PATH = "/dzwieki-efemeryczne";
/** Nazwa własna cyklu: małymi literami i z kropką, jak na plakacie. */
export const CONCERT_SERIES_NAME = "dźwięki efemeryczne.";
/** Karta OG strony cyklu – osobny plik obok kart wpisów w /og/. */
export const CONCERT_SERIES_OG = `/og${CONCERT_SERIES_PATH}.png`;

/**
 * Nawigacja. Makieta ma cztery komórki (marka, dwie pozycje, Kontakt); piąta –
 * Współpraca – doszła razem ze stroną usługową, Nav.astro rozszerza siatkę.
 */
export const NAV = [
  { label: "Współpraca", href: SERVICE_PATH },
  { label: "O mnie", href: "/o-mnie" },
  { label: "Blog", href: "/blog" },
] as const;

/**
 * Etykiety niosą słowo kluczowe („muzyczne”, „koncertowy”), bo trafiają do h1
 * strony usługowej, hero, OfferCatalog i llms.txt – samo „Booking” nie mówi
 * robotowi, o jaką branżę chodzi. `description` czyta strona /manager-muzyczny
 * i węzeł Service w JSON-LD.
 */
export const SERVICES = [
  {
    no: "01",
    id: "management",
    label: "Management artystów",
    description:
      "Strategia kariery, plan wydawniczy i koncertowy, pilnowanie terminów i pieniędzy. Rozmowy z wytwórniami, agencjami i mediami w imieniu artysty.",
  },
  {
    no: "02",
    id: "wydawnictwa",
    label: "Wydawnictwa muzyczne",
    description:
      "Kalendarz premier, dystrybucja cyfrowa, pitching do playlist i mediów, materiały prasowe. Od demo do wydanego singla, EP-ki albo albumu.",
  },
  {
    no: "03",
    id: "booking",
    label: "Booking koncertowy",
    description:
      "Zgłoszenia na festiwale i showcase’y, oferta koncertowa, negocjacje z organizatorami, logistyka trasy.",
  },
] as const;

/**
 * Linki wychodzące do stron artystów dostają UTM-y, żeby w ich analityce
 * ruch z tej strony dał się odróżnić od wejść bezpośrednich. `href` trzymamy
 * czysty – parametry dokleja `withUtm()` w miejscu użycia, więc kanoniczny
 * adres zostaje jeden (m.in. w JSON-LD, gdyby kiedyś tam trafił).
 */
export const ROSTER = [
  {
    name: "Ola Geppert",
    genres: "alt-pop / indie / retro",
    href: "https://olageppert.pl",
  },
  // Duet to osobna pozycja, bo to osobny projekt z własnym wydawnictwem.
  // Formalnie prowadzę tylko Olę – Ioanni nie jest w managemencie – ale przy
  // wspólnym materiale nie da się prowadzić połowy projektu (patrz wpis
  // „Początkujący manager…”). Adres ten sam: duet nie ma własnej strony.
  {
    name: "Ola Geppert / Ioanni",
    genres: "duet / alt-pop",
    href: "https://olageppert.pl",
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
 * Kategoria opisuje efekt pracy, o której jest wpis, a nie temat, o który
 * zahacza – „budżet trasy" to Finanse, choć dotyczy koncertów.
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
 * Formaty wpisu. To nie jest wyłącznie konwencja redakcyjna: `kind` steruje
 * układem łamów w src/pages/blog/[...slug].astro – patrz komentarz tamże.
 */
export const KINDS = ["notatka", "przewodnik"] as const;

export type Kind = (typeof KINDS)[number];

/**
 * Prefiks daty w nazwach plików wpisów (`2026-08-11-slug.md`). Zdejmują go
 * content.config.ts (id wpisu) i astro.config.mjs (lastmod w sitemapie) –
 * jedno wyrażenie, żeby oba miejsca nie mogły się rozjechać.
 */
export const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

// ---------------------------------------------------------------------------
// Polityka prywatności – jedno źródło dla strony /polityka-prywatnosci
// i dla linków w banerze cookies (src/scripts/consent.ts).
// ---------------------------------------------------------------------------
export const PRIVACY_POLICY_PATH = "/polityka-prywatnosci";
export const PRIVACY_POLICY_UPDATED = "2026-08-09";

/** Nazwa cookie z decyzją użytkownika – pada też w treści polityki. */
export const CONSENT_COOKIE = "mm_consent";
export const CONSENT_COOKIE_DAYS = 182;

/**
 * Administrator danych. To firma, nie osoba prywatna – dane muszą się zgadzać
 * z wpisem w CEIDG i z polityką na pl.typeofweb.com, bo to ten sam podmiot.
 */
export const COMPANY = {
  name: "Type of Web - Michał Miszczyszyn",
  street: "ul. Stolema 6H/2",
  postalCode: "80-177",
  city: "Gdańsk",
  nip: "6040080451",
} as const;

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
      "Osadzony odtwarzacz utworu w niektórych wpisach na blogu – odsłuch bez wychodzenia ze strony.",
    storage: "Cookies i localStorage Spotify",
    basis: "Uzasadniony interes (art. 6 ust. 1 lit. f RODO)",
  },
] as const;

export const PRIVACY_SECTIONS = [
  {
    title: "Kto jest administratorem",
    paragraphs: [
      `Administratorem danych zbieranych przez stronę ${SITE_URL} jest ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}, NIP ${COMPANY.nip} – działalność gospodarcza wpisana do CEIDG.`,
      `We wszystkich sprawach dotyczących danych osobowych napisz na ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "Jakie dane zbieram",
    paragraphs: [
      "Strona nie ma formularzy, logowania ani koszyka – nie proszę o żadne dane i nie zakładam kont.",
      "Zbierane są wyłącznie dane techniczne związane z odwiedzinami: adres IP, typ przeglądarki i urządzenia, adres odwiedzonej podstrony, źródło wejścia oraz przybliżona lokalizacja na poziomie kraju. Trafiają do narzędzi statystycznych wymienionych niżej.",
      `Jeśli napiszesz na ${CONTACT_EMAIL}, przetwarzam dane zawarte w wiadomości wyłącznie po to, żeby na nią odpowiedzieć.`,
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
      "W niektórych wpisach na blogu osadzony jest odtwarzacz Spotify. Wczytuje się razem ze stroną i Spotify zapisuje wtedy własne cookies oraz dane w localStorage, na zasadach opisanych w polityce prywatności Spotify. Jeśli tego nie chcesz, zablokuj cookies stron trzecich w ustawieniach przeglądarki.",
    ],
  },
  {
    title: "Przekazywanie danych poza EOG",
    paragraphs: [
      "Google, Vercel i Umami mogą przetwarzać dane w Stanach Zjednoczonych. Odbywa się to na podstawie decyzji Komisji Europejskiej o odpowiednim stopniu ochrony (EU–U.S. Data Privacy Framework) lub standardowych klauzul umownych.",
    ],
  },
  {
    title: "Jak długo przechowuję dane",
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
