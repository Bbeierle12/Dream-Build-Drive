"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { deleteAttachment } from "@/actions/attachments"
import { toast } from "sonner"
import type { AttachmentWithDetails } from "@/lib/types"

type DocumentTableProps = {
  documents: AttachmentWithDetails[]
  projectId: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentTable({ documents, projectId }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No documents yet. Upload some!
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Linked To</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} id={`attachment-${doc.id}`} className="deeplink-target">
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{doc.file_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {doc.file_type.split("/").pop()?.toUpperCase()}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-sm">
                {formatFileSize(doc.file_size)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {[doc.category_name, doc.part_name].filter(Boolean).join(" · ") || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(doc.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Download ${doc.file_name}`}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </a>
                  <ConfirmDeleteDialog
                    title={`Delete "${doc.file_name}"?`}
                    description="This document will be permanently removed from the project."
                    onConfirm={async () => {
                      const result = await deleteAttachment(doc.id, doc.storage_path, projectId)
                      if (result?.error) {
                        toast.error(result.error)
                        throw new Error(result.error)
                      }
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:text-destructive"
                        aria-label={`Delete ${doc.file_name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
