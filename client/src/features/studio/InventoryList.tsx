import type { Product } from "@/services/types";
import { stockLabel } from "@/utils/stock";

type Props = {
  products: Product[];
  formatPrice: (price: number) => string;
  onEdit: (product: Product) => void;
  onUpdateStock: (product: Product) => void;
  onRemove: (product: Product) => void;
};

export default function InventoryList({
  products,
  formatPrice,
  onEdit,
  onUpdateStock,
  onRemove,
}: Props) {
  if (products.length === 0) {
    return null;
  }

  return (
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
            {products.map((product) => (
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
                      onClick={() => onUpdateStock(product)}
                    >
                      Update stock
                    </button>
                    <button
                      type="button"
                      className="interactive-muted uppercase tracking-[0.08em]"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="interactive-muted uppercase tracking-[0.08em] text-danger"
                      onClick={() => onRemove(product)}
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
        {products.map((product) => (
          <li key={product.id} className="border border-line p-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
              {product.category_name}
            </p>
            <p className="mt-1 font-display text-2xl">{product.name}</p>
            <p className="mt-2 text-sm tabular-nums">
              {formatPrice(product.price)} · {stockLabel(product.quantity).text}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-[0.08em]">
              <button
                type="button"
                className="interactive-muted"
                onClick={() => onUpdateStock(product)}
              >
                Update stock
              </button>
              <button
                type="button"
                className="interactive-muted"
                onClick={() => onEdit(product)}
              >
                Edit
              </button>
              <button
                type="button"
                className="interactive-muted text-danger"
                onClick={() => onRemove(product)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
