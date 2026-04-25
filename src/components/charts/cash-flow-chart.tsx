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
import { monthlyCashFlow } from "@/lib/finance";
import { currency } from "@/lib/utils";

function CashFlowChartInner() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
        <BarChart data={monthlyCashFlow()} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
