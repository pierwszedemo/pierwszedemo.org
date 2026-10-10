// Build panelu Tiny (public/admin) i klienta (tina/__generated__) z cache.
//
// `tinacms build` to w CI ~25 s samego Vite'a dla aplikacji /admin plus
// czekanie, aż TinaCloud zaindeksuje właśnie wypchnięty commit (~45 s).
// Wynik zależy tylko od konfiguracji Tiny, wersji paczek, gałęzi i projektu
// w TinaCloud – nie od treści – więc wpis czy zmiana tekstu nie musi go
// przebudowywać. Cache leży w node_modules/.astro, bo tylko ten katalog
// Workers Builds przenosi między buildami dla Astro.
//
// --skip-cloud-checks: build strony nie pyta TinaCloud o nic (strony renderują
// się z plików), a wygenerowany klient i tak wskazuje TinaCloud. Jeśli zmiana
// schematu wyprzedzi indeksowanie, edytor przez chwilę widzi stary indeks.
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";

const INPUTS = ["tina/config.ts", "src/consts.ts", "package.json", "bun.lock"];
const OUTPUTS = ["public/admin", "tina/__generated__"];

const branch = process.env.GITHUB_BRANCH || process.env.WORKERS_CI_BRANCH || "";
const hash = createHash("sha256");
for (const file of INPUTS) hash.update(readFileSync(file));
hash.update(`${branch}\0${process.env.PUBLIC_TINA_CLIENT_ID ?? ""}`);
const cacheDir = `node_modules/.astro/tina-admin/${hash.digest("hex").slice(0, 16)}`;

if (existsSync(cacheDir)) {
	for (const out of OUTPUTS) {
		rmSync(out, { recursive: true, force: true });
		cpSync(`${cacheDir}/${out}`, out, { recursive: true });
	}
	console.log(`[tina] panel z cache (${cacheDir})`);
} else {
	execSync("tinacms build --skip-cloud-checks --skip-search-index", { stdio: "inherit" });
	// Stare wpisy wylatują, żeby cache nie puchł z każdą zmianą konfiguracji.
	rmSync("node_modules/.astro/tina-admin", { recursive: true, force: true });
	for (const out of OUTPUTS) cpSync(out, `${cacheDir}/${out}`, { recursive: true });
	console.log(`[tina] panel zbudowany i zapisany w ${cacheDir}`);
}
