"use client";

import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { categorySpend } from "@/lib/finance";
import { createId, useFinance } from "@/lib/finance-store";
import { currency } from "@/lib/utils";

export function ReportsContent() {
  const { cards, pots, transactions, salary, reportExports, saveReportExport } = useFinance();
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const spend = Object.entries(categorySpend(transactions)).sort((a, b) => b[1] - a[1]);

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Ledgerly Monthly Report", 14, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 28);
    doc.text(`Total balance: ${currency.format(totalBalance)}`, 14, 40);
    doc.text(`Gross salary setting: ${currency.format(salary.gross)}`, 14, 48);
    doc.text(`Active pots: ${pots.length}`, 14, 56);
    doc.setFont("helvetica", "bold");
    doc.text("Top spending categories", 14, 70);
    doc.setFont("helvetica", "normal");
    spend.slice(0, 8).forEach(([category, amount], index) => {
      doc.text(`${category}: ${currency.format(amount)}`, 14, 82 + index * 8);
    });
    saveReportExport({
      id: createId("report"),
      reportMonth: new Date().toISOString().slice(0, 10),
      format: "pdf",
      createdAt: new Date().toISOString(),
      summary: {
        totalBalance,
        transactions: transactions.length,
        pots: pots.length,
        topCategory: spend[0]?.[0] ?? "None",
      },
    });
    doc.save("ledgerly-monthly-report.pdf");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="surface h-fit p-5">
        <h2 className="text-xl font-black">Export report</h2>
        <p className="mt-2 text-sm text-muted">Creates a monthly PDF summary from your current workspace data and records it in report history.</p>
        <button onClick={exportPdf} className="mt-5 flex h-11 items-center gap-2 rounded-md bg-foreground px-4 font-black text-background">
          <Download className="size-4" />
          Export PDF
        </button>
      </section>
      <section className="surface p-5">
        <h2 className="text-xl font-black">Report preview</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Preview label="Total balance" value={currency.format(totalBalance)} />
          <Preview label="Transactions" value={String(transactions.length)} />
          <Preview label="Pots" value={String(pots.length)} />
        </div>
        <div className="mt-5 space-y-2">
          {spend.slice(0, 6).map(([category, amount]) => (
            <div key={category} className="flex justify-between rounded-md bg-soft px-3 py-3 text-sm font-bold">
              <span>{category}</span>
              <span>{currency.format(amount)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="surface p-5 xl:col-span-2">
        <h2 className="text-xl font-black">Report history</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {reportExports.length ? reportExports.slice(0, 6).map((report) => (
            <div key={report.id} className="rounded-md bg-soft p-3">
              <p className="text-sm font-black">{new Date(report.createdAt).toLocaleDateString("en-GB")}</p>
              <p className="mt-1 text-sm text-muted">{report.format.toUpperCase()} for {report.reportMonth}</p>
              <p className="mt-2 text-sm font-bold">Balance: {currency.format(Number(report.summary.totalBalance ?? 0))}</p>
            </div>
          )) : <p className="text-sm text-muted">Export a PDF to start building report history.</p>}
        </div>
      </section>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-soft p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
