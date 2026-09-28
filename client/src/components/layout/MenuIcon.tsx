export default function MenuIcon({ open }: { open: boolean; }) {
  if (open) {
    return (
      <>
        <span className="sr-only">Close menu</span>
        <span className="relative block h-5 w-5" aria-hidden="true">
          <span className="absolute top-1/2 left-0 block h-0.5 w-5 -translate-y-1/2 rotate-45 bg-ink" />
          <span className="absolute top-1/2 left-0 block h-0.5 w-5 -translate-y-1/2 -rotate-45 bg-ink" />
        </span>
      </>
    );
  }
  return (
    <>
      <span className="sr-only">Open menu</span>
      <span className="flex h-5 w-5 flex-col justify-center gap-1" aria-hidden="true">
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
      </span>
    </>
  );
}
