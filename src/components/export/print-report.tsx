"use client"

import { forwardRef } from "react"
import type { Project, CategoryWithParts } from "@/lib/types"
import type { ExportTask, ExportSpec } from "@/lib/export-utils"
import { computeCategoryCost, computeProjectCost, formatCurrency } from "@/lib/utils"

type Props = {
  project: Project | null
  categories: CategoryWithParts[]
  tasks: ExportTask[]
  specs: ExportSpec[]
}

export const PrintReport = forwardRef<HTMLDivElement, Props>(
  function PrintReport({ project, categories, tasks, specs }, ref) {
    if (!project) return null

    const projectCost = computeProjectCost(categories)
    const vehicleLabel = [project.year, project.make, project.model, project.trim]
      .filter(Boolean)
      .join(" ")

    return (
      <div ref={ref} className="print-report">
        <style>{`
          @media screen { .print-report { display: none; } }
          @media print {
            body * { visibility: hidden; }
            .print-report, .print-report * { visibility: visible; }
            .print-report { position: absolute; top: 0; left: 0; width: 100%; background: white; color: black; font-family: 'Space Grotesk', Arial, sans-serif; font-size: 11px; line-height: 1.4; padding: 20px; }
            .print-report h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; color: black; }
            .print-report h2 { font-size: 15px; font-weight: 700; margin: 18px 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #C0392B; color: #C0392B; }
            .print-report h3 { font-size: 13px; font-weight: 600; margin: 12px 0 4px 0; color: #333; }
            .print-report .subtitle { color: #666; font-size: 12px; margin-bottom: 12px; }
            .print-report table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
            .print-report th { background: #f3f3f3; border: 1px solid #ddd; padding: 4px 6px; text-align: left; font-weight: 600; }
            .print-report td { border: 1px solid #ddd; padding: 3px 6px; }
            .print-report .text-right { text-align: right; }
            .print-report .font-mono { font-family: 'DM Mono', monospace; }
            .print-report .totals-row { font-weight: 700; background: #f9f9f9; }
            .print-report .page-break { page-break-before: always; }
            .print-report .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; }
          }
        `}</style>

        {/* Header */}
        <h1>{project.name}</h1>
        {vehicleLabel && <div className="subtitle">{vehicleLabel}</div>}

        {/* Cost Summary */}
        <h2>Cost Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {project.budget && (
              <tr>
                <td>Budget</td>
                <td className="text-right font-mono">
                  {formatCurrency(project.budget)}
                </td>
              </tr>
            )}
            <tr>
              <td>Estimated Total</td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.projected)}
              </td>
            </tr>
            <tr>
              <td>Actual Spent</td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.actual)}
              </td>
            </tr>
            <tr>
              <td>Over/Under</td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.overUnder)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Cost by Category */}
        <h2>Cost by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th className="text-right">Parts</th>
              <th className="text-right">Estimated</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Over/Under</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const cost = computeCategoryCost(cat.parts)
              return (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td className="text-right">{cat.parts.length}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(cost.projected)}
                  </td>
                  <td className="text-right font-mono">
                    {formatCurrency(cost.actual)}
                  </td>
                  <td className="text-right font-mono">
                    {formatCurrency(cost.overUnder)}
                  </td>
                </tr>
              )
            })}
            <tr className="totals-row">
              <td>Total</td>
              <td className="text-right">
                {categories.reduce((s, c) => s + c.parts.length, 0)}
              </td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.projected)}
              </td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.actual)}
              </td>
              <td className="text-right font-mono">
                {formatCurrency(projectCost.overUnder)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Parts by Category */}
        <h2>Parts List</h2>
        {categories.map((cat) =>
          cat.parts.length > 0 ? (
            <div key={cat.id}>
              <h3>{cat.name}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Part #</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th className="text-right">Estimated</th>
                    <th className="text-right">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.parts.map((part) => (
                    <tr key={part.id}>
                      <td>{part.name}</td>
                      <td>{part.part_number ?? ""}</td>
                      <td>{part.vendor ?? ""}</td>
                      <td>{part.status}</td>
                      <td className="text-right font-mono">
                        {part.estimated_cost != null
                          ? formatCurrency(part.estimated_cost)
                          : ""}
                      </td>
                      <td className="text-right font-mono">
                        {part.actual_cost != null
                          ? formatCurrency(part.actual_cost)
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <>
            <h2 className="page-break">Tasks</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.status.replace("_", " ")}</td>
                    <td>{task.priority}</td>
                    <td>{task.category_name ?? ""}</td>
                    <td>{task.due_date ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <>
            <h2>Specifications</h2>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.id}>
                    <td>{spec.label}</td>
                    <td className="font-mono">{spec.value}</td>
                    <td>{spec.unit ?? ""}</td>
                    <td>{spec.spec_type}</td>
                    <td>{spec.category_name ?? ""}</td>
                    <td>{spec.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="footer">
          Generated by Dream Build Drive on{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    )
  }
)
