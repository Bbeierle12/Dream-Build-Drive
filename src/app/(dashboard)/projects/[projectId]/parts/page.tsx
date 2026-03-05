import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CostSummaryBar } from "@/components/parts/cost-summary-bar"
import { CategoryBreakdown } from "@/components/parts/category-breakdown"
import { PartsTable } from "@/components/parts/parts-table"
import { PartForm } from "@/components/parts/part-form"
import { computeProjectCost } from "@/lib/utils"
import type { CategoryWithParts } from "@/lib/types"
import { ProjectExportButton } from "@/components/export/project-export-button"

export default async function PartsPage({
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("project_id", params.projectId)
    .order("sort_order")

  const { data: parts } = await supabase
    .from("parts")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at")

  // Group parts by category
  const categoriesWithParts: CategoryWithParts[] = (categories ?? []).map(
    (category) => ({
      ...category,
      parts: (parts ?? []).filter((p) => p.category_id === category.id),
    })
  )

  const costs = computeProjectCost(categoriesWithParts)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts</h1>
          <p className="text-muted-foreground">
            Track every part across categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectExportButton projectId={params.projectId} />
          <PartForm
            projectId={params.projectId}
            categories={categories ?? []}
          />
        </div>
      </div>

      <CostSummaryBar costs={costs} budget={project.budget} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PartsTable
            categories={categoriesWithParts}
            allCategories={categories ?? []}
            projectId={params.projectId}
          />
        </div>
        <div>
          <CategoryBreakdown categories={categoriesWithParts} />
        </div>
      </div>
    </div>
  )
}
