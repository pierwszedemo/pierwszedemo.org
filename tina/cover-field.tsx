/** @jsxImportSource react */
/**
 * Pole „Okładka” w /admin: podgląd okładki wpisu (obrazek OG i karta na
 * liście) i ręczne ustawienie jej parametrów. Okładkę przydziela
 * `allocateCovers` (src/covers.ts) z listy wszystkich wpisów, więc pole raz,
 * przy otwarciu formularza, pobiera z Tiny daty, slugi i ręczne okładki obu
 * kolekcji, podmienia w tej liście bieżący wpis na wartości z formularza
 * (także niezapisane) i liczy ten sam przydział co build. Nowy wpis nie ma
 * jeszcze pliku – jego slug liczy się tak jak nazwa pliku (tina/slug.ts).
 *
 * Zapis: dopóki nikt nie ruszy pola, we frontmatterze nie ma `cover` i działa
 * automat; każda zmiana zapisuje cały obiekt, „Automatycznie” ustawia `null`
 * (undefined formularz Tiny ignoruje i zostawia poprzedni obiekt) – zod
 * (`nullish`) i przydział traktują to jak brak pola.
 *
 * Grafika idzie jako <img> z SVG (bez dangerouslySetInnerHTML), a tekst
 * kolumny i cudzysłów Cytatu jako HTML w krojach strony – tak jak satori
 * składa obrazek OG (renderPostCover w src/og.ts), więc podgląd trzyma się
 * wyniku buildu, choć nie co do piksela.
 */
// React wprost, nie same hooki: Vite panelu Tiny składa JSX klasycznie
// (React.createElement) i ignoruje pragmę wyżej, więc React musi być w zasięgu.
import React, { type CSSProperties, type ReactNode } from "react";
import { useCMS, wrapFieldsWithMeta } from "tinacms";
import { DATE_PREFIX, LOGOTYPE, NEWS_KINDS } from "../src/consts";
import {
	allocateCovers,
	COVER_COLORWAYS,
	COVER_HEIGHT,
	COVER_QUOTE,
	COVER_TEMPLATES,
	COVER_WIDTH,
	type CoverParams,
	type CoverPost,
	coverArt,
	coverParams,
} from "../src/covers";
import { waveSvg } from "../src/logo";
import { slugify } from "./slug";

type Values = Record<string, unknown>;

interface FormLike {
	getState(): { values: Values };
	subscribe(listener: (state: { values: Values }) => void, subscription: { values: true }): () => void;
}

interface Row extends CoverPost {
	/** Nazwa pliku bez rozszerzenia – po niej poznajemy bieżący wpis na liście. */
	filename: string;
}

interface Connection {
	pageInfo: { hasNextPage: boolean; endCursor: string };
	edges: {
		node: { date: string; cover: Partial<CoverParams> | null; _sys: { filename: string } };
	}[];
}

const SERIF = "'Instrument Serif', serif";
const SANS = "'Instrument Sans', system-ui, sans-serif";
const FONTS_ID = "cover-field-fonts";

// Podgląd w panelu redakcji, nie na stronie: tu krój z Google Fonts – strona
// trzyma własne pliki fontów, ale panel ich nie ładuje.
const FONTS_URL =
	"https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&family=Instrument+Serif&display=swap";

const page = (collection: "wiedza" | "aktualnosci") =>
	`query ($after: String) { ${collection}Connection(first: 100, after: $after) { pageInfo { hasNextPage endCursor } edges { node { date cover { template colorway mirror seed roles } _sys { filename } } } } }`;

interface Requester {
	api: { tina: { request: <T>(query: string, options: { variables: Values }) => Promise<T> } };
}

