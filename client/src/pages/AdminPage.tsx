import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api } from "@/services/api";
import type { Category, StaffUser, TenantSummary } from "@/services/types";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Confirm";
import { Empty } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { toastFailure, toastStore } from "@/utils/toast";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";
import { FormMessage } from "@/components/FormMessage";
import { BrandSheet, CategorySection, StaffSheet } from "@/pages/AdminForms";

type AdminSection = "brands" | "staff" | "categories";

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = (searchParams.get("section") as AdminSection | null) ?? "brands";
  const selectedBrandName = searchParams.get("brand") ?? "";
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [brandPendingRemoval, setBrandPendingRemoval] = useState<TenantSummary | null>(null);
  const [staffMemberPendingRemoval, setStaffMemberPendingRemoval] = useState<StaffUser | null>(null);
  const [isDeletingBrand, setIsDeletingBrand] = useState(false);
  const [staffActionError, setStaffActionError] = useState<string | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  const loadTenants = useCallback(() => api<TenantSummary[]>("/admin/tenants"), []);
  const loadStaff = useCallback(() => {
    if (selectedBrandName) {
      return api<StaffUser[]>(`/admin/tenants/${encodeURIComponent(selectedBrandName)}/users`);
    }
    return api<StaffUser[]>("/admin/users");
  }, [selectedBrandName]);
  const loadCategories = useCallback(() => api<Category[]>("/products/categories"), []);

  const tenantsQuery = useLoadData(loadTenants);
  const staffQuery = useLoadData(loadStaff, { enabled: activeSection === "staff" });
  const categoriesQuery = useLoadData(loadCategories, { enabled: activeSection === "categories" });

  useDocumentTitle("Admin · E-commerce");

  function openAdminSection(nextSection: AdminSection, brandName = selectedBrandName) {
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
      await api<void>(`/admin/tenants/${encodeURIComponent(tenant.name)}`, { method: "DELETE" });
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
      await api<void>(`/admin/tenants/${encodeURIComponent(brandName)}/users/${member.id}`, { method: "DELETE" });
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

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-olive px-4 py-3 text-sm text-canvas">
        Restricted access. Platform admin only.
      </div>
      <div className="mt-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Administration</p>
        <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">Platform administration</h1>
        <p className="mt-3 max-w-2xl text-muted">Manage brands, the people who run them, and product categories.</p>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {(["brands", "staff", "categories"] as const).map((sectionName) => (
          <button
            key={sectionName}
            type="button"
            className={adminTabButtonClass(activeSection === sectionName)}
            onClick={() => openAdminSection(sectionName)}
          >
            {sectionName === "categories" ? "Categories" : sectionName === "staff" ? "Staff" : "Brands"}
          </button>
        ))}
      </div>

      {activeSection === "brands" ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl">Brands</h2>
            <Button onClick={() => setIsAddBrandOpen(true)}>Add brand</Button>
          </div>
          {tenantsQuery.isPending ? <Skeleton className="mt-6 h-48" /> : null}
          {tenantsQuery.isError ? (
            <div className="mt-6">
              <Empty title="Brands could not be loaded." />
              <Button className="mt-4" variant="secondary" onClick={() => void tenantsQuery.reload()}>Try again</Button>
            </div>
          ) : null}
          {tenantsQuery.data && tenantsQuery.data.length === 0 ? (
            <div className="mt-6"><Empty title="No brands yet." /></div>
          ) : null}
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {(tenantsQuery.data ?? []).map((tenant) => (
              <li key={tenant.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-2xl">{tenant.name}</p>
                  <p className="mt-1 text-sm text-muted">{tenant.product_count} products · {tenant.staff_count} staff</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => openAdminSection("staff", tenant.name)}>View staff</Button>
                  <Button variant="danger" onClick={() => setBrandPendingRemoval(tenant)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeSection === "staff" ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">{selectedBrandName ? `${selectedBrandName} staff` : "Staff"}</h2>
              <label className="mt-3 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">
                Brand
                <select
                  className="mt-2 block border border-line-strong bg-canvas px-3 py-3 text-sm normal-case"
                  value={selectedBrandName}
                  onChange={(event) => {
                    setStaffActionError(null);
                    openAdminSection("staff", event.target.value);
                  }}
                >
                  <option value="">All brands</option>
                  {(tenantsQuery.data ?? []).map((tenant) => (
                    <option key={tenant.id} value={tenant.name}>{tenant.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              onClick={() => {
                if (!selectedBrandName) {
                  setStaffActionError("Choose a brand before adding staff.");
                  return;
                }
                setStaffActionError(null);
                setIsAddStaffOpen(true);
              }}
            >
              Add staff
            </Button>
          </div>
          <FormMessage message={staffActionError} />
          {staffQuery.isPending ? <Skeleton className="mt-6 h-40" /> : null}
          {staffQuery.isError ? (
            <div className="mt-6">
              <Empty title="Staff could not be loaded." />
              <Button className="mt-4" variant="secondary" onClick={() => void staffQuery.reload()}>Try again</Button>
            </div>
          ) : null}
          {staffQuery.data && staffQuery.data.length === 0 ? (
            <div className="mt-6">
              <Empty title={selectedBrandName ? "No staff for this brand yet." : "No brand staff yet."} />
            </div>
          ) : null}
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {(staffQuery.data ?? []).map((staffMember) => (
              <li key={staffMember.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-display text-2xl">{staffMember.username}</p>
                  <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
                    {staffMember.tenant_name ?? "Unassigned brand"} · {staffMember.role ?? "TENANT"}
                  </p>
                </div>
                <Button variant="danger" onClick={() => setStaffMemberPendingRemoval(staffMember)}>Remove</Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeSection === "categories" ? (
        <CategorySection
          categories={categoriesQuery.data}
          pending={categoriesQuery.isPending}
          failed={categoriesQuery.isError}
          onRetry={() => void categoriesQuery.reload()}
          onCategoryAdded={handleAdminDataChanged}
        />
      ) : null}

      <BrandSheet open={isAddBrandOpen} onClose={() => setIsAddBrandOpen(false)} onBrandCreated={handleAdminDataChanged} />
      <StaffSheet open={isAddStaffOpen} brand={selectedBrandName} onClose={() => setIsAddStaffOpen(false)} onStaffCreated={handleAdminDataChanged} />
      <Confirm
        open={brandPendingRemoval !== null}
        title="Remove brand"
        body={brandPendingRemoval ? `Remove ${brandPendingRemoval.name}? Staff and products linked to it may stop working.` : ""}
        confirmLabel="Remove brand"
        destructive
        busy={isDeletingBrand}
        onConfirm={() => {
          if (brandPendingRemoval) {
            void handleDeleteBrand(brandPendingRemoval);
          }
        }}
        onClose={() => setBrandPendingRemoval(null)}
      />
      <Confirm
        open={staffMemberPendingRemoval !== null}
        title="Remove staff"
        body={
          staffMemberPendingRemoval
            ? `Remove ${staffMemberPendingRemoval.username} from ${staffMemberPendingRemoval.tenant_name ?? selectedBrandName}? They will no longer be able to manage this brand.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        busy={isDeletingStaff}
        onConfirm={() => {
          if (staffMemberPendingRemoval) {
            void handleDeleteStaff(staffMemberPendingRemoval);
          }
        }}
        onClose={() => setStaffMemberPendingRemoval(null)}
      />
    </div>
  );
}

function adminTabButtonClass(isActive: boolean) {
  return isActive
    ? "cursor-pointer border border-accent bg-accent px-3 py-2 text-sm text-white transition-colors"
    : "interactive-surface border border-line-strong px-3 py-2 text-sm";
}
