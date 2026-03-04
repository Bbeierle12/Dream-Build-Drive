import { describe, it, expect } from "vitest"
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  KANBAN_COLUMNS,
} from "@/lib/constants"

describe("TASK_STATUSES", () => {
  it("contains 5 statuses", () => {
    expect(TASK_STATUSES).toHaveLength(5)
  })

  it("starts with backlog and ends with done", () => {
    expect(TASK_STATUSES[0]).toBe("backlog")
    expect(TASK_STATUSES[TASK_STATUSES.length - 1]).toBe("done")
  })

  it("follows the correct flow order", () => {
    expect([...TASK_STATUSES]).toEqual([
      "backlog",
      "todo",
      "in_progress",
      "in_review",
      "done",
    ])
  })
})

describe("TASK_PRIORITIES", () => {
  it("contains 4 priorities", () => {
    expect(TASK_PRIORITIES).toHaveLength(4)
  })

  it("goes from low to urgent", () => {
    expect(TASK_PRIORITIES[0]).toBe("low")
    expect(TASK_PRIORITIES[TASK_PRIORITIES.length - 1]).toBe("urgent")
  })
})

describe("TASK_STATUS_COLORS", () => {
  it("has a color mapping for every status", () => {
    for (const status of TASK_STATUSES) {
      expect(TASK_STATUS_COLORS[status]).toBeDefined()
      expect(typeof TASK_STATUS_COLORS[status]).toBe("string")
    }
  })
})

describe("TASK_STATUS_LABELS", () => {
  it("has a label for every status", () => {
    for (const status of TASK_STATUSES) {
      expect(TASK_STATUS_LABELS[status]).toBeDefined()
    }
  })
})

describe("PRIORITY_COLORS", () => {
  it("has a color mapping for every priority", () => {
    for (const priority of TASK_PRIORITIES) {
      expect(PRIORITY_COLORS[priority]).toBeDefined()
      expect(typeof PRIORITY_COLORS[priority]).toBe("string")
    }
  })
})

describe("PRIORITY_LABELS", () => {
  it("has a label for every priority", () => {
    for (const priority of TASK_PRIORITIES) {
      expect(PRIORITY_LABELS[priority]).toBeDefined()
    }
  })
})

describe("KANBAN_COLUMNS", () => {
  it("has one column per status", () => {
    expect(KANBAN_COLUMNS).toHaveLength(TASK_STATUSES.length)
  })

  it("column ids match status values", () => {
    for (let i = 0; i < KANBAN_COLUMNS.length; i++) {
      expect(KANBAN_COLUMNS[i].id).toBe(TASK_STATUSES[i])
    }
  })
})
