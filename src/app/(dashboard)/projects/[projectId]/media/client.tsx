"use client"

import { useState } from "react"
import { UploadModal } from "@/components/media/upload-modal"
import { PhotoGrid } from "@/components/media/photo-grid"
import { DocumentTable } from "@/components/media/document-table"
import { MediaFilterBar } from "@/components/media/media-filter-bar"
import type { AttachmentWithDetails, Category, Part } from "@/lib/types"

type MediaPageClientProps = {
  projectId: string
  attachments: AttachmentWithDetails[]
  categories: Pick<Category, "id" | "name">[]
  parts: Pick<Part, "id" | "name" | "category_id">[]
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]

export function MediaPageClient({
  projectId,
  attachments,
  categories,
  parts,
}: MediaPageClientProps) {
  const [filter, setFilter] = useState<"all" | "photos" | "documents">("all")

  const photos = attachments.filter((a) => IMAGE_TYPES.includes(a.file_type))
  const documents = attachments.filter((a) => !IMAGE_TYPES.includes(a.file_type))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media</h1>
          <p className="text-muted-foreground">
            Photos and documents for this build
          </p>
        </div>
        <UploadModal projectId={projectId} categories={categories} parts={parts} />
      </div>

      <MediaFilterBar
        filter={filter}
        onFilterChange={setFilter}
        photoCount={photos.length}
        documentCount={documents.length}
      />

      {(filter === "all" || filter === "photos") && photos.length > 0 && (
        <div>
          {filter === "all" && (
            <h2 className="mb-3 text-lg font-semibold">Photos</h2>
          )}
          <PhotoGrid photos={photos} projectId={projectId} />
        </div>
      )}

      {(filter === "all" || filter === "documents") && documents.length > 0 && (
        <div>
          {filter === "all" && (
            <h2 className="mb-3 text-lg font-semibold">Documents</h2>
          )}
          <DocumentTable documents={documents} projectId={projectId} />
        </div>
      )}

      {attachments.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No files uploaded yet. Drag and drop above to get started.
        </p>
      )}
    </div>
  )
}
