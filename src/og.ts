import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { HOME_CITY, SITE_HOST, SITE_NAME, SITE_TAGLINE, WORDMARK } from "./consts";

/**
 * Karty OG 1200×630 rysowane tym samym językiem, co strona: biel, twarda
 * linia, Archivo w tytule, IBM Plex Mono w etykietach.
 *
 * Dlaczego satori, a nie samo SVG w sharpie: sharp renderuje SVG librsvg,
 * który sięga po *systemowe* fonty – Archivo nie ma ani na tej maszynie, ani
 * na builderze Vercela, więc tekst wyszedłby zastępczym krojem. Satori dostaje
 * pliki TTF wprost i zamienia tekst na ścieżki, więc sharp rasteryzuje już
 * gotowe kształty. Stąd też wersje TTF w `src/assets/fonts` – Fonts API Astro
 * cachuje woff2, którego satori nie czyta.
 *
 * Ścieżki liczymy od `process.cwd()`, a nie od `import.meta.url`: Vite bundluje
 * ten moduł do `dist/server/.prerender/chunks/`, obok którego plików TTF już
 * nie ma. Kod wykonuje się wyłącznie przy buildzie (endpointy mają
 * `prerender = true`), więc cwd to katalog repo.
 */
const font = (path: string) => readFileSync(resolve(process.cwd(), path));

const FONTS = [
  {
    name: "Archivo",
    data: font("src/assets/fonts/Archivo-SemiBold.ttf"),
    weight: 600 as const,
    style: "normal" as const,
  },
  {
    name: "IBM Plex Mono",
    data: font("src/assets/fonts/IBMPlexMono-Medium.ttf"),
    weight: 500 as const,
    style: "normal" as const,
  },
];

const INK = "#101010";
const MUTED = "#6f6d68";

interface CardOptions {
  /**
   * Nadtytuł w monospace, u góry karty: nazwa fundacji i czym jest. Kartę
   * widać w podglądzie linku, gdzie stopka z wordmarkiem bywa przycięta.
   * Bez nawiasów, które nosi `h1` strony głównej – tam to etykieta, tu byline.
   */
  eyebrow?: string;
  title: string;
  /** Prawa etykieta w stopce karty – kategoria wpisu albo adres serwisu. */
  badge?: string;
  /** Wymiary płótna; domyślnie karta OG 1200×630. */
  width?: number;
  height?: number;
  /**
   * Poziomy margines treści. Okładka na Facebooku jest kadrowana inaczej na
   * desktopie (820×312) i w telefonie (640×360), więc treść musi siedzieć
   * w środkowym pasie – stąd większy margines niż w karcie OG.
   */
  paddingX?: number;
}

// Satori bez JSX: element to zwykły obiekt {type, props}. Każdy div z wieloma
// dziećmi musi mieć jawny `display: flex` – satori nie zakłada blokowego układu.
const el = (type: string, style: Record<string, unknown>, children?: unknown) =>
  ({ type, props: { style, ...(children === undefined ? {} : { children }) } }) as const;

const mono = {
  fontFamily: "IBM Plex Mono",
  fontSize: 22,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
};

export async function renderOgCard({
  eyebrow = `${SITE_NAME} – ${SITE_TAGLINE} – ${HOME_CITY}`,
  title,
  badge,
  width = 1200,
  height = 630,
  paddingX = 64,
}: CardOptions): Promise<Buffer> {
  // Długie tytuły wpisów muszą zmieścić się w trzech wierszach – bez tego
  // satori pozwoliłby im wyjechać poza kartę.
  const size = title.length > 64 ? 66 : title.length > 40 ? 78 : 94;

  const svg = await satori(
    el(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
        color: INK,
        fontFamily: "Archivo",
      },
      [
        el(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            padding: `64px ${paddingX}px 0`,
          },
          [
            el("div", { ...mono, color: MUTED }, eyebrow),
            el(
              "div",
              {
                marginTop: 36,
                fontSize: size,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                // Satori nie ma `text-wrap: balance`; 16ch trzyma wiersze
                // w tej samej proporcji, co nagłówki na stronie.
                maxWidth: 1000,
              },
              title,
            ),
          ],
        ),
        el(
          "div",
          {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${INK}`,
            padding: `34px ${paddingX}px`,
          },
          [
            el("div", { fontSize: 26 }, WORDMARK),
            el("div", { ...mono, color: MUTED }, badge ?? SITE_HOST),
          ],
        ),
      ],
    ),
    { width, height, fonts: FONTS },
  );

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** Nagłówki wspólne dla obu endpointów z kartami. */
export const OG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=31536000, immutable",
};
