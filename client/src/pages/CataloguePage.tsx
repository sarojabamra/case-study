import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/services/api";
import type { Brand, Category, ProductPage } from "@/services/types";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Empty } from "@/components/SystemState";
import { Pagination } from "@/components/Pagination";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useFavourites, useFavouriteActions } from "@/utils/favourites";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

type SortMode = "listed" | "price-asc" | "price-desc" | "stock";

const SORT_MODES = new Set<SortMode>(["listed", "price-asc", "price-desc", "stock"]);

function parseSortMode(value: string | null): SortMode {
  if (value && SORT_MODES.has(value as SortMode)) {
    return value as SortMode;
  }
  return "listed";
}

function buildCatalogueApiPath(
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
  params.set("limit", "6");
  return `/products/?${params.toString()}`;
}

export function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("category") ?? "";
  const brandId = searchParams.get("brand") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const sortMode = parseSortMode(searchParams.get("sort"));
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const favouritesQuery = useFavourites();
  const favouriteActions = useFavouriteActions(() => {
    void favouritesQuery.reload();
  });

  useDocumentTitle("Catalogue · E-commerce");

  useEffect(() => {
    setSearchDraft(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (window.location.hash === "#filters") {
      document.getElementById("filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const skipFirstProductsScroll = useRef(true);
  useEffect(() => {
    if (skipFirstProductsScroll.current) {
      skipFirstProductsScroll.current = false;
      return;
    }
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, categoryId, sortMode]);

  useEffect(() => {
    if (searchDraft === searchQuery) {
      return;
    }
    const debounceTimer = window.setTimeout(() => {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          if (searchDraft) {
            nextParams.set("q", searchDraft);
          } else {
            nextParams.delete("q");
          }
          nextParams.delete("page");
          return nextParams;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(debounceTimer);
  }, [searchDraft, searchQuery, setSearchParams]);

  const loadProducts = useCallback(
    () => api<ProductPage>(buildCatalogueApiPath(searchQuery, categoryId, brandId, page, sortMode)),
    [searchQuery, categoryId, brandId, page, sortMode],
  );
  const loadCategories = useCallback(() => api<Category[]>("/products/categories"), []);
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);

  const productsQuery = useLoadData(loadProducts);
  const categoriesQuery = useLoadData(loadCategories);
  const brandsQuery = useLoadData(loadBrands, { enabled: Boolean(brandId) });
  const selectedBrandName =
    brandsQuery.data?.find((brand) => String(brand.id) === brandId)?.name ?? "This brand";

  const visibleProducts = productsQuery.data?.products ?? [];
  const savedProductIds = new Set((favouritesQuery.data ?? []).map((product) => product.id));
  const hasActiveFilters = Boolean(searchQuery || categoryId || brandId);

  function updateSearchParam(key: string, value: string) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
      if (key !== "page") {
        nextParams.delete("page");
      }
      return nextParams;
    });
  }

  function updateSortMode(nextSortMode: SortMode) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (nextSortMode === "listed") {
        nextParams.delete("sort");
      } else {
        nextParams.set("sort", nextSortMode);
      }
      nextParams.delete("page");
      return nextParams;
    });
  }

  function clearAllFilters() {
    setSearchDraft("");
    setSearchParams({});
  }

  return (
    <div>
      {favouriteActions.removeFavouriteConfirmDialog}
      <section className="px-5 pt-8 pb-6 md:px-10 lg:px-16">
        {brandId ? (
          <p className="font-display text-3xl font-light md:text-4xl">{selectedBrandName}</p>
        ) : null}
        <h1 className={`font-semibold ${brandId ? "mt-2 text-lg text-muted" : "text-2xl"}`}>
          {brandId ? "Products" : "Products"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          {brandId
            ? `Pieces from ${selectedBrandName}.`
            : "Search the catalogue, filter by category or brand, and order only what is in stock."}
        </p>
      </section>
      <section
        id="filters"
        className="sticky top-[var(--store-header-height,3rem)] z-30 border-y border-line bg-surface px-5 py-4 md:px-10 lg:px-16"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative max-w-md flex-1">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="w-full border border-line-strong bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
            />
            {searchDraft ? (
              <button
                type="button"
                className="interactive-muted absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted"
                onClick={() => setSearchDraft("")}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {brandId ? (
              <Chip active onClick={() => updateSearchParam("brand", "")}>
                {selectedBrandName} · Clear
              </Chip>
            ) : null}
            <Chip active={!categoryId} onClick={() => updateSearchParam("category", "")}>
              All
            </Chip>
            {(categoriesQuery.data ?? []).map((category) => (
              <Chip
                key={category.id}
                active={categoryId === String(category.id)}
                onClick={() => updateSearchParam("category", String(category.id))}
              >
                {category.name}
              </Chip>
            ))}
          </div>
          {categoriesQuery.isError ? <p className="text-sm text-muted">Categories could not be loaded.</p> : null}
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              value={sortMode}
              onChange={(event) => updateSortMode(event.target.value as SortMode)}
              className="border border-line-strong bg-canvas px-2 py-2 text-sm text-ink normal-case"
            >
              <option value="listed">As listed</option>
              <option value="price-asc">Price low–high</option>
              <option value="price-desc">Price high–low</option>
              <option value="stock">Stock</option>
            </select>
          </label>
        </div>
      </section>
      <section id="products" className="scroll-mt-36 px-5 py-8 md:px-10 lg:px-16">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {searchQuery ? `Results for “${searchQuery}”` : brandId ? selectedBrandName : "All products"}
          </h2>
          <p className="text-sm text-muted">
            {productsQuery.data
              ? `${productsQuery.data.total} ${productsQuery.data.total === 1 ? "piece" : "pieces"}`
              : ""}
          </p>
        </div>
        {productsQuery.isPending ? <ProductGridSkeleton /> : null}
        {productsQuery.isError ? (
          <Empty title="The catalogue could not be loaded." action={{ href: "/", label: "Try again" }} />
        ) : null}
        {productsQuery.data && visibleProducts.length === 0 ? (
          <div>
            <Empty title={hasActiveFilters ? "No products match." : "No products yet."} />
            {hasActiveFilters ? (
              <Button className="mt-4" variant="secondary" onClick={clearAllFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : null}
        {visibleProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                saved={savedProductIds.has(product.id)}
                onToggleFavourite={favouriteActions.toggleFavourite}
              />
            ))}
          </div>
        ) : null}
        {productsQuery.data ? (
          <Pagination
            page={productsQuery.data.page}
            limit={productsQuery.data.limit}
            total={productsQuery.data.total}
            totalPages={productsQuery.data.total_pages}
            onPage={(nextPage) => updateSearchParam("page", String(nextPage))}
          />
        ) : null}
      </section>
    </div>
  );
}
