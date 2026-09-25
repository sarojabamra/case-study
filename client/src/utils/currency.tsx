import { createContext, useContext, useState } from "react";

import { type Currency, formatMoney } from "@/utils/money";

const STORAGE_KEY = "shop-currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  format: (amountUsd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStoredCurrency(): Currency {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "INR" ? "INR" : "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => readStoredCurrency());

  function setCurrency(next: Currency) {
    setCurrencyState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function format(amountUsd: number) {
    return formatMoney(amountUsd, currency);
  }

  const currencyContextValue: CurrencyContextValue = {
    currency,
    setCurrency,
    format,
  };

  return <CurrencyContext.Provider value={currencyContextValue}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

export function useFormatPrice() {
  return useCurrency().format;
}
