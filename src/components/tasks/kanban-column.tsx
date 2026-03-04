"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import { KanbanCard } from "./kanban-card"
import type { Task } from "@/lib/types"

type KanbanColumnProps = {
  status: string
  tasks: Task[]
  categoryMap: Map<string, string>
  blockerMap: Map<string, string[]>
}

export function KanbanColumn({
  status,
  tasks,
  categoryMap,
  blockerMap,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[260px] w-[260px] rounded-lg border bg-accent/30 p-2",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <h3 className="text-sm font-semibold">
          {TASK_STATUS_LABELS[status] ?? status}
        </h3>
        <span className="text-xs text-muted-foreground bg-accent rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              categoryName={
                task.category_id ? categoryMap.get(task.category_id) ?? null : null
              }
              blockerNames={blockerMap.get(task.id) ?? []}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
