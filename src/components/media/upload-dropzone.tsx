"use client"

import { useCallback, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { createSignedUploadUrl, createAttachment } from "@/actions/attachments"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UploadDropzoneProps = {
  projectId: string
  categories: { id: string; name: string }[]
  parts: { id: string; name: string; category_id: string }[]
}

export function UploadDropzone({ projectId, categories, parts }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [categoryId, setCategoryId] = useState<string>("none")
  const [partId, setPartId] = useState<string>("none")

  const filteredParts =
    categoryId === "none"
      ? parts
      : parts.filter((part) => part.category_id === categoryId)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true)
      const fileArray = Array.from(files)
      let completed = 0

      for (const file of fileArray) {
        try {
          const result = await createSignedUploadUrl(projectId, file.name)

          if ("error" in result && result.error) {
            toast.error(`Failed to prepare upload: ${result.error}`)
            continue
          }

          const supabase = createClient()
          const { error } = await supabase.storage
            .from("attachments")
            .uploadToSignedUrl(result.path!, result.token!, file)

          if (error) {
            toast.error(`Failed to upload ${file.name}: ${error.message}`)
            continue
          }

          const attachmentResult = await createAttachment({
            projectId,
            categoryId: categoryId === "none" ? null : categoryId,
            partId: partId === "none" ? null : partId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath: result.path!,
            url: result.publicUrl!,
          })

          if (attachmentResult?.error) {
            toast.error(`Failed to save ${file.name}: ${attachmentResult.error}`)
            continue
          }

          completed++
          setProgress(Math.round((completed / fileArray.length) * 100))
        } catch {
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      const failed = fileArray.length - completed
      if (completed > 0) {
        toast.success(
          failed > 0
            ? `Uploaded ${completed} file${completed === 1 ? "" : "s"} with ${failed} failure${failed === 1 ? "" : "s"}`
            : `Uploaded ${completed} file${completed === 1 ? "" : "s"}`
        )
      } else {
        toast.error("No files were uploaded")
      }

      setUploading(false)
      setProgress(0)
    },
    [categoryId, partId, projectId]
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value)
            if (value !== "none" && partId !== "none") {
              const selectedPart = parts.find((part) => part.id === partId)
              if (selectedPart && selectedPart.category_id !== value) {
                setPartId("none")
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Link to category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={partId} onValueChange={setPartId}>
          <SelectTrigger>
            <SelectValue placeholder="Link to part" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No part</SelectItem>
            {filteredParts.map((part) => (
              <SelectItem key={part.id} value={part.id}>
                {part.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              Uploading... {progress}%
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drag files here or click to browse
            </p>
            <input
              type="file"
              multiple
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files)
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
