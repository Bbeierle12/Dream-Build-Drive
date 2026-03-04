import { describe, it, expect } from "vitest"
import { detectCycle, formatTimeEstimate } from "@/lib/task-utils"
import type { TaskDependency } from "@/lib/types"

describe("detectCycle", () => {
  it("returns false for an empty dependency graph", () => {
    expect(detectCycle("a", "b", [])).toBe(false)
  })

  it("returns true for a direct self-referencing cycle", () => {
    // a -> b already exists, adding b -> a creates a cycle
    const deps: TaskDependency[] = [
      { task_id: "a", depends_on_task_id: "b" },
    ]
    expect(detectCycle("b", "a", deps)).toBe(true)
  })

  it("returns true for a transitive cycle", () => {
    // a -> b, b -> c exist. Adding c -> a creates a -> b -> c -> a cycle.
    const deps: TaskDependency[] = [
      { task_id: "a", depends_on_task_id: "b" },
      { task_id: "b", depends_on_task_id: "c" },
    ]
    expect(detectCycle("c", "a", deps)).toBe(true)
  })

  it("returns false for a valid non-cyclic dependency", () => {
    const deps: TaskDependency[] = [
      { task_id: "a", depends_on_task_id: "b" },
      { task_id: "b", depends_on_task_id: "c" },
    ]
    // Adding d -> a is fine — no cycle
    expect(detectCycle("d", "a", deps)).toBe(false)
  })

  it("handles complex graphs without false positives", () => {
    const deps: TaskDependency[] = [
      { task_id: "a", depends_on_task_id: "b" },
      { task_id: "a", depends_on_task_id: "c" },
      { task_id: "b", depends_on_task_id: "d" },
      { task_id: "c", depends_on_task_id: "d" },
    ]
    // Adding e -> d is fine
    expect(detectCycle("e", "d", deps)).toBe(false)
    // Adding d -> a would create cycle
    expect(detectCycle("d", "a", deps)).toBe(true)
  })
})

describe("formatTimeEstimate", () => {
  it("formats minutes only", () => {
    expect(formatTimeEstimate(30)).toBe("30m")
    expect(formatTimeEstimate(45)).toBe("45m")
  })

  it("formats exact hours", () => {
    expect(formatTimeEstimate(60)).toBe("1h")
    expect(formatTimeEstimate(120)).toBe("2h")
  })

  it("formats hours and minutes", () => {
    expect(formatTimeEstimate(90)).toBe("1h 30m")
    expect(formatTimeEstimate(150)).toBe("2h 30m")
  })

  it("formats zero minutes", () => {
    expect(formatTimeEstimate(0)).toBe("0m")
  })
})
