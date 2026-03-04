import Link from "next/link"
import { ListTodo, Package, FolderOpen, Paperclip } from "lucide-react"
import type { SearchResult } from "@/lib/types"

type SearchResultsProps = {
  results: SearchResult[]
  onSelect: () => void
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  task: { label: "Tasks", icon: ListTodo },
  part: { label: "Parts", icon: Package },
  category: { label: "Categories", icon: FolderOpen },
  attachment: { label: "Media", icon: Paperclip },
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No results found
      </div>
    )
  }

  // Group by type
  const grouped = new Map<string, SearchResult[]>()
  for (const r of results) {
    const list = grouped.get(r.type) ?? []
    list.push(r)
    grouped.set(r.type, list)
  }

  return (
    <div className="py-1">
      {Array.from(grouped.entries()).map(([type, items]) => {
        const config = TYPE_CONFIG[type]
        const Icon = config?.icon ?? Package
        return (
          <div key={type}>
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {config?.label ?? type}
            </div>
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={onSelect}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      })}
    </div>
  )
}
