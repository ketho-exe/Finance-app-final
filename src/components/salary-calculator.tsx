"use client";

import { useMemo } from "react";
import { SelectField } from "@/components/select-field";
import { calculateUkSalary } from "@/lib/finance";
import { useFinance, type SalarySettings } from "@/lib/finance-store";
import { currency, preciseCurrency } from "@/lib/utils";

export function SalaryCalculator() {
  const { cards, salary, setSalary } = useFinance();
  const result = useMemo(() => calculateUkSalary(salary.gross, salary.pension, salary.studentLoan, salary.pensionTiming), [salary]);

  function updateSalary(next: Partial<SalarySettings>) {
    setSalary({ ...salary, ...next });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="surface space-y-5 p-5">
        <label className="block">
          <span className="text-sm font-bold text-muted">Gross annual salary</span>
          <input
            type="number"
            value={salary.gross}
            onChange={(event) => updateSalary({ gross: Number(event.target.value) })}
            className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-lg font-black text-foreground"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-muted">Pension contribution</span>
          <div className="mt-3 grid grid-cols-[1fr_84px] items-center gap-3">
            <input
              aria-label="Pension contribution slider"
              type="range"
              min="0"
              max="20"
              value={salary.pension}
              onChange={(event) => updateSalary({ pension: Number(event.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
            <input
              aria-label="Pension contribution percent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={salary.pension}
              onChange={(event) => updateSalary({ pension: Number(event.target.value) })}
              className="focus-ring w-full rounded-md border border-border bg-background px-3 py-2 font-black text-foreground"
            />
          </div>
          <span className="mt-1 block text-sm font-bold">{salary.pension}% saved automatically</span>
        </label>
        <SelectField
          label="Pension tax timing"
          value={salary.pensionTiming}
          onChange={(pensionTiming) => updateSalary({ pensionTiming })}
          options={[
            { value: "before-tax", label: "Before tax" },
            { value: "after-tax", label: "After tax" },
          ]}
        />
        <SelectField
          label="Student loan"
          value={salary.studentLoan}
          onChange={(studentLoan) => updateSalary({ studentLoan })}
          options={[
            { value: "none", label: "None" },
            { value: "plan1", label: "Plan 1" },
            { value: "plan2", label: "Plan 2" },
            { value: "plan5", label: "Plan 5" },
          ]}
        />
        <label className="block">
          <span className="text-sm font-bold text-muted">Monthly payday</span>
          <input
            type="number"
            min="1"
            max="31"
            value={salary.paydayDay}
            onChange={(event) => updateSalary({ paydayDay: Number(event.target.value) })}
            className="focus-ring mt-2 w-full rounded-md border border-border bg-background px-3 py-3 font-bold text-foreground"
          />
        </label>
        <SelectField
          label="Income paid into"
          value={salary.incomeCardId ?? ""}
          onChange={(incomeCardId) => updateSalary({ incomeCardId: incomeCardId || undefined })}
          options={[
            { value: "", label: "Main current balance" },
            ...cards.map((card) => ({ value: card.id, label: card.name })),
          ]}
        />
      </div>
      <div className="surface p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Monthly take-home", currency.format(result.takeHomeMonthly)],
            ["Annual take-home", currency.format(result.takeHomeAnnual)],
            ["Income tax", currency.format(result.incomeTax)],
            ["National Insurance", currency.format(result.nationalInsurance)],
            ["Pension", currency.format(result.pension)],
            ["Student loan", currency.format(result.studentLoan)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-soft p-4">
              <p className="text-sm font-bold text-muted">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-muted">
          Estimate uses England/Wales/NI bands, employee NI, pension {salary.pensionTiming === "before-tax" ? "before tax" : "after tax"}, and current-style student loan thresholds. Monthly net is{" "}
          <span className="font-black text-foreground">{preciseCurrency.format(result.takeHomeMonthly)}</span>.
        </p>
        <p className="mt-3 rounded-md bg-soft px-3 py-2 text-sm font-bold text-muted">
          Salary settings save automatically. Forecasts use monthly take-home on payday, not gross salary.
        </p>
      </div>
    </div>
  );
}
