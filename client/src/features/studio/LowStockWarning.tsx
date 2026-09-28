import type { useStudioPage } from "./useStudioPage";

type Props = Pick<ReturnType<typeof useStudioPage>, "brandName" | "setProductForStockUpdate" | "lowStockQuery">;

export default function LowStockWarning({ brandName, setProductForStockUpdate, lowStockQuery }: Props) {
  return (lowStockQuery.isSuccess &&
    lowStockQuery.data &&
    lowStockQuery.data.length > 0 ? (
    <section
      aria-label="Low stock warning"
      role="status"
      className="mt-6 border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <h2 className="text-sm font-semibold">Low stock — restock needed</h2>
      <p className="mt-1 text-sm">
        {lowStockQuery.data.length}{" "}
        {lowStockQuery.data.length === 1 ? "product has" : "products have"}{" "}
        fewer than 5 units across {brandName}.
      </p>
      <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
        {lowStockQuery.data.map((product) => (
          <li
            key={product.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>
              <span className="font-medium">{product.name}</span> ·{" "}
              {product.quantity <= 0
                ? "Out of stock"
                : `Only ${product.quantity} left`}
            </span>
            <button
              type="button"
              className="shrink-0 underline underline-offset-4"
              aria-label={`Update stock for ${product.name}`}
              onClick={() => setProductForStockUpdate(product)}
            >
              Update stock
            </button>
          </li>
        ))}
      </ul>
    </section>
  ) : null);
}
