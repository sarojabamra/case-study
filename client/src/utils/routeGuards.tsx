import { Navigate, useLocation, useParams } from "react-router-dom";

import { useAuth } from "@/utils/authSession";
import { SystemState } from "@/components/SystemState";
import { safeNext } from "@/utils/schemas";

function brandNamesMatchIgnoringCase(
  leftBrandName: string,
  rightBrandName: string,
) {
  return (
    leftBrandName.localeCompare(rightBrandName, undefined, {
      sensitivity: "accent",
    }) === 0
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <p className="px-5 py-16 text-sm text-muted md:px-10">
        Loading your session…
      </p>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  if (status === "loading") {
    return (
      <p className="px-5 py-16 text-sm text-muted md:px-10">
        Loading your session…
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login?next=/admin" replace />;
  }

  if (user.role !== "ADMIN") {
    return (
      <SystemState
        title="You can’t open this page."
        body="Only a platform admin can open this."
        action={{ href: "/", label: "Back to store" }}
      />
    );
  }

  return children;
}

export function RequireTenant({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const params = useParams();
  const tenantNameFromUrl = params.tenant ?? "";
  const brandLoginPath = `/${encodeURIComponent(tenantNameFromUrl)}/login`;

  if (status === "loading") {
    return (
      <p className="px-5 py-16 text-sm text-muted md:px-10">
        Loading your session…
      </p>
    );
  }

  if (!user) {
    return <Navigate to={brandLoginPath} replace />;
  }

  if (
    user.role !== "TENANT" ||
    !user.tenant_name ||
    !brandNamesMatchIgnoringCase(user.tenant_name, tenantNameFromUrl)
  ) {
    return (
      <SystemState
        title="You can’t open this page."
        body={
          user.tenant_name
            ? `Only ${tenantNameFromUrl} staff can manage this brand. Your studio is ${user.tenant_name}.`
            : "Only brand staff can manage a studio."
        }
        action={{ href: "/", label: "Back to store" }}
        secondary={
          user.tenant_name
            ? {
                href: `/${encodeURIComponent(user.tenant_name)}/studio`,
                label: "Go to your studio",
              }
            : undefined
        }
      />
    );
  }

  if (!(user as any).isBrandStaffLoggedIn) {
    return (
      <SystemState
        title="Brand Studio Access Restricted"
        body="You may be a brand staff member, but please use the brand-specific login to access your studio."
        action={{ href: brandLoginPath, label: "Go to Brand Login" }}
        secondary={{ href: "/", label: "Back to store" }}
      />
    );
  }

  return children;
}

export function destinationAfterLogin(
  role: "USER" | "TENANT" | "ADMIN",
  next: string | null,
) {
  const safe = safeNext(next);
  if (safe) {
    return safe;
  }
  if (role === "ADMIN") {
    return "/admin";
  }
  return "/";
}

