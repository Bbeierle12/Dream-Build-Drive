"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "./search-bar"

export function MobileSearchToggle() {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isExpanded) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
        <div className="flex-1">
          <SearchBar />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] p-0 shrink-0"
          onClick={() => setIsExpanded(false)}
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden min-h-[44px] min-w-[44px] p-0"
      onClick={() => setIsExpanded(true)}
      aria-label="Open search"
    >
      <Search className="h-5 w-5" />
    </Button>
  )
}
