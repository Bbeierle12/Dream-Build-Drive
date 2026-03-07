"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PartForm } from "./part-form"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { deletePart, updatePartStatus } from "@/actions/parts"
import { formatCurrency, computeCategoryCost } from "@/lib/utils"
import { ChevronDown, ChevronRight, Pencil, Trash2, ExternalLink } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PART_STATUSES } from "@/lib/constants"
import { FilterDropdown } from "@/components/ui/filter-dropdown"
import { SortHeader } from "@/components/ui/sort-header"
import type { CategoryWithParts, Category, Part, PartStatus } from "@/lib/types"

type SortDirection = "asc" | "desc" | null

type PartsTableProps = {
  categories: CategoryWithParts[]
  allCategories: Category[]
  projectId: string
}

function sortParts(parts: Part[], field: string | null, direction: SortDirection): Part[] {
  if (!field || !direction) return parts
  return [...parts].sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null
    if (field === "name") { aVal = a.name; bVal = b.name }
    else if (field === "status") { aVal = a.status; bVal = b.status }
    else if (field === "estimated_cost") { aVal = a.estimated_cost; bVal = b.estimated_cost }
    else if (field === "actual_cost") { aVal = a.actual_cost; bVal = b.actual_cost }
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return direction === "asc" ? -1 : 1
    if (aVal > bVal) return direction === "asc" ? 1 : -1
    return 0
  })
}

export function PartsTable({ categories, allCategories, projectId }: PartsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  )
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSort(field: string) {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") { setSortField(null); setSortDirection(null) }
      else setSortDirection("asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  async function handleStatusChange(partId: string, status: PartStatus) {
    const result = await updatePartStatus(partId, projectId, status)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  const statusOptions = PART_STATUSES.map((s) => ({ value: s, label: s }))

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <FilterDropdown
          placeholder="All Statuses"
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
        />
      </div>
      {categories.map((category) => {
        const isOpen = expanded.has(category.id)
        const costs = computeCategoryCost(category.parts)

        return (
          <Collapsible key={category.id} open={isOpen}>
            <div id={`category-${category.id}`} className="deeplink-target rounded-md border">
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.parts.length} parts)
                    </span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatCurrency(costs.actual)} / {formatCurrency(costs.projected)}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortHeader label="Part" field="name" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>
                        <SortHeader label="Status" field="status" currentField={sortField} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortHeader label="Est." field="estimated_cost" currentField={sortField} direction={sortDirection} onSort={handleSort} className="justify-end" />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortHeader label="Actual" field="actual_cost" currentField={sortField} direction={sortDirection} onSort={handleSort} className="justify-end" />
                      </TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.parts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-4"
                        >
                          No parts in this category.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortParts(
                        statusFilter === "all"
                          ? category.parts
                          : category.parts.filter((p) => p.status === statusFilter),
                        sortField,
                        sortDirection
                      ).map((part) => (
                        <TableRow key={part.id} id={`part-${part.id}`} className="deeplink-target">
                          <TableCell className="font-medium">
                            {part.name}
                            {part.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {part.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {part.part_number || "—"}
                          </TableCell>
                          <TableCell>
                            {part.vendor_url ? (
                              <a
                                href={part.vendor_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline text-sm"
                              >
                                {part.vendor || "Link"}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-sm">{part.vendor || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={part.status}
                              onValueChange={(value) =>
                                handleStatusChange(part.id, value as PartStatus)
                              }
                            >
                              <SelectTrigger className="h-7 w-[120px]">
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
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {part.estimated_cost != null
                              ? formatCurrency(part.estimated_cost)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {part.actual_cost != null
                              ? formatCurrency(part.actual_cost)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <PartForm
                                projectId={projectId}
                                categories={allCategories}
                                part={part}
                                trigger={
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 min-h-[44px] min-w-[44px]" aria-label={`Edit ${part.name}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <ConfirmDeleteDialog
                                title={`Delete "${part.name}"?`}
                                description="This part and its data will be permanently removed."
                                onConfirm={async () => {
                                  const result = await deletePart(part.id, projectId)
                                  if (result?.error) {
                                    toast.error(result.error)
                                    throw new Error(result.error)
                                  }
                                }}
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 min-h-[44px] min-w-[44px] hover:text-destructive"
                                    aria-label={`Delete ${part.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}
