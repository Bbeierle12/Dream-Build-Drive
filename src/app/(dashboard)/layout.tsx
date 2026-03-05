import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { MobileSearchToggle } from "@/components/layout/mobile-search-toggle"
import { SearchBar } from "@/components/layout/search-bar"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("updated_at", { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <AppSidebar projects={projects ?? []} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
          <MobileSidebar projects={projects ?? []} />
          <span className="ml-2 text-lg font-bold flex-1">DBD</span>
          <MobileSearchToggle />
        </header>
        <div className="hidden md:flex h-12 items-center border-b border-border bg-card/50 px-6">
          <SearchBar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
