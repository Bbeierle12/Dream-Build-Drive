import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CostSummary, CategoryCostData } from "@/lib/types"

type SpendSummaryCardsProps = {
  costs: CostSummary
  budget: number | null
  partCount: number
  categoryData: CategoryCostData[]
}

type MetricCard = {
  label: string
  value: string
  colorClass: string
}

function buildMetrics({
  costs,
  budget,
  partCount,
  categoryData,
}: SpendSummaryCardsProps): MetricCard[] {
  const overUnder = costs.actual - costs.projected
  const budgetDiff =
    budget != null && budget > 0 ? budget - costs.actual : null

  const mostExpensive =
    categoryData.length > 0
      ? categoryData.reduce((a, b) =>
          (b.actual || b.estimated) > (a.actual || a.estimated) ? b : a
        )
      : null

  return [
    {
      label: "Total Estimated",
      value: formatCurrency(costs.projected),
      colorClass: "text-blue-400",
    },
    {
      label: "Total Actual",
      value: formatCurrency(costs.actual),
      colorClass: "text-zinc-100",
    },
    {
      label: "Over / Under",
      value: `${overUnder > 0 ? "+" : ""}${formatCurrency(overUnder)}`,
      colorClass: overUnder > 0 ? "text-red-400" : "text-green-400",
    },
    {
      label: "Budget Remaining",
      value:
        budgetDiff != null
          ? `${budgetDiff < 0 ? "-" : ""}${formatCurrency(Math.abs(budgetDiff))}`
          : "No budget",
      colorClass:
        budgetDiff == null
          ? "text-zinc-500"
          : budgetDiff < 0
            ? "text-red-400"
            : "text-green-400",
    },
    {
      label: "Parts Tracked",
      value: String(partCount),
      colorClass: "text-zinc-100",
    },
    {
      label: "Most Expensive",
      value: mostExpensive
        ? `${mostExpensive.name} (${formatCurrency(mostExpensive.actual || mostExpensive.estimated)})`
        : "N/A",
      colorClass: "text-orange-400",
    },
  ]
}

export function SpendSummaryCards(props: SpendSummaryCardsProps) {
  const metrics = buildMetrics(props)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="pt-5 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-lg font-bold font-mono truncate ${m.colorClass}`}>
              {m.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
