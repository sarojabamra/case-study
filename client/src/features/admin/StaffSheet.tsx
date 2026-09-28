import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import { api } from "@/services/api";
import { staffSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function StaffSheet({
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
  const staffForm = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: { username: "", password: "" },
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateStaff(credentials: {
    username: string;
    password: string;
  }) {
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
        This person can manage {brand} and can also shop with customer login.
        Usernames are unique across the platform.
      </p>
      <form
        className="space-y-4"
        onSubmit={staffForm.handleSubmit(
          (values) => void handleCreateStaff(values),
        )}
        noValidate
      >
        <Field
          label="Username"
          autoComplete="off"
          error={staffForm.formState.errors.username?.message}
          {...staffForm.register("username")}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          error={staffForm.formState.errors.password?.message}
          {...staffForm.register("password")}
        />
        <Button type="submit" busy={isSaving} busyLabel="Saving…">
          Add staff
        </Button>
      </form>
    </Sheet>
  );
}
