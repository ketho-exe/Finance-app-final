"use client";

import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/lib/finance";
import { buildCashFlowSeries } from "@/lib/finance-insights";
import { currency } from "@/lib/utils";

export const cashFlowChartInitialDimension = {
  width: 720,
  height: 320,
};

function CashFlowChartInner({
  transactions,
  monthlySalary,
}: {
  transactions: Transaction[];
  monthlySalary: number;
}) {
  const data = buildCashFlowSeries({ transactions, monthlySalary });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={280} initialDimension={cashFlowChartInitialDimension}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted)" />
          <YAxis tickFormatter={(value) => `£${Number(value) / 1000}k`} tickLine={false} axisLine={false} stroke="var(--muted)" />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
            formatter={(value) => currency.format(Number(value))}
          />
          <Bar dataKey="income" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outgoings" fill="var(--accent-2)" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="net" stroke="var(--foreground)" strokeWidth={2} dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CashFlowChart = dynamic(() => Promise.resolve(CashFlowChartInner), {
  ssr: false,
  loading: () => <div className="h-80 w-full rounded-md bg-soft" />,
});
