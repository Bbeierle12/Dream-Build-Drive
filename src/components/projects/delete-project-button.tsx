"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type DeleteProjectButtonProps = {
  action: () => Promise<{ error?: string } | void>
}

export function DeleteProjectButton({ action }: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await action()
      if (result?.error) {
        toast.error(result.error)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      Delete Project
    </Button>
  )
}
