import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/services/api";
import type { Order, OrderPage } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { Empty } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { useFormatPrice } from "@/utils/currency";
import { formatOrderStatus, formatReturnStatus, tenantStatusOptions } from "@/utils/orderStatus";
import { toastFailure, toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

export function StudioOrdersPage() {
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const brandName = user?.tenant_name ?? "";
  const [page, setPage] = useState(1);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(
    () => api<OrderPage>(`/${encodeURIComponent(brandName)}/orders?page=${page}&limit=10`),
    [brandName, page],
  );
  const ordersQuery = useLoadData(loadOrders, { enabled: Boolean(brandName) });

  useDocumentTitle(`${brandName} orders · E-commerce`);

  async function updateOrderStatus(orderId: number, status: string) {
    setBusyOrderId(orderId);
    try {
      await api<Order>(`/${encodeURIComponent(brandName)}/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toastStore.success(`Order #${orderId} marked ${formatOrderStatus(status)}`);
      await ordersQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setBusyOrderId(null);
    }
  }

  async function decideReturn(orderId: number, returnStatus: "approved" | "rejected") {
    setBusyOrderId(orderId);
    try {
      await api<Order>(`/${encodeURIComponent(brandName)}/orders/${orderId}/return`, {
        method: "PATCH",
        body: JSON.stringify({ return_status: returnStatus }),
      });
      toastStore.success(`Return ${returnStatus === "approved" ? "approved" : "declined"}`);
      await ordersQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-surface px-4 py-3 text-sm">
        <Link to={`/${encodeURIComponent(brandName)}/studio`} className="underline underline-offset-4">
          Back to {brandName} studio
        </Link>
      </div>
      <div className="mt-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Fulfillment</p>
        <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">Orders for {brandName}</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Update order status for shipments that include your products. Approve or decline return requests after delivery.
        </p>
      </div>

      {ordersQuery.isPending ? <Skeleton className="mt-8 h-64" /> : null}
      {ordersQuery.isError ? (
        <div className="mt-8">
          <Empty title="Orders could not be loaded." />
          <Button className="mt-4" variant="secondary" onClick={() => void ordersQuery.reload()}>Try again</Button>
        </div>
      ) : null}

      {ordersQuery.data && ordersQuery.data.orders.length === 0 ? (
        <div className="mt-8">
          <Empty title="No orders yet for your brand." />
        </div>
      ) : null}

      <ul className="mt-8 space-y-4">
        {(ordersQuery.data?.orders ?? []).map((order) => {
          const nextStatuses = tenantStatusOptions(order.status);
          const isBusy = busyOrderId === order.id;
          return (
            <li key={order.id} className="border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-2xl">Order #{order.id}</p>
                <p className="text-sm tabular-nums">{formatPrice(order.total_amount)}</p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {formatOrderStatus(order.status)}
                {order.return_status ? ` · ${formatReturnStatus(order.return_status)}` : ""}
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {order.items.map((line) => (
                  <li key={line.id}>
                    {line.product_name ?? `Product ${line.product_id}`} · {line.quantity} · {formatPrice(line.price)}
                  </li>
                ))}
              </ul>
              {nextStatuses.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={status === "cancelled" ? "secondary" : "primary"}
                      busy={isBusy}
                      onClick={() => void updateOrderStatus(order.id, status)}
                    >
                      Mark {formatOrderStatus(status)}
                    </Button>
                  ))}
                </div>
              ) : null}
              {order.status === "delivered" && order.return_status === "requested" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button busy={isBusy} onClick={() => void decideReturn(order.id, "approved")}>Approve return</Button>
                  <Button variant="secondary" busy={isBusy} onClick={() => void decideReturn(order.id, "rejected")}>
                    Decline return
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {ordersQuery.data ? (
        <Pagination
          page={ordersQuery.data.page}
          limit={ordersQuery.data.limit}
          total={ordersQuery.data.total}
          totalPages={ordersQuery.data.total_pages}
          onPage={setPage}
        />
      ) : null}
    </div>
  );
}
