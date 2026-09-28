import AddressFormFields from "@/components/addresses/AddressFormFields";
import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Skeleton from "@/components/ui/Skeleton";
import { formatAddressLines } from "@/utils/formatAddress";
import type { useAccount } from "./useAccount";

type Props = Pick<ReturnType<typeof useAccount>, "addressEditor" | "setAddressPendingRemoval" | "isSavingAddress" | "addressForm" | "addressesQuery" | "openNewAddressForm" | "openEditAddressForm" | "closeAddressForm" | "handleSaveAddress" | "handleSetDefaultAddress" | "savedAddresses">;

export default function AddressesSection({ addressEditor, setAddressPendingRemoval, isSavingAddress, addressForm, addressesQuery, openNewAddressForm, openEditAddressForm, closeAddressForm, handleSaveAddress, handleSetDefaultAddress, savedAddresses }: Props) {
  return (<section className="mt-8 border border-line bg-surface p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-2xl">Saved addresses</h2>
      {addressEditor === null ? (
        <Button variant="secondary" onClick={openNewAddressForm}>
          Add address
        </Button>
      ) : (
        <button
          type="button"
          className="interactive-muted text-sm"
          onClick={closeAddressForm}
        >
          Cancel
        </button>
      )}
    </div>

    {addressesQuery.isPending ? <Skeleton className="mt-6 h-32" /> : null}
    {addressesQuery.isError ? (
      <div className="mt-6">
        <Empty title="Addresses could not be loaded." />
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => void addressesQuery.reload()}
        >
          Try again
        </Button>
      </div>
    ) : null}

    {addressEditor === null ? (
      <ul className="mt-6 space-y-4">
        {savedAddresses.length === 0 ? (
          <li className="text-sm text-muted">No saved addresses yet.</li>
        ) : null}
        {savedAddresses.map((address) => (
          <li key={address.id} className="border border-line p-4">
            <p className="text-sm font-medium text-ink">
              {address.label ?? "Address"}
              {address.is_default ? (
                <span className="ml-2 text-xs font-normal text-muted">
                  Default
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-muted">
              {formatAddressLines(address).join(" · ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="interactive-muted underline underline-offset-4"
                onClick={() => openEditAddressForm(address)}
              >
                Edit
              </button>
              {!address.is_default ? (
                <button
                  type="button"
                  className="interactive-muted underline underline-offset-4"
                  onClick={() => void handleSetDefaultAddress(address.id)}
                >
                  Set as default
                </button>
              ) : null}
              <button
                type="button"
                className="interactive-muted text-danger underline underline-offset-4"
                onClick={() => setAddressPendingRemoval(address)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={addressForm.handleSubmit(
          (values) => void handleSaveAddress(values),
        )}
        noValidate
      >
        <AddressFormFields
          form={addressForm}
          idPrefix={
            addressEditor === "new"
              ? "new-address"
              : `edit-address-${addressEditor}`
          }
        />
        <div className="sm:col-span-2">
          <Button type="submit" busy={isSavingAddress} busyLabel="Saving…">
            {addressEditor === "new" ? "Save address" : "Update address"}
          </Button>
        </div>
      </form>
    )}
  </section>);
}
