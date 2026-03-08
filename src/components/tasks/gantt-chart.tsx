"use client"

import { useEffect, useRef, useState } from "react"
import type { TaskWithDependencies, Category } from "@/lib/types"
import { GANTT_CONFIG } from "@/lib/constants"
import {
  getDateRange,
  getDateArray,
  getBarPosition,
  groupTasksByCategory,
  isWeekend,
  getDaysBetween,
} from "@/lib/gantt-utils"
import { computeCriticalPath } from "@/lib/task-utils"
import { updateTask } from "@/actions/tasks"
import { addDaysToDate } from "@/lib/gantt-drag-utils"
import { GanttHeader } from "./gantt-header"
import { GanttBar } from "./gantt-bar"
import { ChevronDown, ChevronRight } from "lucide-react"

type GanttChartProps = {
  tasks: TaskWithDependencies[]
  categories: Category[]
}

export function GanttChart({ tasks, categories }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const tasksWithDates = tasks.filter((t) => t.start_date || t.due_date)

  const { start: rangeStart, end: rangeEnd } = getDateRange(tasks)
  const days = getDateArray(rangeStart, rangeEnd)
  const totalWidth = days.length * GANTT_CONFIG.DAY_WIDTH
  const groups = groupTasksByCategory(tasks, categories)
  const criticalPath = computeCriticalPath(tasks)

  async function handleDragReschedule(taskId: string, daysDelta: number) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const formData = new FormData()
    formData.set("title", task.title)
    formData.set("status", task.status)
    formData.set("priority", task.priority)
    if (task.start_date) formData.set("start_date", addDaysToDate(task.start_date, daysDelta))
    if (task.due_date) formData.set("due_date", addDaysToDate(task.due_date, daysDelta))
    if (task.category_id) formData.set("category_id", task.category_id)
    if (task.part_id) formData.set("part_id", task.part_id)
    if (task.description) formData.set("description", task.description)
    if (task.is_milestone) formData.set("is_milestone", "true")
    if (task.time_estimate_min != null) formData.set("time_estimate_min", String(task.time_estimate_min))
    if (task.time_actual_min != null) formData.set("time_actual_min", String(task.time_actual_min))

    for (const dep of task.dependencies) {
      formData.append("dependency_ids", dep.depends_on_task_id)
    }

    await updateTask(taskId, task.project_id, formData)
  }

  // Auto-scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const today = new Date()
    const dayOffset = getDaysBetween(rangeStart, today)
    const scrollTo = Math.max(0, (dayOffset - 5) * GANTT_CONFIG.DAY_WIDTH)
    scrollRef.current.scrollLeft = scrollTo
  }, [rangeStart])

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-zinc-700">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            No tasks with dates found.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Add start dates and due dates to your tasks to see them here.
          </p>
        </div>
      </div>
    )
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Build flat row list for rendering
  const rows: { type: "header" | "task"; task?: TaskWithDependencies; label?: string; groupKey: string }[] = []
  for (const group of groups) {
    const key = group.category?.id ?? "__uncategorized"
    const label = group.category?.name ?? "Uncategorized"
    rows.push({ type: "header", label, groupKey: key })
    if (!collapsed.has(key)) {
      for (const t of group.tasks) {
        rows.push({ type: "task", task: t, groupKey: key })
      }
    }
  }

  // Build task id -> row index map for dependency lines
  const taskRowIndex = new Map<string, number>()
  let rowIdx = 0
  for (const row of rows) {
    if (row.type === "task" && row.task) {
      taskRowIndex.set(row.task.id, rowIdx)
    }
    rowIdx++
  }

  const totalHeight = rows.length * GANTT_CONFIG.ROW_HEIGHT

  // Today marker position
  const today = new Date()
  const todayOffset = getDaysBetween(rangeStart, today)
  const todayX = (todayOffset - 1) * GANTT_CONFIG.DAY_WIDTH + GANTT_CONFIG.DAY_WIDTH / 2

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
      <div className="flex">
        {/* Left sidebar */}
        <div
          className="flex-shrink-0 border-r border-zinc-800 bg-zinc-950 z-10"
          style={{ width: 200 }}
        >
          <div
            className="border-b border-zinc-800 px-3 flex items-center text-xs font-semibold text-muted-foreground"
            style={{ height: GANTT_CONFIG.HEADER_HEIGHT }}
          >
            Task
          </div>
          <div>
            {rows.map((row, i) => (
              <div
                key={`sidebar-${i}`}
                className={`flex items-center border-b border-zinc-800/50 ${
                  row.type === "header" ? "bg-zinc-900/50" : ""
                }`}
                style={{ height: GANTT_CONFIG.ROW_HEIGHT }}
              >
                {row.type === "header" ? (
                  <button
                    onClick={() => toggleGroup(row.groupKey)}
                    className="flex items-center gap-1 px-3 text-xs font-semibold text-zinc-300 w-full hover:text-zinc-100"
                  >
                    {collapsed.has(row.groupKey) ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {row.label}
                  </button>
                ) : (
                  <span className="px-5 text-xs text-zinc-400 truncate">
                    {row.task?.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right scrollable area */}
        <div ref={scrollRef} className="overflow-x-auto flex-1">
          <GanttHeader rangeStart={rangeStart} rangeEnd={rangeEnd} />
          <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
            {/* Weekend columns */}
            {days.map((d, i) =>
              isWeekend(d) ? (
                <div
                  key={`wk-${i}`}
                  className="absolute top-0 bottom-0 bg-zinc-900/40"
                  style={{
                    left: i * GANTT_CONFIG.DAY_WIDTH,
                    width: GANTT_CONFIG.DAY_WIDTH,
                  }}
                />
              ) : null,
            )}

            {/* Row lines */}
            {rows.map((_, i) => (
              <div
                key={`row-${i}`}
                className="absolute left-0 right-0 border-b border-zinc-800/50"
                style={{ top: (i + 1) * GANTT_CONFIG.ROW_HEIGHT - 1 }}
              />
            ))}

            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-500/70 z-20 pointer-events-none"
              style={{ left: todayX }}
            />

            {/* Task bars */}
            {rows.map((row, i) => {
              if (row.type !== "task" || !row.task) return null
              const pos = getBarPosition(row.task, rangeStart)
              if (!pos) return null
              return (
                <div
                  key={`bar-${row.task.id}`}
                  className="absolute"
                  style={{
                    top: i * GANTT_CONFIG.ROW_HEIGHT,
                    height: GANTT_CONFIG.ROW_HEIGHT,
                    left: 0,
                    right: 0,
                  }}
                >
                  <GanttBar task={row.task} position={pos} isCritical={criticalPath.has(row.task.id)} onDragReschedule={handleDragReschedule} />
                </div>
              )
            })}

            {/* Dependency lines (SVG) */}
            <svg
              className="absolute top-0 left-0 pointer-events-none z-10"
              style={{ width: totalWidth, height: totalHeight }}
            >
              {tasks.flatMap((task) =>
                task.dependencies.map((dep) => {
                  const fromIdx = taskRowIndex.get(dep.depends_on_task_id)
                  const toIdx = taskRowIndex.get(task.id)
                  if (fromIdx === undefined || toIdx === undefined) return null

                  const fromTask = tasks.find((t) => t.id === dep.depends_on_task_id)
                  if (!fromTask) return null

                  const fromPos = getBarPosition(fromTask, rangeStart)
                  const toPos = getBarPosition(task, rangeStart)
                  if (!fromPos || !toPos) return null

                  const fromX = fromPos.left + fromPos.width
                  const fromY = fromIdx * GANTT_CONFIG.ROW_HEIGHT + GANTT_CONFIG.ROW_HEIGHT / 2
                  const toX = toPos.left
                  const toY = toIdx * GANTT_CONFIG.ROW_HEIGHT + GANTT_CONFIG.ROW_HEIGHT / 2
                  const midX = (fromX + toX) / 2

                  const isCriticalEdge = criticalPath.has(dep.depends_on_task_id) && criticalPath.has(task.id)
                  const strokeColor = isCriticalEdge ? "#ef4444" : "#71717a"

                  return (
                    <g key={`dep-${dep.depends_on_task_id}-${task.id}`}>
                      <path
                        d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                      />
                      <polygon
                        points={`${toX},${toY} ${toX - 5},${toY - 3} ${toX - 5},${toY + 3}`}
                        fill={strokeColor}
                      />
                    </g>
                  )
                }),
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
