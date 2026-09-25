import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "@/services/api";
import type { AddressPage, Me, UserAddress } from "@/services/types";
import { RequireAuth } from "@/utils/routeGuards";
import { useAuth } from "@/utils/authSession";
import { AddressFormFields, type AddressFormValues } from "@/components/AddressFormFields";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Confirm";
import { Field } from "@/components/Field";
import { Empty } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { useDocumentTitle } from "@/utils/title";
import { addressFormSchema, changePasswordSchema, profileSchema } from "@/utils/schemas";
import { formatAddressLines } from "@/utils/formatAddress";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";

const roleLabel = {
  USER: "Shopper",
  TENANT: "Brand",
  ADMIN: "Admin",
} as const;

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

function addressToFormValues(address: UserAddress): AddressFormValues {
  return {
    label: address.label ?? "",
    recipient_name: address.recipient_name,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country === "US" ? "US" : "IN",
    phone: address.phone ?? "",
  };
}

function buildAddressPayload(values: AddressFormValues, isDefault: boolean) {
  return {
    label: values.label.trim() || null,
    recipient_name: values.recipient_name.trim(),
    line1: values.line1.trim(),
    line2: values.line2.trim() || null,
    city: values.city.trim(),
    state: values.state.trim(),
    postal_code: values.postal_code.trim(),
    country: values.country,
    phone: values.phone.trim() || null,
    is_default: isDefault,
  };
}

export function AccountPage() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}

