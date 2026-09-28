import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import AuthLayout from "@/features/auth/AuthLayout";
import { api } from "@/services/api";
import type { SignupResult } from "@/services/types";
import { signupSchema } from "@/utils/schemas";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure, toastStore } from "@/utils/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Link,
  useNavigate
} from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  useDocumentTitle("Sign up · E-commerce");
  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", username: "", password: "" },
  });

  async function handleSignupSubmit(values: {
    full_name: string;
    username: string;
    password: string;
  }) {
    try {
      await api<SignupResult>("/auth/signup", {
        method: "POST",
        auth: false,
        body: JSON.stringify(values),
      });
      toastStore.success("Account created", "Log in to continue.");
      navigate("/login", { state: { username: values.username } });
    } catch (error) {
      toastFailure(error);
    }
  }

  return (
    <AuthLayout
      eyebrow="Patron ledger"
      title="Create your account"
      aside="Usernames are unique. After sign-up, you log in to shop."
    >
      <form
        className="space-y-5"
        onSubmit={signupForm.handleSubmit(handleSignupSubmit)}
        noValidate
      >
        <Field
          label="Full name"
          autoComplete="name"
          error={signupForm.formState.errors.full_name?.message}
          {...signupForm.register("full_name")}
        />
        <Field
          label="Username"
          autoComplete="username"
          hint="Usernames are unique."
          error={signupForm.formState.errors.username?.message}
          {...signupForm.register("username")}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          error={signupForm.formState.errors.password?.message}
          {...signupForm.register("password")}
        />
        <Button
          type="submit"
          busy={signupForm.formState.isSubmitting}
          busyLabel="Creating account…"
          className="w-full"
        >
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
