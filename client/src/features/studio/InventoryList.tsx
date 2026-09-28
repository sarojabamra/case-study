import { stockLabel } from "@/utils/stock";
import type { useStudioPage } from "./useStudioPage";

type Props = Pick<ReturnType<typeof useStudioPage>, "formatPrice" | "setProductEditorState" | "setProductForStockUpdate" | "setProductPendingRemoval" | "filteredProductsOnPage">;

export default function InventoryList({ formatPrice, setProductEditorState, setProductForStockUpdate, setProductPendingRemoval, filteredProductsOnPage }: Props) {
  return (filteredProductsOnPage.length > 0 ? (
    <>
      <div className="mt-6 hidden overflow-x-auto border border-line md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">In stock</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductsOnPage.map((product) => (
              <tr
                key={product.id}
                className="border-b border-line last:border-0"
              >
                <td className="px-4 py-4 font-display text-xl">
                  {product.name}
                </td>
                <td className="px-4 py-4">{product.category_name}</td>
                <td className="px-4 py-4 tabular-nums">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-4">
                  {stockLabel(product.quantity).text}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="interactive-muted uppercase tracking-[0.08em]"
                      onClick={() => setProductForStockUpdate(product)}
                    >
                      Update stock
                    </button>
                    <button
                      type="button"
                      className="interactive-muted uppercase tracking-[0.08em]"
                      onClick={() => setProductEditorState(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="interactive-muted uppercase tracking-[0.08em] text-danger"
                      onClick={() => setProductPendingRemoval(product)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-6 space-y-4 md:hidden">
        {filteredProductsOnPage.map((product) => (
          <li key={product.id} className="border border-line p-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
              {product.category_name}
            </p>
            <p className="mt-1 font-display text-2xl">{product.name}</p>
            <p className="mt-2 text-sm tabular-nums">
              {formatPrice(product.price)} ·{" "}
              {stockLabel(product.quantity).text}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-[0.08em]">
              <button
                type="button"
                className="interactive-muted"
                onClick={() => setProductForStockUpdate(product)}
              >
                Update stock
              </button>
              <button
                type="button"
                className="interactive-muted"
                onClick={() => setProductEditorState(product)}
              >
                Edit
              </button>
              <button
                type="button"
                className="interactive-muted text-danger"
                onClick={() => setProductPendingRemoval(product)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  ) : null);
}
