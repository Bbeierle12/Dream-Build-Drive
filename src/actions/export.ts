"use server"

import { createClient } from "@/lib/supabase/server"
import type { CategoryWithParts } from "@/lib/types"
import type { ExportPart, ExportTask, ExportSpec } from "@/lib/export-utils"

function assertNoError<T>(data: T | null, error: { message: string } | null, fallback: string): T {
  if (error) {
    throw new Error(error.message)
  }

  if (data == null) {
    throw new Error(fallback)
  }

  return data
}

export async function getExportParts(projectId: string): Promise<ExportPart[]> {
  const supabase = createClient()

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("project_id", projectId)
  const safeCategories = assertNoError(categories, categoriesError, "Could not load categories")

  const categoryMap = new Map(
    safeCategories.map((c) => [c.id, c.name])
  )

  const { data: parts, error: partsError } = await supabase
    .from("parts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at")
  const safeParts = assertNoError(parts, partsError, "Could not load parts")

  return safeParts.map((p) => ({
    ...p,
    category_name: categoryMap.get(p.category_id) ?? "Uncategorized",
  }))
}

export async function getExportTasks(projectId: string): Promise<ExportTask[]> {
  const supabase = createClient()

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("project_id", projectId)
  const safeCategories = assertNoError(categories, categoriesError, "Could not load categories")

  const categoryMap = new Map(
    safeCategories.map((c) => [c.id, c.name])
  )

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
  const safeTasks = assertNoError(tasks, tasksError, "Could not load tasks")

  return safeTasks.map((t) => ({
    ...t,
    category_name: t.category_id ? categoryMap.get(t.category_id) ?? null : null,
  }))
}

export async function getExportSpecs(projectId: string): Promise<ExportSpec[]> {
  const supabase = createClient()

  const [{ data: categories, error: categoriesError }, { data: parts, error: partsError }, { data: specs, error: specsError }] =
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
  const safeCategories = assertNoError(categories, categoriesError, "Could not load categories")
  const safeParts = assertNoError(parts, partsError, "Could not load parts")
  const safeSpecs = assertNoError(specs, specsError, "Could not load specifications")

  const categoryMap = new Map(
    safeCategories.map((c) => [c.id, c.name])
  )
  const partMap = new Map(
    safeParts.map((p) => [p.id, p.name])
  )

  return safeSpecs.map((s) => ({
    ...s,
    category_name: s.category_id ? categoryMap.get(s.category_id) ?? null : null,
    part_name: s.part_id ? partMap.get(s.part_id) ?? null : null,
  }))
}

export async function getExportCostReport(
  projectId: string
): Promise<CategoryWithParts[]> {
  const supabase = createClient()

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
  const safeCategories = assertNoError(categories, categoriesError, "Could not load categories")

  const { data: parts, error: partsError } = await supabase
    .from("parts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at")
  const safeParts = assertNoError(parts, partsError, "Could not load parts")

  return safeCategories.map((category) => ({
    ...category,
    parts: safeParts.filter((p) => p.category_id === category.id),
  }))
}

export async function getExportProjectInfo(projectId: string) {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  return assertNoError(project, error, "Could not load project")
}
