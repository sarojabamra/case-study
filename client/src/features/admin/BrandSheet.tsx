import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import { api } from "@/services/api";
import { brandSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function BrandSheet({
  open,
  onClose,
  onBrandCreated,
}: {
  open: boolean;
  onClose: () => void;
  onBrandCreated?: () => void;
}) {
  const brandForm = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "" },
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateBrand(brandName: string) {
    setIsSaving(true);
    try {
      await api("/admin/tenants", {
        method: "POST",
        body: JSON.stringify({ name: brandName }),
      });
      toastStore.success("Brand created");
      brandForm.reset();
      onBrandCreated?.();
      onClose();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} title="Add brand" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={brandForm.handleSubmit(
          (values) => void handleCreateBrand(values.name),
        )}
        noValidate
      >
        <Field
          label="Brand name"
          error={brandForm.formState.errors.name?.message}
          {...brandForm.register("name")}
        />
        <p className="text-sm text-muted">
          The name is used in the brand login address.
        </p>
        <Button type="submit" busy={isSaving} busyLabel="Saving…">
          Add brand
        </Button>
      </form>
    </Sheet>
  );
}
