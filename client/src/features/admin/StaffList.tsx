import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import FormMessage from "@/components/ui/FormMessage";
import Skeleton from "@/components/ui/Skeleton";
import type { useAdminPage } from "./useAdminPage";

type Props = Pick<ReturnType<typeof useAdminPage>, "activeSection" | "selectedBrandName" | "setIsAddStaffOpen" | "setStaffMemberPendingRemoval" | "staffActionError" | "setStaffActionError" | "tenantsQuery" | "staffQuery" | "openAdminSection">;

export default function StaffList({ activeSection, selectedBrandName, setIsAddStaffOpen, setStaffMemberPendingRemoval, staffActionError, setStaffActionError, tenantsQuery, staffQuery, openAdminSection }: Props) {
  return (activeSection === "staff" ? (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">
            {selectedBrandName ? `${selectedBrandName} staff` : "Staff"}
          </h2>
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
                <option key={tenant.id} value={tenant.name}>
                  {tenant.name}
                </option>
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
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void staffQuery.reload()}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {staffQuery.data && staffQuery.data.length === 0 ? (
        <div className="mt-6">
          <Empty
            title={
              selectedBrandName
                ? "No staff for this brand yet."
                : "No brand staff yet."
            }
          />
        </div>
      ) : null}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {(staffQuery.data ?? []).map((staffMember) => (
          <li
            key={staffMember.id}
            className="flex items-center justify-between py-4"
          >
            <div>
              <p className="font-display text-2xl">
                {staffMember.username}
              </p>
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-clay">
                {staffMember.tenant_name ?? "Unassigned brand"} ·{" "}
                {staffMember.role ?? "TENANT"}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setStaffMemberPendingRemoval(staffMember)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  ) : null);
}
