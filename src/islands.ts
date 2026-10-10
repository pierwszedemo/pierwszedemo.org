/**
 * Rejestr wysp edycji wizualnej. Działa tylko w edytorze: bridge w iframie
 * /admin woła POST /tina-island/<nazwa> (trasa na żądanie, worker), a ta
 * renderuje komponent z danymi z Tiny – z niezapisanymi jeszcze zmianami
 * z formularza. Strony przy buildzie tego nie używają: renderują te same
 * komponenty z JSON-ów (src/strony.ts), bez zapytań do Tiny.
 *
 * Klient Tiny jest generowany przez `tinacms build`/`tinacms dev` i ma
 * w sobie adres API oraz token tylko do odczytu – trafia do workera, nigdy
 * do przeglądarki.
 */

import { requestWithMetadata } from "@tinacms/astro";
import type { IslandRegistry } from "@tinacms/astro/experimental";
import client from "../tina/__generated__/client";
import FundacjaDzialania from "./components/islands/FundacjaDzialania.astro";
import FundacjaMisja from "./components/islands/FundacjaMisja.astro";
import FundacjaNaglowek from "./components/islands/FundacjaNaglowek.astro";
import Fundator from "./components/islands/Fundator.astro";
import HomeHero from "./components/islands/HomeHero.astro";
import HomeKontakt from "./components/islands/HomeKontakt.astro";
import HomeTeraz from "./components/islands/HomeTeraz.astro";
import { wrappers } from "./components/islands/wrappers";
import type { ActivitiesDoc, FoundationPageDoc, FoundersDoc, HomepageDoc } from "./strony";

const getHome = () =>
	requestWithMetadata(client.queries.stronaGlowna({ relativePath: "strona-glowna.json" }));
const getActivities = () => requestWithMetadata(client.queries.dzialania({ relativePath: "dzialania.json" }));
const getFoundationPage = () =>
	requestWithMetadata(client.queries.fundacja({ relativePath: "fundacja.json" }));
const getFounders = () => requestWithMetadata(client.queries.fundatorzy({ relativePath: "fundatorzy.json" }));

type Result<T> = { data: Record<string, unknown> } & { data: { [key: string]: T } };
const doc = <T>(result: unknown, key: string) => (result as Result<T>).data[key];

export const islands: IslandRegistry = {
	"home-hero": {
		fetch: async () => Promise.all([getHome(), getActivities()]),
		component: HomeHero,
		wrapper: wrappers["home-hero"],
		propsFromData: (data) => {
			const [home, activities] = data as [unknown, unknown];
			return {
				home: doc<HomepageDoc>(home, "stronaGlowna"),
				activities: doc<ActivitiesDoc>(activities, "dzialania"),
			};
		},
	},
	"home-teraz": {
		fetch: getHome,
		component: HomeTeraz,
		wrapper: wrappers["home-teraz"],
		propsFromData: (data) => ({ home: doc<HomepageDoc>(data, "stronaGlowna") }),
	},
	"home-kontakt": {
		fetch: getHome,
		component: HomeKontakt,
		wrapper: wrappers["home-kontakt"],
		propsFromData: (data) => ({ home: doc<HomepageDoc>(data, "stronaGlowna") }),
	},
	"fundacja-naglowek": {
		fetch: getFoundationPage,
		component: FundacjaNaglowek,
		wrapper: wrappers["fundacja-naglowek"],
		propsFromData: (data) => ({ page: doc<FoundationPageDoc>(data, "fundacja") }),
	},
	"fundacja-misja": {
		fetch: getFoundationPage,
		component: FundacjaMisja,
		wrapper: wrappers["fundacja-misja"],
		propsFromData: (data) => ({ page: doc<FoundationPageDoc>(data, "fundacja") }),
	},
	"fundacja-dzialania": {
		fetch: getActivities,
		component: FundacjaDzialania,
		wrapper: wrappers["fundacja-dzialania"],
		propsFromData: (data) => ({ activities: doc<ActivitiesDoc>(data, "dzialania") }),
	},
	// Jedna wyspa na osobę: zdjęcie obok zostaje statyczne, bo <Image>
	// renderowany na żądanie w workerze nie miałby zoptymalizowanego pliku.
	fundator: {
		fetch: getFounders,
		component: Fundator,
		wrapper: wrappers.fundator,
		propsFromData: (data, params) => {
			const founders = doc<FoundersDoc>(data, "fundatorzy");
			return { person: founders[params.get("id") as keyof FoundersDoc] };
		},
	},
};
