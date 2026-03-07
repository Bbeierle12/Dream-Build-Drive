"use client"

import { useState, useRef, useCallback } from "react"
import { Download, FileSpreadsheet, Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getExportParts,
  getExportTasks,
  getExportSpecs,
  getExportCostReport,
  getExportProjectInfo,
} from "@/actions/export"
import {
  partsToCSV,
  tasksToCSV,
  specsToCSV,
  costSummaryToCSV,
  downloadCSV,
} from "@/lib/export-utils"
import { PrintReport } from "./print-report"

type Props = {
  projectId: string
}

export function ExportMenu({ projectId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [printData, setPrintData] = useState<{
    project: Awaited<ReturnType<typeof getExportProjectInfo>>
    categories: Awaited<ReturnType<typeof getExportCostReport>>
    tasks: Awaited<ReturnType<typeof getExportTasks>>
    specs: Awaited<ReturnType<typeof getExportSpecs>>
  } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExport = useCallback(
    async (type: string) => {
      setLoading(type)
      try {
        switch (type) {
          case "parts": {
            const parts = await getExportParts(projectId)
            downloadCSV(partsToCSV(parts), "parts-export.csv")
            break
          }
          case "tasks": {
            const tasks = await getExportTasks(projectId)
            downloadCSV(tasksToCSV(tasks), "tasks-export.csv")
            break
          }
          case "specs": {
            const specs = await getExportSpecs(projectId)
            downloadCSV(specsToCSV(specs), "specs-export.csv")
            break
          }
          case "cost": {
            const categories = await getExportCostReport(projectId)
            downloadCSV(costSummaryToCSV(categories), "cost-report.csv")
            break
          }
          case "print": {
            const [project, categories, tasks, specs] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportCostReport(projectId),
              getExportTasks(projectId),
              getExportSpecs(projectId),
            ])
            setPrintData({ project, categories, tasks, specs })
            // Wait for React to render the print component
            setTimeout(() => window.print(), 100)
            break
          }
        }
      } catch (err) {
        console.error("Export failed:", err)
        toast.error(
          err instanceof Error ? err.message : "Export failed"
        )
      } finally {
        setLoading(null)
      }
    },
    [projectId]
  )

  const icon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Download className="h-4 w-4" />
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!!loading}>
            {icon}
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Data</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport("parts")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Parts (CSV)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("tasks")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Tasks (CSV)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("specs")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Specs (CSV)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("cost")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Cost Report (CSV)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport("print")}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report (PDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {printData && (
        <PrintReport
          ref={printRef}
          project={printData.project}
          categories={printData.categories}
          tasks={printData.tasks}
          specs={printData.specs}
        />
      )}
    </>
  )
}
