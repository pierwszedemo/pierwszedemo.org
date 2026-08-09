import type { APIRoute } from "astro";
import { OG_HEADERS, renderOgCard } from "../og";

export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Kariera to strategia.",
    badge: "miszczyszyn.com",
  });
  return new Response(png, { headers: OG_HEADERS });
};
