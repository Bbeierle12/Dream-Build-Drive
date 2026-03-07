"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { reportError } from "@/lib/error-reporting"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { action: "dashboard.render", meta: { digest: error.digest } })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  )
}
