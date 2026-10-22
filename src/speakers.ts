import type { Element, ElementContent } from "hast";
import type { HastPluginDefinition } from "satteri";

/**
 * Etykiety rozmówców w zapisie rozmowy (`**Ola:** …`). Pogrubienie w treści
 * to zakreślacz (prose.css), a w wywiadzie pogrubione imię otwiera co drugi
 * akapit – strona byłaby limonkowa od góry do dołu i zakreślenie przestałoby
 * cokolwiek wyróżniać. Pogrubienie na początku akapitu zakończone dwukropkiem
 * (w środku albo tuż za nim) dostaje klasę `speaker` i zostaje samym
 * pogrubieniem.
 */

const isElement = (node: unknown): node is Element =>
	typeof node === "object" && node !== null && (node as Element).type === "element";

const isBlank = (node: ElementContent) => node.type === "text" && !node.value.trim();

export const speakerLabels: HastPluginDefinition = {
	name: "speaker-labels",
	element: {
		filter: ["strong"],
		visit(node, ctx) {
			const p = ctx.parent(node);
			const index = ctx.indexOf(node);
			if (!isElement(p) || p.tagName !== "p" || index === undefined) return;
			if (!p.children.slice(0, index).every(isBlank)) return;
			const next = p.children[index + 1];
			const colon =
				ctx.textContent(node).trim().endsWith(":") || (next?.type === "text" && next.value.startsWith(":"));
			if (colon) ctx.setProperty(node, "className", ["speaker"]);
		},
	},
};
