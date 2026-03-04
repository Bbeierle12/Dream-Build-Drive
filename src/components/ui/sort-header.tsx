"use client"

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SortDirection = "asc" | "desc" | null

type SortHeaderProps = {
  label: string
  field: string
  currentField: string | null
  direction: SortDirection
  onSort: (field: string) => void
  className?: string
}

export function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  className,
}: SortHeaderProps) {
  const isActive = currentField === field

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className={cn("h-8 -ml-3 font-medium", className)}
    >
      {label}
      {isActive && direction === "asc" ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : isActive && direction === "desc" ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  )
}
