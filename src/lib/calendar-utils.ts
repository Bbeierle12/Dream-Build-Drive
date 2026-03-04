export type CalendarDay = {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * Generates a full month grid (always 6 rows x 7 cols = 42 days).
 */
export function generateMonthGrid(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const todayStr = formatDateStr(today)

  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay() // 0=Sun

  const days: CalendarDay[] = []
  const startDate = new Date(year, month, 1 - startDay)

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      isCurrentMonth: date.getMonth() === month,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

/**
 * Generates a week grid (7 days) starting from the Sunday of the given date's week.
 */
export function generateWeekGrid(referenceDate: Date): CalendarDay[] {
  const today = new Date()
  const todayStr = formatDateStr(today)

  const dayOfWeek = referenceDate.getDay()
  const sunday = new Date(referenceDate)
  sunday.setDate(referenceDate.getDate() - dayOfWeek)

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    const dateStr = formatDateStr(date)
    days.push({
      date,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

/**
 * Returns true if a task (with start_date and/or due_date) spans the given date.
 */
export function taskSpansDate(
  startDate: string | null,
  dueDate: string | null,
  dateStr: string
): boolean {
  if (!startDate && !dueDate) return false
  if (startDate && dueDate) return dateStr >= startDate && dateStr <= dueDate
  if (startDate) return dateStr === startDate
  if (dueDate) return dateStr === dueDate
  return false
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
