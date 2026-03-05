"use server"

import { createClient } from "@/lib/supabase/server"
import type { CategoryWithParts } from "@/lib/types"
import type { ExportPart, ExportTask, ExportSpec } from "@/lib/export-utils"

export async function getExportParts(projectId: string): Promise<ExportPart[]> {
  const supabase = createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("project_id", projectId)

  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name])
  )

  const { data: parts } = await supabase
    .from("parts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at")

  return (parts ?? []).map((p) => ({
    ...p,
    category_name: categoryMap.get(p.category_id) ?? "Uncategorized",
  }))
}

export async function getExportTasks(projectId: string): Promise<ExportTask[]> {
  const supabase = createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("project_id", projectId)

  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name])
  )

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  return (tasks ?? []).map((t) => ({
    ...t,
    category_name: t.category_id ? categoryMap.get(t.category_id) ?? null : null,
  }))
}

export async function getExportSpecs(projectId: string): Promise<ExportSpec[]> {
  const supabase = createClient()

  const [{ data: categories }, { data: parts }, { data: specs }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .eq("project_id", projectId),
      supabase
        .from("parts")
        .select("id, name")
        .eq("project_id", projectId),
      supabase
        .from("specifications")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at"),
    ])

  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name])
  )
  const partMap = new Map(
    (parts ?? []).map((p) => [p.id, p.name])
  )

  return (specs ?? []).map((s) => ({
    ...s,
    category_name: s.category_id ? categoryMap.get(s.category_id) ?? null : null,
    part_name: s.part_id ? partMap.get(s.part_id) ?? null : null,
  }))
}

export async function getExportCostReport(
  projectId: string
): Promise<CategoryWithParts[]> {
  const supabase = createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")

  const { data: parts } = await supabase
    .from("parts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at")

  return (categories ?? []).map((category) => ({
    ...category,
    parts: (parts ?? []).filter((p) => p.category_id === category.id),
  }))
}

export async function getExportProjectInfo(projectId: string) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  return project
}
