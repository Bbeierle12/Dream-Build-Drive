"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { normalizeOptionalSelectValue } from "@/lib/form-utils"
import { detectCycle } from "@/lib/task-utils"
import type { TaskDependency, TaskStatus } from "@/lib/types"

function extractDependencyIds(formData: FormData): string[] {
  return Array.from(
    new Set(
      formData
        .getAll("dependency_ids")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function revalidateTaskPaths(projectId: string) {
  revalidatePath(`/projects/${projectId}/tasks`)
  revalidatePath(`/projects/${projectId}/tasks/kanban`)
  revalidatePath(`/projects/${projectId}/tasks/calendar`)
  revalidatePath(`/projects/${projectId}/tasks/gantt`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

async function getProjectDependencies(projectId: string) {
  const supabase = createClient()

  const { data: projectTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)

  if (tasksError) {
    return { error: tasksError.message, taskIds: new Set<string>(), dependencies: [] as TaskDependency[] }
  }

  const taskIds = new Set((projectTasks ?? []).map((task) => task.id))

  const { data: allDependencies, error: depsError } = await supabase
    .from("task_dependencies")
    .select("*")

  if (depsError) {
    return { error: depsError.message, taskIds, dependencies: [] as TaskDependency[] }
  }

  const dependencies = (allDependencies ?? []).filter(
    (dependency) =>
      taskIds.has(dependency.task_id) && taskIds.has(dependency.depends_on_task_id)
  )

  return { taskIds, dependencies }
}

async function validateDependencySelection(
  taskId: string,
  projectId: string,
  dependencyIds: string[]
) {
  if (dependencyIds.includes(taskId)) {
    return { error: "A task cannot depend on itself" }
  }

  const { error, taskIds, dependencies } = await getProjectDependencies(projectId)
  if (error) {
    return { error }
  }

  if (!taskIds.has(taskId)) {
    return { error: "Task not found in this project" }
  }

  const invalidDependency = dependencyIds.find((dependencyId) => !taskIds.has(dependencyId))
  if (invalidDependency) {
    return { error: "Dependencies must belong to the same project" }
  }

  const workingDependencies = dependencies.filter((dependency) => dependency.task_id !== taskId)

  for (const dependencyId of dependencyIds) {
    if (detectCycle(taskId, dependencyId, workingDependencies)) {
      return { error: "This dependency would create a cycle" }
    }

    workingDependencies.push({
      task_id: taskId,
      depends_on_task_id: dependencyId,
    })
  }

  return { dependencyIds }
}

async function replaceTaskDependencies(taskId: string, dependencyIds: string[]) {
  const supabase = createClient()

  const { error: deleteError } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (dependencyIds.length === 0) {
    return {}
  }

  const { error: insertError } = await supabase.from("task_dependencies").insert(
    dependencyIds.map((dependencyId) => ({
      task_id: taskId,
      depends_on_task_id: dependencyId,
    }))
  )

  if (insertError) {
    return { error: insertError.message }
  }

  return {}
}

export async function createTask(projectId: string, formData: FormData) {
  const supabase = createClient()
  const dependencyIds = extractDependencyIds(formData)

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      category_id: normalizeOptionalSelectValue(formData.get("category_id")),
      part_id: normalizeOptionalSelectValue(formData.get("part_id")),
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
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  const validation = await validateDependencySelection(data.id, projectId, dependencyIds)
  if (validation.error) {
    await supabase.from("tasks").delete().eq("id", data.id)
    return { error: validation.error }
  }

  const dependencyResult = await replaceTaskDependencies(data.id, validation.dependencyIds ?? [])
  if (dependencyResult.error) {
    await supabase.from("tasks").delete().eq("id", data.id)
    return dependencyResult
  }

  revalidateTaskPaths(projectId)
}

export async function updateTask(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = createClient()
  const dependencyIds = extractDependencyIds(formData)

  const validation = await validateDependencySelection(taskId, projectId, dependencyIds)
  if (validation.error) {
    return { error: validation.error }
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      category_id: normalizeOptionalSelectValue(formData.get("category_id")),
      part_id: normalizeOptionalSelectValue(formData.get("part_id")),
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

  const dependencyResult = await replaceTaskDependencies(taskId, validation.dependencyIds ?? [])
  if (dependencyResult.error) {
    return dependencyResult
  }

  revalidateTaskPaths(projectId)
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("tasks").delete().eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  revalidateTaskPaths(projectId)
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

  revalidateTaskPaths(projectId)
}

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  const { error, dependencies } = await getProjectDependencies(projectId)
  if (error) {
    return { error }
  }

  const dependencyIds = Array.from(
    new Set(
      dependencies
        .filter((dependency) => dependency.task_id === taskId)
        .map((dependency) => dependency.depends_on_task_id)
        .concat(dependsOnTaskId)
    )
  )

  const validation = await validateDependencySelection(taskId, projectId, dependencyIds)
  if (validation.error) {
    return { error: validation.error }
  }

  const result = await replaceTaskDependencies(taskId, validation.dependencyIds ?? [])
  if (result.error) {
    return result
  }

  revalidateTaskPaths(projectId)
}

export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  const { error, dependencies } = await getProjectDependencies(projectId)
  if (error) {
    return { error }
  }

  const remainingDependencyIds = dependencies
    .filter(
      (dependency) =>
        dependency.task_id === taskId && dependency.depends_on_task_id !== dependsOnTaskId
    )
    .map((dependency) => dependency.depends_on_task_id)

  const result = await replaceTaskDependencies(taskId, remainingDependencyIds)
  if (result.error) {
    return result
  }

  revalidateTaskPaths(projectId)
}
