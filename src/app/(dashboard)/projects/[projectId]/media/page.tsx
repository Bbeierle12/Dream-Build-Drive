import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MediaPageClient } from "./client"

export default async function MediaPage({
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

  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false })

  const [{ data: categories }, { data: parts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("project_id", params.projectId)
      .order("sort_order"),
    supabase
      .from("parts")
      .select("id, name, category_id")
      .eq("project_id", params.projectId)
      .order("name"),
  ])

  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const partMap = new Map((parts ?? []).map((part) => [part.id, part.name]))
  const attachmentsWithDetails = (attachments ?? []).map((attachment) => ({
    ...attachment,
    category_name: attachment.category_id
      ? categoryMap.get(attachment.category_id) ?? null
      : null,
    part_name: attachment.part_id ? partMap.get(attachment.part_id) ?? null : null,
  }))

  return (
    <MediaPageClient
      projectId={params.projectId}
      attachments={attachmentsWithDetails}
      categories={categories ?? []}
      parts={parts ?? []}
    />
  )
}
