import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProjectMobileNav } from "@/components/layout/project-mobile-nav"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { projectId: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", params.projectId)
    .single()

  if (!project) notFound()

  return (
    <div>
      <div className="lg:hidden mb-4">
        <h2 className="text-lg font-bold truncate">{project.name}</h2>
      </div>
      <div className="pb-20 lg:pb-0">{children}</div>
      <ProjectMobileNav projectId={project.id} />
    </div>
  )
}
