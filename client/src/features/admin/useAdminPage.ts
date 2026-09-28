import { AdminSection } from "@/features/admin/adminNavigation";
import { api } from "@/services/api";
import type { Category, StaffUser, TenantSummary } from "@/services/types";
import { useDocumentTitle } from "@/utils/title";
import { toastFailure, toastStore } from "@/utils/toast";
import { useLoadData } from "@/utils/useLoadData";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection =
    (searchParams.get("section") as AdminSection | null) ?? "brands";

  const selectedBrandName = searchParams.get("brand") ?? "";

  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const [brandPendingRemoval, setBrandPendingRemoval] =
    useState<TenantSummary | null>(null);

  const [staffMemberPendingRemoval, setStaffMemberPendingRemoval] =
    useState<StaffUser | null>(null);

  const [isDeletingBrand, setIsDeletingBrand] = useState(false);

  const [staffActionError, setStaffActionError] = useState<string | null>(null);

  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  const loadTenants = useCallback(
    () => api<TenantSummary[]>("/admin/tenants"),
    [],
  );

  const loadStaff = useCallback(() => {
    if (selectedBrandName) {
      return api<StaffUser[]>(
        `/admin/tenants/${encodeURIComponent(selectedBrandName)}/users`,
      );
    }
    return api<StaffUser[]>("/admin/users");
  }, [selectedBrandName]);

  const loadCategories = useCallback(
    () => api<Category[]>("/products/categories"),
    [],
  );

  const tenantsQuery = useLoadData(loadTenants);

  const staffQuery = useLoadData(loadStaff, {
    enabled: activeSection === "staff",
  });

  const categoriesQuery = useLoadData(loadCategories, {
    enabled: activeSection === "categories",
  });

  useDocumentTitle("Admin · E-commerce");

  function openAdminSection(
    nextSection: AdminSection,
    brandName = selectedBrandName,
  ) {
    const params = new URLSearchParams();
    params.set("section", nextSection);
    if (brandName) {
      params.set("brand", brandName);
    }
    setSearchParams(params);
  }

  async function handleDeleteBrand(tenant: TenantSummary) {
    setIsDeletingBrand(true);
    try {
      await api<void>(`/admin/tenants/${encodeURIComponent(tenant.name)}`, {
        method: "DELETE",
      });
      setBrandPendingRemoval(null);
      if (tenant.name === selectedBrandName) {
        openAdminSection("brands", "");
      }
      toastStore.success("Brand removed");
      await tenantsQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsDeletingBrand(false);
    }
  }

  async function handleDeleteStaff(member: StaffUser) {
    const brandName = member.tenant_name ?? selectedBrandName;
    if (!brandName) {
      toastFailure("This staff member is not linked to a brand.");
      return;
    }
    setIsDeletingStaff(true);
    try {
      await api<void>(
        `/admin/tenants/${encodeURIComponent(brandName)}/users/${member.id}`,
        { method: "DELETE" },
      );
      setStaffMemberPendingRemoval(null);
      toastStore.success("Staff account removed");
      await staffQuery.reload();
      await tenantsQuery.reload();
    } catch (error) {
      toastFailure(error);
    } finally {
      setIsDeletingStaff(false);
    }
  }

  function handleAdminDataChanged() {
    void tenantsQuery.reload();
    void staffQuery.reload();
    void categoriesQuery.reload();
  }
  return {
    activeSection,
    selectedBrandName,
    isAddBrandOpen,
    setIsAddBrandOpen,
    isAddStaffOpen,
    setIsAddStaffOpen,
    brandPendingRemoval,
    setBrandPendingRemoval,
    staffMemberPendingRemoval,
    setStaffMemberPendingRemoval,
    isDeletingBrand,
    staffActionError,
    setStaffActionError,
    isDeletingStaff,
    tenantsQuery,
    staffQuery,
    categoriesQuery,
    openAdminSection,
    handleDeleteBrand,
    handleDeleteStaff,
    handleAdminDataChanged,
  };
}
