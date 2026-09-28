import { PRODUCTS_PER_PAGE } from "@/features/studio/studioConfig";
import {
  useStudioProductActions,
  useStudioProducts,
} from "@/features/studio/useStudioProducts";
import type { Product } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useFormatPrice } from "@/utils/currency";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure, toastStore } from "@/utils/toast";
import { useEffect, useState } from "react";

export function useStudioPage() {
  const formatPrice = useFormatPrice();

  const { user } = useAuth();

  const brandName = user?.tenant_name ?? "";

  const [currentPage, setCurrentPage] = useState(1);

  const [nameFilter, setNameFilter] = useState("");

  const [productEditorState, setProductEditorState] = useState<
    Product | null | "new"
  >(null);

  const [productForStockUpdate, setProductForStockUpdate] =
    useState<Product | null>(null);

  const [productPendingRemoval, setProductPendingRemoval] =
    useState<Product | null>(null);

  const {
    productsQuery: studioProductsQuery,
    lowStockQuery,
    productsOnPage,
    hasNextPage,
    reload,
  } = useStudioProducts(brandName, currentPage, PRODUCTS_PER_PAGE);

  const { removeProduct } = useStudioProductActions(brandName);

  useEffect(() => {
    if (
      currentPage > 1 &&
      studioProductsQuery.isSuccess &&
      (studioProductsQuery.data?.length ?? 0) === 0
    ) {
      setCurrentPage((previousPage) => Math.max(1, previousPage - 1));
    }
  }, [currentPage, studioProductsQuery.data, studioProductsQuery.isSuccess]);

  useDocumentTitle(`${brandName} studio · E-commerce`);

  const nameFilterLower = nameFilter.trim().toLowerCase();

  const filteredProductsOnPage = productsOnPage.filter(
    (product) =>
      !nameFilterLower || product.name.toLowerCase().includes(nameFilterLower),
  );

  const totalUnitsOnPage = productsOnPage.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );

  const lowStockCountOnPage = productsOnPage.filter(
    (product) => product.quantity < 5,
  ).length;

  const [isRemovingProduct, setIsRemovingProduct] = useState(false);

  async function handleRemoveProduct(product: Product) {
    setIsRemovingProduct(true);
    try {
      await removeProduct(product.id);
      setProductPendingRemoval(null);
      toastStore.success("Product removed");
      await reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsRemovingProduct(false);
    }
  }

  function handleStudioCatalogChanged() {
    void reload();
  }
  return {
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
    productsOnPage,
    hasNextPage,
    filteredProductsOnPage,
    totalUnitsOnPage,
    lowStockCountOnPage,
    isRemovingProduct,
    handleRemoveProduct,
    handleStudioCatalogChanged,
  };
}
