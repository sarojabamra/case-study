import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/services/api";
import type { Brand, SignupResult } from "@/services/types";
import { destinationAfterLogin } from "@/utils/routeGuards";
import { useAuth } from "@/utils/authSession";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { SystemState } from "@/components/SystemState";
import { brandSchema, credentialsSchema, signupSchema } from "@/utils/schemas";
import { toastFailure, toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

function CredentialsForm({
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
  onSubmit: (values: { username: string; password: string }) => Promise<void>;
}) {
  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { username: defaultUsername, password: "" },
  });

  return (
    <form className="space-y-5" onSubmit={credentialsForm.handleSubmit(onSubmit)} noValidate>
      <Field label="Username" autoComplete="username" hint={usernameHint} error={credentialsForm.formState.errors.username?.message} {...credentialsForm.register("username")} />
      <Field label="Password" type="password" autoComplete={passwordAutoComplete} error={credentialsForm.formState.errors.password?.message} {...credentialsForm.register("password")} />
      <Button type="submit" busy={credentialsForm.formState.isSubmitting} busyLabel={busyLabel} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

function AuthLayout({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  aside: string;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 md:px-10 lg:grid-cols-2">
      <section>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-5xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </section>
      <aside className="hidden border border-line bg-surface p-8 lg:block">
        <p className="font-display text-3xl leading-snug">{aside}</p>
      </aside>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  useDocumentTitle("Sign up · E-commerce");
  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", username: "", password: "" },
  });

  async function handleSignupSubmit(values: { full_name: string; username: string; password: string }) {
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
    <AuthLayout eyebrow="Patron ledger" title="Create your account" aside="Usernames are unique. After sign-up, you log in to shop.">
      <form className="space-y-5" onSubmit={signupForm.handleSubmit(handleSignupSubmit)} noValidate>
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
        <Button type="submit" busy={signupForm.formState.isSubmitting} busyLabel="Creating account…" className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account? <Link to="/login" className="underline underline-offset-4">Log in</Link>
      </p>
    </AuthLayout>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isBrandLoginExpanded, setIsBrandLoginExpanded] = useState(false);
  const prefilledUsername = (location.state as { username?: string } | null)?.username ?? "";
  const brandNameForm = useForm({ resolver: zodResolver(brandSchema), defaultValues: { name: "" } });
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);
  const brandsQuery = useLoadData(loadBrands, { enabled: isBrandLoginExpanded, showErrorToast: false });

  useDocumentTitle("Log in · E-commerce");

  async function handleShopperLoginSubmit(credentials: { username: string; password: string }) {
    try {
      const signedInUser = await login(credentials);
      navigate(destinationAfterLogin(signedInUser.role, searchParams.get("next")), { replace: true });
    } catch (error) {
      toastStore.failure(error instanceof ApiError ? error.message : "Sign-in failed. Check your username and password.");
    }
  }

  function navigateToBrandLoginPage(formValues: { name: string }) {
    if (!brandsQuery.data) {
      toastStore.failure("The brand list could not be loaded.");
      return;
    }
    const matchingBrand = brandsQuery.data.find(
      (brand) => brand.name.localeCompare(formValues.name, undefined, { sensitivity: "accent" }) === 0,
    );
    if (!matchingBrand) {
      brandNameForm.setError("name", { message: "That brand does not exist." });
      return;
    }
    navigate(`/${encodeURIComponent(matchingBrand.name)}/login`);
  }

  return (
    <AuthLayout eyebrow="Private client" title="Log in" aside="Shoppers, brand staff, and admins use this door to enter the store.">
      <CredentialsForm
        defaultUsername={prefilledUsername}
        submitLabel="Log in"
        busyLabel="Signing in…"
        passwordAutoComplete="current-password"
        onSubmit={handleShopperLoginSubmit}
      />
      <p className="mt-6 text-sm">
        New here? <Link to="/signup" className="underline underline-offset-4">Create an account</Link>
      </p>
      <button type="button" className="interactive-muted mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] underline underline-offset-4" onClick={() => setIsBrandLoginExpanded((expanded) => !expanded)}>
        Brand staff? Open your brand login
      </button>
      {isBrandLoginExpanded ? (
        <form
          className="mt-4 space-y-4 border border-line bg-surface p-4"
          onSubmit={brandNameForm.handleSubmit(navigateToBrandLoginPage)}
          noValidate
        >
          <Field label="Brand name" autoComplete="organization" error={brandNameForm.formState.errors.name?.message} {...brandNameForm.register("name")} />
          <Button type="submit" variant="secondary">
            Continue
          </Button>
        </form>
      ) : null}
    </AuthLayout>
  );
}

export function BrandLoginPage() {
  const params = useParams();
  const tenantNameFromUrl = params.tenant ?? "";
  const { login } = useAuth();
  const navigate = useNavigate();
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);
  const brandsQuery = useLoadData(loadBrands);

  const matchingBrand = (brandsQuery.data ?? []).find(
    (brand) => brand.name.localeCompare(tenantNameFromUrl, undefined, { sensitivity: "accent" }) === 0,
  );

  useDocumentTitle(`${matchingBrand?.name ?? tenantNameFromUrl} login · E-commerce`);

  useEffect(() => {
    if (matchingBrand && matchingBrand.name !== tenantNameFromUrl) {
      navigate(`/${encodeURIComponent(matchingBrand.name)}/login`, { replace: true });
    }
  }, [matchingBrand, navigate, tenantNameFromUrl]);

  async function handleBrandStaffLoginSubmit(credentials: { username: string; password: string }) {
    try {
      const brandName = matchingBrand?.name ?? tenantNameFromUrl;
      await login({ ...credentials, tenantName: brandName });
      navigate(`/${encodeURIComponent(brandName)}/studio`, { replace: true });
    } catch (error) {
      toastFailure(error, "Sign-in failed. Check your username and password.");
    }
  }

  if (brandsQuery.isPending) {
    return <p className="px-5 py-16 text-sm text-muted">Loading brand…</p>;
  }

  if (brandsQuery.isError) {
    return (
      <SystemState
        title="The brand list could not be loaded."
        body="Try again in a moment."
        action={{ href: "/brands", label: "Browse brands" }}
      />
    );
  }

  if (brandsQuery.isSuccess && !matchingBrand) {
    return (
      <SystemState
        title="That brand does not exist."
        body="Check the brand name and try again."
        action={{ href: "/brands", label: "Browse brands" }}
      />
    );
  }

  return (
    <AuthLayout
      eyebrow={matchingBrand?.name ?? tenantNameFromUrl}
      title="Brand login"
      aside={`This signs you into ${matchingBrand?.name ?? tenantNameFromUrl} only.`}
    >
      <p className="mb-6 text-sm text-muted">This signs you into {matchingBrand?.name ?? tenantNameFromUrl} only.</p>
      <CredentialsForm
        submitLabel="Log in"
        busyLabel="Signing in…"
        passwordAutoComplete="current-password"
        onSubmit={handleBrandStaffLoginSubmit}
      />
      <p className="mt-6 text-sm">
        Shopping instead? <Link to="/login" className="underline underline-offset-4">Customer login</Link>
      </p>
    </AuthLayout>
  );
}
