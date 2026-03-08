"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { CHART_COLORS } from "@/lib/constants"
import type { SpendOverTime } from "@/lib/types"

type BurnRateChartProps = {
  data: SpendOverTime[]
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export function BurnRateChart({ data }: BurnRateChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
        <p className="text-sm text-muted-foreground">No spend data yet</p>
      </div>
    )
  }

  return (
    <div id="chart-burn-rate" className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">
        Monthly Burn Rate
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#999", fontSize: 12 }}
            axisLine={{ stroke: "#444" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: "#999", fontSize: 12 }}
            axisLine={{ stroke: "#444" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
