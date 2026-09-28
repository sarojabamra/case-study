import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppErrorBoundary from "@/components/ui/AppErrorBoundary";
import ToastViewport from "@/components/ui/ToastViewport";
import "@/index.css";
import { AppRoutes } from "@/routes";
import { AuthProvider } from "@/utils/authSession";
import { CartProvider } from "@/utils/cart";
import { CurrencyProvider } from "@/utils/currency";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <CurrencyProvider>
              <ToastViewport />
              <AppRoutes />
            </CurrencyProvider>
          </CartProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
