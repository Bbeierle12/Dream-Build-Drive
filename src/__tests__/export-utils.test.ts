import { describe, it, expect } from "vitest"
import {
  partsToCSV,
  tasksToCSV,
  specsToCSV,
  costSummaryToCSV,
} from "@/lib/export-utils"
import type { ExportPart, ExportTask, ExportSpec } from "@/lib/export-utils"
import type { CategoryWithParts } from "@/lib/types"

const basePart: ExportPart = {
  id: "p1",
  category_id: "c1",
  project_id: "proj1",
  name: "Turbo",
  part_number: "TB-001",
  vendor: "Summit",
  vendor_url: null,
  estimated_cost: 500,
  actual_cost: 480,
  status: "installed",
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category_name: "Engine",
}

const baseTask: ExportTask = {
  id: "t1",
  project_id: "proj1",
  category_id: "c1",
  part_id: null,
  title: "Install turbo",
  description: null,
  status: "done",
  priority: "high",
  start_date: "2026-01-01",
  due_date: "2026-01-15",
  is_milestone: false,
  time_estimate_min: 120,
  time_actual_min: 90,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category_name: "Engine",
}

const baseSpec: ExportSpec = {
  id: "s1",
  project_id: "proj1",
  part_id: null,
  category_id: "c1",
  spec_type: "torque",
  label: "Head bolts",
  value: "72",
  unit: "ft-lb",
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  category_name: "Engine",
  part_name: null,
}

describe("partsToCSV", () => {
  it("generates header row and data rows", () => {
    const csv = partsToCSV([basePart])
    const lines = csv.split("\n")
    expect(lines[0]).toBe(
      "Category,Name,Part Number,Vendor,Status,Estimated Cost,Actual Cost,Notes"
    )
    expect(lines[1]).toBe("Engine,Turbo,TB-001,Summit,installed,500,480,")
  })

  it("escapes commas and quotes in values", () => {
    const part: ExportPart = {
      ...basePart,
      name: 'Turbo, "Big Boy"',
      notes: "Has a comma, here",
    }
    const csv = partsToCSV([part])
    const lines = csv.split("\n")
    expect(lines[1]).toContain('"Turbo, ""Big Boy"""')
    expect(lines[1]).toContain('"Has a comma, here"')
  })

  it("handles null values as empty strings", () => {
    const part: ExportPart = {
      ...basePart,
      part_number: null,
      vendor: null,
      estimated_cost: null,
      actual_cost: null,
    }
    const csv = partsToCSV([part])
    const lines = csv.split("\n")
    expect(lines[1]).toBe("Engine,Turbo,,,installed,,,")
  })

  it("returns header only for empty array", () => {
    const csv = partsToCSV([])
    expect(csv.split("\n")).toHaveLength(1)
  })
})

describe("tasksToCSV", () => {
  it("generates correct columns", () => {
    const csv = tasksToCSV([baseTask])
    const lines = csv.split("\n")
    expect(lines[0]).toBe(
      "Title,Status,Priority,Category,Start Date,Due Date,Time Estimate (min),Time Actual (min)"
    )
    expect(lines[1]).toBe(
      "Install turbo,done,high,Engine,2026-01-01,2026-01-15,120,90"
    )
  })
})

describe("specsToCSV", () => {
  it("generates correct columns", () => {
    const csv = specsToCSV([baseSpec])
    const lines = csv.split("\n")
    expect(lines[0]).toBe("Category,Part,Type,Label,Value,Unit,Notes")
    expect(lines[1]).toBe("Engine,,torque,Head bolts,72,ft-lb,")
  })
})

describe("costSummaryToCSV", () => {
  it("generates category rows and a TOTAL row", () => {
    const categories: CategoryWithParts[] = [
      {
        id: "c1",
        project_id: "proj1",
        name: "Engine",
        sort_order: 0,
        created_at: "2026-01-01",
        parts: [
          { ...basePart, estimated_cost: 500, actual_cost: 480, status: "installed" },
          { ...basePart, id: "p2", estimated_cost: 200, actual_cost: null, status: "planned" },
        ],
      },
    ]

    const csv = costSummaryToCSV(categories)
    const lines = csv.split("\n")

    expect(lines[0]).toBe(
      "Category,Parts Count,Estimated Total,Actual Total,Purchased,Planned,Over/Under"
    )
    // Engine row
    expect(lines[1]).toContain("Engine,2,")
    // TOTAL row
    expect(lines[2]).toContain("TOTAL,2,")
  })

  it("handles empty categories", () => {
    const csv = costSummaryToCSV([])
    const lines = csv.split("\n")
    expect(lines).toHaveLength(2) // header + totals
    expect(lines[1]).toBe("TOTAL,0,0,0,0,0,0")
  })
})