async function fetchPosts(cms: Requester): Promise<Row[]> {
	const rows: Row[] = [];
	for (const collection of ["wiedza", "aktualnosci"] as const) {
		let after: string | null = null;
		do {
			const data: Record<string, Connection> = await cms.api.tina.request(page(collection), {
				variables: { after },
			});
			const connection = data[`${collection}Connection`];
			for (const { node } of connection.edges) {
				rows.push({
					filename: node._sys.filename,
					slug: node._sys.filename.replace(DATE_PREFIX, ""),
					date: node.date,
					cover: node.cover,
				});
			}
			after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
		} while (after);
	}
	return rows;
}

const useFormValues = (form: FormLike) => {
	const [values, setValues] = React.useState(() => form.getState().values);
	React.useEffect(() => form.subscribe((state) => setValues(state.values), { values: true }), [form]);
	return values;
};

const useWidth = () => {
	const ref = React.useRef<HTMLDivElement>(null);
	const [width, setWidth] = React.useState(0);
	React.useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, width] as const;
};

const svgUri = (inner: string) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}">${inner}</svg>`,
	)}`;

const isComplete = (value: unknown): value is CoverParams => {
	const cover = value as Partial<CoverParams> | null | undefined;
	return !!cover?.template && !!cover.colorway;
};

/** Okładka 1200×630 – te same warstwy i ta sama kolumna tekstu co renderPostCover. */
function Cover({
	params,
	title,
	badge,
	text,
}: {
	params: CoverParams;
	title: string;
	badge: string;
	text: boolean;
}) {
	const { palette: P, back, front, quote } = coverArt(params);
	const align = params.mirror ? "flex-end" : "flex-start";
	const split = LOGOTYPE.lastIndexOf(" ");
	const layer: CSSProperties = {
		position: "absolute",
		left: 0,
		top: 0,
		width: COVER_WIDTH,
		height: COVER_HEIGHT,
	};
	return (
		<div style={{ ...layer, background: P.bg, overflow: "hidden", color: P.text }}>
			<img src={svgUri(back)} alt="" style={layer} />
			{quote && (
				<div
					style={{
						position: "absolute",
						left: COVER_QUOTE.x,
						top: COVER_QUOTE.top,
						fontFamily: SERIF,
						fontSize: COVER_QUOTE.size,
						lineHeight: 1,
						color: quote,
					}}
				>
					{COVER_QUOTE.glyph}
				</div>
			)}
			<img src={svgUri(front)} alt="" style={layer} />
			{text && (
				<div
					style={{
						position: "absolute",
						top: 56,
						bottom: 56,
						width: 500,
						...(params.mirror ? { right: 64 } : { left: 64 }),
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: align,
						gap: 24,
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: align,
							gap: 72 * 0.05,
							fontFamily: SERIF,
						}}
					>
						<div style={{ fontSize: 72 * 0.58, lineHeight: 1, letterSpacing: "-0.02em" }}>Fundacja</div>
						<div
							style={{
								display: "flex",
								alignItems: "flex-start",
								fontSize: 72,
								lineHeight: 1,
								letterSpacing: "-0.015em",
							}}
						>
							<span>{LOGOTYPE.slice(0, split)}&nbsp;</span>
							<span style={{ display: "flex", flexDirection: "column", gap: 72 * 0.12 }}>
								<span>{LOGOTYPE.slice(split + 1)}</span>
								<img
									src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(waveSvg(P.wave))}`}
									alt=""
									style={{ width: "100%", height: 72 * 0.33 }}
								/>
							</span>
						</div>
					</div>
					<div
						style={{
							fontFamily: SERIF,
							fontSize: title.length > 48 ? 54 : 62,
							lineHeight: 1,
							letterSpacing: "-0.015em",
							textAlign: params.mirror ? "right" : "left",
						}}
					>
						{title}
					</div>
					<span
						style={{
							padding: "10px 22px",
							borderRadius: 999,
							background: P.chipBg,
							color: P.chipText,
							fontFamily: SANS,
							fontWeight: 600,
							fontSize: 24,
							lineHeight: 1.2,
						}}
					>
						{badge}
					</span>
				</div>
			)}
		</div>
	);
}

