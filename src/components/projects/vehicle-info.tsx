import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/types"

type VehicleInfoProps = {
  project: Project
}

export function VehicleInfo({ project }: VehicleInfoProps) {
  const vehicle = [project.year, project.make, project.model, project.trim]
    .filter(Boolean)
    .join(" ")

  const fields = [
    { label: "Vehicle", value: vehicle || "Not specified" },
    { label: "VIN", value: project.vin },
    { label: "Color", value: project.color },
  ].filter((f) => f.value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vehicle Info</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between">
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="text-sm font-mono">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
