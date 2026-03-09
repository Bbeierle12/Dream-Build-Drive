"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signout } from "@/actions/auth"
import {
  LayoutDashboard,
  LogOut,
  Wrench,
  Car,
  Settings,
  ChevronRight,
  Package,
  ListTodo,
  Columns3,
  CalendarDays,
  GanttChart,
  Image,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { SettingsModal } from "./settings-modal"

type AppSidebarProps = {
  projects?: { id: string; name: string }[]
}

const PROJECT_NAV = [
  { suffix: "", label: "Overview", icon: LayoutDashboard },
  { suffix: "/parts", label: "Parts", icon: Package },
  { suffix: "/tasks", label: "Tasks", icon: ListTodo },
  { suffix: "/tasks/kanban", label: "Kanban", icon: Columns3 },
  { suffix: "/tasks/calendar", label: "Calendar", icon: CalendarDays },
  { suffix: "/tasks/gantt", label: "Gantt", icon: GanttChart },
  { suffix: "/media", label: "Media", icon: Image },
  { suffix: "/specs", label: "Specs", icon: Wrench },
  { suffix: "/analytics", label: "Analytics", icon: BarChart3 },
  { suffix: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ projects = [] }: AppSidebarProps) {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeProjectId = projects.find((p) =>
    pathname.startsWith(`/projects/${p.id}`)
  )?.id

  return (
    <>
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
                const isExpanded = project.id === activeProjectId
                const projectBase = `/projects/${project.id}`

                return (
                  <div key={project.id}>
                    <Link
                      href={projectBase}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                        isExpanded
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <Car className="h-4 w-4 shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </Link>

                    {isExpanded && (
                      <div className="ml-4 border-l border-border pl-2 mt-1 mb-2 space-y-0.5">
                        {PROJECT_NAV.map((item) => {
                          const href = `${projectBase}${item.suffix}`
                          const Icon = item.icon
                          const isActive =
                            item.suffix === ""
                              ? pathname === projectBase
                              : pathname === href || pathname.startsWith(href + "/")
                          return (
                            <Link
                              key={item.suffix}
                              href={href}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors min-h-[36px]",
                                isActive
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {item.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
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

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
