import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { api } from "@/services/api";
import type { ApiCartLine, CartResponse, Product } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { toastStore } from "@/utils/toast";

const GUEST_CART_KEY = "shop.cart";
const CART_SYNC_DELAY_MS = 400;

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  tenantName: string;
  quantity: number;
  available: number;
};

type CartContextValue = {
  cartItems: CartItem[];
  count: number;
  addProductToCart: (product: Product, quantity: number) => { ok: true } | { ok: false; message: string };
  setCartItemQuantity: (productId: number, quantity: number) => void;
  removeCartItem: (productId: number) => void;
  clearCart: () => void;
  updateCartItemFromProductStock: (product: Product) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cartItem = value as Partial<CartItem>;
  return (
    typeof cartItem.productId === "number" &&
    typeof cartItem.name === "string" &&
    typeof cartItem.price === "number" &&
    typeof cartItem.tenantName === "string" &&
    typeof cartItem.quantity === "number" &&
    typeof cartItem.available === "number"
  );
}

function readGuestCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

function writeGuestCartToStorage(cartItems: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  } catch {
    toastStore.failure("The cart could not be saved in this browser.");
  }
}

function mapApiCartLine(line: ApiCartLine): CartItem {
  return {
    productId: line.product_id,
    name: line.name,
    price: line.price,
    tenantName: line.tenant_name ?? "Brand",
    quantity: line.quantity,
    available: line.available,
  };
}

function mergeCartItems(primary: CartItem[], secondary: CartItem[]) {
  const merged = new Map<number, CartItem>();
  for (const item of [...primary, ...secondary]) {
    const existing = merged.get(item.productId);
    const quantity = (existing?.quantity ?? 0) + item.quantity;
    const available = Math.max(existing?.available ?? 0, item.available);
    merged.set(item.productId, {
      ...item,
      quantity: Math.min(quantity, available),
      available,
    });
  }
  return Array.from(merged.values()).filter((item) => item.quantity > 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const skipNextServerSyncRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  const persistServerCart = useCallback(async (items: CartItem[]) => {
    const response = await api<CartResponse>("/cart/", {
      method: "PUT",
      body: JSON.stringify({
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
      }),
    });
    return response.items.map(mapApiCartLine);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    let isCancelled = false;

    async function hydrateCart() {
      setIsHydrated(false);
      if (!user) {
        setCartItems(readGuestCartFromStorage());
        skipNextServerSyncRef.current = true;
        setIsHydrated(true);
        return;
      }

      try {
        const serverCart = await api<CartResponse>("/cart/");
        const guestCart = readGuestCartFromStorage();
        const merged = mergeCartItems(
          serverCart.items.map(mapApiCartLine),
          guestCart,
        );
        const synced = merged.length > 0 ? await persistServerCart(merged) : [];
        if (isCancelled) {
          return;
        }
        localStorage.removeItem(GUEST_CART_KEY);
        setCartItems(synced);
        skipNextServerSyncRef.current = true;
      } catch {
        if (!isCancelled) {
          setCartItems([]);
        }
      } finally {
        if (!isCancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateCart();
    return () => {
      isCancelled = true;
    };
  }, [user, status, persistServerCart]);

  useEffect(() => {
    if (!isHydrated || status === "loading") {
      return;
    }

    if (!user) {
      writeGuestCartToStorage(cartItems);
      return;
    }

    if (skipNextServerSyncRef.current) {
      skipNextServerSyncRef.current = false;
      return;
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      void persistServerCart(cartItems)
        .then((syncedItems) => {
          setCartItems(syncedItems);
          skipNextServerSyncRef.current = true;
        })
        .catch(() => {
          toastStore.failure("Your cart could not be saved to your account.");
        });
    }, CART_SYNC_DELAY_MS);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [cartItems, isHydrated, persistServerCart, status, user]);

  const count = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  function addProductToCart(product: Product, quantity: number): { ok: true } | { ok: false; message: string } {
    if (product.quantity <= 0 || quantity < 1) {
      return { ok: false, message: "Out of stock." };
    }
    const existingItem = cartItems.find((cartItem) => cartItem.productId === product.id);
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
    if (nextQuantity > product.quantity) {
      return { ok: false, message: `Only ${product.quantity} left.` };
    }
    const updatedItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      tenantName: product.tenant_name ?? "Brand",
      quantity: nextQuantity,
      available: product.quantity,
    };
    setCartItems((currentCartItems) => {
      const otherItems = currentCartItems.filter((cartItem) => cartItem.productId !== product.id);
      return [...otherItems, updatedItem];
    });
    return { ok: true };
  }

  function setCartItemQuantity(productId: number, quantity: number) {
    setCartItems((currentCartItems) =>
      currentCartItems.flatMap((cartItem) => {
        if (cartItem.productId !== productId) {
          return [cartItem];
        }
        if (quantity < 1) {
          return [];
        }
        const clampedQuantity = Math.min(quantity, cartItem.available);
        return [{ ...cartItem, quantity: clampedQuantity }];
      }),
    );
  }

  function removeCartItem(productId: number) {
    setCartItems((currentCartItems) => currentCartItems.filter((cartItem) => cartItem.productId !== productId));
  }

  function clearCart() {
    setCartItems([]);
  }

  function updateCartItemFromProductStock(product: Product) {
    setCartItems((currentCartItems) =>
      currentCartItems.flatMap((cartItem) => {
        if (cartItem.productId !== product.id) {
          return [cartItem];
        }
        if (product.quantity <= 0) {
          return [];
        }
        const quantity = Math.min(cartItem.quantity, product.quantity);
        return [
          {
            ...cartItem,
            name: product.name,
            price: product.price,
            tenantName: product.tenant_name ?? cartItem.tenantName,
            available: product.quantity,
            quantity,
          },
        ];
      }),
    );
  }

  const cartContextValue: CartContextValue = {
    cartItems,
    count,
    addProductToCart,
    setCartItemQuantity,
    removeCartItem,
    clearCart,
    updateCartItemFromProductStock,
  };

  return <CartContext.Provider value={cartContextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
