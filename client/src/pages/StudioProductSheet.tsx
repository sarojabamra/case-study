import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";

import { api } from "@/services/api";
import type { Category, Product } from "@/services/types";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Confirm";
import { Field, SelectField } from "@/components/Field";
import { Sheet } from "@/components/Modal";
import { productImageSrc } from "@/utils/image";
import { productSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SavedProduct = { product: { id: number } };

type ProductValues = {
  name: string;
  price: string;
  quantity: string;
  category_id: string;
};

export function ProductSheet({
  brand,
  product,
  open,
  onClose,
  onProductSaved,
}: {
  brand: string;
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onProductSaved?: () => void;
}) {
  const loadCategories = useCallback(() => api<Category[]>("/products/categories"), []);
  const categoriesQuery = useLoadData(loadCategories, { enabled: open, showErrorToast: false });
  const productForm = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", quantity: "", category_id: "" },
  });
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileError, setImageFileError] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { reset } = productForm;

  useEffect(() => {
    setImageFile(null);
    setImageFileError(null);
    setRemoveExistingImage(false);
    setCreatedProductId(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (!open) {
      return;
    }
    reset(
      product
        ? {
            name: product.name,
            price: String(product.price),
            quantity: String(product.quantity),
            category_id: String(product.category_id),
          }
        : { name: "", price: "", quantity: "", category_id: "" },
    );
  }, [open, product, reset]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  async function handleSaveProduct(values: ProductValues) {
    setIsSaving(true);
    try {
      const requestBody = {
        name: values.name,
        price: Number(values.price),
        quantity: Number(values.quantity),
        category_id: Number(values.category_id),
      };
      let productId = product?.id ?? createdProductId;
      if (productId == null) {
        const saved = await api<SavedProduct>(`/${encodeURIComponent(brand)}/products`, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });
        productId = saved.product.id;
        setCreatedProductId(productId);
      } else {
        await api(`/${encodeURIComponent(brand)}/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(requestBody),
        });
      }
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api(`/${encodeURIComponent(brand)}/products/${productId}/image`, { method: "POST", body: formData });
      } else if (removeExistingImage && product?.has_image) {
        await api(`/${encodeURIComponent(brand)}/products/${productId}/image`, { method: "DELETE" });
      }
      toastStore.success(product ? "Product updated" : "Product added");
      onProductSaved?.();
      onClose();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      setImageFile(null);
      setImageFileError(null);
      return;
    }
    if (selectedFile.size > MAX_IMAGE_BYTES || (selectedFile.type && !IMAGE_TYPES.has(selectedFile.type))) {
      setImageFile(null);
      setImageFileError("Use a JPEG, PNG, or WebP image up to 5 MB.");
      event.target.value = "";
      return;
    }
    setImageFile(selectedFile);
    setImageFileError(null);
    setRemoveExistingImage(false);
  }

  const currentProductImageUrl = product && !removeExistingImage ? productImageSrc(product) : null;

  function requestClose() {
    if (productForm.formState.isDirty || imageFile || removeExistingImage) {
      setDiscardConfirmOpen(true);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet open={open} title={product ? "Edit product" : "Add product"} onClose={requestClose}>
        <form className="space-y-4" onSubmit={productForm.handleSubmit((values) => void handleSaveProduct(values))} noValidate>
          <Field label="Name" error={productForm.formState.errors.name?.message} {...productForm.register("name")} />
          <Field label="Price" inputMode="decimal" error={productForm.formState.errors.price?.message} {...productForm.register("price")} />
          <Field label="Stock" inputMode="numeric" error={productForm.formState.errors.quantity?.message} {...productForm.register("quantity")} />
          <SelectField label="Category" error={productForm.formState.errors.category_id?.message} {...productForm.register("category_id")}>
            <option value="">Choose a category</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <Field
            ref={imageInputRef}
            id="product-image"
            label="Product photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hint="Optional. JPEG, PNG, or WebP up to 5 MB. Shown on the storefront with the category label."
            error={imageFileError ?? undefined}
            onChange={handleImageFileChange}
          />
          {imagePreviewUrl ? <img src={imagePreviewUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
          {!imagePreviewUrl && currentProductImageUrl ? (
            <img src={currentProductImageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : null}
          {product?.has_image ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeExistingImage}
                onChange={(event) => {
                  setRemoveExistingImage(event.target.checked);
                  if (event.target.checked) {
                    setImageFile(null);
                    setImageFileError(null);
                    if (imageInputRef.current) {
                      imageInputRef.current.value = "";
                    }
                  }
                }}
              />
              Remove current image
            </label>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" busy={isSaving} busyLabel="Saving…">
              {product ? "Save changes" : "Add product"}
            </Button>
            <Button variant="secondary" onClick={requestClose}>Cancel</Button>
          </div>
        </form>
      </Sheet>
      <Confirm
        open={discardConfirmOpen}
        title="Discard unsaved changes?"
        body="The product form will close without saving."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          onClose();
        }}
        onClose={() => setDiscardConfirmOpen(false)}
      />
    </>
  );
}
