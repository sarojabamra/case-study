import { useCallback } from "react";
import { Link } from "react-router-dom";

import { api } from "@/services/api";
import type { Brand } from "@/services/types";
import { Empty, SystemState } from "@/components/SystemState";
import { Skeleton } from "@/components/Skeleton";
import { useDocumentTitle } from "@/utils/title";
import { useLoadData } from "@/utils/useLoadData";

export function BrandsPage() {
  const loadBrands = useCallback(() => api<Brand[]>("/brands"), []);
  const brandsQuery = useLoadData(loadBrands);

  useDocumentTitle("Brands · E-commerce");

  return (
    <div className="px-5 py-10 md:px-10 lg:px-16">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">Directory</p>
      <h1 className="mt-2 font-display text-4xl font-light">Brands</h1>
      <p className="mt-3 max-w-xl text-muted">Each name is a brand in this shop. Open one to see its products.</p>
      {brandsQuery.isPending ? <Skeleton className="mt-8 h-48" /> : null}
      {brandsQuery.isError ? (
        <SystemState title="The brand list could not be loaded." body="Try again from the catalogue." action={{ href: "/", label: "Back to store" }} />
      ) : null}
      {brandsQuery.data && brandsQuery.data.length === 0 ? (
        <div className="mt-8">
          <Empty title="No brands yet." />
        </div>
      ) : null}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {(brandsQuery.data ?? []).map((brand) => (
          <li key={brand.id}>
            <Link to={`/?brand=${brand.id}`} className="flex items-center justify-between py-4 transition-colors hover:bg-surface">
              <span className="font-display text-2xl">{brand.name}</span>
              <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted">View pieces</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
