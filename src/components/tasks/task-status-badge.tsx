import { cn } from "@/lib/utils"
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/constants"

type TaskStatusBadgeProps = {
  status: string
  className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TASK_STATUS_COLORS[status] ?? "bg-zinc-500/20 text-zinc-400",
        className
      )}
    >
      {TASK_STATUS_LABELS[status] ?? status}
    </span>
  )
}
