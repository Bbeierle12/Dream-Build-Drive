import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Car, DollarSign, PiggyBank, Wrench, ListTodo } from "lucide-react"

type StatCardsProps = {
  activeProjects: number
  totalSpend: number
  totalBudget: number
  totalParts: number
  totalTasks?: number
}

export function StatCards({
  activeProjects,
  totalSpend,
  totalBudget,
  totalParts,
  totalTasks,
}: StatCardsProps) {
  const budgetRemaining = totalBudget - totalSpend

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${totalTasks !== undefined ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Builds</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{activeProjects}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(totalSpend)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-mono ${budgetRemaining < 0 ? "text-destructive" : ""}`}>
            {formatCurrency(budgetRemaining)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{totalParts}</div>
        </CardContent>
      </Card>
      {totalTasks !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalTasks}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
