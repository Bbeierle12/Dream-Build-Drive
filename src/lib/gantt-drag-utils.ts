import { GANTT_CONFIG } from "@/lib/constants"

export function pixelOffsetToDays(px: number): number {
  return Math.round(px / GANTT_CONFIG.DAY_WIDTH)
}

export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
