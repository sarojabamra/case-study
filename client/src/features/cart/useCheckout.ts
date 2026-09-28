import { api } from "@/services/api";
import type { AddressPage, OrderCreated, Product, UserAddress } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useCart } from "@/utils/cart";
import { useFormatPrice } from "@/utils/currency";
import { addressFormSchema } from "@/utils/schemas";
import { toastFailure } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

type AddressFormValues = {
  label: string;
  recipient_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: "IN" | "US";
  phone: string;
};

const emptyAddressForm: AddressFormValues = {
  label: "",
  recipient_name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "IN",
  phone: "",
};

export function useCheckout() {
  const formatPrice = useFormatPrice();

  const { cartItems, setCartItemQuantity, removeCartItem, clearCart, updateCartItemFromProductStock } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [deliveryAddressError, setDeliveryAddressError] = useState<string | null>(null);

  const addressFormMethods = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: emptyAddressForm,
  });

  const cartItemsRef = useRef(cartItems);

  const cartActionsRef = useRef({ removeCartItem, updateCartItemFromProductStock });

  cartItemsRef.current = cartItems;

  cartActionsRef.current = { removeCartItem, updateCartItemFromProductStock };

  const productIdsKey = cartItems.map((cartItem) => cartItem.productId).join(",");

  const loadAddresses = useCallback(() => api<AddressPage>("/addresses/"), []);

  const addressesQuery = useLoadData(loadAddresses, {
    enabled: Boolean(user),
    showErrorToast: false,
  });

  const savedAddresses = addressesQuery.data?.addresses ?? [];

  useEffect(() => {
    if (savedAddresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    if (selectedAddressId && savedAddresses.some((address) => address.id === selectedAddressId)) {
      return;
    }
    const defaultAddress = savedAddresses.find((address) => address.is_default) ?? savedAddresses[0];
    setSelectedAddressId(defaultAddress.id);
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    let isCancelled = false;
    async function syncCartWithLatestProductStock() {
      const currentCartItems = cartItemsRef.current;
      if (currentCartItems.length === 0) {
        return;
      }
      const latestProducts = await Promise.all(
        currentCartItems.map(async (cartItem) => {
          try {
            return await api<Product>(`/products/${cartItem.productId}`);
          } catch {
            return null;
          }
        }),
      );
      if (isCancelled) {
        return;
      }
      latestProducts.forEach((product, index) => {
        const cartItem = currentCartItems[index];
        if (!product) {
          cartActionsRef.current.removeCartItem(cartItem.productId);
          return;
        }
        cartActionsRef.current.updateCartItemFromProductStock(product);
      });
    }
    void syncCartWithLatestProductStock();
    return () => {
      isCancelled = true;
    };
  }, [productIdsKey]);

  async function saveAddress(values: AddressFormValues) {
    setIsSavingAddress(true);
    try {
      const createdAddress = await api<UserAddress>("/addresses/", {
        method: "POST",
        body: JSON.stringify({
          label: values.label.trim() || null,
          recipient_name: values.recipient_name.trim(),
          line1: values.line1.trim(),
          line2: values.line2.trim() || null,
          city: values.city.trim(),
          state: values.state.trim(),
          postal_code: values.postal_code.trim(),
          country: values.country,
          phone: values.phone.trim() || null,
          is_default: savedAddresses.length === 0,
        }),
      });
      addressFormMethods.reset(emptyAddressForm);
      setShowAddressForm(false);
      setDeliveryAddressError(null);
      await addressesQuery.reload();
      setSelectedAddressId(createdAddress.id);
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function placeOrder() {
    setIsPlacingOrder(true);
    try {
      const createdOrder = await api<OrderCreated>("/orders/", {
        method: "POST",
        body: JSON.stringify({
          address_id: selectedAddressId,
          items: cartItems.map((cartItem) => ({ product_id: cartItem.productId, quantity: cartItem.quantity })),
        }),
      });
      clearCart();
      navigate(`/orders/${createdOrder.order_id}`, { state: { confirmed: true } });
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsPlacingOrder(false);
    }
  }

  const totalQuantity = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  const totalAmount = cartItems.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);

  const cartItemsByBrand = cartItems.reduce<Record<string, typeof cartItems>>((grouped, cartItem) => {
    const brandName = cartItem.tenantName;
    grouped[brandName] = [...(grouped[brandName] ?? []), cartItem];
    return grouped;
  }, {});

  function handlePlaceOrderClick() {
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    if (addressesQuery.isPending) {
      setDeliveryAddressError("Wait for your saved addresses to finish loading.");
      return;
    }
    if (!selectedAddressId) {
      setDeliveryAddressError(
        savedAddresses.length === 0
          ? "Add and save a delivery address before placing your order."
          : "Select a delivery address before placing your order.",
      );
      return;
    }
    setDeliveryAddressError(null);
    void placeOrder();
  }

  function handleSelectAddress(addressId: number) {
    setSelectedAddressId(addressId);
    setDeliveryAddressError(null);
  }

  const addressErrors = addressFormMethods.formState.errors;
  return {
    formatPrice,
    cartItems,
    setCartItemQuantity,
    removeCartItem,
    user,
    isPlacingOrder,
    selectedAddressId,
    showAddressForm,
    setShowAddressForm,
    isSavingAddress,
    deliveryAddressError,
    addressFormMethods,
    addressesQuery,
    savedAddresses,
    saveAddress,
    totalQuantity,
    totalAmount,
    cartItemsByBrand,
    handlePlaceOrderClick,
    handleSelectAddress,
    addressErrors,
  };
}
