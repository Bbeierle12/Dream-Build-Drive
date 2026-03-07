"use client"

import { useState } from "react"
import { toast } from "sonner"
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
import { SPEC_TYPES, SPEC_TYPE_LABELS, SPEC_TYPE_UNITS } from "@/lib/constants"
import { createSpecification, updateSpecification } from "@/actions/specs"
import type { Specification, Category, Part } from "@/lib/types"
import { Plus } from "lucide-react"

type SpecFormProps = {
  projectId: string
  categories: Category[]
  parts: Part[]
  spec?: Specification
  trigger?: React.ReactNode
}

export function SpecForm({
  projectId,
  categories,
  parts,
  spec,
  trigger,
}: SpecFormProps) {
  const [open, setOpen] = useState(false)
  const [specType, setSpecType] = useState<string>(spec?.spec_type ?? "torque")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const unitOptions = SPEC_TYPE_UNITS[specType] ?? [""]

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    try {
      const result = spec
        ? await updateSpecification(spec.id, projectId, formData)
        : await createSpecification(projectId, formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Spec
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {spec ? "Edit Specification" : "Add Specification"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spec_type">Type *</Label>
              <Select
                name="spec_type"
                defaultValue={spec?.spec_type ?? "torque"}
                onValueChange={setSpecType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SPEC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SPEC_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select name="unit" defaultValue={spec?.unit ?? unitOptions[0]}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u) => (
                    <SelectItem key={u || "none"} value={u || "none"}>
                      {u || "None"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              name="label"
              required
              defaultValue={spec?.label}
              placeholder="e.g. Head bolt torque"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value *</Label>
            <Input
              id="value"
              name="value"
              required
              defaultValue={spec?.value}
              placeholder="e.g. 65"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                name="category_id"
                defaultValue={spec?.category_id ?? "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="part_id">Part</Label>
              <Select
                name="part_id"
                defaultValue={spec?.part_id ?? "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={spec?.notes ?? ""}
              placeholder="Any notes about this specification..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {spec ? "Save Changes" : "Add Specification"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
