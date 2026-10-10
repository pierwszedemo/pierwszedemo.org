import type { Element, ElementContent } from "hast";
import type { HastPluginDefinition, MdastPluginDefinition } from "satteri";

/**
 * Obrazki w treści wpisu.
 *
 * 1. `assetImages` (mdast) – Tina zapisuje ścieżkę względem `src/assets`
 *    (`/blog/x.jpg`, `publicFolder: "src/assets"` w tina/config.ts). Dla Astro
 *    ścieżka zaczynająca się od `/` to plik z `public/`: nie optymalizuje go,
 *    a pliku tam nie ma. Zamiana na ścieżkę względem wpisu (`../../assets/…`,
 *    oba katalogi wpisów leżą tak samo głęboko) robi z niego zwykły obraz
 *    z `src/assets`, który Astro przerabia na WebP przy buildzie – ta sama
 *    zamiana co dla pola `image` w content.config.ts.
 * 2. `figures` (hast) – akapit, w którym stoi sam obrazek, staje się
 *    `<figure>`; tytuł obrazka (`![alt](ścieżka "Podpis")`, w Tinie pole
 *    „Caption”) idzie do `<figcaption>`. `alt` zostaje dla czytników ekranu,
 *    podpis jest dla wszystkich.
 */

export const assetImages: MdastPluginDefinition = {
	name: "asset-images",
	image(node, ctx) {
		if (node.url.startsWith("/blog/")) ctx.setProperty(node, "url", `../../assets${node.url}`);
	},
};

const isElement = (node: unknown): node is Element =>
	typeof node === "object" && node !== null && (node as Element).type === "element";

const isBlank = (node: ElementContent) => node.type === "text" && !node.value.trim();

export const figures: HastPluginDefinition = {
	name: "figures",
	element: {
		filter: ["p"],
		visit(node, ctx) {
			const content = node.children.filter((child) => !isBlank(child));
			const img = content[0];
			if (content.length !== 1 || !isElement(img) || img.tagName !== "img") return;
			const { title, ...properties } = img.properties;
			const caption = typeof title === "string" ? title.trim() : "";
			ctx.replaceNode(node, {
				type: "element",
				tagName: "figure",
				properties: {},
				children: [
					{ ...img, properties },
					...(caption
						? [
								{
									type: "element" as const,
									tagName: "figcaption",
									properties: {},
									children: [{ type: "text" as const, value: caption }],
								},
							]
						: []),
				],
			});
		},
	},
};
