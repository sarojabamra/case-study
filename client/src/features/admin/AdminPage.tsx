import Confirm from "@/components/ui/Confirm";
import BrandSheet from "@/features/admin/BrandSheet";
import CategorySection from "@/features/admin/CategorySection";
import StaffSheet from "@/features/admin/StaffSheet";
import BrandList from "./BrandList";
import StaffList from "./StaffList";
import { useAdminPage } from "./useAdminPage";

import { adminTabButtonClass } from "@/features/admin/adminNavigation";

export default function AdminPage() {
  const {
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
  } = useAdminPage();

  return (
    <div className="px-5 py-8 md:px-10 lg:px-16">
      <div className="border border-olive bg-olive px-4 py-3 text-sm text-canvas">
        Restricted access. Platform admin only.
      </div>
      <div className="mt-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
          Administration
        </p>
        <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
          Platform administration
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Manage brands, the people who run them, and product categories.
        </p>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {(["brands", "staff", "categories"] as const).map((sectionName) => (
          <button
            key={sectionName}
            type="button"
            className={adminTabButtonClass(activeSection === sectionName)}
            onClick={() => openAdminSection(sectionName)}
          >
            {sectionName === "categories"
              ? "Categories"
              : sectionName === "staff"
                ? "Staff"
                : "Brands"}
          </button>
        ))}
      </div>

      <BrandList
        activeSection={activeSection}
        setIsAddBrandOpen={setIsAddBrandOpen}
        setBrandPendingRemoval={setBrandPendingRemoval}
        tenantsQuery={tenantsQuery}
        openAdminSection={openAdminSection}
      />

      <StaffList
        activeSection={activeSection}
        selectedBrandName={selectedBrandName}
        setIsAddStaffOpen={setIsAddStaffOpen}
        setStaffMemberPendingRemoval={setStaffMemberPendingRemoval}
        staffActionError={staffActionError}
        setStaffActionError={setStaffActionError}
        tenantsQuery={tenantsQuery}
        staffQuery={staffQuery}
        openAdminSection={openAdminSection}
      />

      {activeSection === "categories" ? (
        <CategorySection
          categories={categoriesQuery.data}
          pending={categoriesQuery.isPending}
          failed={categoriesQuery.isError}
          onRetry={() => void categoriesQuery.reload()}
          onCategoryAdded={handleAdminDataChanged}
        />
      ) : null}

      <BrandSheet
        open={isAddBrandOpen}
        onClose={() => setIsAddBrandOpen(false)}
        onBrandCreated={handleAdminDataChanged}
      />
      <StaffSheet
        open={isAddStaffOpen}
        brand={selectedBrandName}
        onClose={() => setIsAddStaffOpen(false)}
        onStaffCreated={handleAdminDataChanged}
      />
      <Confirm
        open={brandPendingRemoval !== null}
        title="Remove brand"
        body={
          brandPendingRemoval
            ? `Remove ${brandPendingRemoval.name}? Staff and products linked to it may stop working.`
            : ""
        }
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
