"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";
import { SelectField } from "@/components/select-field";
import type { Category } from "@/lib/finance";
import { autoDetectCsvMapping, buildCsvCandidates, csvCandidateToTransaction, transactionFingerprint, type CsvMapping } from "@/lib/csv-import";
import { createId, useFinance } from "@/lib/finance-store";

export function CsvImporter() {
  const { cards, transactions, categoryOptions, csvTemplates, saveCsvTemplate, saveTransaction } = useFinance();
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [defaultCategory, setDefaultCategory] = useState<Category>("Groceries");
  const [defaultCardId, setDefaultCardId] = useState("");
  const [previewLimit, setPreviewLimit] = useState(20);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState("");
  const existingFingerprints = useMemo(() => new Set(transactions.map(transactionFingerprint)), [transactions]);
  const candidates = useMemo(() => buildCsvCandidates(rawRows, {
    mapping,
    cards,
    categories: categoryOptions,
    defaultCardId: defaultCardId || cards[0]?.id || "",
    defaultCategory,
    existingFingerprints,
  }), [cards, categoryOptions, defaultCardId, defaultCategory, existingFingerprints, mapping, rawRows]);
  const visibleCandidates = candidates.slice(0, previewLimit);
  const validImportCount = candidates.filter((candidate) => candidate.valid).length;

  function handleFile(file?: File) {
    if (!file) return;
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setError("");
        const nextColumns = result.meta.fields ?? [];
        setColumns(nextColumns);
        setMapping(autoDetectCsvMapping(nextColumns));
        setDefaultCardId(cards[0]?.id ?? "");
        setDefaultCategory(categoryOptions.includes("Groceries") ? "Groceries" : categoryOptions[0] ?? "Shopping");
        setPreviewLimit(20);
        setRawRows(result.data as Record<string, unknown>[]);
      },
      error: (parseError) => setError(parseError.message),
    });
  }

  function importRows() {
    candidates.filter((candidate) => candidate.valid).forEach((candidate) => {
      saveTransaction(csvCandidateToTransaction(candidate, createId("csv")));
    });
    setRawRows([]);
    setColumns([]);
    setMapping({});
  }

  function applyTemplate(templateId: string) {
    const template = csvTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setMapping({
      date: template.mapping.date,
      merchant: template.mapping.merchant,
      amount: template.mapping.amount,
      notes: template.mapping.notes,
      category: template.mapping.category,
      account: template.mapping.account,
    });
    setDefaultCategory((template.mapping.defaultCategory as Category) ?? defaultCategory);
    setDefaultCardId(template.mapping.defaultCardId ?? defaultCardId);
  }

  function saveCurrentMapping() {
    if (!rawRows.length) return;
    saveCsvTemplate({
      id: createId("csv-template"),
      bankName: templateName || "Custom CSV",
      columns,
      mapping: {
        ...mapping,
        defaultCategory,
        defaultCardId: defaultCardId || (cards[0]?.id ?? ""),
      },
    });
    setTemplateName("");
  }

  const columnOptions = [{ value: "", label: "Not mapped" }, ...columns.map((column) => ({ value: column, label: column }))];

  return (
    <div className="surface p-5">
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-soft px-4 text-center">
        <span className="text-lg font-black">Drop in a bank CSV</span>
        <span className="mt-2 max-w-lg text-sm text-muted">Map real bank columns, validate every row, and import all valid rows without truncating your file.</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
      </label>
      {error ? <p className="mt-4 text-sm font-bold text-danger">{error}</p> : null}
      {rawRows.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <SelectField value="" onChange={applyTemplate} buttonClassName="mt-0 px-3 py-2 text-sm" options={[{ value: "", label: "Apply saved mapping" }, ...csvTemplates.map((template) => ({ value: template.id, label: template.bankName }))]} />
            <input placeholder="Mapping name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="focus-ring rounded-md border border-border bg-background px-3 py-2 text-sm font-bold" />
            <button type="button" onClick={saveCurrentMapping} className="rounded-md border border-border px-3 py-2 text-sm font-black">Save mapping</button>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <SelectField label="Date" value={mapping.date ?? ""} onChange={(date) => setMapping({ ...mapping, date })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
            <SelectField label="Merchant" value={mapping.merchant ?? ""} onChange={(merchant) => setMapping({ ...mapping, merchant })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
            <SelectField label="Amount" value={mapping.amount ?? ""} onChange={(amount) => setMapping({ ...mapping, amount })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
            <SelectField label="Notes" value={mapping.notes ?? ""} onChange={(notes) => setMapping({ ...mapping, notes })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
            <SelectField label="Category column" value={mapping.category ?? ""} onChange={(category) => setMapping({ ...mapping, category })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
            <SelectField label="Account column" value={mapping.account ?? ""} onChange={(account) => setMapping({ ...mapping, account })} buttonClassName="px-3 py-2 text-sm" options={columnOptions} />
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <SelectField label="Default category" value={defaultCategory} onChange={setDefaultCategory} buttonClassName="px-3 py-2 text-sm" options={categoryOptions.map((category) => ({ value: category, label: category }))} />
            <SelectField label="Default account" value={defaultCardId || cards[0]?.id || ""} onChange={setDefaultCardId} buttonClassName="px-3 py-2 text-sm" options={cards.map((card) => ({ value: card.id, label: card.name }))} />
          </div>
          <div className="mb-4 rounded-md bg-soft px-4 py-3 text-sm font-bold text-muted">
            Showing {Math.min(previewLimit, candidates.length)} of {candidates.length} rows. {validImportCount} valid rows will be imported.
            {previewLimit < candidates.length ? (
              <button type="button" onClick={() => setPreviewLimit(candidates.length)} className="ml-3 font-black text-accent">Show all rows</button>
            ) : null}
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="border-b border-border py-3">Date</th>
                <th className="border-b border-border py-3">Merchant</th>
                <th className="border-b border-border py-3">Description</th>
                <th className="border-b border-border py-3">Amount</th>
                <th className="border-b border-border py-3">Category</th>
                <th className="border-b border-border py-3">Account</th>
                <th className="border-b border-border py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleCandidates.map((row) => (
                <tr key={`${row.fingerprint}-${row.index}`} className={!row.valid ? "bg-danger/5" : undefined}>
                  <td className="border-b border-border py-3">{row.date || "-"}</td>
                  <td className="border-b border-border py-3">{row.merchant || "-"}</td>
                  <td className="border-b border-border py-3">{row.notes ?? "-"}</td>
                  <td className="border-b border-border py-3 font-bold">{row.amount || "-"}</td>
                  <td className="border-b border-border py-3">{row.category}</td>
                  <td className="border-b border-border py-3">{cards.find((card) => card.id === row.cardId)?.name ?? "No account"}</td>
                  <td className={`border-b border-border py-3 font-bold ${row.valid ? "text-accent" : "text-danger"}`}>
                    {row.valid ? "Ready" : row.errors.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={importRows} disabled={validImportCount === 0} className="mt-4 h-11 rounded-md bg-foreground px-4 font-black text-background disabled:cursor-not-allowed disabled:opacity-50">
            Import {validImportCount} valid rows
          </button>
        </div>
      ) : null}
    </div>
  );
}
