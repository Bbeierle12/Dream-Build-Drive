import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProjectSidebar } from "@/components/layout/project-sidebar"
import { ProjectMobileNav } from "@/components/layout/project-mobile-nav"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
    <div className="flex gap-0 lg:gap-6">
      <div className="hidden w-56 shrink-0 lg:block">
        <Link
          href="/"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Garage
        </Link>
        <ProjectSidebar projectId={project.id} projectName={project.name} />
      </div>
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="lg:hidden mb-4">
          <h2 className="text-lg font-bold truncate">{project.name}</h2>
        </div>
        {children}
      </div>
      <ProjectMobileNav projectId={project.id} />
    </div>
  )
}
