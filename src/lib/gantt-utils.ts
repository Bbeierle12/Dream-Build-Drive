import type { TaskWithDependencies, Category } from "@/lib/types"
import { GANTT_CONFIG } from "@/lib/constants"

export type DateRange = { start: Date; end: Date }
export type BarPosition = { left: number; width: number }
export type CategoryGroup = {
  category: Category | null
  tasks: TaskWithDependencies[]
}

const ONE_DAY_MS = 86_400_000
const PADDING_DAYS = 7

export function getDateRange(tasks: TaskWithDependencies[]): DateRange {
  const withDates = tasks.filter((t) => t.start_date || t.due_date)

  if (withDates.length === 0) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end }
  }

  let min = Infinity
  let max = -Infinity

  for (const t of withDates) {
    if (t.start_date) {
      const d = new Date(t.start_date).getTime()
      if (d < min) min = d
      if (d > max) max = d
    }
    if (t.due_date) {
      const d = new Date(t.due_date).getTime()
      if (d < min) min = d
      if (d > max) max = d
    }
  }

  return {
    start: new Date(min - PADDING_DAYS * ONE_DAY_MS),
    end: new Date(max + PADDING_DAYS * ONE_DAY_MS),
  }
}

export function getDaysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / ONE_DAY_MS))
}

export function getDateArray(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function getBarPosition(
  task: TaskWithDependencies,
  rangeStart: Date,
  dayWidth: number = GANTT_CONFIG.DAY_WIDTH,
): BarPosition | null {
  if (!task.start_date && !task.due_date) return null

  const startDate = task.start_date
    ? new Date(task.start_date)
    : new Date(task.due_date!)
  const endDate = task.due_date
    ? new Date(task.due_date)
    : new Date(task.start_date!)

  const offsetDays = getDaysBetween(rangeStart, startDate)
  const durationDays = Math.max(1, getDaysBetween(startDate, endDate) + 1)

  const left = (offsetDays - 1) * dayWidth
  const width = Math.max(GANTT_CONFIG.MIN_BAR_WIDTH, durationDays * dayWidth)

  return { left, width }
}

export function groupTasksByCategory(
  tasks: TaskWithDependencies[],
  categories: Category[],
): CategoryGroup[] {
  const map = new Map<string | null, TaskWithDependencies[]>()

  for (const t of tasks) {
    const key = t.category_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }

  const groups: CategoryGroup[] = []

  for (const cat of categories) {
    const catTasks = map.get(cat.id)
    if (catTasks && catTasks.length > 0) {
      groups.push({ category: cat, tasks: catTasks })
      map.delete(cat.id)
    }
  }

  const uncategorized = map.get(null)
  if (uncategorized && uncategorized.length > 0) {
    groups.push({ category: null, tasks: uncategorized })
  }

  // Any remaining tasks with category_ids not in the categories list
  map.forEach((catTasks, key) => {
    if (key !== null && catTasks.length > 0) {
      groups.push({ category: null, tasks: catTasks })
    }
  })

  return groups
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
