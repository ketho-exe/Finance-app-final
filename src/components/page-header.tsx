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
    <header className="mb-6">
      <p className="text-sm font-black uppercase text-accent">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-base leading-7 text-muted">{description}</p>
    </header>
  );
}
