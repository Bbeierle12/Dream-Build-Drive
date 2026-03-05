"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SpecForm } from "./spec-form"
import { SpecTypeBadge } from "./spec-type-badge"
import { deleteSpecification } from "@/actions/specs"
import { FilterDropdown } from "@/components/ui/filter-dropdown"
import { Pencil, Trash2 } from "lucide-react"
import { SPEC_TYPES, SPEC_TYPE_LABELS } from "@/lib/constants"
import type { Specification, Category, Part } from "@/lib/types"

type GroupMode = "category" | "type"

type SpecTableProps = {
  specs: Specification[]
  categories: Category[]
  parts: Part[]
  projectId: string
}

function getGroupKey(
  spec: Specification,
  mode: GroupMode,
  categories: Category[]
): string {
  if (mode === "type") {
    return SPEC_TYPE_LABELS[spec.spec_type] ?? spec.spec_type
  }
  if (!spec.category_id) return "Uncategorized"
  const cat = categories.find((c) => c.id === spec.category_id)
  return cat?.name ?? "Uncategorized"
}

function groupSpecs(
  specs: Specification[],
  mode: GroupMode,
  categories: Category[]
): Map<string, Specification[]> {
  const groups = new Map<string, Specification[]>()
  for (const spec of specs) {
    const key = getGroupKey(spec, mode, categories)
    const list = groups.get(key) ?? []
    list.push(spec)
    groups.set(key, list)
  }
  return groups
}

export function SpecTable({
  specs,
  categories,
  parts,
  projectId,
}: SpecTableProps) {
  const [typeFilter, setTypeFilter] = useState("all")
  const [groupMode, setGroupMode] = useState<GroupMode>("category")

  const typeOptions = SPEC_TYPES.map((t) => ({
    value: t,
    label: SPEC_TYPE_LABELS[t],
  }))

  const filtered =
    typeFilter === "all"
      ? specs
      : specs.filter((s) => s.spec_type === typeFilter)

  const grouped = groupSpecs(filtered, groupMode, categories)
  const partMap = new Map(parts.map((p) => [p.id, p.name]))
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FilterDropdown
          placeholder="All Types"
          value={typeFilter}
          options={typeOptions}
          onChange={setTypeFilter}
        />
        <Button
          variant={groupMode === "category" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setGroupMode("category")}
        >
          By Category
        </Button>
        <Button
          variant={groupMode === "type" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setGroupMode("type")}
        >
          By Type
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No specifications yet. Add one to get started.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([groupName, groupSpecs]) => (
          <div key={groupName} className="rounded-md border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-medium">{groupName}</span>
                <span className="text-xs text-muted-foreground">
                  ({groupSpecs.length})
                </span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  {groupMode === "type" && <TableHead>Category</TableHead>}
                  <TableHead>Part</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupSpecs.map((spec) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium">
                      {spec.label}
                      {spec.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {spec.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {spec.value}
                      {spec.unit && (
                        <span className="text-muted-foreground ml-1">
                          {spec.unit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SpecTypeBadge specType={spec.spec_type} />
                    </TableCell>
                    {groupMode === "type" && (
                      <TableCell className="text-sm">
                        {spec.category_id
                          ? categoryMap.get(spec.category_id) ?? "—"
                          : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      {spec.part_id
                        ? partMap.get(spec.part_id) ?? "—"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <SpecForm
                          projectId={projectId}
                          categories={categories}
                          parts={parts}
                          spec={spec}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          onClick={() =>
                            deleteSpecification(spec.id, projectId)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}
    </div>
  )
}
