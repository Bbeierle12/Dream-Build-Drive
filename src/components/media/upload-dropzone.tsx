"use client"

import { useCallback, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { createSignedUploadUrl, createAttachment } from "@/actions/attachments"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type UploadDropzoneProps = {
  projectId: string
}

export function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

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
    [projectId]
  )

  return (
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
  )
}
