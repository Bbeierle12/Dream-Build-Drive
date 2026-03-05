import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { Project } from "@/lib/types"

type ProjectListTableProps = {
  projects: (Project & { totalSpend: number; partCount: number })[]
}

export function ProjectListTable({ projects }: ProjectListTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead className="text-right">Parts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No projects yet. Create your first build!
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[project.year, project.make, project.model]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {project.budget ? formatCurrency(project.budget) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(project.totalSpend)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{project.partCount}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
