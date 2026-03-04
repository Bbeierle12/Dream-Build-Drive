import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TaskForm } from "@/components/tasks/task-form"

export default async function KanbanPage({
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
    .order("created_at")

  const { data: dependencies } = await supabase
    .from("task_dependencies")
    .select("*")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Drag and drop tasks between status columns
          </p>
        </div>
        <TaskForm
          projectId={params.projectId}
          categories={categories ?? []}
        />
      </div>

      <KanbanBoard
        tasks={tasks ?? []}
        dependencies={dependencies ?? []}
        categories={categories ?? []}
        projectId={params.projectId}
      />
    </div>
  )
}
