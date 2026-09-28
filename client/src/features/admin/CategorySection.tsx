import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Field from "@/components/ui/Field";
import Skeleton from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import type { Category } from "@/services/types";
import { categorySchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function CategorySection({
  categories,
  pending,
  failed = false,
  onRetry,
  onCategoryAdded,
}: {
  categories: Category[] | undefined;
  pending: boolean;
  failed?: boolean;
  onRetry?: () => void;
  onCategoryAdded?: () => void;
}) {
  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateCategory(categoryName: string) {
    setIsSaving(true);
    try {
      await api("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName }),
      });
      toastStore.success("Category added");
      categoryForm.reset();
      onCategoryAdded?.();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-3xl">Categories</h2>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start"
        onSubmit={categoryForm.handleSubmit(
          (values) => void handleCreateCategory(values.name),
        )}
        noValidate
      >
        <Field
          className="flex-1"
          label="Category name"
          error={categoryForm.formState.errors.name?.message}
          {...categoryForm.register("name")}
        />
        <Button
          className="sm:mt-7"
          type="submit"
          busy={isSaving}
          busyLabel="Adding…"
        >
          Add category
        </Button>
      </form>
      {pending ? <Skeleton className="mt-6 h-32" /> : null}
      {failed ? (
        <div className="mt-6">
          <Empty title="Categories could not be loaded." />
          {onRetry ? (
            <Button className="mt-4" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
      {!failed && categories && categories.length === 0 ? (
        <div className="mt-6">
          <Empty title="No categories yet. Products need a category before a brand can add them." />
        </div>
      ) : null}
      {!failed && categories && categories.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {categories.map((category) => (
            <li key={category.id} className="py-3">
              {category.name}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
