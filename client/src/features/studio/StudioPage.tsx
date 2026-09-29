import Button from "@/components/ui/Button";
import Confirm from "@/components/ui/Confirm";
import Empty from "@/components/ui/Empty";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import ProductSheet from "@/features/studio/ProductSheet";
import StockSheet from "@/features/studio/StockSheet";
import StudioStat from "@/features/studio/StudioStat";
import { PRODUCTS_PER_PAGE } from "@/features/studio/studioConfig";
import { Link } from "react-router-dom";
import InventoryList from "./InventoryList";
import LowStockWarning from "./LowStockWarning";
import { useStudioPage } from "./useStudioPage";

export default function StudioPage() {
  const {
    formatPrice,
    brandName,
    currentPage,
    setCurrentPage,
    nameFilter,
    setNameFilter,
    productEditorState,
    setProductEditorState,
    productForStockUpdate,
    setProductForStockUpdate,
    productPendingRemoval,
    setProductPendingRemoval,
    studioProductsQuery,
    lowStockQuery,
    summaryQuery,
    hasNextPage,
    filteredProductsOnPage,
    isRemovingProduct,
    handleRemoveProduct,
    handleStudioCatalogChanged,
  } = useStudioPage();

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-surface px-4 py-3 text-sm">
        You are signed in as staff for {brandName}. You can manage only this
        brand.{" "}
        <Link to="/" className="underline underline-offset-4">
          Shop as customer
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
            Brand studio
          </p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            {brandName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/${encodeURIComponent(brandName)}/studio/orders`}
            className="interactive-surface border border-line-strong bg-surface px-4 py-2 text-sm font-medium"
          >
            Manage orders
          </Link>
          <Button onClick={() => setProductEditorState("new")}>
            Add product
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StudioStat label="Brand" value={summaryQuery.data ? String(summaryQuery.data.brand_count) : "—"} />
        <StudioStat label="Products" value={summaryQuery.data ? String(summaryQuery.data.product_count) : "—"} />
        <StudioStat label="Low stock" value={summaryQuery.data ? String(summaryQuery.data.low_stock_count) : "—"} />
        <StudioStat label="Orders" value={summaryQuery.data ? String(summaryQuery.data.order_count) : "—"} />
        <StudioStat label="Revenue" value={summaryQuery.data ? formatPrice(summaryQuery.data.revenue) : "—"} />
      </div>
      {summaryQuery.isError ? <p className="mt-3 text-sm text-danger">Studio totals could not be loaded.</p> : null}
      <p className="mt-3 text-xs text-muted">Revenue excludes cancelled orders and approved returns.</p>
      <LowStockWarning
        brandName={brandName}
        setProductForStockUpdate={setProductForStockUpdate}
        lowStockQuery={lowStockQuery}
      />
      {lowStockQuery.isError ? (
        <div className="mt-6 border border-line p-4 text-sm">
          <p>Stock warnings could not be loaded.</p>
          <Button variant="text" onClick={() => void lowStockQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      <div className="mt-6">
        <input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter this page"
          aria-label="Filter this page"
          className="w-full max-w-md border border-line-strong bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        {nameFilter ? (
          <p className="mt-2 text-sm text-muted">
            Filtering products on this page.
          </p>
        ) : null}
      </div>
      {studioProductsQuery.isPending ? (
        <Skeleton className="mt-6 h-64" />
      ) : null}
      {studioProductsQuery.isError ? (
        <div className="mt-6">
          <Empty title="Products could not be loaded." />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void studioProductsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {studioProductsQuery.isSuccess && filteredProductsOnPage.length === 0 ? (
        <div className="mt-6">
          <Empty
            title={
              nameFilter
                ? "No products match."
                : `No products for ${brandName} yet.`
            }
          />
          {!nameFilter ? (
            <Button
              className="mt-4"
              onClick={() => setProductEditorState("new")}
            >
              Add product
            </Button>
          ) : null}
        </div>
      ) : null}
      <InventoryList
        formatPrice={formatPrice}
        setProductEditorState={setProductEditorState}
        setProductForStockUpdate={setProductForStockUpdate}
        setProductPendingRemoval={setProductPendingRemoval}
        filteredProductsOnPage={filteredProductsOnPage}
      />
      <Pagination
        page={currentPage}
        limit={PRODUCTS_PER_PAGE}
        hasNext={hasNextPage}
        onPage={setCurrentPage}
      />
      <ProductSheet
        brand={brandName}
        product={productEditorState === "new" ? null : productEditorState}
        open={productEditorState !== null}
        onClose={() => setProductEditorState(null)}
        onProductSaved={handleStudioCatalogChanged}
      />
      <StockSheet
        brand={brandName}
        product={productForStockUpdate}
        onClose={() => setProductForStockUpdate(null)}
        onStockUpdated={handleStudioCatalogChanged}
      />
      <Confirm
        open={productPendingRemoval !== null}
        title="Remove product"
        body={
          productPendingRemoval
            ? `Remove ${productPendingRemoval.name}? This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        busy={isRemovingProduct}
        onConfirm={() => {
          if (productPendingRemoval) {
            void handleRemoveProduct(productPendingRemoval);
          }
        }}
        onClose={() => setProductPendingRemoval(null)}
      />
    </div>
  );
}