function Account() {
  const { user, refreshUser } = useAuth();
  const [addressEditor, setAddressEditor] = useState<"new" | number | null>(null);
  const [addressPendingRemoval, setAddressPendingRemoval] = useState<UserAddress | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { full_name: user?.full_name?.trim() ?? "" },
  });
  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  });
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: emptyAddressForm,
  });

  const loadAddresses = useCallback(() => api<AddressPage>("/addresses/"), []);
  const addressesQuery = useLoadData(loadAddresses);

  useDocumentTitle("Account · E-commerce");

  if (!user) {
    return null;
  }

  function openNewAddressForm() {
    addressForm.reset(emptyAddressForm);
    setAddressEditor("new");
  }

  function openEditAddressForm(address: UserAddress) {
    addressForm.reset(addressToFormValues(address));
    setAddressEditor(address.id);
  }

  function closeAddressForm() {
    setAddressEditor(null);
    addressForm.reset(emptyAddressForm);
  }

  async function handleSaveProfile(values: { full_name: string }) {
    try {
      await api<Me>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      await refreshUser();
      toastStore.success("Profile updated");
    } catch (error) {
      toastFailure(error);
    }
  }

  async function handleSaveAddress(values: AddressFormValues) {
    setIsSavingAddress(true);
    try {
      const existing =
        typeof addressEditor === "number"
          ? savedAddresses.find((address) => address.id === addressEditor)
          : undefined;
      const isDefault =
        addressEditor === "new" ? savedAddresses.length === 0 : (existing?.is_default ?? false);
      const payload = buildAddressPayload(values, isDefault);

      if (addressEditor === "new") {
        await api<UserAddress>("/addresses/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toastStore.success("Address saved");
      } else if (typeof addressEditor === "number") {
        await api<UserAddress>(`/addresses/${addressEditor}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toastStore.success("Address updated");
      }
      closeAddressForm();
      await addressesQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleSetDefaultAddress(addressId: number) {
    try {
      await api<UserAddress>(`/addresses/${addressId}`, {
        method: "PUT",
        body: JSON.stringify({ is_default: true }),
      });
      await addressesQuery.reload();
      toastStore.success("Default address updated");
    } catch (error) {
      toastFailure(error);
    }
  }

  async function handleDeleteAddress() {
    if (!addressPendingRemoval) {
      return;
    }
    setIsDeletingAddress(true);
    try {
      await api<void>(`/addresses/${addressPendingRemoval.id}`, { method: "DELETE" });
      setAddressPendingRemoval(null);
      if (addressEditor === addressPendingRemoval.id) {
        closeAddressForm();
      }
      await addressesQuery.reload();
      toastStore.success("Address removed");
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsDeletingAddress(false);
    }
  }

  async function handleChangePassword(values: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }) {
    try {
      await api<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: values.current_password,
          new_password: values.new_password,
        }),
      });
      passwordForm.reset();
      toastStore.success("Password updated", "Use your new password next time you sign in.");
    } catch (error) {
      toastFailure(error);
    }
  }

  const savedAddresses = addressesQuery.data?.addresses ?? [];

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:px-10">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Account</p>
      <h1 className="mt-2 font-display text-4xl font-light">Your account</h1>
      <p className="mt-3 text-sm text-muted">Update your profile, saved addresses, and password.</p>

      <section className="mt-10 border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">Profile</h2>
        <form
          className="mt-6 space-y-4"
          onSubmit={profileForm.handleSubmit((values) => void handleSaveProfile(values))}
          noValidate
        >
          <Field label="Username" value={user.username} readOnly disabled className="opacity-80" />
          <Field
            label="Full name"
            autoComplete="name"
            error={profileForm.formState.errors.full_name?.message}
            {...profileForm.register("full_name")}
          />
          <p className="text-sm text-muted">
            {roleLabel[user.role]}{user.tenant_name ? ` · ${user.tenant_name}` : ""}
          </p>
          <Button type="submit" busy={profileForm.formState.isSubmitting} busyLabel="Saving…">
            Save profile
          </Button>
        </form>
      </section>

      <section className="mt-8 border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Saved addresses</h2>
          {addressEditor === null ? (
            <Button variant="secondary" onClick={openNewAddressForm}>Add address</Button>
          ) : (
            <button type="button" className="interactive-muted text-sm" onClick={closeAddressForm}>
              Cancel
            </button>
          )}
        </div>

        {addressesQuery.isPending ? <Skeleton className="mt-6 h-32" /> : null}
        {addressesQuery.isError ? (
          <div className="mt-6">
            <Empty title="Addresses could not be loaded." />
            <Button className="mt-4" variant="secondary" onClick={() => void addressesQuery.reload()}>Try again</Button>
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
                  {address.is_default ? <span className="ml-2 text-xs font-normal text-muted">Default</span> : null}
                </p>
                <p className="mt-2 text-sm text-muted">{formatAddressLines(address).join(" · ")}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <button type="button" className="interactive-muted underline underline-offset-4" onClick={() => openEditAddressForm(address)}>
                    Edit
                  </button>
                  {!address.is_default ? (
                    <button type="button" className="interactive-muted underline underline-offset-4" onClick={() => void handleSetDefaultAddress(address.id)}>
                      Set as default
                    </button>
                  ) : null}
                  <button type="button" className="interactive-muted text-danger underline underline-offset-4" onClick={() => setAddressPendingRemoval(address)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={addressForm.handleSubmit((values) => void handleSaveAddress(values))}
            noValidate
          >
            <AddressFormFields form={addressForm} idPrefix={addressEditor === "new" ? "new-address" : `edit-address-${addressEditor}`} />
            <div className="sm:col-span-2">
              <Button type="submit" busy={isSavingAddress} busyLabel="Saving…">
                {addressEditor === "new" ? "Save address" : "Update address"}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">Password</h2>
        <p className="mt-2 text-sm text-muted">Enter your current password, then choose a new one.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={passwordForm.handleSubmit((values) => void handleChangePassword(values))}
          noValidate
        >
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.current_password?.message}
            {...passwordForm.register("current_password")}
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.new_password?.message}
            {...passwordForm.register("new_password")}
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirm_new_password?.message}
            {...passwordForm.register("confirm_new_password")}
          />
          <Button type="submit" busy={passwordForm.formState.isSubmitting} busyLabel="Updating…">
            Update password
          </Button>
        </form>
      </section>

      <Confirm
        open={addressPendingRemoval !== null}
        title="Remove address"
        body={addressPendingRemoval ? "Remove this saved address? Checkout will no longer list it." : ""}
        confirmLabel="Remove"
        destructive
        busy={isDeletingAddress}
        onConfirm={() => void handleDeleteAddress()}
        onClose={() => setAddressPendingRemoval(null)}
      />
    </div>
  );
}
