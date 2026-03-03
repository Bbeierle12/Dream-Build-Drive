"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/types"

type ProjectFormProps = {
  action: (formData: FormData) => void
  project?: Project
  submitLabel?: string
}

export function ProjectForm({
  action,
  project,
  submitLabel = "Create Project",
}: ProjectFormProps) {
  return (
    <form action={action}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={project?.name}
                placeholder="e.g. LS Swap S14"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.budget ?? ""}
                placeholder="10000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Build Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={project?.notes ?? ""}
                placeholder="What's the vision for this build?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max="2100"
                  defaultValue={project?.year ?? ""}
                  placeholder="1995"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  name="make"
                  defaultValue={project?.make ?? ""}
                  placeholder="Nissan"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  defaultValue={project?.model ?? ""}
                  placeholder="240SX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  name="trim"
                  defaultValue={project?.trim ?? ""}
                  placeholder="SE"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  name="vin"
                  defaultValue={project?.vin ?? ""}
                  placeholder="JN1..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  defaultValue={project?.color ?? ""}
                  placeholder="Super Black"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
