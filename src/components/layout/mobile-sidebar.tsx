"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { ProjectSidebar } from "./project-sidebar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type MobileSidebarProps = {
  projects?: { id: string; name: string }[]
}

function extractProjectContext(
  pathname: string,
  projects: { id: string; name: string }[]
): { projectId: string; projectName: string } | null {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  if (!match) return null
  const projectId = match[1]
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null
  return { projectId: project.id, projectName: project.name }
}

export function MobileSidebar({ projects = [] }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const projectContext = extractProjectContext(pathname, projects)

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
        {projectContext ? (
          <div className="flex flex-col h-full" onClick={() => setOpen(false)}>
            <div className="p-4 border-b border-border">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Garage
              </Link>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <ProjectSidebar
                projectId={projectContext.projectId}
                projectName={projectContext.projectName}
              />
            </div>
            <Separator />
            <div className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Other Builds
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {projects
                  .filter((p) => p.id !== projectContext.projectId)
                  .slice(0, 5)
                  .map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block truncate text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors min-h-[44px] flex items-center"
                    >
                      {p.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => setOpen(false)}>
            <AppSidebar projects={projects} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
