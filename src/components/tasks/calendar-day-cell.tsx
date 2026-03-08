import { cn } from "@/lib/utils"
import { Flag, AlertTriangle, Link2 } from "lucide-react"
import { PRIORITY_COLORS } from "@/lib/constants"
import type { TaskWithDependencies } from "@/lib/types"
import type { CalendarDay } from "@/lib/calendar-utils"

type CalendarDayCellProps = {
  day: CalendarDay
  tasks: TaskWithDependencies[]
  allTasks?: TaskWithDependencies[]
}

function isBlocked(task: TaskWithDependencies, allTasks: TaskWithDependencies[]): boolean {
  if (task.dependencies.length === 0) return false
  return task.dependencies.some((dep) => {
    const blocker = allTasks.find((t) => t.id === dep.depends_on_task_id)
    return blocker && blocker.status !== "done"
  })
}

export function CalendarDayCell({ day, tasks, allTasks }: CalendarDayCellProps) {
  return (
    <div
      className={cn(
        "min-h-[80px] border border-border/50 p-1 text-xs",
        !day.isCurrentMonth && "opacity-30",
        day.isToday && "bg-primary/5 border-primary/30"
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
          day.isToday && "bg-primary text-primary-foreground font-bold"
        )}
      >
        {day.date.getDate()}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className={cn(
              "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
              PRIORITY_COLORS[task.priority] ?? "bg-zinc-500/20 text-zinc-400"
            )}
          >
            <span className="flex items-center gap-0.5">
              {task.is_milestone && <Flag className="h-2.5 w-2.5 shrink-0" />}
              {allTasks && isBlocked(task, allTasks) && (
                <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-400" />
              )}
              {task.dependencies.length > 0 && !isBlocked(task, allTasks ?? []) && (
                <Link2 className="h-2.5 w-2.5 shrink-0 text-zinc-500" />
              )}
              {task.title}
            </span>
          </div>
        ))}
        {tasks.length > 3 && (
          <span className="text-[10px] text-muted-foreground pl-1">
            +{tasks.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}
