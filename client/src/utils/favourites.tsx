import { useCallback, useState } from "react";

import { api } from "@/services/api";
import type { Product } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { Confirm } from "@/components/Confirm";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";

export function useFavourites() {
  const { user, status } = useAuth();
  const enabled = status === "ready" && Boolean(user);

  const loadFavourites = useCallback(() => api<Product[]>("/products/favourites"), []);

  return useLoadData(loadFavourites, { enabled, showErrorToast: false });
}

export function useFavouriteActions(onFavouritesChanged?: () => void) {
  const [productPendingRemoval, setProductPendingRemoval] = useState<Product | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  async function removeFavourite(product: Product) {
    setIsRemoving(true);
    try {
      await api<void>(`/products/${product.id}/favourite`, { method: "DELETE" });
      setProductPendingRemoval(null);
      toastStore.success("Removed from favourites");
      onFavouritesChanged?.();
    } catch (error) {
      toastFailure(error);
      onFavouritesChanged?.();
    } finally {
      setIsRemoving(false);
    }
  }

  async function addFavourite(product: Product) {
    setIsAdding(true);
    try {
      await api(`/products/${product.id}/favourite`, { method: "POST" });
      toastStore.success("Saved");
      onFavouritesChanged?.();
    } catch (error) {
      toastFailure(error);
      onFavouritesChanged?.();
    } finally {
      setIsAdding(false);
    }
  }

  function toggleFavourite(product: Product, isAlreadySaved: boolean) {
    if (isAlreadySaved) {
      setProductPendingRemoval(product);
      return;
    }
    void addFavourite(product);
  }

  function confirmRemoveFavourite() {
    if (productPendingRemoval) {
      void removeFavourite(productPendingRemoval);
    }
  }

  const removeFavouriteConfirmDialog = (
    <Confirm
      open={productPendingRemoval !== null}
      title="Remove favourite"
      body={productPendingRemoval ? `Remove ${productPendingRemoval.name} from favourites?` : ""}
      confirmLabel="Remove"
      destructive
      busy={isRemoving}
      onConfirm={confirmRemoveFavourite}
      onClose={() => setProductPendingRemoval(null)}
    />
  );

  return {
    productPendingRemoval,
    setProductPendingRemoval,
    addToFavourites: addFavourite,
    isAddingFavourite: isAdding,
    removeFavouriteConfirmDialog,
    toggleFavourite,
  };
}
