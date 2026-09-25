import type { ShippingAddress, UserAddress } from "@/services/types";

export function formatAddressLines(address: UserAddress | ShippingAddress) {
  const lines = [
    address.recipient_name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean) as string[];

  return lines;
}
