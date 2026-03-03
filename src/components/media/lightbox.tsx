"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { Attachment } from "@/lib/types"

type LightboxProps = {
  photos: Attachment[]
  initialIndex: number
  onClose: () => void
}

export function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1))
  }, [photos.length])

  const next = useCallback(() => {
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0))
  }, [photos.length])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [prev, next, onClose])

  const photo = photos[index]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 border-0 bg-black/90">
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
            onClick={prev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="relative w-full h-[70vh]">
            <Image
              src={photo.url}
              alt={photo.file_name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10 text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {photo.file_name} ({index + 1} / {photos.length})
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
