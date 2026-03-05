"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { BudgetHealth } from "@/lib/analytics-utils"

type BudgetGaugeProps = {
  health: BudgetHealth
  actual: number
  budget: number | null
}

const GAUGE_CONFIG = {
  SIZE: 180,
  STROKE_WIDTH: 16,
  RADIUS: 74,
  CENTER: 90,
  START_ANGLE: 180,
  END_ANGLE: 0,
} as const

const STATUS_STYLES: Record<BudgetHealth["status"], string> = {
  healthy: "#22c55e",
  warning: "#eab308",
  over: "#ef4444",
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy - r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy - r * Math.sin(endRad)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`
}

export function BudgetGauge({ health, actual, budget }: BudgetGaugeProps) {
  if (budget == null || budget <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground text-center">
            No budget set for this project.
          </p>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Set a budget in project settings to track spending.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { SIZE, STROKE_WIDTH, RADIUS, CENTER } = GAUGE_CONFIG
  const capped = Math.min(health.percentage, 100)
  const sweepAngle = (capped / 100) * 180
  const fillEnd = 180 - sweepAngle
  const bgPath = describeArc(CENTER, CENTER, RADIUS, 180, 0)
  const fillPath = describeArc(CENTER, CENTER, RADIUS, 180, fillEnd)
  const color = STATUS_STYLES[health.status]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <svg
          width={SIZE}
          height={SIZE / 2 + 20}
          viewBox={`0 0 ${SIZE} ${SIZE / 2 + 20}`}
        >
          <path
            d={bgPath}
            fill="none"
            stroke="#333"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
          {capped > 0 && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          )}
          <text
            x={CENTER}
            y={CENTER - 8}
            textAnchor="middle"
            fill={color}
            className="font-mono"
            fontSize="28"
            fontWeight="bold"
          >
            {Math.round(health.percentage)}%
          </text>
        </svg>
        <p className="font-mono text-sm text-zinc-300 mt-1">
          {formatCurrency(actual)}{" "}
          <span className="text-muted-foreground">of</span>{" "}
          {formatCurrency(budget)}
        </p>
        <p
          className="text-xs mt-1 font-medium"
          style={{ color }}
        >
          {health.status === "healthy" && "On track"}
          {health.status === "warning" && "Approaching budget"}
          {health.status === "over" && "Over budget"}
        </p>
      </CardContent>
    </Card>
  )
}
