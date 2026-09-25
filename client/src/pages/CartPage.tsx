import { CartView } from "@/components/CartView";
import { useDocumentTitle } from "@/utils/title";

export function CartPage() {
  useDocumentTitle("Cart · E-commerce");

  return (
    <div className="px-5 py-10 md:px-10 lg:px-16">
      <CartView />
    </div>
  );
}
