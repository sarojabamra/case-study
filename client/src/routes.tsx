import { Navigate, Route, Routes } from "react-router-dom";

import StoreShell from "@/components/layout/StoreShell";
import AccountPage from "@/features/account/AccountPage";
import AdminPage from "@/features/admin/AdminPage";
import BrandLoginPage from "@/features/auth/BrandLoginPage";
import LoginPage from "@/features/auth/LoginPage";
import SignupPage from "@/features/auth/SignupPage";
import CartPage from "@/features/cart/CartPage";
import BrandsPage from "@/features/catalogue/BrandsPage";
import CataloguePage from "@/features/catalogue/CataloguePage";
import ProductPage from "@/features/catalogue/ProductPage";
import NotFoundPage from "@/features/errors/NotFoundPage";
import FavouritesPage from "@/features/orders/FavouritesPage";
import OrderDetailPage from "@/features/orders/OrderDetailPage";
import OrdersPage from "@/features/orders/OrdersPage";
import StudioOrdersPage from "@/features/studio/StudioOrdersPage";
import StudioPage from "@/features/studio/StudioPage";
import { RequireAdmin, RequireTenant } from "@/utils/routeGuards";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreShell />}>
        <Route index element={<CataloguePage />} />
        <Route path="products/:productId" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="favourites" element={<FavouritesPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path=":tenant/login" element={<BrandLoginPage />} />
        <Route path=":tenant/studio" element={<RequireTenant><StudioPage /></RequireTenant>} />
        <Route path=":tenant/studio/orders" element={<RequireTenant><StudioOrdersPage /></RequireTenant>} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
