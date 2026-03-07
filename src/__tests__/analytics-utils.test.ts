import { describe, it, expect } from "vitest"
import {
  computeCategoryCostData,
  computeStatusDistribution,
  computeTaskStatusDistribution,
  computeBudgetHealth,
} from "@/lib/analytics-utils"
import type { CategoryWithParts, Part, Task, CostSummary } from "@/lib/types"

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: "p1",
    category_id: "c1",
    project_id: "proj1",
    name: "Part",
    part_number: null,
    vendor: null,
    vendor_url: null,
    estimated_cost: 100,
    actual_cost: 90,
    status: "installed",
    notes: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    project_id: "proj1",
    category_id: null,
    part_id: null,
    title: "Task",
    description: null,
    status: "backlog",
    priority: "medium",
    start_date: null,
    due_date: null,
    is_milestone: false,
    time_estimate_min: null,
    time_actual_min: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  }
}

function makeCategory(
  name: string,
  parts: Part[]
): CategoryWithParts {
  return {
    id: `cat-${name}`,
    project_id: "proj1",
    name,
    sort_order: 0,
    created_at: "2026-01-01",
    parts,
  }
}

describe("computeCategoryCostData", () => {
  it("sums estimated and actual costs per category", () => {
    const categories = [
      makeCategory("Engine", [
        makePart({ estimated_cost: 500, actual_cost: 480 }),
        makePart({ id: "p2", estimated_cost: 200, actual_cost: 190 }),
      ]),
    ]

    const result = computeCategoryCostData(categories)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: "Engine",
      estimated: 700,
      actual: 670,
      partCount: 2,
    })
  })

  it("filters out categories with no costs and no parts", () => {
    const categories = [
      makeCategory("Empty", []),
      makeCategory("Engine", [makePart()]),
    ]

    const result = computeCategoryCostData(categories)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Engine")
  })

  it("keeps categories with parts but null costs", () => {
    const categories = [
      makeCategory("Misc", [
        makePart({ estimated_cost: null, actual_cost: null }),
      ]),
    ]

    const result = computeCategoryCostData(categories)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: "Misc",
      estimated: 0,
      actual: 0,
      partCount: 1,
    })
  })

  it("returns empty for no categories", () => {
    expect(computeCategoryCostData([])).toEqual([])
  })
})

describe("computeStatusDistribution", () => {
  it("counts parts by status", () => {
    const parts = [
      makePart({ status: "installed" }),
      makePart({ id: "p2", status: "installed" }),
      makePart({ id: "p3", status: "ordered" }),
    ]

    const result = computeStatusDistribution(parts)
    expect(result).toContainEqual({ status: "installed", count: 2 })
    expect(result).toContainEqual({ status: "ordered", count: 1 })
  })

  it("returns empty for no parts", () => {
    expect(computeStatusDistribution([])).toEqual([])
  })
})

describe("computeTaskStatusDistribution", () => {
  it("counts tasks by status", () => {
    const tasks = [
      makeTask({ status: "done" }),
      makeTask({ id: "t2", status: "done" }),
      makeTask({ id: "t3", status: "in_progress" }),
      makeTask({ id: "t4", status: "backlog" }),
    ]

    const result = computeTaskStatusDistribution(tasks)
    expect(result).toContainEqual({ status: "done", count: 2 })
    expect(result).toContainEqual({ status: "in_progress", count: 1 })
    expect(result).toContainEqual({ status: "backlog", count: 1 })
  })
})

describe("computeBudgetHealth", () => {
  const costs: CostSummary = {
    projected: 1000,
    actual: 750,
    purchased: 750,
    planned: 250,
    overUnder: -250,
  }

  it("returns healthy when under 75%", () => {
    const result = computeBudgetHealth({ ...costs, actual: 500 }, 1000)
    expect(result.status).toBe("healthy")
    expect(result.percentage).toBe(50)
  })

  it("returns warning at 75-100%", () => {
    const result = computeBudgetHealth({ ...costs, actual: 800 }, 1000)
    expect(result.status).toBe("warning")
    expect(result.percentage).toBe(80)
  })

  it("returns over above 100%", () => {
    const result = computeBudgetHealth({ ...costs, actual: 1200 }, 1000)
    expect(result.status).toBe("over")
    expect(result.percentage).toBe(120)
  })

  it("returns healthy with 0 percentage for zero budget", () => {
    const result = computeBudgetHealth(costs, 0)
    expect(result.status).toBe("healthy")
    expect(result.percentage).toBe(0)
  })

  it("returns healthy with 0 percentage for negative budget", () => {
    const result = computeBudgetHealth(costs, -100)
    expect(result.status).toBe("healthy")
    expect(result.percentage).toBe(0)
  })

  it("returns exactly warning at 75%", () => {
    const result = computeBudgetHealth({ ...costs, actual: 750 }, 1000)
    expect(result.status).toBe("warning")
    expect(result.percentage).toBe(75)
  })
})
