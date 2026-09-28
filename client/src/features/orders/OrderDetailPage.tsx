import OrderDetail from "@/features/orders/OrderDetail";
import { RequireAuth } from "@/utils/routeGuards";

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  );
}
