import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "@/services/api";
import type { Category } from "@/services/types";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Sheet } from "@/components/Modal";
import { Empty } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { brandSchema, categorySchema, staffSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";

export function BrandSheet({
  open,
  onClose,
  onBrandCreated,
}: {
  open: boolean;
  onClose: () => void;
  onBrandCreated?: () => void;
}) {
  const brandForm = useForm({ resolver: zodResolver(brandSchema), defaultValues: { name: "" } });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateBrand(brandName: string) {
    setIsSaving(true);
    try {
      await api("/admin/tenants", { method: "POST", body: JSON.stringify({ name: brandName }) });
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
      <form className="space-y-4" onSubmit={brandForm.handleSubmit((values) => void handleCreateBrand(values.name))} noValidate>
        <Field label="Brand name" error={brandForm.formState.errors.name?.message} {...brandForm.register("name")} />
        <p className="text-sm text-muted">The name is used in the brand login address.</p>
        <Button type="submit" busy={isSaving} busyLabel="Saving…">Add brand</Button>
      </form>
    </Sheet>
  );
}

export function StaffSheet({
  open,
  brand,
  onClose,
  onStaffCreated,
}: {
  open: boolean;
  brand: string;
  onClose: () => void;
  onStaffCreated?: () => void;
}) {
  const staffForm = useForm({ resolver: zodResolver(staffSchema), defaultValues: { username: "", password: "" } });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateStaff(credentials: { username: string; password: string }) {
    setIsSaving(true);
    try {
      await api(`/admin/tenants/${encodeURIComponent(brand)}/users`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      toastStore.success("Staff account created");
      staffForm.reset();
      onStaffCreated?.();
      onClose();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} title="Add staff" onClose={onClose}>
      <p className="mb-4 text-sm text-muted">
        This person can manage {brand} and can also shop with customer login. Usernames are unique across the platform.
      </p>
      <form className="space-y-4" onSubmit={staffForm.handleSubmit((values) => void handleCreateStaff(values))} noValidate>
        <Field label="Username" autoComplete="off" error={staffForm.formState.errors.username?.message} {...staffForm.register("username")} />
        <Field label="Password" type="password" autoComplete="new-password" error={staffForm.formState.errors.password?.message} {...staffForm.register("password")} />
        <Button type="submit" busy={isSaving} busyLabel="Saving…">Add staff</Button>
      </form>
    </Sheet>
  );
}

export function CategorySection({
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
  const categoryForm = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: "" } });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateCategory(categoryName: string) {
    setIsSaving(true);
    try {
      await api("/admin/categories", { method: "POST", body: JSON.stringify({ name: categoryName }) });
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
        onSubmit={categoryForm.handleSubmit((values) => void handleCreateCategory(values.name))}
        noValidate
      >
        <Field className="flex-1" label="Category name" error={categoryForm.formState.errors.name?.message} {...categoryForm.register("name")} />
        <Button className="sm:mt-7" type="submit" busy={isSaving} busyLabel="Adding…">Add category</Button>
      </form>
      {pending ? <Skeleton className="mt-6 h-32" /> : null}
      {failed ? (
        <div className="mt-6">
          <Empty title="Categories could not be loaded." />
          {onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button> : null}
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
            <li key={category.id} className="py-3">{category.name}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
