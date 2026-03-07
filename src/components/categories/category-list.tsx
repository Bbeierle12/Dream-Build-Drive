"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { deleteCategory } from "@/actions/categories"
import { CategoryForm } from "./category-form"
import type { Category } from "@/lib/types"

type CategoryListProps = {
  categories: Category[]
  projectId: string
}

export function CategoryList({ categories, projectId }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdd(true)}
          aria-label="Add category"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showAdd && (
        <CategoryForm
          projectId={projectId}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.id}>
            {editingId === category.id ? (
              <CategoryForm
                projectId={projectId}
                category={category}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-accent group">
                <span>{category.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(category.id)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <ConfirmDeleteDialog
                    title={`Delete "${category.name}"?`}
                    description="This category and all its parts will be permanently removed."
                    onConfirm={async () => {
                      const result = await deleteCategory(category.id, projectId)
                      if (result?.error) {
                        toast.error(result.error)
                        throw new Error(result.error)
                      }
                    }}
                    trigger={
                      <button className="p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete ${category.name}`}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
