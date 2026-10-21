import ola from "./assets/dzwieki-efemeryczne/ola-geppert.jpg";
import michal from "./assets/michal.jpg";

/**
 * Zdjęcia fundatorów, klucz = `FOUNDERS[n].id`. Jedno miejsce dla slotów na
 * /fundacja, kolażu w hero strony głównej i `image` w węzłach Person – alt
 * i kadr opisują to samo zdjęcie, więc nie mogą się rozjechać między stronami.
 * `position` to `object-position`: gdzie w kadrze jest twarz przy ciasnym slocie.
 */
export const FOUNDER_PHOTOS = {
	michal: {
		src: michal,
		alt: "Michał Miszczyszyn w niebieskiej kurtce, w tle panorama Bergen",
		position: "object-[65%_0%]",
	},
	ola: {
		src: ola,
		alt: "Ola Geppert na scenie – czarno-białe zdjęcie: chustka na głowie, długie czarne rękawiczki, mikrofon trzymany oburącz przy ustach",
		position: "object-top",
	},
} as const;
