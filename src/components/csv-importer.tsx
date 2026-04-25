"use client";

import Papa from "papaparse";
import { useState } from "react";
import { categories, type Category } from "@/lib/finance";
import { createId, useFinance } from "@/lib/finance-store";

type ParsedRow = {
  Date?: string;
  Merchant?: string;
  Description?: string;
  Amount?: string;
  Category?: string;
  mappedCategory?: Category;
  mappedCardId?: string;
};

export function CsvImporter() {
  const { cards, saveTransaction } = useFinance();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");

  function handleFile(file?: File) {
    if (!file) return;
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setError("");
        setRows(
          result.data.slice(0, 20).map((row) => ({
            ...row,
            mappedCategory: categories.includes(row.Category as Category) ? (row.Category as Category) : "Groceries",
            mappedCardId: cards[0]?.id ?? "",
          })),
        );
      },
      error: (parseError) => setError(parseError.message),
    });
  }

  function updateRow(index: number, next: Partial<ParsedRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next } : row)));
  }

  function importRows() {
    rows.forEach((row) => {
      const amount = Number(String(row.Amount ?? "0").replace(/,/g, ""));
      saveTransaction({
        id: createId("csv"),
        date: row.Date || new Date().toISOString().slice(0, 10),
        merchant: row.Merchant || row.Description || "CSV transaction",
        category: row.mappedCategory ?? "Groceries",
        amount,
        cardId: row.mappedCardId || cards[0]?.id || "",
        notes: row.Description,
      });
    });
    setRows([]);
  }

  return (
    <div className="surface p-5">
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-soft px-4 text-center">
        <span className="text-lg font-black">Drop in a bank CSV</span>
        <span className="mt-2 max-w-lg text-sm text-muted">Columns such as Date, Merchant, Description, Amount, and Category will be previewed here before mapping to Supabase.</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
      </label>
      {error ? <p className="mt-4 text-sm font-bold text-danger">{error}</p> : null}
      {rows.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="border-b border-border py-3">Date</th>
                <th className="border-b border-border py-3">Merchant</th>
                <th className="border-b border-border py-3">Description</th>
                <th className="border-b border-border py-3">Amount</th>
                <th className="border-b border-border py-3">Category</th>
                <th className="border-b border-border py-3">Card</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.Date}-${index}`}>
                  <td className="border-b border-border py-3">{row.Date ?? "-"}</td>
                  <td className="border-b border-border py-3">{row.Merchant ?? "-"}</td>
                  <td className="border-b border-border py-3">{row.Description ?? "-"}</td>
                  <td className="border-b border-border py-3 font-bold">{row.Amount ?? "-"}</td>
                  <td className="border-b border-border py-3">
                    <select value={row.mappedCategory} onChange={(event) => updateRow(index, { mappedCategory: event.target.value as Category })} className="focus-ring w-full rounded-md border border-border bg-background px-2 py-2 font-bold">
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-border py-3">
                    <select value={row.mappedCardId} onChange={(event) => updateRow(index, { mappedCardId: event.target.value })} className="focus-ring w-full rounded-md border border-border bg-background px-2 py-2 font-bold">
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={importRows} className="mt-4 h-11 rounded-md bg-foreground px-4 font-black text-background">
            Import mapped rows
          </button>
        </div>
      ) : null}
    </div>
  );
}
