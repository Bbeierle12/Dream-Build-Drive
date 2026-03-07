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

  const [{ data: categories }, { data: parts }, { data: tasks }, { data: dependencies }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("project_id", params.projectId)
        .order("sort_order"),
      supabase
        .from("parts")
        .select("*")
        .eq("project_id", params.projectId)
        .order("name"),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", params.projectId)
        .order("created_at"),
      supabase
        .from("task_dependencies")
        .select("*"),
    ])

  const taskList = tasks ?? []
  const taskIds = new Set(taskList.map((task) => task.id))
  const scopedDependencies = (dependencies ?? []).filter(
    (dependency) =>
      taskIds.has(dependency.task_id) && taskIds.has(dependency.depends_on_task_id)
  )

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
          parts={parts ?? []}
          tasks={taskList}
          dependencies={scopedDependencies}
        />
      </div>

      <KanbanBoard
        tasks={taskList}
        dependencies={scopedDependencies}
        categories={categories ?? []}
        parts={parts ?? []}
        projectId={params.projectId}
      />
    </div>
  )
}
