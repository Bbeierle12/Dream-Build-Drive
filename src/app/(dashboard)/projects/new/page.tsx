import { ProjectForm } from "@/components/projects/project-form"
import { createProject } from "@/actions/projects"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Build</h1>
          <p className="text-muted-foreground">Add a new project to your garage</p>
        </div>
      </div>

      <ProjectForm action={createProject} />
    </div>
  )
}
