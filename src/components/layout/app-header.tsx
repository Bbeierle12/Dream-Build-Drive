import { Wrench } from "lucide-react"

export function AppHeader() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-card px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Wrench className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold">Dream Build Drive</span>
      </div>
    </header>
  )
}
