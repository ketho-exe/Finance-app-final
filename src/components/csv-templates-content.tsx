import { csvTemplates } from "@/lib/finance-insights";

export function CsvTemplatesContent() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {csvTemplates.map((template) => (
        <article key={template.bank} className="surface p-5">
          <h2 className="text-2xl font-black">{template.bank}</h2>
          <p className="mt-2 text-sm text-muted">Expected columns</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {template.columns.map((column) => (
              <span key={column} className="rounded-md bg-soft px-2 py-1 text-xs font-black">
                {column}
              </span>
            ))}
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-soft p-4 text-sm font-bold">
            {JSON.stringify(template.mapping, null, 2)}
          </pre>
        </article>
      ))}
    </div>
  );
}
