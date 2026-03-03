"use client"

import { useState } from "react"
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
import type { CategoryWithParts, Category, PartStatus } from "@/lib/types"

type PartsTableProps = {
  categories: CategoryWithParts[]
  allCategories: Category[]
  projectId: string
}

export function PartsTable({ categories, allCategories, projectId }: PartsTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  )

  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const isOpen = expanded.has(category.id)
        const costs = computeCategoryCost(category.parts)

        return (
          <Collapsible key={category.id} open={isOpen}>
            <div className="rounded-md border">
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
              <CollapsibleContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Part #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Est.</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
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
                      category.parts.map((part) => (
                        <TableRow key={part.id}>
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
                                updatePartStatus(part.id, projectId, value as PartStatus)
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
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:text-destructive"
                                onClick={() => deletePart(part.id, projectId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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
