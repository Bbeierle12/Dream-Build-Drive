import { describe, it, expect } from "vitest"
import { computeCriticalPath } from "@/lib/task-utils"
import type { TaskWithDependencies } from "@/lib/types"

function makeTask(overrides: Partial<TaskWithDependencies> & { id: string }): TaskWithDependencies {
  return {
    project_id: "p1",
    category_id: null,
    part_id: null,
    title: `Task ${overrides.id}`,
    description: null,
    status: "todo",
    priority: "medium",
    start_date: null,
    due_date: null,
    is_milestone: false,
    time_estimate_min: null,
    time_actual_min: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    dependencies: [],
    blocked_by: [],
    ...overrides,
  }
}

describe("computeCriticalPath", () => {
  it("returns empty set for no tasks", () => {
    expect(computeCriticalPath([])).toEqual(new Set())
  })

  it("returns single task as critical", () => {
    const tasks = [makeTask({ id: "a", start_date: "2025-01-01", due_date: "2025-01-05" })]
    const result = computeCriticalPath(tasks)
    expect(result.has("a")).toBe(true)
  })

  it("identifies critical path in linear chain", () => {
    const tasks = [
      makeTask({ id: "a", start_date: "2025-01-01", due_date: "2025-01-03" }),
      makeTask({
        id: "b",
        start_date: "2025-01-04",
        due_date: "2025-01-06",
        dependencies: [{ task_id: "b", depends_on_task_id: "a" }],
      }),
      makeTask({
        id: "c",
        start_date: "2025-01-07",
        due_date: "2025-01-10",
        dependencies: [{ task_id: "c", depends_on_task_id: "b" }],
      }),
    ]
    const result = computeCriticalPath(tasks)
    expect(result.has("a")).toBe(true)
    expect(result.has("b")).toBe(true)
    expect(result.has("c")).toBe(true)
  })

  it("identifies critical path with parallel branches", () => {
    // a -> b (3 days) and a -> c (1 day), both -> d
    // Critical path should be a -> b -> d (longer)
    const tasks = [
      makeTask({ id: "a", start_date: "2025-01-01", due_date: "2025-01-01" }),
      makeTask({
        id: "b",
        start_date: "2025-01-02",
        due_date: "2025-01-04",
        dependencies: [{ task_id: "b", depends_on_task_id: "a" }],
      }),
      makeTask({
        id: "c",
        start_date: "2025-01-02",
        due_date: "2025-01-02",
        dependencies: [{ task_id: "c", depends_on_task_id: "a" }],
      }),
      makeTask({
        id: "d",
        start_date: "2025-01-05",
        due_date: "2025-01-06",
        dependencies: [
          { task_id: "d", depends_on_task_id: "b" },
          { task_id: "d", depends_on_task_id: "c" },
        ],
      }),
    ]
    const result = computeCriticalPath(tasks)
    expect(result.has("a")).toBe(true)
    expect(result.has("b")).toBe(true)
    expect(result.has("d")).toBe(true)
    // c is NOT on critical path (shorter branch)
    expect(result.has("c")).toBe(false)
  })

  it("handles tasks with no dependencies", () => {
    const tasks = [
      makeTask({ id: "a", start_date: "2025-01-01", due_date: "2025-01-03" }),
      makeTask({ id: "b", start_date: "2025-01-01", due_date: "2025-01-05" }),
    ]
    const result = computeCriticalPath(tasks)
    // Both are independent; the longer one is critical
    expect(result.has("b")).toBe(true)
  })
})
