export type OrderStatus = "placed" | "shipped" | "delivered" | "cancelled";
export type ReturnStatus = "requested" | "approved" | "rejected";

const orderStatusLabels: Record<OrderStatus, string> = {
  placed: "Placed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const returnStatusLabels: Record<ReturnStatus, string> = {
  requested: "Return requested",
  approved: "Return approved",
  rejected: "Return declined",
};

export function formatOrderStatus(status: string) {
  return orderStatusLabels[status as OrderStatus] ?? status;
}

export function formatReturnStatus(status: string) {
  return returnStatusLabels[status as ReturnStatus] ?? status;
}

export function tenantStatusOptions(currentStatus: string) {
  switch (currentStatus) {
    case "placed":
      return ["shipped", "cancelled"] as const;
    case "shipped":
      return ["delivered", "cancelled"] as const;
    default:
      return [] as const;
  }
}
