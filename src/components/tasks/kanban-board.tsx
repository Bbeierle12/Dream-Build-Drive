"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KANBAN_COLUMNS } from "@/lib/constants"
import { updateTaskStatus } from "@/actions/tasks"
import { toast } from "sonner"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import type { Task, TaskDependency, Category, TaskStatus, Part } from "@/lib/types"

type KanbanBoardProps = {
  tasks: Task[]
  dependencies: TaskDependency[]
  categories: Category[]
  parts: Part[]
  projectId: string
}

export function KanbanBoard({
  tasks: initialTasks,
  dependencies,
  categories,
  parts,
  projectId,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const partMap = new Map(parts.map((part) => [part.id, part.name]))

  const blockerMap = new Map<string, string[]>()
  for (const dep of dependencies) {
    const blocker = tasks.find((t) => t.id === dep.depends_on_task_id)
    if (blocker && blocker.status !== "done") {
      const existing = blockerMap.get(dep.task_id) ?? []
      existing.push(blocker.title)
      blockerMap.set(dep.task_id, existing)
    }
  }

  const tasksByStatus = new Map<string, Task[]>()
  for (const col of KANBAN_COLUMNS) {
    tasksByStatus.set(
      col.id,
      tasks.filter((t) => t.status === col.id)
    )
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    // Determine the target column
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
    const targetStatus = isColumn
      ? overId
      : tasks.find((t) => t.id === overId)?.status

    if (!targetStatus) return

    const currentTask = tasks.find((t) => t.id === activeTaskId)
    if (!currentTask || currentTask.status === targetStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId ? { ...t, status: targetStatus as TaskStatus } : t
      )
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const task = tasks.find((t) => t.id === (active.id as string))
    const originalTask = initialTasks.find((t) => t.id === (active.id as string))
    if (!task || !originalTask) return

    // If status actually changed, persist to DB
    if (task.status !== originalTask.status) {
      const result = await updateTaskStatus(task.id, projectId, task.status)
      if (result?.error) {
        toast.error(result.error)
        setTasks(initialTasks)
      }
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No tasks yet. Create a task to start using the kanban board.
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            tasks={tasksByStatus.get(col.id) ?? []}
            categoryMap={categoryMap}
            partMap={partMap}
            blockerMap={blockerMap}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            categoryName={
              activeTask.category_id
                ? categoryMap.get(activeTask.category_id) ?? null
                : null
            }
            partName={
              activeTask.part_id
                ? partMap.get(activeTask.part_id) ?? null
                : null
            }
            blockerNames={blockerMap.get(activeTask.id) ?? []}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
