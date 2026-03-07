"use client"

import { useState } from "react"
import Image from "next/image"
import { Lightbox } from "./lightbox"
import type { AttachmentWithDetails } from "@/lib/types"

type PhotoGridProps = {
  photos: AttachmentWithDetails[]
  projectId: string
}

export function PhotoGrid({ photos, projectId }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No photos yet. Upload some!
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            id={`attachment-${photo.id}`}
            onClick={() => setSelectedIndex(index)}
            className="deeplink-target group relative aspect-square overflow-hidden rounded-md border border-border"
          >
            <Image
              src={photo.url}
              alt={photo.file_name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            {(photo.category_name || photo.part_name) && (
              <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {photo.category_name && <div>{photo.category_name}</div>}
                {photo.part_name && <div>{photo.part_name}</div>}
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          photos={photos}
          projectId={projectId}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
