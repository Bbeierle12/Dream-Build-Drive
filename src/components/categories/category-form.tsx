"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createCategory, updateCategory } from "@/actions/categories"
import { Check, X } from "lucide-react"
import type { Category } from "@/lib/types"

type CategoryFormProps = {
  projectId: string
  category?: Category
  onClose: () => void
}

export function CategoryForm({ projectId, category, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const result = category
        ? await updateCategory(category.id, projectId, name.trim())
        : await createCategory(projectId, name.trim())

      if (result?.error) {
        toast.error(result.error)
        return
      }

      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="h-8 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") onClose()
        }}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        disabled={isSubmitting}
        onClick={handleSubmit}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        disabled={isSubmitting}
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
