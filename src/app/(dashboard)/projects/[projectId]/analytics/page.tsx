import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { computeProjectCost } from "@/lib/utils"
import {
  computeCategoryCostData,
  computeStatusDistribution,
  computeTaskStatusDistribution,
  computeBudgetHealth,
} from "@/lib/analytics-utils"
import { SpendSummaryCards } from "@/components/analytics/spend-summary-cards"
import { CostByCategoryChart } from "@/components/analytics/cost-by-category-chart"
import { BudgetGauge } from "@/components/analytics/budget-gauge"
import { StatusPieChart } from "@/components/analytics/status-pie-chart"
import { TaskCompletionChart } from "@/components/analytics/task-completion-chart"
import type { CategoryWithParts } from "@/lib/types"

export default async function AnalyticsPage({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, budget")
    .eq("id", params.projectId)
    .single()

  if (!project) notFound()

  const [categoriesRes, partsRes, tasksRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("project_id", params.projectId)
      .order("sort_order"),
    supabase
      .from("parts")
      .select("*")
      .eq("project_id", params.projectId)
      .order("created_at"),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", params.projectId)
      .order("created_at"),
  ])

  const categories = categoriesRes.data ?? []
  const parts = partsRes.data ?? []
  const tasks = tasksRes.data ?? []

  const categoriesWithParts: CategoryWithParts[] = categories.map((cat) => ({
    ...cat,
    parts: parts.filter((p) => p.category_id === cat.id),
  }))

  const costs = computeProjectCost(categoriesWithParts)
  const categoryData = computeCategoryCostData(categoriesWithParts)
  const partStatusData = computeStatusDistribution(parts)
  const taskStatusData = computeTaskStatusDistribution(tasks)
  const budgetHealth = computeBudgetHealth(costs, project.budget ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Cost breakdown, budget health, and progress at a glance
        </p>
      </div>

      <SpendSummaryCards
        costs={costs}
        budget={project.budget}
        partCount={parts.length}
        categoryData={categoryData}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CostByCategoryChart data={categoryData} />
        </div>
        <div>
          <BudgetGauge
            health={budgetHealth}
            actual={costs.actual}
            budget={project.budget}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StatusPieChart data={partStatusData} title="Part Status" />
        <TaskCompletionChart data={taskStatusData} />
      </div>
    </div>
  )
}
