import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleInfo } from "@/components/projects/vehicle-info"
import { CategoryList } from "@/components/categories/category-list"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingUp, Package } from "lucide-react"

export default async function ProjectOverview({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*")
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
    .select("actual_cost, estimated_cost, status")
    .eq("project_id", params.projectId)

  const totalActual = (parts ?? []).reduce((sum, p) => sum + (p.actual_cost ?? 0), 0)
  const totalEstimated = (parts ?? []).reduce((sum, p) => sum + (p.estimated_cost ?? 0), 0)
  const installedCount = (parts ?? []).filter((p) => p.status === "installed").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        {project.notes && (
          <p className="mt-1 text-muted-foreground">{project.notes}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {project.budget ? formatCurrency(project.budget) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalActual)} spent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalEstimated)}
            </div>
            <p className="text-xs text-muted-foreground">
              estimated total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{(parts ?? []).length}</div>
            <p className="text-xs text-muted-foreground">
              {installedCount} installed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VehicleInfo project={project} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={categories ?? []}
              projectId={params.projectId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
