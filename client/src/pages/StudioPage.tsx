import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/services/api";
import type { Product } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Confirm";
import { Pagination } from "@/components/Pagination";
import { Empty } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { useFormatPrice } from "@/utils/currency";
import { stockLabel } from "@/utils/stock";
import { toastFailure, toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";
import { ProductSheet } from "@/pages/StudioProductSheet";
import { StockSheet } from "@/pages/StudioStockSheet";

const PRODUCTS_PER_PAGE = 10;

export function StudioPage() {
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const brandName = user?.tenant_name ?? "";
  const [currentPage, setCurrentPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [productEditorState, setProductEditorState] = useState<Product | null | "new">(null);
  const [productForStockUpdate, setProductForStockUpdate] = useState<Product | null>(null);
  const [productPendingRemoval, setProductPendingRemoval] = useState<Product | null>(null);
  const skipOffset = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const loadStudioProducts = useCallback(
    () => api<Product[]>(`/${encodeURIComponent(brandName)}/products?skip=${skipOffset}&limit=${PRODUCTS_PER_PAGE + 1}`),
    [brandName, skipOffset],
  );
  const studioProductsQuery = useLoadData(loadStudioProducts, { enabled: Boolean(brandName), showErrorToast: false });
  const productsOnPage = (studioProductsQuery.data ?? []).slice(0, PRODUCTS_PER_PAGE);
  const hasNextPage = (studioProductsQuery.data?.length ?? 0) > PRODUCTS_PER_PAGE;

  useEffect(() => {
    if (currentPage > 1 && studioProductsQuery.isSuccess && (studioProductsQuery.data?.length ?? 0) === 0) {
      setCurrentPage((previousPage) => Math.max(1, previousPage - 1));
    }
  }, [currentPage, studioProductsQuery.data, studioProductsQuery.isSuccess]);

  useDocumentTitle(`${brandName} studio · E-commerce`);

  const nameFilterLower = nameFilter.trim().toLowerCase();
  const filteredProductsOnPage = productsOnPage.filter(
    (product) => !nameFilterLower || product.name.toLowerCase().includes(nameFilterLower),
  );

  const totalUnitsOnPage = productsOnPage.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockCountOnPage = productsOnPage.filter((product) => product.quantity <= 1).length;

  const [isRemovingProduct, setIsRemovingProduct] = useState(false);

  async function handleRemoveProduct(product: Product) {
    setIsRemovingProduct(true);
    try {
      await api<void>(`/${encodeURIComponent(brandName)}/products/${product.id}`, { method: "DELETE" });
      setProductPendingRemoval(null);
      toastStore.success("Product removed");
      await studioProductsQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsRemovingProduct(false);
    }
  }

  function handleStudioCatalogChanged() {
    void studioProductsQuery.reload();
  }

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-surface px-4 py-3 text-sm">
        You are signed in as staff for {brandName}. You can manage only this brand.{" "}
        <Link to="/" className="underline underline-offset-4">Shop as customer</Link>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Brand studio</p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">{brandName}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/${encodeURIComponent(brandName)}/studio/orders`}
            className="interactive-surface border border-line-strong bg-surface px-4 py-2 text-sm font-medium"
          >
            Manage orders
          </Link>
          <Button onClick={() => setProductEditorState("new")}>Add product</Button>
        </div>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StudioStat label="On this page" value={String(studioProductsQuery.data ? productsOnPage.length : "—")} />
        <StudioStat label="Units on this page" value={String(studioProductsQuery.data ? totalUnitsOnPage : "—")} />
        <StudioStat label="Low or out" value={String(studioProductsQuery.data ? lowStockCountOnPage : "—")} />
      </div>
      <div className="mt-6">
        <input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter this page"
          aria-label="Filter this page"
          className="w-full max-w-md border border-line-strong bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        {nameFilter ? <p className="mt-2 text-sm text-muted">Filtering products on this page.</p> : null}
      </div>
      {studioProductsQuery.isPending ? <Skeleton className="mt-6 h-64" /> : null}
      {studioProductsQuery.isError ? (
        <div className="mt-6">
          <Empty title="Products could not be loaded." />
          <Button className="mt-4" variant="secondary" onClick={() => void studioProductsQuery.refetch()}>Try again</Button>
        </div>
      ) : null}
      {studioProductsQuery.isSuccess && filteredProductsOnPage.length === 0 ? (
        <div className="mt-6">
          <Empty title={nameFilter ? "No products match." : `No products for ${brandName} yet.`} />
          {!nameFilter ? <Button className="mt-4" onClick={() => setProductEditorState("new")}>Add product</Button> : null}
        </div>
      ) : null}
      {filteredProductsOnPage.length > 0 ? (
        <>
          <div className="mt-6 hidden overflow-x-auto border border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">In stock</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductsOnPage.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-4 font-display text-xl">{product.name}</td>
                    <td className="px-4 py-4">{product.category_name}</td>
                    <td className="px-4 py-4 tabular-nums">{formatPrice(product.price)}</td>
                    <td className="px-4 py-4">{stockLabel(product.quantity).text}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        <button type="button" className="interactive-muted uppercase tracking-[0.08em]" onClick={() => setProductForStockUpdate(product)}>Update stock</button>
                        <button type="button" className="interactive-muted uppercase tracking-[0.08em]" onClick={() => setProductEditorState(product)}>Edit</button>
                        <button type="button" className="interactive-muted uppercase tracking-[0.08em] text-danger" onClick={() => setProductPendingRemoval(product)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 space-y-4 md:hidden">
            {filteredProductsOnPage.map((product) => (
              <li key={product.id} className="border border-line p-4">
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-clay">{product.category_name}</p>
                <p className="mt-1 font-display text-2xl">{product.name}</p>
                <p className="mt-2 text-sm tabular-nums">{formatPrice(product.price)} · {stockLabel(product.quantity).text}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-[0.08em]">
                  <button type="button" className="interactive-muted" onClick={() => setProductForStockUpdate(product)}>Update stock</button>
                  <button type="button" className="interactive-muted" onClick={() => setProductEditorState(product)}>Edit</button>
                  <button type="button" className="interactive-muted text-danger" onClick={() => setProductPendingRemoval(product)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
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
        body={productPendingRemoval ? `Remove ${productPendingRemoval.name}? This cannot be undone.` : ""}
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

function StudioStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-surface p-4">
      <p className="font-display text-3xl">{value}</p>
      <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}

