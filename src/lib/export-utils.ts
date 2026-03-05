import type { Part, Task, Category, Specification, CategoryWithParts } from "@/lib/types"
import { computeCategoryCost } from "@/lib/utils"

// ── CSV Escaping ────────────────────────────────────────────

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSVRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCSV).join(",")
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [toCSVRow(headers), ...rows.map(toCSVRow)]
  return lines.join("\n")
}

// ── Export Types (data shapes from server actions) ──────────

export type ExportPart = Part & { category_name: string }
export type ExportTask = Task & { category_name: string | null }
export type ExportSpec = Specification & {
  category_name: string | null
  part_name: string | null
}

// ── CSV Generators ──────────────────────────────────────────

export function partsToCSV(parts: ExportPart[]): string {
  const headers = [
    "Category",
    "Name",
    "Part Number",
    "Vendor",
    "Status",
    "Estimated Cost",
    "Actual Cost",
    "Notes",
  ]
  const rows = parts.map((p) => [
    p.category_name,
    p.name,
    p.part_number,
    p.vendor,
    p.status,
    p.estimated_cost,
    p.actual_cost,
    p.notes,
  ])
  return buildCSV(headers, rows)
}

export function tasksToCSV(tasks: ExportTask[]): string {
  const headers = [
    "Title",
    "Status",
    "Priority",
    "Category",
    "Start Date",
    "Due Date",
    "Time Estimate (min)",
    "Time Actual (min)",
  ]
  const rows = tasks.map((t) => [
    t.title,
    t.status,
    t.priority,
    t.category_name,
    t.start_date,
    t.due_date,
    t.time_estimate_min,
    t.time_actual_min,
  ])
  return buildCSV(headers, rows)
}

export function specsToCSV(specs: ExportSpec[]): string {
  const headers = ["Category", "Part", "Type", "Label", "Value", "Unit", "Notes"]
  const rows = specs.map((s) => [
    s.category_name,
    s.part_name,
    s.spec_type,
    s.label,
    s.value,
    s.unit,
    s.notes,
  ])
  return buildCSV(headers, rows)
}

export function costSummaryToCSV(categories: CategoryWithParts[]): string {
  const headers = [
    "Category",
    "Parts Count",
    "Estimated Total",
    "Actual Total",
    "Purchased",
    "Planned",
    "Over/Under",
  ]
  const rows = categories.map((cat) => {
    const cost = computeCategoryCost(cat.parts)
    return [
      cat.name,
      cat.parts.length,
      cost.projected,
      cost.actual,
      cost.purchased,
      cost.planned,
      cost.overUnder,
    ]
  })

  // Add totals row
  const totals = computeCategoryCost(categories.flatMap((c) => c.parts))
  rows.push([
    "TOTAL",
    categories.reduce((sum, c) => sum + c.parts.length, 0),
    totals.projected,
    totals.actual,
    totals.purchased,
    totals.planned,
    totals.overUnder,
  ])

  return buildCSV(headers, rows)
}

// ── Client-Side Download Helper ─────────────────────────────

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
