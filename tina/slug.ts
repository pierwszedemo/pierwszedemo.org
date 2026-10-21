/**
 * Slug z polskiego tekstu: „Skąd wziąć pieniądze” → „skad-wziac-pieniadze”.
 * `ł` nie rozkłada się w NFD na literę i znak diakrytyczny, stąd osobna zamiana.
 * Wspólny dla nazwy pliku nowego wpisu (config.ts) i podglądu okładki
 * (cover-field.tsx), który przed pierwszym zapisem musi znać ten sam slug.
 */
export const slugify = (text: string) =>
	text
		.toLowerCase()
		.replace(/ł/g, "l")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
