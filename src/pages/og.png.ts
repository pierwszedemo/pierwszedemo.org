import type { APIRoute } from "astro";
import { OG_HEADERS, renderOgCard } from "../og";

export const prerender = true;

export const GET: APIRoute = async () => {
  // Bez `badge` – domyślny to adres serwisu, liczony z SITE_URL.
  const png = await renderOgCard({ title: "Kariera to strategia." });
  return new Response(png, { headers: OG_HEADERS });
};
