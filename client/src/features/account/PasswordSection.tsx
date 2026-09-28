import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import type { useAccount } from "./useAccount";

type Props = Pick<ReturnType<typeof useAccount>, "passwordForm" | "handleChangePassword">;

export default function PasswordSection({ passwordForm, handleChangePassword }: Props) {
  return (<section className="mt-8 border border-line bg-surface p-5">
    <h2 className="font-display text-2xl">Password</h2>
    <p className="mt-2 text-sm text-muted">
      Enter your current password, then choose a new one.
    </p>
    <form
      className="mt-6 space-y-4"
      onSubmit={passwordForm.handleSubmit(
        (values) => void handleChangePassword(values),
      )}
      noValidate
    >
      <Field
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={passwordForm.formState.errors.current_password?.message}
        {...passwordForm.register("current_password")}
      />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        error={passwordForm.formState.errors.new_password?.message}
        {...passwordForm.register("new_password")}
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={passwordForm.formState.errors.confirm_new_password?.message}
        {...passwordForm.register("confirm_new_password")}
      />
      <Button
        type="submit"
        busy={passwordForm.formState.isSubmitting}
        busyLabel="Updating…"
      >
        Update password
      </Button>
    </form>
  </section>);
}