/**
 * Okładka przeskalowana do szerokości ramki. `card`: kadr 4:3 jak na liście –
 * wysokość okładki na całą ramkę, przycięta od strony kolumny tekstu.
 */
function Frame({ card = false, mirror, children }: { card?: boolean; mirror: boolean; children: ReactNode }) {
	const [ref, width] = useWidth();
	const height = card ? (width * 3) / 4 : (width * COVER_HEIGHT) / COVER_WIDTH;
	const scale = height / COVER_HEIGHT;
	return (
		<div
			ref={ref}
			style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: card ? 14 : 8 }}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					...(card && !mirror ? { right: 0 } : { left: 0 }),
					width: COVER_WIDTH,
					height: COVER_HEIGHT,
					transform: `scale(${scale})`,
					transformOrigin: card && !mirror ? "top right" : "top left",
				}}
			>
				{children}
			</div>
		</div>
	);
}

const control: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 4,
	fontSize: 13,
	fontWeight: 600,
};
const input: CSSProperties = {
	font: "inherit",
	fontWeight: 400,
	padding: "6px 8px",
	border: "1px solid #c9c7c0",
	borderRadius: 6,
	background: "#fff",
};
const button: CSSProperties = {
	font: "inherit",
	fontSize: 13,
	fontWeight: 600,
	padding: "8px 14px",
	borderRadius: 999,
	border: "1.5px solid #15151a",
	background: "#fff",
	cursor: "pointer",
};

const randomInt = (max: number) => Math.floor(Math.random() * max);

