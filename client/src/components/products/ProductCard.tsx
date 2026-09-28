import ProductPlate from "@/components/products/ProductPlate";
import type { Product } from "@/services/types";

import Button from "@/components/ui/Button";
import { useAuth } from "@/utils/authSession";
import { useCart } from "@/utils/cart";
import { useFormatPrice } from "@/utils/currency";
import { stockLabel } from "@/utils/stock";
import { toastStore } from "@/utils/toast";
import { Link, useLocation, useNavigate } from "react-router-dom";

type ProductCardProps = {
  product: Product;
  saved: boolean;
  onToggleFavourite: (product: Product, saved: boolean) => void;
};

export default function ProductCard({ product, saved, onToggleFavourite }: ProductCardProps) {
  const formatPrice = useFormatPrice();
  const { addProductToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stock = stockLabel(product.quantity);

  function handleAddToCart() {
    const addResult = addProductToCart(product, 1);
    if (!addResult.ok) {
      toastStore.failure(addResult.message);
      return;
    }
    toastStore.success("Added to cart");
  }

  function handleFavouriteClick() {
    if (!user) {
      const next = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?next=${next}`);
      return;
    }
    onToggleFavourite(product, saved);
  }

  return (
    <article className="flex flex-col border border-line bg-canvas">
      <div className="relative">
        <Link to={`/products/${product.id}`} className="block">
          <ProductPlate product={product} />
        </Link>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from favourites` : `Save ${product.name}`}
          className="interactive-icon absolute top-3 right-3 h-11 w-11 border border-line bg-canvas text-lg"
          onClick={handleFavouriteClick}
        >
          <span className={saved ? "text-ink" : "text-muted"}>{saved ? "♥" : "♡"}</span>
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-sm text-muted">{product.tenant_name ?? "Brand"}</p>
          <Link
            to={`/products/${product.id}`}
            className="mt-1 block font-medium leading-snug hover:underline underline-offset-4"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm tabular-nums">{formatPrice(product.price)}</p>
          <p className="text-sm text-muted">{stock.text}</p>
        </div>
        <Button className="mt-auto w-full" disabled={product.quantity <= 0} onClick={handleAddToCart}>
          {product.quantity <= 0 ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
