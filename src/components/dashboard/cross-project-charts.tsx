"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { CHART_COLORS } from "@/lib/constants"
import { BudgetGauge } from "@/components/analytics/budget-gauge"
import type { BudgetHealth } from "@/lib/analytics-utils"

type ProjectSpend = {
  name: string
  spend: number
  budget: number
}

type CrossProjectChartsProps = {
  projectData: ProjectSpend[]
  overallHealth: BudgetHealth
  totalSpend: number
  totalBudget: number
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-zinc-100">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-zinc-400">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function CrossProjectCharts({
  projectData,
  overallHealth,
  totalSpend,
  totalBudget,
}: CrossProjectChartsProps) {
  if (projectData.length === 0) return null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div id="chart-cross-project" className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">
          Spend by Project
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={projectData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#999", fontSize: 11 }}
              axisLine={{ stroke: "#444" }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: "#999", fontSize: 12 }}
              axisLine={{ stroke: "#444" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spend" fill={CHART_COLORS[0]} name="Actual Spend" radius={[4, 4, 0, 0]} />
            <Bar dataKey="budget" fill={CHART_COLORS[1]} name="Budget" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <BudgetGauge
          health={overallHealth}
          actual={totalSpend}
          budget={totalBudget > 0 ? totalBudget : null}
        />
      </div>
    </div>
  )
}
