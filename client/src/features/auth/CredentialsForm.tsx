import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { credentialsSchema } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function CredentialsForm({
  defaultUsername = "",
  submitLabel,
  busyLabel,
  passwordAutoComplete,
  usernameHint,
  onSubmit,
}: {
  defaultUsername?: string;
  submitLabel: string;
  busyLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  usernameHint?: string;
  onSubmit: (values: { username: string; password: string; }) => Promise<void>;
}) {
  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { username: defaultUsername, password: "" },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={credentialsForm.handleSubmit(onSubmit)}
      noValidate
    >
      <Field
        label="Username"
        autoComplete="username"
        hint={usernameHint}
        error={credentialsForm.formState.errors.username?.message}
        {...credentialsForm.register("username")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete={passwordAutoComplete}
        error={credentialsForm.formState.errors.password?.message}
        {...credentialsForm.register("password")}
      />
      <Button
        type="submit"
        busy={credentialsForm.formState.isSubmitting}
        busyLabel={busyLabel}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
