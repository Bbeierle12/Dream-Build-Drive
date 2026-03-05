import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GanttChart } from "@/components/tasks/gantt-chart"
import type { TaskWithDependencies, TaskDependency } from "@/lib/types"

export default async function GanttPage({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.projectId)
    .single()

  if (!project) notFound()

  const [categoriesRes, tasksRes, depsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("project_id", params.projectId)
      .order("sort_order"),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", params.projectId)
      .order("start_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("task_dependencies")
      .select("*"),
  ])

  const categories = categoriesRes.data ?? []
  const rawTasks = tasksRes.data ?? []
  const allDeps: TaskDependency[] = depsRes.data ?? []

  const taskIds = new Set(rawTasks.map((t) => t.id))

  const tasks: TaskWithDependencies[] = rawTasks.map((t) => ({
    ...t,
    dependencies: allDeps.filter(
      (d) => d.task_id === t.id && taskIds.has(d.depends_on_task_id),
    ),
    blocked_by: allDeps.filter(
      (d) => d.depends_on_task_id === t.id && taskIds.has(d.task_id),
    ),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gantt Chart</h1>
        <p className="text-muted-foreground">
          Visualize task timelines and dependencies
        </p>
      </div>

      <GanttChart tasks={tasks} categories={categories} />
    </div>
  )
}
