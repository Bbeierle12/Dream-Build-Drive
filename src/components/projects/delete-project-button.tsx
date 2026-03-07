"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

type DeleteProjectButtonProps = {
  action: () => Promise<{ error?: string } | void>
}

export function DeleteProjectButton({ action }: DeleteProjectButtonProps) {
  async function handleDelete() {
    const result = await action()
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <ConfirmDeleteDialog
      title="Delete this project?"
      description="This will permanently delete the project and all its parts, tasks, specs, and media. This action cannot be undone."
      onConfirm={handleDelete}
      trigger={
        <Button variant="destructive" type="button">
          Delete Project
        </Button>
      }
    />
  )
}
