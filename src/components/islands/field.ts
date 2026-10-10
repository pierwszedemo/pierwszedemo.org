import { tinaField } from "@tinacms/astro/tina-field";

/**
 * `data-tina-field` dla klikania w podglądzie edytora. Bez metadanych Tiny
 * (zwykły build) `tinaField()` zwraca pusty łańcuch – wtedy `undefined`, żeby
 * Astro w ogóle nie wypisało atrybutu i produkcyjny HTML został czysty.
 */
export const field = (object: unknown, property?: string, index?: number) =>
	// Typy `tinaField` zakładają obiekt z wygenerowanego klienta Tiny; tu
	// dostaje też zwykłe JSON-y z buildu, dla których i tak zwraca "".
	tinaField(object as never, property as never, index) || undefined;
