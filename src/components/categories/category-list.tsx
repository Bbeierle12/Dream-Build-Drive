"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id, projectId)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
