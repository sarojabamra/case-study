import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { roleLabel } from "@/features/account/accountForms";
import type { useAccount } from "./useAccount";

type Props = Pick<ReturnType<typeof useAccount>, "user" | "profileForm" | "handleSaveProfile">;

export default function ProfileSection({ user, profileForm, handleSaveProfile }: Props) {
  if (!user) return null;
  return (<section className="mt-10 border border-line bg-surface p-5">
    <h2 className="font-display text-2xl">Profile</h2>
    <form
      className="mt-6 space-y-4"
      onSubmit={profileForm.handleSubmit(
        (values) => void handleSaveProfile(values),
      )}
      noValidate
    >
      <Field
        label="Username"
        value={user.username}
        readOnly
        disabled
        className="opacity-80"
      />
      <Field
        label="Full name"
        autoComplete="name"
        error={profileForm.formState.errors.full_name?.message}
        {...profileForm.register("full_name")}
      />
      <p className="text-sm text-muted">
        {roleLabel[user.role]}
        {user.tenant_name ? ` · ${user.tenant_name}` : ""}
      </p>
      <Button
        type="submit"
        busy={profileForm.formState.isSubmitting}
        busyLabel="Saving…"
      >
        Save profile
      </Button>
    </form>
  </section>);
}
