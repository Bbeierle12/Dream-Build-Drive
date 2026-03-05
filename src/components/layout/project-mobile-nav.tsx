"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ListTodo,
  Image,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3, CalendarDays, Settings, GanttChart, Wrench, BarChart3 } from "lucide-react"

type ProjectMobileNavProps = {
  projectId: string
}

const PRIMARY_NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/parts", label: "Parts", icon: Package },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/media", label: "Media", icon: Image },
]

const MORE_NAV = [
  { href: "/tasks/kanban", label: "Kanban", icon: Columns3 },
  { href: "/tasks/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks/gantt", label: "Gantt", icon: GanttChart },
  { href: "/specs", label: "Specs", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function ProjectMobileNav({ projectId }: ProjectMobileNavProps) {
  const pathname = usePathname()
  const basePath = `/projects/${projectId}`

  function isActive(href: string) {
    const fullPath = `${basePath}${href}`
    if (href === "") return pathname === basePath
    return pathname.startsWith(fullPath)
  }

  const moreIsActive = MORE_NAV.some((item) => isActive(item.href))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="flex items-stretch justify-around">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs transition-colors outline-none",
              moreIsActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2">
            {MORE_NAV.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={`${basePath}${item.href}`}
                    className={cn(
                      "flex items-center gap-2 min-h-[44px]",
                      isActive(item.href) && "text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
