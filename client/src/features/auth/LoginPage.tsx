import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import AuthLayout from "@/features/auth/AuthLayout";
import CredentialsForm from "@/features/auth/CredentialsForm";
import { api, ApiError } from "@/services/api";
import type { Brand } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { destinationAfterLogin } from "@/utils/routeGuards";
import { brandSchema } from "@/utils/schemas";
import { useDocumentTitle } from "@/utils/title";
import { toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isBrandLoginExpanded, setIsBrandLoginExpanded] = useState(false);
  const prefilledUsername =
    (location.state as { username?: string } | null)?.username ?? "";
  const brandNameForm = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "" },
  });
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);
  const brandsQuery = useLoadData(loadBrands, {
    enabled: isBrandLoginExpanded,
    showErrorToast: false,
  });

  useDocumentTitle("Log in · E-commerce");

  async function handleShopperLoginSubmit(credentials: {
    username: string;
    password: string;
  }) {
    try {
      const signedInUser = await login(credentials);
      navigate(
        destinationAfterLogin(signedInUser.role, searchParams.get("next")),
        { replace: true },
      );
    } catch (error) {
      toastStore.failure(
        error instanceof ApiError
          ? error.message
          : "Sign-in failed. Check your username and password.",
      );
    }
  }

  function navigateToBrandLoginPage(formValues: { name: string }) {
    if (!brandsQuery.data) {
      toastStore.failure("The brand list could not be loaded.");
      return;
    }
    const enteredBrandName = formValues.name.toLowerCase();
    const matchingBrand = brandsQuery.data.find(
      (brand) => brand.name.toLowerCase() === enteredBrandName,
    );
    if (!matchingBrand) {
      brandNameForm.setError("name", { message: "That brand does not exist." });
      return;
    }
    navigate(`/${encodeURIComponent(matchingBrand.name)}/login`);
  }

  return (
    <AuthLayout
      eyebrow="Private client"
      title="Log in"
      aside="Shoppers, brand staff, and admins use this door to enter the store."
    >
      <CredentialsForm
        defaultUsername={prefilledUsername}
        submitLabel="Log in"
        busyLabel="Signing in…"
        passwordAutoComplete="current-password"
        onSubmit={handleShopperLoginSubmit}
      />
      <p className="mt-6 text-sm">
        New here?{" "}
        <Link to="/signup" className="underline underline-offset-4">
          Create an account
        </Link>
      </p>
      <button
        type="button"
        className="interactive-muted mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] underline underline-offset-4"
        onClick={() => setIsBrandLoginExpanded((expanded) => !expanded)}
      >
        Brand staff? Open your brand login
      </button>
      {isBrandLoginExpanded ? (
        <form
          className="mt-4 space-y-4 border border-line bg-surface p-4"
          onSubmit={brandNameForm.handleSubmit(navigateToBrandLoginPage)}
          noValidate
        >
          <Field
            label="Brand name"
            autoComplete="organization"
            error={brandNameForm.formState.errors.name?.message}
            {...brandNameForm.register("name")}
          />
          <Button type="submit" variant="secondary">
            Continue
          </Button>
        </form>
      ) : null}
    </AuthLayout>
  );
}
