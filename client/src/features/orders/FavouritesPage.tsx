import FavouritesGrid from "@/features/orders/FavouritesGrid";
import { RequireAuth } from "@/utils/routeGuards";

export default function FavouritesPage() {
  return (
    <RequireAuth>
      <FavouritesGrid />
    </RequireAuth>
  );
}
