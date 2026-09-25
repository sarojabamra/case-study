import { useCallback, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { api, ApiError } from "@/services/api";
import type { Order } from "@/services/types";
import { RequireAuth } from "@/utils/routeGuards";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Confirm";
import { Empty, SystemState } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { useFormatPrice } from "@/utils/currency";
import { formatAddressLines } from "@/utils/formatAddress";
import { formatOrderStatus, formatReturnStatus } from "@/utils/orderStatus";
import { toastFailure, toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

export function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  );
}

function OrderDetail() {
  const formatPrice = useFormatPrice();
  const params = useParams();
  const location = useLocation();
  const orderId = Number(params.orderId);
  const confirmed = Boolean((location.state as { confirmed?: boolean } | null)?.confirmed);
  const orderIdIsValid = Number.isInteger(orderId) && orderId > 0;
  const loadOrder = useCallback(() => api<Order>(`/orders/${orderId}`), [orderId]);
  const orderQuery = useLoadData(loadOrder, { enabled: orderIdIsValid, showErrorToast: false });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentTitle(`Order ${orderId} · E-commerce`);

  if (!Number.isInteger(orderId) || orderId <= 0 || (orderQuery.isError && orderQuery.error instanceof ApiError && orderQuery.error.status === 404)) {
    return <SystemState title="Order not found." body="That order is not in your history." action={{ href: "/orders", label: "Your orders" }} />;
  }

  if (orderQuery.isPending) {
    return <Skeleton className="mx-5 mt-10 h-64 md:mx-10" />;
  }

  if (!orderQuery.data) {
    return <SystemState title="The order could not be loaded." body="Try your order history again." action={{ href: "/orders", label: "Your orders" }} />;
  }

  const order = orderQuery.data;
  const canCancel = order.status === "placed" || order.status === "shipped";
  const canRequestReturn = order.status === "delivered" && !order.return_status;

  async function cancelOrder() {
    setIsSubmitting(true);
    try {
      await api<Order>(`/orders/${order.id}/cancel`, { method: "POST" });
      toastStore.success("Order cancelled");
      setConfirmCancel(false);
      await orderQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestReturn() {
    setIsSubmitting(true);
    try {
      await api<Order>(`/orders/${order.id}/return`, { method: "POST" });
      toastStore.success("Return requested");
      setConfirmReturn(false);
      await orderQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-10">
      {confirmed ? (
        <div className="mb-8 border border-olive bg-surface px-5 py-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-olive">Order placed</p>
          <p className="mt-2 font-display text-3xl">Thank you. Your order is recorded.</p>
        </div>
      ) : null}
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Order #{order.id}</p>
      <h1 className="mt-2 font-display text-4xl font-light">Order detail</h1>
      <p className="mt-3 text-sm text-muted">
        {formatOrderStatus(order.status)}
        {order.return_status ? ` · ${formatReturnStatus(order.return_status)}` : ""}
        {" · "}
        {order.total_quantity} items · <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
      </p>
      {order.shipping_address?.line1 ? (
        <div className="mt-8 border border-line bg-surface p-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">Shipped to</p>
          <p className="mt-2 text-sm text-ink">
            {order.shipping_address.label ? `${order.shipping_address.label} · ` : ""}
            {formatAddressLines(order.shipping_address).join(" · ")}
          </p>
        </div>
      ) : null}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.items.map((orderLine) => (
          <li key={orderLine.id} className="flex items-baseline justify-between gap-4 py-4">
            <div>
              <Link to={`/products/${orderLine.product_id}`} className="font-display text-2xl">
                {orderLine.product_name ?? `Product ${orderLine.product_id}`}
              </Link>
              <p className="mt-1 text-sm text-muted">Quantity {orderLine.quantity}</p>
            </div>
            <p className="text-sm tabular-nums">{formatPrice(orderLine.price)}</p>
          </li>
        ))}
      </ul>
      {(canCancel || canRequestReturn) ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {canCancel ? (
            <Button variant="secondary" onClick={() => setConfirmCancel(true)}>Cancel order</Button>
          ) : null}
          {canRequestReturn ? (
            <Button variant="secondary" onClick={() => setConfirmReturn(true)}>Request return</Button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link to="/orders" className="underline underline-offset-4">View order history</Link>
        <Link to="/" className="underline underline-offset-4">Continue shopping</Link>
      </div>
      {!order.items.length ? <div className="mt-6"><Empty title="This order has no items." /></div> : null}
      <Confirm
        open={confirmCancel}
        title="Cancel order"
        body="Your items will be returned to stock and this order will be marked cancelled."
        confirmLabel="Cancel order"
        destructive
        busy={isSubmitting}
        onConfirm={() => void cancelOrder()}
        onClose={() => setConfirmCancel(false)}
      />
      <Confirm
        open={confirmReturn}
        title="Request return"
        body="The brand will review your return request after delivery."
        confirmLabel="Request return"
        busy={isSubmitting}
        onConfirm={() => void requestReturn()}
        onClose={() => setConfirmReturn(false)}
      />
    </div>
  );
}
