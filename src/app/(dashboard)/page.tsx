import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ProjectListTable } from "@/components/dashboard/project-list-table"
import { createClient } from "@/lib/supabase/server"

export default async function GarageDashboard() {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })

  const [{ data: parts }, { count: totalTasks }] = await Promise.all([
    supabase.from("parts").select("project_id, actual_cost, estimated_cost"),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
  ])

  const projectList = (projects ?? []).map((project) => {
    const projectParts = (parts ?? []).filter((p) => p.project_id === project.id)
    const totalSpend = projectParts.reduce(
      (sum, p) => sum + (p.actual_cost ?? 0),
      0
    )
    return {
      ...project,
      totalSpend,
      partCount: projectParts.length,
    }
  })

  const totalSpend = projectList.reduce((sum, p) => sum + p.totalSpend, 0)
  const totalBudget = (projects ?? []).reduce(
    (sum, p) => sum + (p.budget ?? 0),
    0
  )
  const totalParts = (parts ?? []).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Garage Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your car build command center</p>
        </div>
        <Button asChild className="min-h-[44px] w-full sm:w-auto">
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Build
          </Link>
        </Button>
      </div>

      <StatCards
        activeProjects={projectList.length}
        totalSpend={totalSpend}
        totalBudget={totalBudget}
        totalParts={totalParts}
        totalTasks={totalTasks ?? 0}
      />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Builds</h2>
        <ProjectListTable projects={projectList} />
      </div>
    </div>
  )
}
