import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import Stepper from "@/components/ui/Stepper";
import { useStudioProductActions } from "@/features/studio/useStudioProducts";
import type { Product } from "@/services/types";
import { stockSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const stockFormSchema = z.object({ quantity: stockSchema });

export default function StockSheet({
  brand,
  product,
  onClose,
  onStockUpdated,
}: {
  brand: string;
  product: Product | null;
  onClose: () => void;
  onStockUpdated?: () => void;
}) {
  const { updateProduct } = useStudioProductActions(brand);
  const stockForm = useForm<{ quantity: string; }>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: { quantity: "" },
  });
  const [isSaving, setIsSaving] = useState(false);
  const { reset } = stockForm;

  useEffect(() => {
    if (product) {
      reset({ quantity: String(product.quantity) });
    }
  }, [product, reset]);

  async function handleUpdateStock(quantity: string) {
    if (!product) {
      return;
    }
    setIsSaving(true);
    try {
      await updateProduct(product.id, { quantity: Number(quantity) });
      toastStore.success("Stock updated");
      onStockUpdated?.();
      onClose();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSaving(false);
    }
  }

  const currentQuantity = Number(stockForm.watch("quantity") || 0);

  return (
    <Sheet open={product !== null} title="Update stock" onClose={onClose}>
      <p className="text-sm text-muted">{product?.name}</p>
      <form
        className="mt-4 space-y-4"
        onSubmit={stockForm.handleSubmit(
          (values) => void handleUpdateStock(values.quantity),
        )}
        noValidate
      >
        <Stepper
          min={0}
          max={100000}
          value={Number.isNaN(currentQuantity) ? 0 : currentQuantity}
          onChange={(value) =>
            stockForm.setValue("quantity", String(value), {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          label="Stock"
        />
        {stockForm.formState.errors.quantity?.message ? (
          <p role="alert" className="text-sm text-danger">
            {stockForm.formState.errors.quantity.message}
          </p>
        ) : null}
        <Button
          className="ms-2"
          type="submit"
          busy={isSaving}
          busyLabel="Saving…"
        >
          Update stock
        </Button>
      </form>
    </Sheet>
  );
}
