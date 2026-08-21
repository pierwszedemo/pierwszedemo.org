#!/usr/bin/env bun
/**
 * Formaty pojedyncze na Instagram – trzy układy, które mają się *odróżniać* od
 * karuzeli, żeby profil nie zlewał się w jedną ścianę białych kadrów. Ramy
 * (nagłówek, stopka, kadr) są wspólne z karuzelą i przychodzą z lib.mjs; różni
 * się środek:
 *
 *   mit     – dwa slajdy w odwróconej kolejności niż karuzela: 01 negatyw
 *             z przekreślonym mitem, 02 biel z faktem. Etykieta MIT/FAKT to
 *             ogromne mono – karuzela nigdy nie używa dużego mono.
 *   zapisz  – jeden slajd na tle `panel` (krem), numerowane wiersze
 *             oddzielone hairline. Lista, której karuzela nie ma.
 *   pytanie – jeden slajd, tekst wyśrodkowany w hairline'owej ramce, wielki
 *             „?” w mono. Karuzela jest zawsze lewa i bez ramki.
 *
 * Uruchomienie – zawsze z katalogu głównego repo:
 *   bun .agents/skills/instagram-carousel/scripts/format.mjs <slug> <mit|zapisz|pytanie>
 * Czyta instagram/<data>-<slug>-<format>/spec.json, zapisuje tam NN.png
 * i alt.txt – każdy post na Instagram ma własny katalog, jak karuzela.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  BODY, HAIRLINE, INK, MUTED, MUTED_ON_INK, PANEL, el, failOn, footer, frame, glue, header, makeCheck, mono,
  readSpec, render, requireRepoRoot, resolvePostDir,
} from "./lib.mjs";

const FORMATS = ["mit", "zapisz", "pytanie"];
const [slug, format] = process.argv.slice(2);
requireRepoRoot();
const post = resolvePostDir(slug, format);
if (!post || !FORMATS.includes(format)) {
  console.error(`Użycie: bun .agents/skills/instagram-carousel/scripts/format.mjs <slug> <${FORMATS.join("|")}>`);
  process.exit(1);
}
const { dir, dirName } = post;
const spec = readSpec(resolve(dir, "spec.json"));
const errors = [];
const check = makeCheck(errors);
const eyebrow = spec.eyebrow ?? "Blog";
check("eyebrow", eyebrow, 40);

/** Wielka etykieta mono – znak rozpoznawczy formatów, nieobecny w karuzeli. */
const bigMono = (text, color) =>
  el("div", { ...mono, fontSize: 120, letterSpacing: "0.06em", lineHeight: 1, color }, text);

let nodes;
let altLines;

if (format === "mit") {
  // Mit ma być zdaniem, które ktoś naprawdę mówi; fakt – tezą wpisu.
  check("mit", spec.mit, 110, { token: 17 });
  check("fakt", spec.fakt, 140, { token: 17 });
  check("rozwiniecie", spec.rozwiniecie, 220, { required: false, token: 30 });
  failOn(errors);
  const size = (s) => (s.length > 90 ? 60 : s.length > 60 ? 68 : 80);
  nodes = [
    frame(true, [
      header(eyebrow, "01/02", true),
      el("div", { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "flex-end", paddingBottom: 56 }, [
        bigMono("Mit", MUTED_ON_INK),
        el(
          "div",
          {
            marginTop: 40, fontSize: size(spec.mit), fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em",
            maxWidth: 912, textDecoration: "line-through", textDecorationColor: MUTED_ON_INK, color: "#ffffff",
          },
          glue(spec.mit),
        ),
      ]),
      footer(true),
    ]),
    frame(false, [
      header(eyebrow, "02/02"),
      el("div", { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "flex-end", paddingBottom: 56 }, [
        bigMono("Fakt", INK),
        el("div", { marginTop: 40, fontSize: size(spec.fakt), fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 912 }, glue(spec.fakt)),
        ...(spec.rozwiniecie
          ? [el("div", { marginTop: 30, fontSize: 36, lineHeight: 1.4, color: BODY, maxWidth: 880 }, glue(spec.rozwiniecie))]
          : []),
      ]),
      footer(false),
    ]),
  ];
  altLines = [`Mit: ${spec.mit}`, `Fakt: ${spec.fakt}${spec.rozwiniecie ? ` ${spec.rozwiniecie}` : ""}`];
}

if (format === "zapisz") {
  check("tytul", spec.tytul, 60, { token: 20 });
  const items = Array.isArray(spec.punkty) ? spec.punkty : [];
  if (items.length < 3 || items.length > 6) errors.push(`punkty: ${items.length}, ma być 3–6`);
  // Wiersz ma zmieścić się w jednej–dwóch linijkach przy 36 px obok numeru.
  items.forEach((p, i) => check(`punkty[${i}]`, p, 90, { token: 26 }));
  failOn(errors);
  nodes = [
    frame(false, [
      header(eyebrow, "Zapisz na później"),
      el("div", { display: "flex", flexGrow: 1, flexDirection: "column", justifyContent: "center" }, [
        el("div", { fontSize: 56, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.025em", maxWidth: 912, marginBottom: 36 }, glue(spec.tytul)),
        ...items.map((p, i) =>
          el(
            "div",
            {
              display: "flex", alignItems: "flex-start", gap: 36, paddingTop: 26, paddingBottom: 26,
              borderTop: `2px solid ${HAIRLINE}`, borderBottom: i === items.length - 1 ? `2px solid ${HAIRLINE}` : "none",
            },
            [
              el("div", { ...mono, fontSize: 26, color: MUTED, paddingTop: 8, width: 64, flexShrink: 0 }, String(i + 1).padStart(2, "0")),
              el("div", { fontSize: 36, lineHeight: 1.35, color: INK, flexGrow: 1 }, glue(p)),
            ],
          ),
        ),
      ]),
      footer(false),
    ], PANEL),
  ];
  altLines = [`${spec.tytul}. ${items.map((p, i) => `${i + 1}. ${p}`).join(" ")}`];
}

if (format === "pytanie") {
  check("pytanie", spec.pytanie, 120, { token: 17 });
  check("podpis", spec.podpis, 60, { required: false });
  failOn(errors);
  const size = spec.pytanie.length > 90 ? 60 : spec.pytanie.length > 60 ? 68 : 80;
  nodes = [
    frame(false, [
      header(eyebrow, "Pytanie"),
      el(
        "div",
        {
          display: "flex", flexGrow: 1, flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", border: `2px solid ${HAIRLINE}`, marginTop: 40, marginBottom: 40, padding: 64,
        },
        [
          bigMono("?", MUTED),
          el("div", { marginTop: 40, fontSize: size, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 800 }, glue(spec.pytanie)),
          el("div", { ...mono, marginTop: 48, color: MUTED }, spec.podpis ?? "Odpowiedz w komentarzu"),
        ],
      ),
      footer(false),
    ]),
  ];
  altLines = [`Pytanie: ${spec.pytanie} ${spec.podpis ?? "Odpowiedz w komentarzu"}`];
}

mkdirSync(dir, { recursive: true });
await render({ dir, dirName, nodes, altLines });
console.log(`Gotowe: ${format}, ${nodes.length} ${nodes.length === 1 ? "slajd" : "slajdy"}.`);
