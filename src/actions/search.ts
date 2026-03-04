"use server"

import { createClient } from "@/lib/supabase/server"
import type { SearchResult } from "@/lib/types"
import { SEARCH_CONFIG } from "@/lib/constants"

export async function globalSearch(
  query: string
): Promise<{ results: SearchResult[]; error?: string }> {
  if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return { results: [] }
  }

  const supabase = createClient()

  // Convert query to tsquery format: split words and join with &
  const tsquery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ")

  const limit = SEARCH_CONFIG.MAX_RESULTS_PER_TYPE

  const [tasksRes, partsRes, categoriesRes, attachmentsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, project_id")
      .textSearch("fts", tsquery)
      .limit(limit),
    supabase
      .from("parts")
      .select("id, name, vendor, project_id, category_id")
      .textSearch("fts", tsquery)
      .limit(limit),
    supabase
      .from("categories")
      .select("id, name, project_id")
      .textSearch("fts", tsquery)
      .limit(limit),
    supabase
      .from("attachments")
      .select("id, file_name, project_id")
      .textSearch("fts", tsquery)
      .limit(limit),
  ])

  const results: SearchResult[] = []

  for (const task of tasksRes.data ?? []) {
    results.push({
      type: "task",
      id: task.id,
      title: task.title,
      subtitle: task.description?.slice(0, 60) ?? null,
      project_id: task.project_id,
      url: `/projects/${task.project_id}/tasks`,
    })
  }

  for (const part of partsRes.data ?? []) {
    results.push({
      type: "part",
      id: part.id,
      title: part.name,
      subtitle: part.vendor,
      project_id: part.project_id,
      url: `/projects/${part.project_id}/parts`,
    })
  }

  for (const cat of categoriesRes.data ?? []) {
    results.push({
      type: "category",
      id: cat.id,
      title: cat.name,
      subtitle: null,
      project_id: cat.project_id,
      url: `/projects/${cat.project_id}/parts`,
    })
  }

  for (const att of attachmentsRes.data ?? []) {
    results.push({
      type: "attachment",
      id: att.id,
      title: att.file_name,
      subtitle: null,
      project_id: att.project_id,
      url: `/projects/${att.project_id}/media`,
    })
  }

  return { results }
}
