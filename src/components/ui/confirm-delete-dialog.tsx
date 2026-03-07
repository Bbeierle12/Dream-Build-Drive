"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

type ConfirmDeleteDialogProps = {
  title?: string
  description?: string
  onConfirm: () => Promise<void>
  trigger: React.ReactNode
}

export function ConfirmDeleteDialog({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  trigger,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    setIsPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
