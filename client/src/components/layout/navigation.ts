import type { Me } from "@/services/types";

export const roleLabel = {
  USER: "Shopper",
  TENANT: "Brand",
  ADMIN: "Admin",
} as const;

export function catalogueNavLinkClass(isActive: boolean) {
  return isActive ? "text-sm font-medium text-ink underline underline-offset-4" : "text-sm text-muted hover:text-ink";
}

export function mobileNavLinkClass(isActive: boolean) {
  return `block py-3 text-base ${isActive ? "font-medium text-ink" : "text-ink"}`;
}

export function getStaffPortalLink(user: Me) {
  if (user.role === "ADMIN") {
    return { to: "/admin", label: "Admin console" };
  }
  if (user.role === "TENANT" && user.tenant_name) {
    return {
      to: `/${encodeURIComponent(user.tenant_name)}/studio`,
      label: `${user.tenant_name} studio`,
    };
  }
  return null;
}

export function staffPortalButtonClass(isActive: boolean) {
  return isActive
    ? "cursor-pointer border border-ink bg-ink px-3 py-1.5 text-sm font-medium text-canvas transition-colors"
    : "interactive-surface border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink";
}

export function userDisplayName(user: Me) {
  const name = user.full_name?.trim();
  return name || user.username;
}

export function userInitials(displayName: string) {
  const parts = displayName.trim().split(/[\s._'-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const word = parts[0] ?? displayName;
  return word.slice(0, 2).toUpperCase();
}

export function userRoleLine(user: Me) {
  return `${roleLabel[user.role]}${user.tenant_name ? ` · ${user.tenant_name}` : ""}`;
}

export const profileDropdownItemClass =
  "block w-full rounded-sm px-2 py-2 text-left text-sm text-ink transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