export const CoverField = wrapFieldsWithMeta(({ input: field, form, tinaForm }) => {
	const cms = useCMS() as unknown as Requester;
	const values = useFormValues(form as unknown as FormLike);
	const [rows, setRows] = React.useState<Row[] | null>(null);
	const [failed, setFailed] = React.useState(false);

	React.useEffect(() => {
		if (!document.getElementById(FONTS_ID)) {
			const link = document.createElement("link");
			link.id = FONTS_ID;
			link.rel = "stylesheet";
			link.href = FONTS_URL;
			document.head.append(link);
		}
		let alive = true;
		fetchPosts(cms)
			.then((posts) => alive && setRows(posts))
			.catch(() => alive && setFailed(true));
		return () => {
			alive = false;
		};
	}, [cms]);

	// Istniejący wpis: slug z nazwy pliku. Nowy (bez pliku): tak jak nazwa
	// pliku w tina/config.ts – z frazy głównej, a bez niej z tytułu.
	const file =
		tinaForm.crudType === "create" ? "" : (tinaForm.path ?? "").split("/").pop()?.replace(/\.md$/, "");
	const keyphrase = typeof values.keyphrase === "string" ? values.keyphrase : "";
	const title = typeof values.title === "string" ? values.title : "";
	const slug = file ? file.replace(DATE_PREFIX, "") : slugify(keyphrase || title) || "nowy-wpis";
	const manual = isComplete(field.value) ? field.value : null;
	const date = typeof values.date === "string" && values.date ? values.date : new Date().toISOString();

	const { params, twins } = React.useMemo(() => {
		if (!rows) return { params: manual ?? coverParams(slug), twins: [] as string[] };
		const all = [...rows.filter((row) => row.filename !== file), { slug, date, cover: manual }];
		const covers = allocateCovers(all);
		const own = covers.get(slug) ?? coverParams(slug);
		const same = [...covers]
			.filter(([other, p]) => other !== slug && p.template === own.template && p.colorway === own.colorway)
			.map(([other]) => other);
		return { params: own, twins: same };
	}, [rows, file, slug, date, manual]);

	const badge =
		(typeof values.category === "string" && values.category) ||
		NEWS_KINDS[values.kind as keyof typeof NEWS_KINDS] ||
		"Kategoria";
	const set = (patch: Partial<CoverParams>) => field.onChange({ ...params, ...patch });

	const status = failed
		? "Nie udało się pobrać listy wpisów – podgląd liczony z samego sluga, na stronie okładka może wyjść inna."
		: !rows
			? "Wczytuję listę wpisów, żeby przydzielić okładkę bez powtórek…"
			: manual
				? "Ustawiona ręcznie."
				: `Przydzielona automatycznie ze sluga „${slug}”, bez powtórek z innymi wpisami. Zmień cokolwiek, żeby ją przypiąć.`;

	return (
		// Opakowanie pola w Tinie dziedziczy `white-space: nowrap` – bez tego tytuł
		// w podglądzie nie łamałby się na 500 px jak w obrazku OG.
		<div style={{ display: "flex", flexDirection: "column", gap: 12, whiteSpace: "normal", minWidth: 0 }}>
			<Frame mirror={params.mirror}>
				<Cover params={params} title={title || "Tytuł wpisu"} badge={badge} text />
			</Frame>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
					gap: 12,
					alignItems: "start",
				}}
			>
				<Frame card mirror={params.mirror}>
					<Cover params={params} title="" badge="" text={false} />
				</Frame>
				<div style={{ fontSize: 13, lineHeight: 1.45 }}>
					<p style={{ margin: 0 }}>{status}</p>
					{twins.length > 0 && (
						<p style={{ margin: "6px 0 0", color: "#b42318" }}>
							Ten sam szablon i kolorystyka co: {twins.join(", ")}.
						</p>
					)}
				</div>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
				<label style={control}>
					Szablon
					<select
						style={input}
						value={params.template}
						onChange={(e) => set({ template: Number(e.target.value) })}
					>
						{COVER_TEMPLATES.map((name, i) => (
							<option key={name} value={i + 1}>
								{i + 1} · {name}
							</option>
						))}
					</select>
				</label>
				<label style={control}>
					Kolorystyka
					<select
						style={input}
						value={params.colorway}
						onChange={(e) => set({ colorway: Number(e.target.value) })}
					>
						{COVER_COLORWAYS.map((name, i) => (
							<option key={name} value={i + 1}>
								{i + 1} · {name}
							</option>
						))}
					</select>
				</label>
				<label style={control}>
					Role kolorów
					<select style={input} value={params.roles} onChange={(e) => set({ roles: Number(e.target.value) })}>
						{[0, 1, 2, 3, 4, 5].map((roles) => (
							<option key={roles} value={roles}>
								{roles === 0 ? "1 · jak w makiecie" : `${roles + 1}`}
							</option>
						))}
					</select>
				</label>
				<label style={control}>
					Ziarno
					<input
						style={input}
						type="number"
						min={0}
						max={99999}
						value={params.seed}
						onChange={(e) => {
							const seed = Number(e.target.value);
							if (Number.isInteger(seed) && seed >= 0 && seed <= 99999) set({ seed });
						}}
					/>
				</label>
				<label style={{ ...control, flexDirection: "row", alignItems: "center", gap: 8 }}>
					<input
						type="checkbox"
						checked={params.mirror}
						disabled={params.template === 4}
						onChange={(e) => set({ mirror: e.target.checked })}
					/>
					Lustro{params.template === 4 ? " (Cytat bez lustra)" : ""}
				</label>
			</div>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				<button
					type="button"
					style={button}
					onClick={() =>
						field.onChange({
							template: randomInt(5) + 1,
							colorway: randomInt(8) + 1,
							mirror: Math.random() < 0.5,
							seed: randomInt(100000),
							roles: randomInt(6),
						})
					}
				>
					Losuj
				</button>
				<button
					type="button"
					style={{ ...button, opacity: manual ? 1 : 0.5 }}
					disabled={!manual}
					onClick={() => field.onChange(null)}
				>
					Automatycznie
				</button>
			</div>
		</div>
	);
});
