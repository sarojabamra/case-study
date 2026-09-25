export type Currency = "USD" | "INR";

/** API prices are stored in USD. */
export const USD_TO_INR = 83;

export function convertFromUsd(amountUsd: number, currency: Currency): number {
  if (currency === "USD") {
    return amountUsd;
  }
  return amountUsd * USD_TO_INR;
}

export function formatMoney(amountUsd: number, currency: Currency): string {
  const value = convertFromUsd(amountUsd, currency);
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(value);
}
