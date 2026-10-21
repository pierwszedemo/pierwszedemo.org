/**
 * Domena, z której podgląd linku (og:image) ma pobrać kartę. Strona jest
 * statyczna: HTML powstaje raz, przy buildzie, bez żądania, więc nie zna
 * hosta, z którego zostanie podany – a og:image musi być adresem
 * bezwzględnym (Facebook, LinkedIn i Slack nie rozwiązują względnych).
 * Domyślnie to więc produkcja, ale wtedy podgląd gałęzi pokazywał kartę
 * z produkcji – starą albo 404 dla wpisu, którego tam jeszcze nie ma.
 *
 * Build podglądu w Workers Builds (gałąź inna niż `main`) zna swoją gałąź
 * (`WORKERS_CI_BRANCH`), a `wrangler preview` nazywa podgląd jej nazwą, więc
 * adres da się złożyć: `<gałąź>-<worker>.<subdomena>.workers.dev`. Gałąź
 * czyścimy tak jak wrangler (`sanitizeBranchName`); gdy nazwa się nie mieści
 * w etykiecie DNS, wrangler skraca ją z haszem – wtedy zostaje produkcja.
 *
 * Dotyczy tylko og:image. Canonical, og:url i JSON-LD zostają produkcyjne,
 * bo podgląd nie może udawać strony kanonicznej. Moduł czyta `process.env`,
 * więc tylko dla kodu renderowanego na serwerze – nigdy z `src/scripts/`.
 */
import { SITE_URL } from "./consts";

const WORKER = "pierwszedemo";
const WORKERS_DEV = "fundacja-pierwsze-demo.workers.dev";
const PRODUCTION_BRANCH = "main";

export function previewOrigin(branch = process.env.WORKERS_CI_BRANCH): string | undefined {
	if (!branch || branch === PRODUCTION_BRANCH) return undefined;
	const alias = branch
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
	if (!/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/.test(alias) || alias.length + WORKER.length + 1 > 63)
		return undefined;
	return `https://${alias}-${WORKER}.${WORKERS_DEV}`;
}

/** Origin dla og:image: serwer deweloperski z żądania, podgląd gałęzi albo produkcja. */
export function ogOrigin(requestUrl: URL): string {
	if (import.meta.env.DEV) return requestUrl.origin;
	return previewOrigin() ?? SITE_URL;
}
