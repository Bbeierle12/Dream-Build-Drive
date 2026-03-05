import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SpecTable } from "@/components/specs/spec-table"
import { SpecForm } from "@/components/specs/spec-form"
import { TemplateBrowser } from "@/components/specs/template-browser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SpecsPage({
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

  const [
    { data: specs },
    { data: categories },
    { data: parts },
    { data: templates },
  ] = await Promise.all([
    supabase
      .from("specifications")
      .select("*")
      .eq("project_id", params.projectId)
      .order("spec_type")
      .order("label"),
    supabase
      .from("categories")
      .select("*")
      .eq("project_id", params.projectId)
      .order("sort_order"),
    supabase
      .from("parts")
      .select("*")
      .eq("project_id", params.projectId)
      .order("name"),
    supabase
      .from("spec_templates")
      .select("*")
      .eq("vehicle_platform", "universal")
      .order("category_name")
      .order("label"),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Specifications</h1>
          <p className="text-muted-foreground">
            Track torque specs, fluid capacities, clearances, and more
          </p>
        </div>
        <SpecForm
          projectId={params.projectId}
          categories={categories ?? []}
          parts={parts ?? []}
        />
      </div>

      <Tabs defaultValue="specifications">
        <TabsList>
          <TabsTrigger value="specifications">
            Specifications ({(specs ?? []).length})
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications" className="mt-4">
          <SpecTable
            specs={specs ?? []}
            categories={categories ?? []}
            parts={parts ?? []}
            projectId={params.projectId}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplateBrowser
            templates={templates ?? []}
            existingSpecs={specs ?? []}
            categories={categories ?? []}
            projectId={params.projectId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
