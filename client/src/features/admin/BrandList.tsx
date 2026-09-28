import Button from "@/components/ui/Button";
import Empty from "@/components/ui/Empty";
import Skeleton from "@/components/ui/Skeleton";
import type { useAdminPage } from "./useAdminPage";

type Props = Pick<
  ReturnType<typeof useAdminPage>,
  | "activeSection"
  | "setIsAddBrandOpen"
  | "setBrandPendingRemoval"
  | "tenantsQuery"
  | "openAdminSection"
>;

export default function BrandList({
  activeSection,
  setIsAddBrandOpen,
  setBrandPendingRemoval,
  tenantsQuery,
  openAdminSection,
}: Props) {
  return activeSection === "brands" ? (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl">Brands</h2>
        <Button onClick={() => setIsAddBrandOpen(true)}>Add brand</Button>
      </div>
      {tenantsQuery.isPending ? <Skeleton className="mt-6 h-48" /> : null}
      {tenantsQuery.isError ? (
        <div className="mt-6">
          <Empty title="Brands could not be loaded." />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => void tenantsQuery.reload()}
          >
            Try again
          </Button>
        </div>
      ) : null}
      {tenantsQuery.data && tenantsQuery.data.length === 0 ? (
        <div className="mt-6">
          <Empty title="No brands yet." />
        </div>
      ) : null}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {(tenantsQuery.data ?? []).map((tenant) => (
          <li
            key={tenant.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-2xl">{tenant.name}</p>
              <p className="mt-1 text-sm text-muted">
                {tenant.product_count} products · {tenant.staff_count} staff
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => openAdminSection("staff", tenant.name)}
              >
                View staff
              </Button>
              <Button
                variant="danger"
                onClick={() => setBrandPendingRemoval(tenant)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
}
