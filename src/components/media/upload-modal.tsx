"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Upload, Loader2 } from "lucide-react"
import { createSignedUploadUrl, createAttachment } from "@/actions/attachments"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { reportError } from "@/lib/error-reporting"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]

type UploadModalProps = {
  projectId: string
  categories: { id: string; name: string }[]
  parts: { id: string; name: string; category_id: string }[]
  defaultCategoryId?: string
  defaultPartId?: string
  trigger?: ReactNode
}

export function UploadModal({
  projectId,
  categories,
  parts,
  defaultCategoryId,
  defaultPartId,
  trigger,
}: UploadModalProps) {
  const [open, setOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId ?? "none")
  const [partId, setPartId] = useState<string>(defaultPartId ?? "none")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const filteredParts =
    categoryId === "none"
      ? parts
      : parts.filter((part) => part.category_id === categoryId)

  function resetForm() {
    setCategoryId(defaultCategoryId ?? "none")
    setPartId(defaultPartId ?? "none")
    setTitle("")
    setDescription("")
    setProgress(0)
  }

  function validateFiles(files: File[]): File[] {
    const valid: File[] = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`)
        continue
      }
      if (ACCEPTED_TYPES.length > 0 && !ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type (${file.type || "unknown"})`)
        continue
      }
      valid.push(file)
    }
    return valid
  }

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = validateFiles(Array.from(fileList))
      if (files.length === 0) return

      setUploading(true)
      let completed = 0

      for (const file of files) {
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
            title: title || null,
            description: description || null,
          })

          if (attachmentResult?.error) {
            toast.error(`Failed to save ${file.name}: ${attachmentResult.error}`)
            continue
          }

          completed++
          setProgress(Math.round((completed / files.length) * 100))
        } catch (err) {
          reportError(err, { action: "media.upload", projectId, meta: { fileName: file.name } })
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      const failed = files.length - completed
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

      if (completed > 0) {
        setTimeout(() => {
          setOpen(false)
          resetForm()
        }, 500)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryId, partId, projectId, title, description]
  )

  function handleOpenChange(next: boolean) {
    if (uploading) return
    setOpen(next)
    if (!next) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Add photos or documents to your build
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value)
                if (value !== "none" && partId !== "none") {
                  const selectedPart = parts.find((p) => p.id === partId)
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
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
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
                : "border-border hover:border-muted-foreground/50",
              uploading && "pointer-events-none"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
                <div className="w-full max-w-[200px] h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag files here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Images, PDFs, spreadsheets, and documents up to 50MB
                </p>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
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
      </DialogContent>
    </Dialog>
  )
}
