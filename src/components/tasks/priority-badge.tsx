import { cn } from "@/lib/utils"
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants"

type PriorityBadgeProps = {
  priority: string
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PRIORITY_COLORS[priority] ?? "bg-zinc-500/20 text-zinc-400",
        className
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}
