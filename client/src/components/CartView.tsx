import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { api } from "@/services/api";
import type { AddressPage, OrderCreated, Product, UserAddress } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useCart } from "@/utils/cart";
import { Button } from "@/components/Button";
import { Field, SelectField } from "@/components/Field";
import { FormMessage } from "@/components/FormMessage";
import { Stepper } from "@/components/Stepper";
import { useFormatPrice } from "@/utils/currency";
import { formatAddressLines } from "@/utils/formatAddress";
import { addressFormSchema } from "@/utils/schemas";
import { toastFailure } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";

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

export function CartView({ compact = false }: { compact?: boolean }) {
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

  if (cartItems.length === 0) {
    return (
      <div className="border border-line bg-surface p-6">
        <h2 className="font-display text-3xl">Cart</h2>
        <p className="mt-3 text-muted">Your cart is empty.</p>
        <Link to="/" className="mt-6 inline-block text-sm underline decoration-line-strong underline-offset-4">
          Browse products
        </Link>
      </div>
    );
  }

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

  return (
    <div className={compact ? "border border-line bg-surface p-5" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"}>
      <div className="space-y-8">
        {!compact ? <h1 className="font-display text-4xl font-light">Cart</h1> : <h2 className="font-display text-3xl">Cart</h2>}
        {Object.entries(cartItemsByBrand).map(([brandName, brandCartItems]) => (
          <section key={brandName}>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">{brandName}</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {brandCartItems.map((cartItem) => (
                <li key={cartItem.productId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/products/${cartItem.productId}`} className="font-display text-xl">
                      {cartItem.name}
                    </Link>
                    <p className="mt-1 text-sm tabular-nums text-muted">{formatPrice(cartItem.price)}</p>
                    {cartItem.quantity >= cartItem.available ? (
                      <p className="mt-1 text-sm text-clay">Only {cartItem.available} left.</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <Stepper
                      value={cartItem.quantity}
                      max={cartItem.available}
                      onChange={(quantity) => setCartItemQuantity(cartItem.productId, quantity)}
                      label={`Quantity for ${cartItem.name}`}
                    />
                    <p className="w-20 text-right text-sm tabular-nums">{formatPrice(cartItem.price * cartItem.quantity)}</p>
                    <button
                      type="button"
                      className="interactive-muted text-[0.6875rem] uppercase tracking-[0.12em]"
                      onClick={() => removeCartItem(cartItem.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {user ? (
          <section
            className={`border bg-surface p-5 ${deliveryAddressError ? "border-danger" : "border-line"}`}
            aria-invalid={deliveryAddressError ? true : undefined}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Delivery address</p>
              <button
                type="button"
                className="interactive-muted text-sm"
                onClick={() => setShowAddressForm((visible) => !visible)}
              >
                {showAddressForm ? "Cancel" : "Add address"}
              </button>
            </div>

            <FormMessage message={deliveryAddressError} />

            {addressesQuery.isPending ? (
              <p className="mt-4 text-sm text-muted">Loading saved addresses…</p>
            ) : savedAddresses.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Save an address below to deliver this order.</p>
            ) : (
              <ul className="mt-4 space-y-3" role="radiogroup" aria-label="Delivery address">
                {savedAddresses.map((address) => {
                  const isSelected = selectedAddressId === address.id;
                  return (
                    <li key={address.id}>
                      <label
                        className={`block cursor-pointer border p-4 transition-colors ${
                          isSelected ? "border-ink bg-canvas" : "border-line hover:border-line-strong"
                        } ${deliveryAddressError && !isSelected ? "border-danger/60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => handleSelectAddress(address.id)}
                        />
                        <p className="text-sm font-medium text-ink">
                          {address.label ?? "Address"}
                          {address.is_default ? <span className="ml-2 text-xs font-normal text-muted">Default</span> : null}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                          {formatAddressLines(address).join(" · ")}
                        </p>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {showAddressForm ? (
              <form
                className="mt-6 grid gap-4 sm:grid-cols-2"
                onSubmit={addressFormMethods.handleSubmit((values) => void saveAddress(values))}
                noValidate
              >
                <Field
                  label="Label (optional)"
                  placeholder="Home, Office…"
                  className="sm:col-span-2"
                  error={addressErrors.label?.message}
                  {...addressFormMethods.register("label")}
                />
                <Field
                  label="Recipient name"
                  className="sm:col-span-2"
                  error={addressErrors.recipient_name?.message}
                  {...addressFormMethods.register("recipient_name")}
                />
                <Field
                  label="Address line 1"
                  className="sm:col-span-2"
                  error={addressErrors.line1?.message}
                  {...addressFormMethods.register("line1")}
                />
                <Field
                  label="Address line 2 (optional)"
                  className="sm:col-span-2"
                  error={addressErrors.line2?.message}
                  {...addressFormMethods.register("line2")}
                />
                <Field label="City" error={addressErrors.city?.message} {...addressFormMethods.register("city")} />
                <Field label="State" error={addressErrors.state?.message} {...addressFormMethods.register("state")} />
                <Field
                  label={addressFormMethods.watch("country") === "IN" ? "PIN code" : "Postal code"}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  error={addressErrors.postal_code?.message}
                  {...addressFormMethods.register("postal_code")}
                />
                <SelectField
                  label="Country"
                  error={addressErrors.country?.message}
                  {...addressFormMethods.register("country")}
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                </SelectField>
                <Field
                  label="Phone (optional)"
                  className="sm:col-span-2"
                  error={addressErrors.phone?.message}
                  {...addressFormMethods.register("phone")}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" busy={isSavingAddress} busyLabel="Saving…">
                    Save address
                  </Button>
                </div>
              </form>
            ) : null}
          </section>
        ) : null}
      </div>
      <aside className="h-fit border border-line bg-surface p-5 lg:sticky lg:top-28">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Summary</p>
        <p className="mt-4 flex justify-between text-sm">
          <span>Items</span>
          <span className="tabular-nums">{totalQuantity}</span>
        </p>
        <p className="mt-2 flex justify-between font-display text-2xl">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(totalAmount)}</span>
        </p>
        <FormMessage message={user ? deliveryAddressError : null} />
        <Button
          className="mt-6 w-full"
          busy={isPlacingOrder}
          busyLabel="Placing order…"
          disabled={cartItems.length === 0 || isPlacingOrder}
          onClick={handlePlaceOrderClick}
        >
          Place order
        </Button>
      </aside>
    </div>
  );
}
