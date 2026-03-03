"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, Image, Settings } from "lucide-react"

type ProjectSidebarProps = {
  projectId: string
  projectName: string
}

const getNavItems = (projectId: string) => [
  { href: `/projects/${projectId}`, label: "Overview", icon: LayoutDashboard },
  { href: `/projects/${projectId}/parts`, label: "Parts", icon: Package },
  { href: `/projects/${projectId}/media`, label: "Media", icon: Image },
  { href: `/projects/${projectId}/settings`, label: "Settings", icon: Settings },
]

export function ProjectSidebar({ projectId, projectName }: ProjectSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold truncate">{projectName}</h2>
      </div>
      <nav className="space-y-1">
        {getNavItems(projectId).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
