import Confirm from "@/components/ui/Confirm";
import AddressesSection from "./AddressesSection";
import PasswordSection from "./PasswordSection";
import ProfileSection from "./ProfileSection";
import { useAccount } from "./useAccount";

export default function Account() {
  const {
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
  } = useAccount();
  if (!user) {
    return null;
  }
  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:px-10">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
        Account
      </p>
      <h1 className="mt-2 font-display text-4xl font-light">Your account</h1>
      <p className="mt-3 text-sm text-muted">
        Update your profile, saved addresses, and password.
      </p>

      <ProfileSection user={user} profileForm={profileForm} handleSaveProfile={handleSaveProfile} />

      <AddressesSection
        addressEditor={addressEditor}
        setAddressPendingRemoval={setAddressPendingRemoval}
        isSavingAddress={isSavingAddress}
        addressForm={addressForm}
        addressesQuery={addressesQuery}
        openNewAddressForm={openNewAddressForm}
        openEditAddressForm={openEditAddressForm}
        closeAddressForm={closeAddressForm}
        handleSaveAddress={handleSaveAddress}
        handleSetDefaultAddress={handleSetDefaultAddress}
        savedAddresses={savedAddresses}
      />

      <PasswordSection passwordForm={passwordForm} handleChangePassword={handleChangePassword} />

      <Confirm
        open={addressPendingRemoval !== null}
        title="Remove address"
        body={
          addressPendingRemoval
            ? "Remove this saved address? Checkout will no longer list it."
            : ""
        }
        confirmLabel="Remove"
        destructive
        busy={isDeletingAddress}
        onConfirm={() => void handleDeleteAddress()}
        onClose={() => setAddressPendingRemoval(null)}
      />
    </div>
  );
}
