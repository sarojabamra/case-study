import ProductCard from "@/components/products/ProductCard";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Empty from "@/components/ui/Empty";
import Pagination from "@/components/ui/Pagination";
import ProductGridSkeleton from "@/components/ui/ProductGridSkeleton";
import { useCataloguePage } from "./useCataloguePage";

import { SortMode } from "@/features/catalogue/catalogueQuery";

export default function CataloguePage() {
  const {
    searchQuery,
    categoryId,
    brandId,
    sortMode,
    searchDraft,
    setSearchDraft,
    favouriteActions,
    productsQuery,
    categoriesQuery,
    selectedBrandName,
    visibleProducts,
    savedProductIds,
    hasActiveFilters,
    updateSearchParam,
    updateSortMode,
    clearAllFilters,
  } = useCataloguePage();

  return (
    <div>
      {favouriteActions.removeFavouriteConfirmDialog}
      <section className="px-5 pt-8 pb-6 md:px-10 lg:px-16">
        {brandId ? (
          <p className="font-display text-3xl font-light md:text-4xl">
            {selectedBrandName}
          </p>
        ) : null}
        <h1
          className={`font-semibold ${brandId ? "mt-2 text-lg text-muted" : "text-2xl"}`}
        >
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
        className="sticky top-(--store-header-height,3rem) z-30 border-y border-line bg-surface px-5 py-4 md:px-10 lg:px-16"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-96 max-w-full shrink-0">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 w-full border border-line-strong bg-canvas py-2 pl-3 pr-16 text-sm outline-none focus:border-ink"
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
          <label className="flex shrink-0 items-center gap-2 sm:ml-auto text-sm text-muted">
            Sort
            <select
              value={sortMode}
              onChange={(event) =>
                updateSortMode(event.target.value as SortMode)
              }
              className="border border-line-strong bg-canvas px-2 py-2 text-sm text-ink normal-case"
            >
              <option value="listed">As listed</option>
              <option value="price-asc">Price low–high</option>
              <option value="price-desc">Price high–low</option>
              <option value="stock">Stock</option>
            </select>
          </label>
          <div className="flex w-full flex-wrap gap-2">
            {brandId ? (
              <Chip active onClick={() => updateSearchParam("brand", "")}>
                {selectedBrandName} · Clear
              </Chip>
            ) : null}
            <Chip
              active={!categoryId}
              onClick={() => updateSearchParam("category", "")}
            >
              All
            </Chip>
            {(categoriesQuery.data ?? []).map((category) => (
              <Chip
                key={category.id}
                active={categoryId === String(category.id)}
                onClick={() =>
                  updateSearchParam("category", String(category.id))
                }
              >
                {category.name}
              </Chip>
            ))}
          </div>
          {categoriesQuery.isError ? (
            <p className="text-sm text-muted">
              Categories could not be loaded.
            </p>
          ) : null}
        </div>
      </section>
      <section
        id="products"
        className="scroll-mt-36 px-5 py-8 md:px-10 lg:px-16"
      >
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {searchQuery
              ? `Results for “${searchQuery}”`
              : brandId
                ? selectedBrandName
                : "All products"}
          </h2>
          <p className="text-sm text-muted">
            {productsQuery.data
              ? `${productsQuery.data.total} ${productsQuery.data.total === 1 ? "piece" : "pieces"}`
              : ""}
          </p>
        </div>
        {productsQuery.isPending ? <ProductGridSkeleton /> : null}
        {productsQuery.isError ? (
          <Empty
            title="The catalogue could not be loaded."
            action={{ href: "/", label: "Try again" }}
          />
        ) : null}
        {productsQuery.data && visibleProducts.length === 0 ? (
          <div>
            <Empty
              title={
                hasActiveFilters ? "No products match." : "No products yet."
              }
            />
            {hasActiveFilters ? (
              <Button
                className="mt-4"
                variant="secondary"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : null}
        {visibleProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
