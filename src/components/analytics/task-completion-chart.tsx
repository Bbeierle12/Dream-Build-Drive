"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import type { StatusDistribution } from "@/lib/types"

type TaskCompletionChartProps = {
  data: StatusDistribution[]
}

const TASK_CHART_COLORS: Record<string, string> = {
  backlog: "#71717a",
  todo: "#3b82f6",
  in_progress: "#eab308",
  in_review: "#a855f7",
  done: "#22c55e",
}

const DISPLAY_ORDER = ["backlog", "todo", "in_progress", "in_review", "done"]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: { status: string } }[]
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const label = TASK_STATUS_LABELS[entry.payload.status] ?? entry.payload.status
  return (
    <div className="rounded-lg border bg-zinc-900 p-2 shadow-lg">
      <p className="text-xs font-medium text-zinc-100">
        {label}: {entry.value}
      </p>
    </div>
  )
}

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Ensure all statuses are present and in order
  const ordered = DISPLAY_ORDER.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status] ?? status,
    count: data.find((d) => d.status === status)?.count ?? 0,
  }))

  const doneCount = ordered.find((d) => d.status === "done")?.count ?? 0
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Task Progress</span>
          <span className="text-sm font-mono text-green-400">
            {pct}% done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={ordered}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#444" }}
              tickLine={{ stroke: "#444" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#444" }}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {ordered.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={TASK_CHART_COLORS[entry.status] ?? "#71717a"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {ordered
            .filter((d) => d.count > 0)
            .map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      TASK_CHART_COLORS[entry.status] ?? "#71717a",
                  }}
                />
                <span className="text-xs text-zinc-400">
                  {entry.label} ({entry.count})
                </span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
