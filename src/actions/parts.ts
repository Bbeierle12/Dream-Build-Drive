"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { PartStatus } from "@/lib/types"

export async function createPart(
  projectId: string,
  categoryId: string,
  formData: FormData
) {
  const supabase = createClient()

  const { error } = await supabase.from("parts").insert({
    project_id: projectId,
    category_id: categoryId,
    name: formData.get("name") as string,
    part_number: (formData.get("part_number") as string) || null,
    vendor: (formData.get("vendor") as string) || null,
    vendor_url: (formData.get("vendor_url") as string) || null,
    estimated_cost: formData.get("estimated_cost")
      ? Number(formData.get("estimated_cost"))
      : null,
    actual_cost: formData.get("actual_cost")
      ? Number(formData.get("actual_cost"))
      : null,
    status: (formData.get("status") as PartStatus) || "researching",
    notes: (formData.get("notes") as string) || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/parts`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function updatePart(
  partId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("parts")
    .update({
      name: formData.get("name") as string,
      part_number: (formData.get("part_number") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      vendor_url: (formData.get("vendor_url") as string) || null,
      estimated_cost: formData.get("estimated_cost")
        ? Number(formData.get("estimated_cost"))
        : null,
      actual_cost: formData.get("actual_cost")
        ? Number(formData.get("actual_cost"))
        : null,
      status: (formData.get("status") as PartStatus) || "researching",
      notes: (formData.get("notes") as string) || null,
      category_id: formData.get("category_id") as string,
    })
    .eq("id", partId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/parts`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function deletePart(partId: string, projectId: string) {
  const supabase = createClient()

  await supabase.from("parts").delete().eq("id", partId)

  revalidatePath(`/projects/${projectId}/parts`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function updatePartStatus(
  partId: string,
  projectId: string,
  status: PartStatus
) {
  const supabase = createClient()

  await supabase.from("parts").update({ status }).eq("id", partId)

  revalidatePath(`/projects/${projectId}/parts`)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}
