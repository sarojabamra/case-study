export default function ProductCategoryLabel({ name }: { name: string | null | undefined; }) {
  if (!name) {
    return null;
  }
  return (
    <span
      className="absolute top-3 left-3 border border-line bg-canvas/90 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay backdrop-blur-sm"
    >
      {name}
    </span>
  );
}
