import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CalendarView } from "@/components/tasks/calendar-view"
import { TaskForm } from "@/components/tasks/task-form"
import type { TaskWithDependencies, TaskDependency } from "@/lib/types"

export default async function CalendarPage({
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

  const [{ data: categories }, { data: parts }, { data: rawTasks }, { data: deps }] =
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
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("task_dependencies")
        .select("*"),
    ])

  const taskList = rawTasks ?? []
  const allDeps: TaskDependency[] = deps ?? []
  const taskIds = new Set(taskList.map((t) => t.id))

  const tasks: TaskWithDependencies[] = taskList.map((t) => ({
    ...t,
    dependencies: allDeps.filter(
      (d) => d.task_id === t.id && taskIds.has(d.depends_on_task_id),
    ),
    blocked_by: allDeps.filter(
      (d) => d.depends_on_task_id === t.id && taskIds.has(d.task_id),
    ),
  }))

  const scopedDependencies = allDeps.filter(
    (d) => taskIds.has(d.task_id) && taskIds.has(d.depends_on_task_id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View tasks and milestones on a calendar
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

      <CalendarView tasks={tasks} />
    </div>
  )
}
