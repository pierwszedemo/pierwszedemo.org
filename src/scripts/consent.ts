import type { CookieConsentConfig } from "vanilla-cookieconsent";
import * as CookieConsent from "vanilla-cookieconsent";
import { CONSENT_COOKIE, CONSENT_COOKIE_DAYS, PRIVACY_POLICY_PATH, SITE_URL } from "../consts";

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
		/** Ustawiane przez ConsentManager.astro – init tylko raz na sesję. */
		__ccInit?: boolean;
	}
}

/**
 * Przekazuje decyzję użytkownika do Google Consent Mode v2. Domyślne „denied"
 * ustawia BaseLayout jeszcze przed gtag.js – tutaj tylko podnosimy zgody.
 */
const syncGoogleConsent = () => {
	const analytics = CookieConsent.acceptedCategory("analytics") ? "granted" : "denied";
	const ads = CookieConsent.acceptedCategory("ads") ? "granted" : "denied";

	window.gtag?.("consent", "update", {
		analytics_storage: analytics,
		ad_storage: ads,
		ad_user_data: ads,
		ad_personalization: ads,
	});
};

const domain = new URL(SITE_URL).hostname;

export const consentConfig: CookieConsentConfig = {
	// Umami i Cloudflare Web Analytics nie zapisują nic na urządzeniu (brak cookies
	// i localStorage), więc art. 5(3) ePrivacy ich nie obejmuje – nie ma ich
	// w banerze. Wymienione są w polityce prywatności.
	root: "body",
	autoShow: true,
	// Podbij przy każdej zmianie kategorii lub treści zgody – użytkownicy
	// zostaną zapytani ponownie.
	revision: 1,
	cookie: {
		name: CONSENT_COOKIE,
		expiresAfterDays: CONSENT_COOKIE_DAYS,
		sameSite: "Lax",
	},

	guiOptions: {
		consentModal: {
			// „cloud inline" w rogu – jedno zdanie i dwa przyciski w jednej linii.
			// Bez overlaya i bez blokady scrolla, więc strona zostaje w pełni
			// czytelna i klikalna.
			layout: "cloud inline",
			position: "bottom right",
			// Oba przyciski tej samej wagi – wymóg UODO/EROD, żeby odmowa była
			// tak samo łatwa jak zgoda.
			equalWeightButtons: true,
			flipButtons: false,
		},
		preferencesModal: {
			layout: "box",
			equalWeightButtons: true,
			flipButtons: false,
		},
	},

	categories: {
		necessary: {
			enabled: true,
			readOnly: true,
		},
		analytics: {
			// Po cofnięciu zgody kasujemy cookies GA – sam brak zgody nie usuwa
			// tego, co zapisało się wcześniej.
			autoClear: {
				cookies: [{ name: /^_ga/ }],
			},
		},
		ads: {
			autoClear: {
				cookies: [{ name: /^_fb/ }, { name: /^_gcl/ }],
			},
		},
	},

	language: {
		default: "pl",
		translations: {
			pl: {
				consentModal: {
					// Tytuł tylko dla czytników ekranu (ukryty w CSS) – na pasku liczy
					// się jedno zdanie i dwa przyciski.
					title: "Cookies",
					// Linki w opisie zamiast stopki i trzeciego przycisku – na pasku
					// zostają tylko dwa równorzędne przyciski (zgoda / odmowa).
					// [data-cc-preferences] obsługuje ConsentManager.astro.
					description: `Cookies ⋅ <button type="button" data-cc-preferences>Ustawienia</button> ⋅ <a href="${PRIVACY_POLICY_PATH}">Polityka</a>`,
					acceptAllBtn: "Akceptuję",
					acceptNecessaryBtn: "Odrzucam",
				},
				preferencesModal: {
					title: "Ustawienia cookies",
					acceptAllBtn: "Akceptuję wszystkie",
					acceptNecessaryBtn: "Odrzucam wszystkie",
					savePreferencesBtn: "Zapisz wybór",
					closeIconLabel: "Zamknij",
					serviceCounterLabel: "usługa|usługi",
					sections: [
						{
							description: `Decydujesz, co może zapisać się na Twoim urządzeniu. Wybór zmienisz w każdej chwili – link „Cookies” jest w stopce. Szczegóły w <a href="${PRIVACY_POLICY_PATH}">polityce prywatności</a>.`,
						},
						{
							title: "Niezbędne",
							description:
								"Zapamiętanie Twojej decyzji o cookies. Bez tego baner pytałby przy każdym wejściu.",
							linkedCategory: "necessary",
						},
						{
							title: "Analityka",
							description:
								"Google Analytics – anonimowe statystyki odwiedzin: które podstrony są oglądane i skąd przychodzą wejścia.",
							linkedCategory: "analytics",
							cookieTable: {
								headers: {
									name: "Cookie",
									domain: "Domena",
									desc: "Opis",
									exp: "Wygasa",
								},
								body: [
									{
										name: "_ga",
										domain,
										desc: "Losowy identyfikator przeglądarki – rozróżnia unikalnych użytkowników.",
										exp: "2 lata",
									},
									{
										name: "_ga_*",
										domain,
										desc: "Stan sesji Google Analytics 4.",
										exp: "2 lata",
									},
								],
							},
						},
						{
							title: "Marketing",
							description:
								"Mierzenie skuteczności reklam i remarketing (Meta Pixel, Google Ads). Obecnie nieużywane – kategoria jest tu na wypadek kampanii promujących artystów.",
							linkedCategory: "ads",
						},
						{
							title: "Bez cookies",
							description:
								"Umami i Cloudflare Web Analytics zliczają odwiedziny, nie zapisując niczego na Twoim urządzeniu i nie tworząc profili. Dlatego działają zawsze i nie wymagają zgody.",
						},
					],
				},
			},
		},
	},

	// onConsent leci też przy pierwszej decyzji i po każdym wczytaniu strony
	// z zapisaną zgodą; onChange – przy edycji ustawień.
	onConsent: syncGoogleConsent,
	onChange: syncGoogleConsent,
};
