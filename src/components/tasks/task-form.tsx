"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants"
import { createTask, updateTask } from "@/actions/tasks"
import type { Task, Category, TaskDependency, Part } from "@/lib/types"
import { Plus } from "lucide-react"

type TaskFormProps = {
  projectId: string
  categories: Category[]
  parts?: Part[]
  task?: Task
  tasks?: Task[]
  dependencies?: TaskDependency[]
  trigger?: React.ReactNode
}

export function TaskForm({
  projectId,
  categories,
  parts = [],
  task,
  tasks = [],
  dependencies = [],
  trigger,
}: TaskFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dependencyIds = new Set(
    task
      ? dependencies
          .filter((dependency) => dependency.task_id === task.id)
          .map((dependency) => dependency.depends_on_task_id)
      : []
  )
  const dependencyOptions = tasks
    .filter((candidate) => candidate.id !== task?.id)
    .sort((a, b) => a.title.localeCompare(b.title))

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    try {
      const result = task
        ? await updateTask(task.id, projectId, formData)
        : await createTask(projectId, formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={task?.title}
              placeholder="e.g. Install turbo kit"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={task?.status ?? "backlog"}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "medium"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                name="category_id"
                defaultValue={task?.category_id ?? "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="part_id">Part</Label>
              <Select
                name="part_id"
                defaultValue={task?.part_id ?? "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_estimate_min">Time Estimate (min)</Label>
              <Input
                id="time_estimate_min"
                name="time_estimate_min"
                type="number"
                min="0"
                defaultValue={task?.time_estimate_min ?? ""}
                placeholder="60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={task?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={task?.due_date ?? ""}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_milestone"
              name="is_milestone"
              value="true"
              defaultChecked={task?.is_milestone}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="is_milestone">Mark as milestone</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={task?.description ?? ""}
              placeholder="Details about this task..."
              rows={3}
            />
          </div>

          {dependencyOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencies</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {dependencyOptions.map((dependencyTask) => (
                  <label
                    key={dependencyTask.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="dependency_ids"
                      value={dependencyTask.id}
                      defaultChecked={dependencyIds.has(dependencyTask.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {dependencyTask.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {TASK_STATUS_LABELS[dependencyTask.status]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {task && (
            <div className="space-y-2">
              <Label htmlFor="time_actual_min">Actual Time (min)</Label>
              <Input
                id="time_actual_min"
                name="time_actual_min"
                type="number"
                min="0"
                defaultValue={task.time_actual_min ?? ""}
                placeholder="0"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {task ? "Save Changes" : "Add Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
