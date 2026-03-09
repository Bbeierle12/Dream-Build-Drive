"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { AppSidebar } from "./app-sidebar"

type MobileSidebarProps = {
  projects?: { id: string; name: string }[]
}

export function MobileSidebar({ projects = [] }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden min-h-[44px] min-w-[44px] p-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div onClick={() => setOpen(false)}>
          <AppSidebar projects={projects} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
