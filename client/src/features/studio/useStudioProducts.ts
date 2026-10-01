import { useCallback } from "react";

import { api } from "@/services/api";
import type { Category, Product, StudioSummary } from "@/services/types";
import { useLoadData } from "@/utils/useLoadData";

type ProductInput = {
  name: string;
  price: number;
  quantity: number;
  category_id: number;
};

type SavedProduct = {
  product: { id: number };
};

export function useStudioProducts(
  brand: string,
  page: number,
  pageSize: number,
) {
  const productsPath = `/${encodeURIComponent(brand)}/products`;
  const skip = (page - 1) * pageSize;
  const loadProducts = useCallback(
    () => api<Product[]>(`${productsPath}?skip=${skip}&limit=${pageSize + 1}`),
    [productsPath, skip, pageSize],
  );
  const loadLowStock = useCallback(
    () => api<Product[]>(`${productsPath}/low-stock`),
    [productsPath],
  );
  const loadSummary = useCallback(
    () => api<StudioSummary>(`/${encodeURIComponent(brand)}/studio/summary`),
    [brand],
  );
  const options = { enabled: Boolean(brand), showErrorToast: false };
  const productsQuery = useLoadData(loadProducts, options);
  const lowStockQuery = useLoadData(loadLowStock, options);
  const summaryQuery = useLoadData(loadSummary, options);
  const { reload: reloadProducts } = productsQuery;
  const { reload: reloadLowStock } = lowStockQuery;
  const { reload: reloadSummary } = summaryQuery;
  const reload = useCallback(async () => {
    await Promise.all([reloadProducts(), reloadLowStock(), reloadSummary()]);
  }, [reloadProducts, reloadLowStock, reloadSummary]);

  return {
    productsQuery,
    lowStockQuery,
    summaryQuery,
    productsOnPage: (productsQuery.data ?? []).slice(0, pageSize),
    hasNextPage: (productsQuery.data?.length ?? 0) > pageSize,
    reload,
  };
}

export function useStudioProductActions(brand: string) {
  const productsPath = `/${encodeURIComponent(brand)}/products`;
  const createProduct = useCallback(
    (values: ProductInput) =>
      api<SavedProduct>(productsPath, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    [productsPath],
  );
  const updateProduct = useCallback(
    (id: number, values: Partial<ProductInput>) =>
      api<SavedProduct>(`${productsPath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    [productsPath],
  );
  const removeProduct = useCallback(
    (id: number) => api<void>(`${productsPath}/${id}`, { method: "DELETE" }),
    [productsPath],
  );
  const uploadImage = useCallback(
    (id: number, file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api<SavedProduct>(`${productsPath}/${id}/image`, {
        method: "POST",
        body,
      });
    },
    [productsPath],
  );
  const removeImage = useCallback(
    (id: number) =>
      api<void>(`${productsPath}/${id}/image`, { method: "DELETE" }),
    [productsPath],
  );

  return {
    createProduct,
    updateProduct,
    removeProduct,
    uploadImage,
    removeImage,
  };
}

export function useProductCategories(enabled = true) {
  const loadCategories = useCallback(
    () => api<Category[]>("/products/categories"),
    [],
  );
  return useLoadData(loadCategories, { enabled, showErrorToast: false });
}
