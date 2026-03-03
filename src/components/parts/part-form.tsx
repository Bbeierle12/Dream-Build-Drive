"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PART_STATUSES } from "@/lib/constants"
import { createPart, updatePart } from "@/actions/parts"
import type { Part, Category } from "@/lib/types"
import { Plus } from "lucide-react"

type PartFormProps = {
  projectId: string
  categories: Category[]
  part?: Part
  defaultCategoryId?: string
  trigger?: React.ReactNode
}

export function PartForm({
  projectId,
  categories,
  part,
  defaultCategoryId,
  trigger,
}: PartFormProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (part) {
      await updatePart(part.id, projectId, formData)
    } else {
      const categoryId = formData.get("category_id") as string
      await createPart(projectId, categoryId, formData)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Part
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{part ? "Edit Part" : "Add Part"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Part Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={part?.name}
              placeholder="e.g. Turbo manifold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                name="category_id"
                defaultValue={part?.category_id ?? defaultCategoryId ?? categories[0]?.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={part?.status ?? "researching"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PART_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                name="estimated_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={part?.estimated_cost ?? ""}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_cost">Actual Cost ($)</Label>
              <Input
                id="actual_cost"
                name="actual_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={part?.actual_cost ?? ""}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="part_number">Part Number</Label>
              <Input
                id="part_number"
                name="part_number"
                defaultValue={part?.part_number ?? ""}
                placeholder="ABC-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                name="vendor"
                defaultValue={part?.vendor ?? ""}
                placeholder="Summit Racing"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_url">Vendor URL</Label>
            <Input
              id="vendor_url"
              name="vendor_url"
              type="url"
              defaultValue={part?.vendor_url ?? ""}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={part?.notes ?? ""}
              placeholder="Any notes about this part..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            {part ? "Save Changes" : "Add Part"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
