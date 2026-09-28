import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import FormMessage from "@/components/ui/FormMessage";
import SelectField from "@/components/ui/SelectField";
import Stepper from "@/components/ui/Stepper";
import { formatAddressLines } from "@/utils/formatAddress";
import { Link } from "react-router-dom";
import { useCheckout } from "./useCheckout";

export default function CartView({ compact = false }: { compact?: boolean; }) {
  const {
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
  } = useCheckout();
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
  return (
    <div className={compact ? "border border-line bg-surface p-5" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"}>
      <div className="space-y-8">
        {!compact ? <h1 className="font-display text-4xl font-light">Cart</h1> : <h2 className="font-display text-3xl">Cart</h2>}
        {Object.entries(cartItemsByBrand).map(([brandName, brandCartItems]) => (
          <section key={brandName}>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">{brandName}</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {brandCartItems.map((cartItem) => (
                <li
                  key={cartItem.productId}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
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
                        className={`block cursor-pointer border p-4 transition-colors ${isSelected ? "border-ink bg-canvas" : "border-line hover:border-line-strong"
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
