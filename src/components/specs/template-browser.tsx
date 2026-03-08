"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SpecTypeBadge } from "./spec-type-badge"
import { applySpecTemplate, applyAllTemplates, getSpecTemplates } from "@/actions/specs"
import { Check, Download, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SpecTemplate, Specification, Category } from "@/lib/types"

const VEHICLE_PLATFORMS = [
  { value: "universal", label: "Universal" },
  { value: "classic-muscle", label: "Classic Muscle" },
  { value: "modern-efi", label: "Modern EFI" },
  { value: "diesel-truck", label: "Diesel Truck" },
]

type TemplateBrowserProps = {
  templates: SpecTemplate[]
  existingSpecs: Specification[]
  categories: Category[]
  projectId: string
}

function groupTemplates(
  templates: SpecTemplate[]
): Map<string, SpecTemplate[]> {
  const groups = new Map<string, SpecTemplate[]>()
  for (const t of templates) {
    const list = groups.get(t.category_name) ?? []
    list.push(t)
    groups.set(t.category_name, list)
  }
  return groups
}

function isApplied(
  template: SpecTemplate,
  existingSpecs: Specification[],
  categories: Category[]
): boolean {
  const cat = categories.find(
    (c) => c.name.toLowerCase() === template.category_name.toLowerCase()
  )
  if (!cat) return false
  return existingSpecs.some(
    (s) =>
      s.category_id === cat.id &&
      s.label.toLowerCase() === template.label.toLowerCase()
  )
}

export function TemplateBrowser({
  templates,
  existingSpecs,
  categories,
  projectId,
}: TemplateBrowserProps) {
  const [isPending, startTransition] = useTransition()
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [platform, setPlatform] = useState("universal")
  const [displayTemplates, setDisplayTemplates] = useState(templates)

  const grouped = groupTemplates(displayTemplates)
  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  )

  function handleApply(template: SpecTemplate) {
    const catId = categoryMap.get(template.category_name.toLowerCase())
    if (!catId) return

    startTransition(async () => {
      const result = await applySpecTemplate(projectId, catId, template)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setAppliedIds((prev) => new Set(prev).add(template.id))
    })
  }

  function handleApplyAll() {
    startTransition(async () => {
      const result = await applyAllTemplates(projectId, categories)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      if (typeof result?.applied === "number") {
        toast.success(
          result.applied > 0
            ? `Applied ${result.applied} template${result.applied === 1 ? "" : "s"}`
            : "No new templates to apply"
        )
      }
    })
  }

  if (displayTemplates.length === 0 && platform === "universal") {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No templates available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            value={platform}
            onValueChange={(value) => {
              setPlatform(value)
              startTransition(async () => {
                const result = await getSpecTemplates(value)
                if (result.data) {
                  setDisplayTemplates(result.data)
                }
              })
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Apply spec templates to your project categories.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleApplyAll}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Apply All
        </Button>
      </div>

      {Array.from(grouped.entries()).map(([categoryName, catTemplates]) => {
        const catId = categoryMap.get(categoryName.toLowerCase())

        return (
          <div key={categoryName} className="rounded-md border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-medium">{categoryName}</span>
                <span className="text-xs text-muted-foreground">
                  ({catTemplates.length} templates)
                </span>
              </div>
              {!catId && (
                <span className="text-xs text-yellow-500">
                  No matching category
                </span>
              )}
            </div>
            <div className="divide-y">
              {catTemplates.map((template) => {
                const alreadyApplied =
                  appliedIds.has(template.id) ||
                  isApplied(template, existingSpecs, categories)

                return (
                  <div
                    key={template.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <SpecTypeBadge specType={template.spec_type} />
                      <span className="text-sm font-medium">
                        {template.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {template.default_value}
                        {template.unit && ` ${template.unit}`}
                      </span>
                    </div>
                    {alreadyApplied ? (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Check className="h-3 w-3" />
                        Applied
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!catId || isPending}
                        onClick={() => handleApply(template)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
