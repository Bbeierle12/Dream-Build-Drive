import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function computeCategoryCost(parts: { estimated_cost: number | null; actual_cost: number | null; status: string }[]) {
  let projected = 0
  let actual = 0
  let purchased = 0
  let planned = 0

  for (const part of parts) {
    const est = part.estimated_cost ?? 0
    const act = part.actual_cost ?? 0

    projected += est
    actual += act

    if (["ordered", "shipped", "received", "installed"].includes(part.status)) {
      purchased += act || est
    } else {
      planned += est
    }
  }

  return {
    projected,
    actual,
    purchased,
    planned,
    overUnder: actual - projected,
  }
}

export function computeProjectCost(
  categories: { parts: { estimated_cost: number | null; actual_cost: number | null; status: string }[] }[]
) {
  const allParts = categories.flatMap((c) => c.parts)
  return computeCategoryCost(allParts)
}
