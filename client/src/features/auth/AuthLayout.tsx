export default function AuthLayout({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  aside: string;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 md:px-10 lg:grid-cols-2">
      <section>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-clay">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight md:text-5xl">
          {title}
        </h1>
        <div className="mt-8">{children}</div>
      </section>
      <aside className="hidden border border-line bg-surface p-8 lg:block">
        <p className="font-display text-3xl leading-snug">{aside}</p>
      </aside>
    </div>
  );
}
