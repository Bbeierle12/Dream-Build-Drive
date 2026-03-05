"use client"

import { ExportMenu } from "./export-menu"

type Props = {
  projectId: string
}

export function ProjectExportButton({ projectId }: Props) {
  return <ExportMenu projectId={projectId} />
}
