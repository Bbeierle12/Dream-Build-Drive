import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CostSummary } from "@/lib/types"

type CostSummaryBarProps = {
  costs: CostSummary
  budget?: number | null
}

export function CostSummaryBar({ costs, budget }: CostSummaryBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <p className="text-xs text-muted-foreground">Projected</p>
            <p className="text-lg font-bold font-mono">
              {formatCurrency(costs.projected)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-lg font-bold font-mono">
              {formatCurrency(costs.actual)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="text-lg font-bold font-mono">
              {formatCurrency(costs.purchased)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Planned</p>
            <p className="text-lg font-bold font-mono">
              {formatCurrency(costs.planned)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Over/Under</p>
            <p
              className={`text-lg font-bold font-mono ${
                costs.overUnder > 0 ? "text-destructive" : "text-green-400"
              }`}
            >
              {costs.overUnder > 0 ? "+" : ""}
              {formatCurrency(costs.overUnder)}
            </p>
          </div>
        </div>
        {budget != null && budget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Budget Usage</span>
              <span>
                {formatCurrency(costs.actual)} / {formatCurrency(budget)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  costs.actual > budget ? "bg-destructive" : "bg-primary"
                }`}
                style={{
                  width: `${Math.min((costs.actual / budget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
