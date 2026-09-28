import SystemState from "@/components/ui/SystemState";
import AuthLayout from "@/features/auth/AuthLayout";
import CredentialsForm from "@/features/auth/CredentialsForm";
import { api } from "@/services/api";
import type { Brand } from "@/services/types";
import { useAuth } from "@/utils/authSession";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

export default function BrandLoginPage() {
  const params = useParams();
  const tenantNameFromUrl = params.tenant ?? "";
  const { login } = useAuth();
  const navigate = useNavigate();
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);
  const brandsQuery = useLoadData(loadBrands);

  const matchingBrand = (brandsQuery.data ?? []).find(
    (brand) =>
      brand.name.localeCompare(tenantNameFromUrl, undefined, {
        sensitivity: "accent",
      }) === 0,
  );

  useDocumentTitle(
    `${matchingBrand?.name ?? tenantNameFromUrl} login · E-commerce`,
  );

  useEffect(() => {
    if (matchingBrand && matchingBrand.name !== tenantNameFromUrl) {
      navigate(`/${encodeURIComponent(matchingBrand.name)}/login`, {
        replace: true,
      });
    }
  }, [matchingBrand, navigate, tenantNameFromUrl]);

  async function handleBrandStaffLoginSubmit(credentials: {
    username: string;
    password: string;
  }) {
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
      <p className="mb-6 text-sm text-muted">
        This signs you into {matchingBrand?.name ?? tenantNameFromUrl} only.
      </p>
      <CredentialsForm
        submitLabel="Log in"
        busyLabel="Signing in…"
        passwordAutoComplete="current-password"
        onSubmit={handleBrandStaffLoginSubmit}
      />
      <p className="mt-6 text-sm">
        Shopping instead?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Customer login
        </Link>
      </p>
    </AuthLayout>
  );
}
