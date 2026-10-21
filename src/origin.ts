/**
 * Czy build jest podglądem gałęzi i pod jakim adresem stoi. Podgląd to build
 * Workers Builds z gałęzi innej niż `main` (`WORKERS_CI_BRANCH`), wgrany przez
 * `wrangler preview`, który nazywa podgląd gałęzią. Stoi pod dwoma adresami:
 * `<gałąź>.pierwszedemo.org` (trasa z `previews_enabled` w wrangler.jsonc)
 * i `<gałąź>-pierwszedemo.fundacja-pierwsze-demo.workers.dev` (`preview_urls`).
 *
 * Strona jest statyczna: HTML powstaje raz, przy buildzie, bez żądania, więc
 * nie zna hosta, z którego zostanie podany – a og:image musi być adresem
 * bezwzględnym (Facebook, LinkedIn i Slack nie rozwiązują względnych).
 * Z produkcyjnym hostem podgląd pokazywał w podglądzie linku kartę
 * z produkcji – starą albo 404 dla wpisu, którego tam jeszcze nie ma. Bierze
 * więc własną domenę, bo to ten adres się udostępnia. Gałąź czyścimy tak jak
 * wrangler (`sanitizeBranchName`); nazwa, która nie mieści się w etykiecie
 * DNS, zostaje przy produkcji.
 *
 * Canonical, og:url i JSON-LD zostają produkcyjne – podgląd nie może udawać
 * strony kanonicznej. Moduł czyta `process.env`, więc tylko dla kodu
 * renderowanego na serwerze – nigdy z `src/scripts/`.
 */
import { SITE_HOST, SITE_URL } from "./consts";

const PRODUCTION_BRANCH = "main";

const previewBranch = () => {
	const name = process.env.WORKERS_CI_BRANCH;
	return name && name !== PRODUCTION_BRANCH ? name : undefined;
};

/** Build podglądu gałęzi – BaseLayout daje mu noindex. */
export const isPreviewBuild = () => previewBranch() !== undefined;

export function previewOrigin(branch = previewBranch()): string | undefined {
	if (!branch) return undefined;
	const label = branch
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
	if (!/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/.test(label) || label.length > 63) return undefined;
	return `https://${label}.${SITE_HOST}`;
}

/** Origin dla og:image: serwer deweloperski z żądania, podgląd gałęzi albo produkcja. */
export function ogOrigin(requestUrl: URL): string {
	if (import.meta.env.DEV) return requestUrl.origin;
	return previewOrigin() ?? SITE_URL;
}
