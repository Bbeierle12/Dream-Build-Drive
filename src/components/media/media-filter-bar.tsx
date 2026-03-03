"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MediaFilter = "all" | "photos" | "documents"

type MediaFilterBarProps = {
  filter: MediaFilter
  onFilterChange: (filter: MediaFilter) => void
  photoCount: number
  documentCount: number
}

export function MediaFilterBar({
  filter,
  onFilterChange,
  photoCount,
  documentCount,
}: MediaFilterBarProps) {
  const filters: { value: MediaFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: photoCount + documentCount },
    { value: "photos", label: "Photos", count: photoCount },
    { value: "documents", label: "Documents", count: documentCount },
  ]

  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <Button
          key={f.value}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(f.value)}
          className={cn(
            filter === f.value && "bg-accent text-accent-foreground"
          )}
        >
          {f.label}
          <span className="ml-1.5 text-xs text-muted-foreground">
            {f.count}
          </span>
        </Button>
      ))}
    </div>
  )
}
