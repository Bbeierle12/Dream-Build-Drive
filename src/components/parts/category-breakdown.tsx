"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, computeCategoryCost } from "@/lib/utils"
import type { CategoryWithParts } from "@/lib/types"

type CategoryBreakdownProps = {
  categories: CategoryWithParts[]
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const maxCost = Math.max(
    ...categories.map((c) => computeCategoryCost(c.parts).projected),
    1
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => {
          const costs = computeCategoryCost(category.parts)
          const pct = maxCost > 0 ? (costs.projected / maxCost) * 100 : 0

          return (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{category.name}</span>
                <span className="font-mono text-muted-foreground">
                  {formatCurrency(costs.actual)} / {formatCurrency(costs.projected)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
