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

  return (
    <MediaPageClient
      projectId={params.projectId}
      attachments={attachments ?? []}
    />
  )
}
