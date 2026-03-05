"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { SpecType, SpecTemplate, Category } from "@/lib/types"

export async function getSpecifications(projectId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("specifications")
    .select("*")
    .eq("project_id", projectId)
    .order("spec_type")
    .order("label")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createSpecification(
  projectId: string,
  formData: FormData
) {
  const supabase = createClient()

  const { error } = await supabase.from("specifications").insert({
    project_id: projectId,
    spec_type: formData.get("spec_type") as SpecType,
    label: formData.get("label") as string,
    value: formData.get("value") as string,
    unit: (formData.get("unit") as string) || null,
    notes: (formData.get("notes") as string) || null,
    part_id: (formData.get("part_id") as string) || null,
    category_id: (formData.get("category_id") as string) || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/specs`)
  revalidatePath(`/projects/${projectId}`)
}

export async function updateSpecification(
  specId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("specifications")
    .update({
      spec_type: formData.get("spec_type") as SpecType,
      label: formData.get("label") as string,
      value: formData.get("value") as string,
      unit: (formData.get("unit") as string) || null,
      notes: (formData.get("notes") as string) || null,
      part_id: (formData.get("part_id") as string) || null,
      category_id: (formData.get("category_id") as string) || null,
    })
    .eq("id", specId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/specs`)
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteSpecification(specId: string, projectId: string) {
  const supabase = createClient()

  await supabase.from("specifications").delete().eq("id", specId)

  revalidatePath(`/projects/${projectId}/specs`)
  revalidatePath(`/projects/${projectId}`)
}

export async function getSpecTemplates(vehiclePlatform?: string) {
  const supabase = createClient()

  const platform = vehiclePlatform || "universal"
  const { data, error } = await supabase
    .from("spec_templates")
    .select("*")
    .eq("vehicle_platform", platform)
    .order("category_name")
    .order("label")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function applySpecTemplate(
  projectId: string,
  categoryId: string,
  template: SpecTemplate
) {
  const supabase = createClient()

  const { error } = await supabase.from("specifications").insert({
    project_id: projectId,
    category_id: categoryId,
    spec_type: template.spec_type,
    label: template.label,
    value: template.default_value,
    unit: template.unit,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/specs`)
  revalidatePath(`/projects/${projectId}`)
}

export async function applyAllTemplates(
  projectId: string,
  categories: Category[]
) {
  const supabase = createClient()

  const { data: templates } = await supabase
    .from("spec_templates")
    .select("*")
    .eq("vehicle_platform", "universal")

  if (!templates || templates.length === 0) {
    return { error: "No templates found" }
  }

  // Build a map of category name -> id
  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  )

  // Get existing specs to avoid duplicates
  const { data: existingSpecs } = await supabase
    .from("specifications")
    .select("label, category_id")
    .eq("project_id", projectId)

  const existingSet = new Set(
    (existingSpecs ?? []).map((s) => `${s.category_id}:${s.label}`)
  )

  const inserts = templates
    .map((t) => {
      const catId = categoryMap.get(t.category_name.toLowerCase())
      if (!catId) return null
      if (existingSet.has(`${catId}:${t.label}`)) return null
      return {
        project_id: projectId,
        category_id: catId,
        spec_type: t.spec_type,
        label: t.label,
        value: t.default_value,
        unit: t.unit,
      }
    })
    .filter(Boolean)

  if (inserts.length === 0) {
    return { applied: 0 }
  }

  const { error } = await supabase.from("specifications").insert(inserts)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/specs`)
  revalidatePath(`/projects/${projectId}`)
  return { applied: inserts.length }
}
