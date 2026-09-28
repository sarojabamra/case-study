import ProductCard from "@/components/products/ProductCard";
import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Skeleton from "@/components/ui/Skeleton";
import type { Product } from "@/services/types";
import { useFavouriteActions, useFavourites } from "@/utils/favourites";
import { useDocumentTitle } from "@/utils/title";

export default function FavouritesGrid() {
  const favouritesQuery = useFavourites();
  const favouriteActions = useFavouriteActions(() => {
    void favouritesQuery.reload();
  });

  useDocumentTitle("Favourites · E-commerce");

  const savedProductIds = new Set(
    (favouritesQuery.data ?? []).map((product: Product) => product.id),
  );

  return (
    <div className="px-5 py-10 md:px-10 lg:px-16">
      {favouriteActions.removeFavouriteConfirmDialog}
      <h1 className="font-display text-4xl font-light">Favourites</h1>
      {favouritesQuery.isPending ? <Skeleton className="mt-6 h-64" /> : null}
      {favouritesQuery.isError ? (
        <div className="mt-6">
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
        <div className="mt-6">
          <Empty
            title="No favourites yet."
            action={{ href: "/", label: "Browse products" }}
          />
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(favouritesQuery.data ?? []).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            saved={savedProductIds.has(product.id)}
            onToggleFavourite={favouriteActions.toggleFavourite}
          />
        ))}
      </div>
    </div>
  );
}
