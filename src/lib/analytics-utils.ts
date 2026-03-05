import type {
  CategoryWithParts,
  CategoryCostData,
  StatusDistribution,
  Part,
  Task,
  CostSummary,
} from "@/lib/types"

export function computeCategoryCostData(
  categories: CategoryWithParts[]
): CategoryCostData[] {
  return categories
    .map((cat) => {
      let estimated = 0
      let actual = 0
      for (const part of cat.parts) {
        estimated += part.estimated_cost ?? 0
        actual += part.actual_cost ?? 0
      }
      return {
        name: cat.name,
        estimated,
        actual,
        partCount: cat.parts.length,
      }
    })
    .filter((d) => d.estimated > 0 || d.actual > 0 || d.partCount > 0)
}

export function computeStatusDistribution(parts: Part[]): StatusDistribution[] {
  const counts: Record<string, number> = {}
  for (const part of parts) {
    counts[part.status] = (counts[part.status] ?? 0) + 1
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }))
}

export function computeTaskStatusDistribution(
  tasks: Task[]
): StatusDistribution[] {
  const counts: Record<string, number> = {}
  for (const task of tasks) {
    counts[task.status] = (counts[task.status] ?? 0) + 1
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }))
}

export type BudgetHealth = {
  percentage: number
  status: "healthy" | "warning" | "over"
}

export function computeBudgetHealth(
  costs: CostSummary,
  budget: number
): BudgetHealth {
  if (budget <= 0) {
    return { percentage: 0, status: "healthy" }
  }
  const percentage = (costs.actual / budget) * 100
  let status: BudgetHealth["status"] = "healthy"
  if (percentage > 100) {
    status = "over"
  } else if (percentage >= 75) {
    status = "warning"
  }
  return { percentage, status }
}
