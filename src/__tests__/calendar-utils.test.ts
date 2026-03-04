import { describe, it, expect } from "vitest"
import {
  generateMonthGrid,
  generateWeekGrid,
  taskSpansDate,
} from "@/lib/calendar-utils"

describe("generateMonthGrid", () => {
  it("returns 42 days", () => {
    const grid = generateMonthGrid(2026, 2) // March 2026
    expect(grid).toHaveLength(42)
  })

  it("starts on a Sunday", () => {
    const grid = generateMonthGrid(2026, 2)
    expect(grid[0].date.getDay()).toBe(0) // Sunday
  })

  it("marks days in current month", () => {
    const grid = generateMonthGrid(2026, 2) // March 2026
    const marchDays = grid.filter((d) => d.isCurrentMonth)
    expect(marchDays.length).toBe(31) // March has 31 days
  })

  it("has correct dateStr format", () => {
    const grid = generateMonthGrid(2026, 0) // January 2026
    const jan1 = grid.find((d) => d.dateStr === "2026-01-01")
    expect(jan1).toBeDefined()
    expect(jan1!.isCurrentMonth).toBe(true)
  })
})

describe("generateWeekGrid", () => {
  it("returns 7 days", () => {
    const grid = generateWeekGrid(new Date(2026, 2, 3)) // March 3, 2026
    expect(grid).toHaveLength(7)
  })

  it("starts on Sunday", () => {
    const grid = generateWeekGrid(new Date(2026, 2, 5)) // Thursday
    expect(grid[0].date.getDay()).toBe(0) // Sunday
  })

  it("contains the reference date", () => {
    const ref = new Date(2026, 2, 5)
    const grid = generateWeekGrid(ref)
    const found = grid.some((d) => d.dateStr === "2026-03-05")
    expect(found).toBe(true)
  })
})

describe("taskSpansDate", () => {
  it("returns false for no dates", () => {
    expect(taskSpansDate(null, null, "2026-03-01")).toBe(false)
  })

  it("matches exact start date when no due date", () => {
    expect(taskSpansDate("2026-03-01", null, "2026-03-01")).toBe(true)
    expect(taskSpansDate("2026-03-01", null, "2026-03-02")).toBe(false)
  })

  it("matches exact due date when no start date", () => {
    expect(taskSpansDate(null, "2026-03-05", "2026-03-05")).toBe(true)
    expect(taskSpansDate(null, "2026-03-05", "2026-03-04")).toBe(false)
  })

  it("matches range when both dates provided", () => {
    expect(taskSpansDate("2026-03-01", "2026-03-05", "2026-03-01")).toBe(true)
    expect(taskSpansDate("2026-03-01", "2026-03-05", "2026-03-03")).toBe(true)
    expect(taskSpansDate("2026-03-01", "2026-03-05", "2026-03-05")).toBe(true)
    expect(taskSpansDate("2026-03-01", "2026-03-05", "2026-02-28")).toBe(false)
    expect(taskSpansDate("2026-03-01", "2026-03-05", "2026-03-06")).toBe(false)
  })
})
