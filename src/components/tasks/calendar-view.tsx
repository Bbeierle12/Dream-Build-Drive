"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CALENDAR_CONFIG } from "@/lib/constants"
import {
  generateMonthGrid,
  generateWeekGrid,
  taskSpansDate,
} from "@/lib/calendar-utils"
import { CalendarDayCell } from "./calendar-day-cell"
import type { Task } from "@/lib/types"

type CalendarViewProps = {
  tasks: Task[]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function CalendarView({ tasks }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView] = useState<"month" | "week">("month")
  const [weekRef, setWeekRef] = useState(today)

  const days =
    view === "month"
      ? generateMonthGrid(year, month)
      : generateWeekGrid(weekRef)

  function navigatePrev() {
    if (view === "month") {
      if (month === 0) {
        setMonth(11)
        setYear(year - 1)
      } else {
        setMonth(month - 1)
      }
    } else {
      const prev = new Date(weekRef)
      prev.setDate(prev.getDate() - 7)
      setWeekRef(prev)
    }
  }

  function navigateNext() {
    if (view === "month") {
      if (month === 11) {
        setMonth(0)
        setYear(year + 1)
      } else {
        setMonth(month + 1)
      }
    } else {
      const next = new Date(weekRef)
      next.setDate(next.getDate() + 7)
      setWeekRef(next)
    }
  }

  function goToToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setWeekRef(now)
  }

  const title =
    view === "month"
      ? `${MONTH_NAMES[month]} ${year}`
      : `Week of ${days[0]?.dateStr ?? ""}`

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No tasks with dates yet. Add start or due dates to your tasks to see them on the calendar.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev} aria-label={view === "month" ? "Previous month" : "Previous week"}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {title}
          </h2>
          <Button variant="outline" size="icon" onClick={navigateNext} aria-label={view === "month" ? "Next month" : "Next week"}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex gap-1">
          {CALENDAR_CONFIG.VIEWS.map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              size="sm"
              onClick={() => setView(v)}
              className="capitalize"
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 mb-1">
          {CALENDAR_CONFIG.WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) =>
              taskSpansDate(t.start_date, t.due_date, day.dateStr)
            )
            return (
              <CalendarDayCell key={day.dateStr} day={day} tasks={dayTasks} />
            )
          })}
        </div>
      </div>
    </div>
  )
}
