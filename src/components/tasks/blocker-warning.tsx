"use client"

import { AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BlockerWarningProps = {
  blockerNames: string[]
}

export function BlockerWarning({ blockerNames }: BlockerWarningProps) {
  if (blockerNames.length === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-orange-400">
            <AlertTriangle className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Blocked by: {blockerNames.join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
