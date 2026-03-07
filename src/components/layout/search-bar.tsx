"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { globalSearch } from "@/actions/search"
import { SearchResults } from "./search-results"
import { SEARCH_CONFIG } from "@/lib/constants"
import type { SearchResult } from "@/lib/types"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      const { results: searchResults } = await globalSearch(query)
      setResults(searchResults)
      setIsOpen(true)
      setIsLoading(false)
    }, SEARCH_CONFIG.DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks, parts, specs, media..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          className="pl-9 h-9"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : (
            <SearchResults
              results={results}
              onSelect={() => {
                setIsOpen(false)
                setQuery("")
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
