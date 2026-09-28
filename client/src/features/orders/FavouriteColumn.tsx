import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Skeleton from "@/components/ui/Skeleton";
import { useFormatPrice } from "@/utils/currency";
import { useFavouriteActions, useFavourites } from "@/utils/favourites";
import { Link } from "react-router-dom";

export default function FavouriteColumn() {
  const formatPrice = useFormatPrice();
  const favouritesQuery = useFavourites();
  const favouriteActions = useFavouriteActions(() => {
    void favouritesQuery.reload();
  });

  return (
    <div>
      {favouriteActions.removeFavouriteConfirmDialog}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl">Favourites</h2>
        <Link
          to="/favourites"
          className="text-[0.6875rem] uppercase tracking-[0.12em]"
        >
          View all
        </Link>
      </div>
      {favouritesQuery.isPending ? <Skeleton className="mt-4 h-40" /> : null}
      {favouritesQuery.isError ? (
        <div className="mt-4">
          <Empty title="Favourites could not be loaded." />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void favouritesQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {favouritesQuery.data && favouritesQuery.data.length === 0 ? (
        <div className="mt-4">
          <Empty
            title="No favourites yet."
            action={{ href: "/", label: "Browse products" }}
          />
        </div>
      ) : null}
      <ul className="mt-4 space-y-3">
        {(favouritesQuery.data ?? []).map((product) => (
          <li key={product.id} className="border border-line p-4">
            <Link
              to={`/products/${product.id}`}
              className="font-display text-xl"
            >
              {product.name}
            </Link>
            <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
              {product.tenant_name}
            </p>
            <p className="mt-2 text-sm tabular-nums">
              {formatPrice(product.price)}
            </p>
            <button
              type="button"
              className="interactive-muted mt-3 text-[0.6875rem] uppercase tracking-[0.12em]"
              onClick={() => favouriteActions.toggleFavourite(product, true)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
