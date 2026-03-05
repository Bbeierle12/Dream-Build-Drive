"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { StatusDistribution } from "@/lib/types"

type StatusPieChartProps = {
  data: StatusDistribution[]
  title?: string
}

const STATUS_CHART_COLORS: Record<string, string> = {
  researching: "#eab308",
  planned: "#3b82f6",
  ordered: "#6366f1",
  shipped: "#8b5cf6",
  received: "#22c55e",
  installed: "#10b981",
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { status: string } }[]
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border bg-zinc-900 p-2 shadow-lg">
      <p className="text-xs font-medium text-zinc-100 capitalize">
        {entry.payload.status}: {entry.value}
      </p>
    </div>
  )
}

export function StatusPieChart({
  data,
  title = "Part Status",
}: StatusPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No parts to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_CHART_COLORS[entry.status] ?? "#71717a"}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono"
              fill="#e4e4e7"
              fontSize={24}
              fontWeight="bold"
            >
              {total}
            </text>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {data.map((entry) => (
            <div key={entry.status} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_CHART_COLORS[entry.status] ?? "#71717a",
                }}
              />
              <span className="text-xs text-zinc-400 capitalize">
                {entry.status.replace("_", " ")} ({entry.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
