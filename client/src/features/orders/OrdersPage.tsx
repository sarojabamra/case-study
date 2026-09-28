import OrdersLedger from "@/features/orders/OrdersLedger";
import { RequireAuth } from "@/utils/routeGuards";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersLedger />
    </RequireAuth>
  );
}
