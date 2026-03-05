"use client"

import { getDateArray, isWeekend } from "@/lib/gantt-utils"
import { GANTT_CONFIG } from "@/lib/constants"

type GanttHeaderProps = {
  rangeStart: Date
  rangeEnd: Date
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function GanttHeader({ rangeStart, rangeEnd }: GanttHeaderProps) {
  const days = getDateArray(rangeStart, rangeEnd)
  const totalWidth = days.length * GANTT_CONFIG.DAY_WIDTH

  // Build month spans
  const monthSpans: { label: string; startIndex: number; count: number }[] = []
  let currentMonth = -1
  let currentYear = -1

  for (let i = 0; i < days.length; i++) {
    const d = days[i]
    const m = d.getMonth()
    const y = d.getFullYear()
    if (m !== currentMonth || y !== currentYear) {
      monthSpans.push({
        label: `${MONTH_NAMES[m]} ${y}`,
        startIndex: i,
        count: 1,
      })
      currentMonth = m
      currentYear = y
    } else {
      monthSpans[monthSpans.length - 1].count++
    }
  }

  return (
    <div style={{ width: totalWidth }} className="flex-shrink-0">
      {/* Month row */}
      <div className="flex" style={{ height: GANTT_CONFIG.HEADER_HEIGHT / 2 }}>
        {monthSpans.map((span) => (
          <div
            key={`${span.label}-${span.startIndex}`}
            style={{ width: span.count * GANTT_CONFIG.DAY_WIDTH }}
            className="text-xs font-semibold text-muted-foreground border-b border-r border-zinc-800 px-2 flex items-center truncate"
          >
            {span.label}
          </div>
        ))}
      </div>
      {/* Day row */}
      <div className="flex" style={{ height: GANTT_CONFIG.HEADER_HEIGHT / 2 }}>
        {days.map((d, i) => {
          const weekend = isWeekend(d)
          return (
            <div
              key={i}
              style={{ width: GANTT_CONFIG.DAY_WIDTH }}
              className={`text-[10px] text-center border-b border-r border-zinc-800 flex items-center justify-center ${
                weekend ? "bg-zinc-900/60 text-zinc-600" : "text-zinc-500"
              }`}
            >
              {d.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
