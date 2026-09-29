import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import FavouriteColumn from "@/features/orders/FavouriteColumn";

import { api } from "@/services/api";
import type { OrderPage } from "@/services/types";
import { useFormatPrice } from "@/utils/currency";
import { formatOrderStatus, formatReturnStatus } from "@/utils/orderStatus";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function mobileTabButtonClass(isActive: boolean) {
  return isActive
    ? "cursor-pointer border border-ink bg-ink px-3 py-2 text-sm text-canvas transition-colors"
    : "interactive-surface border border-line-strong px-3 py-2 text-sm";
}

export default function OrdersLedger() {
  const formatPrice = useFormatPrice();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [activeMobileTab, setActiveMobileTab] = useState<
    "orders" | "favourites"
  >("orders");
  const loadOrders = useCallback(
    () => api<OrderPage>(`/orders/?page=${page}&limit=10`),
    [page],
  );
  const ordersQuery = useLoadData(loadOrders);

  useDocumentTitle("Your orders · E-commerce");

  return (
    <div className="px-5 py-10 md:px-10 lg:px-16">
      <div className="mb-6 flex gap-2 lg:hidden">
        <button
          type="button"
          className={mobileTabButtonClass(activeMobileTab === "orders")}
          onClick={() => setActiveMobileTab("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          className={mobileTabButtonClass(activeMobileTab === "favourites")}
          onClick={() => setActiveMobileTab("favourites")}
        >
          Favourites
        </button>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          className={activeMobileTab === "orders" ? "block" : "hidden lg:block"}
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
            Index 01
          </p>
          <h1 className="mt-2 font-display text-4xl font-light">Your orders</h1>
          {ordersQuery.isPending ? <Skeleton className="mt-6 h-48" /> : null}
          {ordersQuery.isError ? (
            <div className="mt-6">
              <Empty title="Your orders could not be loaded." />
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => void ordersQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : null}
          {ordersQuery.data && ordersQuery.data.orders.length === 0 ? (
            <div className="mt-6">
              <Empty
                title="You have no orders yet."
                action={{ href: "/", label: "Browse products" }}
              />
            </div>
          ) : null}
          <ul className="mt-6 space-y-4">
            {(ordersQuery.data?.orders ?? []).map((order) => (
              <li key={order.id} className="border border-line bg-surface">
                <Link
                  to={`/orders/${order.id}`}
                  className="block px-4 py-4 transition-colors hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">
                      Order #{order.id}
                    </p>
                    <p className="tabular-nums">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {formatOrderStatus(order.status)}
                    {" · "}
                    {order.total_quantity} items
                  </p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {order.items.map((orderLineItem) => (
                      <li key={orderLineItem.id}>
                        {orderLineItem.product_name ??
                          `Product ${orderLineItem.product_id}`}{" "}
                        · {orderLineItem.quantity} ·{" "}
                        {formatPrice(orderLineItem.price)}
                        {orderLineItem.is_cancelled ? " · Cancelled" : orderLineItem.return_status ? ` · ${formatReturnStatus(orderLineItem.return_status)}` : ""}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
          {ordersQuery.data ? (
            <Pagination
              page={ordersQuery.data.page}
              limit={ordersQuery.data.limit}
              total={ordersQuery.data.total}
              totalPages={ordersQuery.data.total_pages}
              onPage={(nextPage) => {
                setSearchParams(
                  nextPage === 1 ? {} : { page: String(nextPage) },
                );
              }}
            />
          ) : null}
        </section>
        <section
          className={
            activeMobileTab === "favourites" ? "block" : "hidden lg:block"
          }
        >
          <FavouriteColumn />
        </section>
      </div>
    </div>
  );
}
