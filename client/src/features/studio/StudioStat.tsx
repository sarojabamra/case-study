export default function StudioStat({ label, value }: { label: string; value: string; }) {
  return (
    <div className="border border-line bg-surface p-4">
      <p className="font-display text-3xl">{value}</p>
      <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>
  );
}
