"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signout } from "@/actions/auth"
import { LayoutDashboard, LogOut, Wrench, Car } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

type AppSidebarProps = {
  projects?: { id: string; name: string }[]
}

export function AppSidebar({ projects = [] }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Wrench className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">DBD</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
            pathname === "/"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Garage
        </Link>

        {projects.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Builds
            </p>
            {projects.map((project) => {
              const isActive = pathname.startsWith(`/projects/${project.id}`)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Car className="h-4 w-4" />
                  <span className="truncate">{project.name}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <form action={signout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
