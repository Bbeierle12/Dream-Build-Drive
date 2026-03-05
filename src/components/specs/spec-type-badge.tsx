import { cn } from "@/lib/utils"
import { SPEC_TYPE_COLORS, SPEC_TYPE_LABELS } from "@/lib/constants"

type SpecTypeBadgeProps = {
  specType: string
  className?: string
}

export function SpecTypeBadge({ specType, className }: SpecTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        SPEC_TYPE_COLORS[specType] ?? "bg-zinc-500/20 text-zinc-400",
        className
      )}
    >
      {SPEC_TYPE_LABELS[specType] ?? specType}
    </span>
  )
}
