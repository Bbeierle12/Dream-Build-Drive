import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TaskTable } from "@/components/tasks/task-table"
import { TaskForm } from "@/components/tasks/task-form"
import { ProjectExportButton } from "@/components/export/project-export-button"

export default async function TasksPage({
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("project_id", params.projectId)
    .order("sort_order")

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false })

  const { data: dependencies } = await supabase
    .from("task_dependencies")
    .select("*")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your build tasks and track progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectExportButton projectId={params.projectId} />
          <TaskForm
            projectId={params.projectId}
            categories={categories ?? []}
          />
        </div>
      </div>

      <TaskTable
        tasks={tasks ?? []}
        dependencies={dependencies ?? []}
        categories={categories ?? []}
        projectId={params.projectId}
      />
    </div>
  )
}
