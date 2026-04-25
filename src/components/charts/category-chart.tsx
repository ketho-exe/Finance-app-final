"use client";

import dynamic from "next/dynamic";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categorySpend, type Transaction } from "@/lib/finance";
import { currency } from "@/lib/utils";

const colours = ["#0f766e", "#2457c5", "#b45309", "#7c3aed", "#be123c", "#15803d", "#0369a1", "#a16207"];

function CategoryChartInner({ transactions }: { transactions?: Transaction[] }) {
  const data = Object.entries(categorySpend(transactions))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
          <PieChart>
            <Pie data={data} innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colours[index % colours.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--foreground)",
              }}
              formatter={(value) => currency.format(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-bold">
              <span className="size-3 shrink-0 rounded-sm" style={{ background: colours[index % colours.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 text-muted">{currency.format(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CategoryChart = dynamic(() => Promise.resolve(CategoryChartInner), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded-md bg-soft" />,
});
