import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProjectForm } from "@/components/projects/project-form"
import { updateProject, deleteProject } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function ProjectSettings({
  params,
}: {
  params: { projectId: string }
}) {
  const supabase = createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .single()

  if (!project) notFound()

  const updateWithId = updateProject.bind(null, params.projectId)
  const deleteWithId = deleteProject.bind(null, params.projectId)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage project details</p>
      </div>

      <ProjectForm
        action={updateWithId}
        project={project}
        submitLabel="Save Changes"
      />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this project and all its data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteWithId}>
            <Button variant="destructive" type="submit">
              Delete Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
