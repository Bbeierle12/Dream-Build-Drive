"use client"

import { useState, useCallback, useEffect } from "react"
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
import { reportError } from "@/lib/error-reporting"

type Props = {
  projectId: string
}

type PrintData = {
  project: Awaited<ReturnType<typeof getExportProjectInfo>>
  categories: Awaited<ReturnType<typeof getExportCostReport>>
  tasks: Awaited<ReturnType<typeof getExportTasks>>
  specs: Awaited<ReturnType<typeof getExportSpecs>>
}

function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project"
}

function buildExportFilename(projectName: string, suffix: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${slugifyProjectName(projectName)}-${suffix}-${date}.csv`
}

function hasPrintableContent({
  project,
  categories,
  tasks,
  specs,
}: PrintData): boolean {
  const hasCategoryData = categories.length > 0
  const hasParts = categories.some((category) => category.parts.length > 0)
  const hasVehicleDetails = Boolean(
    project.year ||
      project.make ||
      project.model ||
      project.trim ||
      project.vin ||
      project.color
  )

  return (
    hasCategoryData ||
    hasParts ||
    tasks.length > 0 ||
    specs.length > 0 ||
    project.budget != null ||
    Boolean(project.notes) ||
    hasVehicleDetails
  )
}

export function ExportMenu({ projectId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [printData, setPrintData] = useState<PrintData | null>(null)

  useEffect(() => {
    function handleAfterPrint() {
      setPrintData(null)
    }

    window.addEventListener("afterprint", handleAfterPrint)
    return () => window.removeEventListener("afterprint", handleAfterPrint)
  }, [])

  const handleExport = useCallback(
    async (type: string) => {
      setLoading(type)
      try {
        switch (type) {
          case "parts": {
            const [project, parts] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportParts(projectId),
            ])

            if (parts.length === 0) {
              toast.error("No parts to export yet")
              return
            }

            downloadCSV(
              partsToCSV(parts),
              buildExportFilename(project.name, "parts")
            )
            break
          }
          case "tasks": {
            const [project, tasks] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportTasks(projectId),
            ])

            if (tasks.length === 0) {
              toast.error("No tasks to export yet")
              return
            }

            downloadCSV(
              tasksToCSV(tasks),
              buildExportFilename(project.name, "tasks")
            )
            break
          }
          case "specs": {
            const [project, specs] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportSpecs(projectId),
            ])

            if (specs.length === 0) {
              toast.error("No specifications to export yet")
              return
            }

            downloadCSV(
              specsToCSV(specs),
              buildExportFilename(project.name, "specs")
            )
            break
          }
          case "cost": {
            const [project, categories] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportCostReport(projectId),
            ])

            if (categories.length === 0) {
              toast.error("No categories to export yet")
              return
            }

            downloadCSV(
              costSummaryToCSV(categories),
              buildExportFilename(project.name, "cost-report")
            )
            break
          }
          case "print": {
            const [project, categories, tasks, specs] = await Promise.all([
              getExportProjectInfo(projectId),
              getExportCostReport(projectId),
              getExportTasks(projectId),
              getExportSpecs(projectId),
            ])

            if (!hasPrintableContent({ project, categories, tasks, specs })) {
              toast.error("Nothing to print yet")
              return
            }

            setPrintData({ project, categories, tasks, specs })
            // Wait for React to render the print component
            setTimeout(() => window.print(), 100)
            break
          }
        }
      } catch (err) {
        reportError(err, { action: `export.${type}`, projectId })
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
          project={printData.project}
          categories={printData.categories}
          tasks={printData.tasks}
          specs={printData.specs}
        />
      )}
    </>
  )
}
