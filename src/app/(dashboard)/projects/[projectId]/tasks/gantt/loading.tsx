export default function GanttLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-5 w-72 bg-zinc-800/60 rounded animate-pulse mt-2" />
      </div>
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="flex">
          <div className="w-[200px] border-r border-zinc-800 flex-shrink-0">
            <div className="h-12 bg-zinc-900 border-b border-zinc-800" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 border-b border-zinc-800/50 px-3 flex items-center"
              >
                <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="h-12 bg-zinc-900 border-b border-zinc-800" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 border-b border-zinc-800/50 px-4 flex items-center"
              >
                <div
                  className="h-5 bg-zinc-800 rounded animate-pulse"
                  style={{ width: `${30 + Math.random() * 40}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
