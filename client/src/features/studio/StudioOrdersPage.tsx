import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import type { Order, OrderPage } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useFormatPrice } from "@/utils/currency";
import {
  formatOrderStatus,
  formatReturnStatus,
  tenantStatusOptions,
} from "@/utils/orderStatus";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

export default function StudioOrdersPage() {
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const brandName = user?.tenant_name ?? "";
  const [page, setPage] = useState(1);
  const [busyActionId, setBusyActionId] = useState<number | null>(null);

  const loadOrders = useCallback(
    () =>
      api<OrderPage>(
        `/${encodeURIComponent(brandName)}/orders?page=${page}&limit=10`,
      ),
    [brandName, page],
  );
  const ordersQuery = useLoadData(loadOrders, { enabled: Boolean(brandName) });

  useDocumentTitle(`${brandName} orders · E-commerce`);

  async function updateOrderStatus(orderId: number, status: string) {
    setBusyActionId(orderId);
    try {
      await api<Order>(
        `/${encodeURIComponent(brandName)}/orders/${orderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      toastStore.success(
        `Order #${orderId} marked ${formatOrderStatus(status)}`,
      );
      await ordersQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setBusyActionId(null);
    }
  }

  async function cancelItem(orderId: number, itemId: number) {
    setBusyActionId(itemId);
    try {
      await api<Order>(
        `/${encodeURIComponent(brandName)}/orders/${orderId}/items/${itemId}/cancel`,
        { method: "POST" },
      );
      toastStore.success("Item cancelled");
      await ordersQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setBusyActionId(null);
    }
  }

  async function decideReturn(
    orderId: number,
    itemId: number,
    returnStatus: "approved" | "rejected",
  ) {
    setBusyActionId(itemId);
    try {
      await api<Order>(
        `/${encodeURIComponent(brandName)}/orders/${orderId}/items/${itemId}/return`,
        {
          method: "PATCH",
          body: JSON.stringify({ return_status: returnStatus }),
        },
      );
      toastStore.success(
        `Return ${returnStatus === "approved" ? "approved" : "declined"}`,
      );
      await ordersQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setBusyActionId(null);
    }
  }

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-surface px-4 py-3 text-sm">
        <Link
          to={`/${encodeURIComponent(brandName)}/studio`}
          className="underline underline-offset-4"
        >
          Back to {brandName} studio
        </Link>
      </div>
      <div className="mt-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
          Fulfillment
        </p>
        <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
          Orders for {brandName}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Update order status for shipments that include your products. Approve
          or decline return requests after delivery.
        </p>
      </div>

      {ordersQuery.isPending ? <Skeleton className="mt-8 h-64" /> : null}
      {ordersQuery.isError ? (
        <div className="mt-8">
          <Empty title="Orders could not be loaded." />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void ordersQuery.reload()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {ordersQuery.data && ordersQuery.data.orders.length === 0 ? (
        <div className="mt-8">
          <Empty title="No orders yet for your brand." />
        </div>
      ) : null}

      <ul className="mt-8 space-y-4">
        {(ordersQuery.data?.orders ?? []).map((order) => {
          const hasActiveItems = order.items.some((item) => !item.is_cancelled);
          const nextStatuses = hasActiveItems
            ? tenantStatusOptions(order.status)
            : [];
          const isBusy = busyActionId === order.id;
          return (
            <li key={order.id} className="border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-2xl">Order #{order.id}</p>
                <p className="text-sm tabular-nums">
                  {formatPrice(order.total_amount)}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {formatOrderStatus(order.status)}
              </p>
              <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
                {order.items.map((line) => (
                  <li key={line.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <p>
                      {line.product_name ?? `Product ${line.product_id}`} · {line.quantity} · {formatPrice(line.price)}
                      {line.is_cancelled ? " · Cancelled" : line.return_status ? ` · ${formatReturnStatus(line.return_status)}` : ""}
                    </p>
                    {(order.status === "placed" || order.status === "shipped") && !line.is_cancelled ? (
                      <Button variant="secondary" busy={busyActionId === line.id} onClick={() => void cancelItem(order.id, line.id)}>Cancel item</Button>
                    ) : null}
                    {order.status === "delivered" && line.return_status === "requested" ? (
                      <div className="flex gap-2">
                        <Button busy={busyActionId === line.id} onClick={() => void decideReturn(order.id, line.id, "approved")}>Approve return</Button>
                        <Button variant="secondary" busy={busyActionId === line.id} onClick={() => void decideReturn(order.id, line.id, "rejected")}>Decline return</Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              {nextStatuses.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="primary"
                      busy={isBusy}
                      onClick={() => void updateOrderStatus(order.id, status)}
                    >
                      Mark {formatOrderStatus(status)}
                    </Button>
                  ))}
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
