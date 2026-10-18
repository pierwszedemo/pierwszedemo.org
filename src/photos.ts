import ola from "./assets/dzwieki-efemeryczne/ola-geppert.jpg";
import michal from "./assets/michal.jpg";

/**
 * Zdjęcia fundatorów, klucz = `FOUNDERS[n].id`. Jedno miejsce dla slotów na
 * /fundacja, kolażu w hero strony głównej i `image` w węzłach Person – alt
 * i kadr opisują to samo zdjęcie, więc nie mogą się rozjechać między stronami.
 * `position` to `object-position`: gdzie w kadrze jest twarz przy ciasnym slocie
 * (klasa Tailwinda dla stron, `focus` – ta sama wartość w CSS dla satori).
 * `file` to ścieżka od korzenia repo: karta OG strony głównej czyta plik
 * z dysku, bo zaimportowany obrazek to przy buildzie tylko adres /_astro/….
 */
export const FOUNDER_PHOTOS = {
	michal: {
		src: michal,
		file: "src/assets/michal.jpg",
		alt: "Michał Miszczyszyn w niebieskiej kurtce, w tle panorama Bergen",
		position: "object-[center_35%]",
		focus: "50% 35%",
	},
	ola: {
		src: ola,
		file: "src/assets/dzwieki-efemeryczne/ola-geppert.jpg",
		alt: "Ola Geppert na scenie – czarno-białe zdjęcie: chustka na głowie, długie czarne rękawiczki, mikrofon trzymany oburącz przy ustach",
		position: "object-top",
		focus: "50% 0%",
	},
} as const;
