// Import komponentu .astro z pliku .ts (rejestr wysp, src/islands.ts). W edytorze
// typy daje wtyczka Astro do TypeScriptu, ale goły `tsgo` – jedyny typecheck
// w tym repo – jej nie ma i bez tej deklaracji nie rozwiązuje modułu.
declare module "*.astro" {
  const component: import("astro/runtime/server/index.js").AstroComponentFactory;
  export default component;
}
