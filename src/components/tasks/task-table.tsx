"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Flag } from "lucide-react"
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { updateTaskStatus, deleteTask } from "@/actions/tasks"
import { formatTimeEstimate } from "@/lib/task-utils"
import { TaskForm } from "./task-form"
import { PriorityBadge } from "./priority-badge"
import { BlockerWarning } from "./blocker-warning"
import { TaskFilters } from "./task-filters"
import type { Task, TaskDependency, Category, TaskStatus, Part } from "@/lib/types"

type TaskTableProps = {
  tasks: Task[]
  dependencies: TaskDependency[]
  categories: Category[]
  parts: Part[]
  projectId: string
}

export function TaskTable({
  tasks,
  dependencies,
  categories,
  parts,
  projectId,
}: TaskTableProps) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const blockerMap = new Map<string, string[]>()
  for (const dep of dependencies) {
    const blockerTask = tasks.find((t) => t.id === dep.depends_on_task_id)
    if (blockerTask && blockerTask.status !== "done") {
      const existing = blockerMap.get(dep.task_id) ?? []
      existing.push(blockerTask.title)
      blockerMap.set(dep.task_id, existing)
    }
  }

  const filtered = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false
    if (categoryFilter !== "all" && task.category_id !== categoryFilter) return false
    return true
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const partMap = new Map(parts.map((part) => [part.id, part.name]))

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const result = await updateTaskStatus(taskId, projectId, status)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <TaskFilters
        categories={categories}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Est.</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => (
                <TableRow key={task.id} id={`task-${task.id}`} className="deeplink-target">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {task.is_milestone && (
                        <Flag className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium">{task.title}</span>
                        {task.part_id && (
                          <p className="text-xs text-muted-foreground">
                            {partMap.get(task.part_id) ?? "Linked part"}
                          </p>
                        )}
                      </div>
                      <BlockerWarning blockerNames={blockerMap.get(task.id) ?? []} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value as TaskStatus)
                      }
                    >
                      <SelectTrigger className="h-7 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {TASK_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {task.category_id ? categoryMap.get(task.category_id) ?? "—" : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {task.due_date ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {task.time_estimate_min
                      ? formatTimeEstimate(task.time_estimate_min)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TaskForm
                        projectId={projectId}
                        categories={categories}
                        parts={parts}
                        tasks={tasks}
                        dependencies={dependencies}
                        task={task}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px]" aria-label={`Edit ${task.title}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <ConfirmDeleteDialog
                        title={`Delete "${task.title}"?`}
                        description="This task will be permanently removed."
                        onConfirm={async () => {
                          const result = await deleteTask(task.id, projectId)
                          if (result?.error) {
                            toast.error(result.error)
                            throw new Error(result.error)
                          }
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 min-h-[44px] min-w-[44px] text-destructive"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>
    </div>
  )
}
