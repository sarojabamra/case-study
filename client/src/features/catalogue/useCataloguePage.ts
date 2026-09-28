import { SortMode, buildCatalogueApiPath, parseSortMode } from "@/features/catalogue/catalogueQuery";
import { api } from "@/services/api";
import type { Brand, Category, ProductPage } from "@/services/types";
import { useFavouriteActions, useFavourites } from "@/utils/favourites";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useCataloguePage() {
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
      document
        .getElementById("filters")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const skipFirstProductsScroll = useRef(true);

  useEffect(() => {
    if (skipFirstProductsScroll.current) {
      skipFirstProductsScroll.current = false;
      return;
    }
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    () =>
      api<ProductPage>(
        buildCatalogueApiPath(searchQuery, categoryId, brandId, page, sortMode),
      ),
    [searchQuery, categoryId, brandId, page, sortMode],
  );

  const loadCategories = useCallback(
    () => api<Category[]>("/products/categories"),
    [],
  );

  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);

  const productsQuery = useLoadData(loadProducts);

  const categoriesQuery = useLoadData(loadCategories);

  const brandsQuery = useLoadData(loadBrands, { enabled: Boolean(brandId) });

  const selectedBrandName =
    brandsQuery.data?.find((brand) => String(brand.id) === brandId)?.name ??
    "This brand";

  const visibleProducts = productsQuery.data?.products ?? [];

  const savedProductIds = new Set(
    (favouritesQuery.data ?? []).map((product) => product.id),
  );

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
  return {
    searchQuery,
    categoryId,
    brandId,
    page,
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
  };
}
