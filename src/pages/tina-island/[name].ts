/**
 * Jedyna trasa renderowana na żądanie: odświeżanie wysp w edytorze Tiny.
 * Przyjmuje wyłącznie POST z typem treści bridge'a i z tej samej domeny –
 * zwykły ruch dostaje 404/405 (patrz experimental_createIslandRoute).
 */
import type { APIRoute } from "astro";
import { experimental_createIslandRoute } from "@tinacms/astro/experimental";
import { islands } from "../../islands";

export const prerender = false;
export const ALL: APIRoute = experimental_createIslandRoute(islands);
