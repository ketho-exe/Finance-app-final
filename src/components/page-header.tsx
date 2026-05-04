export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-2 border-b border-border pb-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h1 className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-base leading-7 text-muted">{description}</p>
    </header>
  );
}
