import type {
  CategoryWithParts,
  CategoryCostData,
  StatusDistribution,
  Part,
  Task,
  CostSummary,
  SpendOverTime,
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

export function computeBurnRate(parts: Part[]): SpendOverTime[] {
  if (parts.length === 0) return []

  // Group parts by month using created_at
  const monthMap = new Map<string, number>()
  for (const part of parts) {
    const cost = part.actual_cost ?? 0
    if (cost === 0) continue
    const date = new Date(part.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + cost)
  }

  // Sort by month and compute cumulative
  const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  let cumulative = 0
  return sorted.map(([date, amount]) => {
    cumulative += amount
    return { date, cumulative }
  })
}
