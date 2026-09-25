import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, ApiError } from "@/services/api";
import type { Product } from "@/services/types";
import { useCart } from "@/utils/cart";
import { CartView } from "@/components/CartView";
import { ProductPlate } from "@/components/ProductCard";
import { Button } from "@/components/Button";
import { SystemState } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { Stepper } from "@/components/Stepper";
import { useFavouriteActions, useFavourites } from "@/utils/favourites";
import { useFormatPrice } from "@/utils/currency";
import { stockLabel } from "@/utils/stock";
import { FormMessage } from "@/components/FormMessage";
import { toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

export function ProductPage() {
  const formatPrice = useFormatPrice();
  const routeParams = useParams();
  const productId = Number(routeParams.productId);
  const { addProductToCart } = useCart();
  const favouritesQuery = useFavourites();
  const favouriteActions = useFavouriteActions(() => {
    void favouritesQuery.reload();
  });
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);

  const productIdIsValid = Number.isInteger(productId) && productId > 0;
  const loadProduct = useCallback(
    () => api<Product>(`/products/${productId}`),
    [productId],
  );
  const productQuery = useLoadData(loadProduct, { enabled: productIdIsValid, showErrorToast: false });

  useEffect(() => {
    setQuantityToAdd(1);
  }, [productId]);

  useDocumentTitle(productQuery.data ? `${productQuery.data.name} · E-commerce` : null);

  if (!Number.isInteger(productId) || productId <= 0 || (productQuery.isError && productQuery.error instanceof ApiError && productQuery.error.status === 404)) {
    return <SystemState title="Product not found." body="That piece is not in the catalogue." action={{ href: "/", label: "Back to store" }} />;
  }

  if (productQuery.isPending) {
    return (
      <div className="grid gap-8 px-5 py-10 md:px-10 lg:grid-cols-12 lg:px-16">
        <Skeleton className="aspect-[4/5] lg:col-span-7" />
        <Skeleton className="h-80 lg:col-span-5" />
      </div>
    );
  }

  if (!productQuery.data) {
    return <SystemState title="The product could not be loaded." body="Try the catalogue again." action={{ href: "/", label: "Back to store" }} />;
  }

  const product = productQuery.data;
  const stockStatus = stockLabel(product.quantity);
  const isSavedAsFavourite = (favouritesQuery.data ?? []).some((favourite) => favourite.id === product.id);

  function handleAddToCart() {
    const addResult = addProductToCart(product, quantityToAdd);
    if (!addResult.ok) {
      setAddToCartError(addResult.message);
      return;
    }
    setAddToCartError(null);
    toastStore.success("Added to cart");
  }

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      {favouriteActions.removeFavouriteConfirmDialog}
      {product.tenant_name ? (
        <p className="font-display text-3xl font-light md:text-4xl">{product.tenant_name}</p>
      ) : null}
      <p className={`text-[0.6875rem] uppercase tracking-[0.12em] text-muted ${product.tenant_name ? "mt-4" : ""}`}>
        <Link to="/">Home</Link>
        {" / "}
        {product.category_name ?? "Category"}
        {" / "}
        {product.tenant_name ?? "Brand"}
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductPlate product={product} className="border border-line" />
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">{product.category_name}</p>
              <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-sm">
                Sold by <Link to={`/?brand=${product.tenant_id}`} className="underline underline-offset-4">{product.tenant_name}</Link>
              </p>
            </div>
            <p className="font-display text-3xl tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <p className={`mt-4 text-sm ${stockStatus.tone === "ok" ? "text-olive" : "text-clay"}`}>{stockStatus.text}</p>
          {product.quantity > 0 ? (
            <div className="mt-6 hidden lg:block">
              <div className="flex items-center gap-4">
                <Stepper
                  value={quantityToAdd}
                  max={product.quantity}
                  onChange={(value) => {
                    setQuantityToAdd(value);
                    setAddToCartError(null);
                  }}
                />
                <Button onClick={handleAddToCart}>Add to cart</Button>
                <Button variant="secondary" onClick={() => favouriteActions.toggleFavourite(product, isSavedAsFavourite)}>
                  {isSavedAsFavourite ? "Saved" : "Save"}
                </Button>
              </div>
              <FormMessage message={addToCartError} />
            </div>
          ) : (
            <p className="mt-6 border border-danger-bg bg-danger-bg px-4 py-3 text-sm text-on-danger">Out of stock.</p>
          )}
          {product.quantity === 0 ? (
            <Button className="mt-4" variant="secondary" onClick={() => favouriteActions.toggleFavourite(product, isSavedAsFavourite)}>
              {isSavedAsFavourite ? "Saved" : "Save"}
            </Button>
          ) : null}
        </div>
        <aside className="hidden lg:col-span-5 lg:block">
          <CartView compact />
        </aside>
      </div>
      {product.quantity > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas px-4 py-3 lg:hidden">
          <FormMessage message={addToCartError} />
          <div className="mt-2 flex items-center gap-3">
            <Stepper
              value={quantityToAdd}
              max={product.quantity}
              onChange={(value) => {
                setQuantityToAdd(value);
                setAddToCartError(null);
              }}
            />
            <Button className="flex-1" onClick={handleAddToCart}>
              Add · {formatPrice(product.price)}
            </Button>
            <Button variant="secondary" onClick={() => favouriteActions.toggleFavourite(product, isSavedAsFavourite)} aria-label={isSavedAsFavourite ? "Saved" : "Save"}>
              {isSavedAsFavourite ? "♥" : "♡"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
