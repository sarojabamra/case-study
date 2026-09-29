export type AdminSection = "brands" | "staff" | "categories";

export function adminTabButtonClass(isActive: boolean) {
  return isActive
    ? "cursor-pointer border border-ink bg-ink px-3 py-2 text-sm text-canvas transition-colors"
    : "interactive-surface border border-line-strong px-3 py-2 text-sm";
}
