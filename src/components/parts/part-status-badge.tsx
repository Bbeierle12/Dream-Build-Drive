import { Badge } from "@/components/ui/badge"
import { STATUS_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { PartStatus } from "@/lib/types"

type PartStatusBadgeProps = {
  status: PartStatus
}

export function PartStatusBadge({ status }: PartStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("capitalize", STATUS_COLORS[status])}
    >
      {status}
    </Badge>
  )
}
