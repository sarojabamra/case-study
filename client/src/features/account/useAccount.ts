import type { AddressFormValues } from "@/components/addresses/addressTypes";
import { addressToFormValues, buildAddressPayload, emptyAddressForm } from "@/features/account/accountForms";
import { api } from "@/services/api";
import type { AddressPage, Me, UserAddress } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import {
  addressFormSchema,
  changePasswordSchema,
  profileSchema,
} from "@/utils/schemas";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

export function useAccount() {
  const { user, refreshUser } = useAuth();

  const [addressEditor, setAddressEditor] = useState<"new" | number | null>(
    null,
  );

  const [addressPendingRemoval, setAddressPendingRemoval] =
    useState<UserAddress | null>(null);

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

  async function handleSaveProfile(values: { full_name: string; }) {
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
        addressEditor === "new"
          ? savedAddresses.length === 0
          : (existing?.is_default ?? false);
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
      await api<void>(`/addresses/${addressPendingRemoval.id}`, {
        method: "DELETE",
      });
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
      await api<{ message: string; }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: values.current_password,
          new_password: values.new_password,
        }),
      });
      passwordForm.reset();
      toastStore.success(
        "Password updated",
        "Use your new password next time you sign in.",
      );
    } catch (error) {
      toastFailure(error);
    }
  }

  const savedAddresses = addressesQuery.data?.addresses ?? [];
  return {
    user,
    addressEditor,
    addressPendingRemoval,
    setAddressPendingRemoval,
    isSavingAddress,
    isDeletingAddress,
    profileForm,
    passwordForm,
    addressForm,
    addressesQuery,
    openNewAddressForm,
    openEditAddressForm,
    closeAddressForm,
    handleSaveProfile,
    handleSaveAddress,
    handleSetDefaultAddress,
    handleDeleteAddress,
    handleChangePassword,
    savedAddresses,
  };
}
