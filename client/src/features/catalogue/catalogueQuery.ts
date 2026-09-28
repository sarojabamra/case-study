export type SortMode = "listed" | "price-asc" | "price-desc" | "stock";

export const SORT_MODES = new Set<SortMode>([
  "listed",
  "price-asc",
  "price-desc",
  "stock",
]);

export function parseSortMode(value: string | null): SortMode {
  if (value && SORT_MODES.has(value as SortMode)) {
    return value as SortMode;
  }
  return "listed";
}

export function buildCatalogueApiPath(
  searchQuery: string,
  categoryId: string,
  brandId: string,
  page: number,
  sortMode: SortMode,
) {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set("search", searchQuery);
  }
  if (categoryId) {
    params.set("category_id", categoryId);
  }
  if (brandId) {
    params.set("tenant_id", brandId);
  }
  if (sortMode !== "listed") {
    params.set("sort", sortMode);
  }
  params.set("page", String(page));
  params.set("limit", "8");
  return `/products/?${params.toString()}`;
}
