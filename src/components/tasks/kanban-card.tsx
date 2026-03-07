"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Flag, Clock, GripVertical } from "lucide-react"
import { PriorityBadge } from "./priority-badge"
import { BlockerWarning } from "./blocker-warning"
import { formatTimeEstimate } from "@/lib/task-utils"
import type { Task } from "@/lib/types"

type KanbanCardProps = {
  task: Task
  categoryName: string | null
  partName?: string | null
  blockerNames: string[]
}

export function KanbanCard({ task, categoryName, partName, blockerNames }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border bg-card p-3 shadow-sm space-y-2"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {task.is_milestone && (
            <Flag className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{task.title}</span>
        </div>
        <BlockerWarning blockerNames={blockerNames} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {categoryName && (
          <span className="text-xs text-muted-foreground bg-accent rounded px-1.5 py-0.5">
            {categoryName}
          </span>
        )}
        {partName && (
          <span className="text-xs text-muted-foreground bg-accent rounded px-1.5 py-0.5">
            {partName}
          </span>
        )}
      </div>

      {(task.due_date || task.time_estimate_min) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.due_date && <span className="font-mono">{task.due_date}</span>}
          {task.time_estimate_min && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeEstimate(task.time_estimate_min)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
