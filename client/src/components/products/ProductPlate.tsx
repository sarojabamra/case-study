import ProductCategoryLabel from "@/components/products/ProductCategoryLabel";
import type { Product } from "@/services/types";
import { productImageSrc } from "@/utils/image";

export default function ProductPlate({ product, className = "" }: { product: Product; className?: string; }) {
  const src = productImageSrc(product);
  if (src) {
    return (
      <div className={`relative aspect-[4/3] w-full overflow-hidden ${className}`}>
        <img src={src} alt={product.name} className="block h-full w-full object-cover" />
        <ProductCategoryLabel name={product.category_name} />
      </div>
    );
  }
  return (
    <div className={`relative aspect-[4/3] w-full bg-surface ${className}`}>
      <ProductCategoryLabel name={product.category_name} />
    </div>
  );
}
