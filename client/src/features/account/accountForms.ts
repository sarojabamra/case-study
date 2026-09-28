import type { AddressFormValues } from "@/components/addresses/addressTypes";
import type { UserAddress } from "@/services/types";

export const roleLabel = {
  USER: "Shopper",
  TENANT: "Brand",
  ADMIN: "Admin",
} as const;

export const emptyAddressForm: AddressFormValues = {
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

export function addressToFormValues(address: UserAddress): AddressFormValues {
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

export function buildAddressPayload(values: AddressFormValues, isDefault: boolean) {
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
