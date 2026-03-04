import { Skeleton } from "@/components/ui/skeleton"

export default function KanbanLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[280px] space-y-3">
            <Skeleton className="h-8 w-full rounded-md" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-28 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
