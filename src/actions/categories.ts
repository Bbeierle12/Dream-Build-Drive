"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createCategory(projectId: string, name: string) {
  const supabase = createClient()

  // Get the max sort_order for this project
  const { data: existing } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase
    .from("categories")
    .insert({
      project_id: projectId,
      name,
      sort_order: nextOrder,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function updateCategory(categoryId: string, projectId: string, name: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteCategory(categoryId: string, projectId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function reorderCategories(
  projectId: string,
  orderedIds: string[]
) {
  const supabase = createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
  )

  await Promise.all(updates)
  revalidatePath(`/projects/${projectId}`)
}
