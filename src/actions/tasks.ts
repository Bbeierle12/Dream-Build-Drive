"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TaskStatus } from "@/lib/types"

export async function createTask(projectId: string, formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    category_id: (formData.get("category_id") as string) || null,
    part_id: (formData.get("part_id") as string) || null,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    status: (formData.get("status") as TaskStatus) || "backlog",
    priority: (formData.get("priority") as string) || "medium",
    start_date: (formData.get("start_date") as string) || null,
    due_date: (formData.get("due_date") as string) || null,
    is_milestone: formData.get("is_milestone") === "true",
    time_estimate_min: formData.get("time_estimate_min")
      ? Number(formData.get("time_estimate_min"))
      : null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
  revalidatePath(`/projects/${projectId}/tasks/calendar`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function updateTask(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("tasks")
    .update({
      category_id: (formData.get("category_id") as string) || null,
      part_id: (formData.get("part_id") as string) || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as TaskStatus) || "backlog",
      priority: (formData.get("priority") as string) || "medium",
      start_date: (formData.get("start_date") as string) || null,
      due_date: (formData.get("due_date") as string) || null,
      is_milestone: formData.get("is_milestone") === "true",
      time_estimate_min: formData.get("time_estimate_min")
        ? Number(formData.get("time_estimate_min"))
        : null,
      time_actual_min: formData.get("time_actual_min")
        ? Number(formData.get("time_actual_min"))
        : null,
    })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
  revalidatePath(`/projects/${projectId}/tasks/calendar`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = createClient()

  await supabase.from("tasks").delete().eq("id", taskId)

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
  revalidatePath(`/projects/${projectId}/tasks/calendar`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
  revalidatePath(`/projects/${projectId}/tasks/calendar`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  const supabase = createClient()

  const { error } = await supabase.from("task_dependencies").insert({
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
}

export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  const supabase = createClient()

  await supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)
    .eq("depends_on_task_id", dependsOnTaskId)

  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
}
