import { describe, it, expect } from "vitest"
import { formatCurrency, computeCategoryCost, computeProjectCost } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats a positive amount", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats a negative amount", () => {
    expect(formatCurrency(-500)).toBe("-$500.00")
  })

  it("rounds to two decimal places", () => {
    expect(formatCurrency(19.999)).toBe("$20.00")
  })
})

describe("computeCategoryCost", () => {
  it("returns zeroes for empty parts", () => {
    const result = computeCategoryCost([])
    expect(result).toEqual({
      projected: 0,
      actual: 0,
      purchased: 0,
      planned: 0,
      overUnder: 0,
    })
  })

  it("sums estimated costs for projected", () => {
    const parts = [
      { estimated_cost: 100, actual_cost: null, status: "researching" },
      { estimated_cost: 200, actual_cost: null, status: "planned" },
    ]
    const result = computeCategoryCost(parts)
    expect(result.projected).toBe(300)
  })

  it("sums actual costs", () => {
    const parts = [
      { estimated_cost: 100, actual_cost: 110, status: "installed" },
      { estimated_cost: 200, actual_cost: 190, status: "received" },
    ]
    const result = computeCategoryCost(parts)
    expect(result.actual).toBe(300)
  })

  it("calculates purchased for ordered/shipped/received/installed", () => {
    const parts = [
      { estimated_cost: 100, actual_cost: 110, status: "installed" },
      { estimated_cost: 200, actual_cost: null, status: "ordered" },
      { estimated_cost: 50, actual_cost: null, status: "researching" },
    ]
    const result = computeCategoryCost(parts)
    // installed: actual_cost 110
    // ordered: no actual, falls back to estimated 200
    expect(result.purchased).toBe(310)
  })

  it("calculates planned for researching/planned statuses", () => {
    const parts = [
      { estimated_cost: 100, actual_cost: null, status: "researching" },
      { estimated_cost: 200, actual_cost: null, status: "planned" },
      { estimated_cost: 300, actual_cost: 300, status: "installed" },
    ]
    const result = computeCategoryCost(parts)
    expect(result.planned).toBe(300)
  })

  it("calculates over/under as actual - projected", () => {
    const parts = [
      { estimated_cost: 100, actual_cost: 120, status: "installed" },
      { estimated_cost: 200, actual_cost: 180, status: "installed" },
    ]
    const result = computeCategoryCost(parts)
    expect(result.overUnder).toBe(0) // 300 actual - 300 projected
  })

  it("handles null costs gracefully", () => {
    const parts = [
      { estimated_cost: null, actual_cost: null, status: "researching" },
    ]
    const result = computeCategoryCost(parts)
    expect(result).toEqual({
      projected: 0,
      actual: 0,
      purchased: 0,
      planned: 0,
      overUnder: 0,
    })
  })
})

describe("computeProjectCost", () => {
  it("rolls up costs from multiple categories", () => {
    const categories = [
      {
        parts: [
          { estimated_cost: 100, actual_cost: 90, status: "installed" },
          { estimated_cost: 200, actual_cost: null, status: "planned" },
        ],
      },
      {
        parts: [
          { estimated_cost: 300, actual_cost: 310, status: "received" },
        ],
      },
    ]
    const result = computeProjectCost(categories)
    expect(result.projected).toBe(600)
    expect(result.actual).toBe(400) // 90 + 310
  })

  it("handles empty categories", () => {
    const result = computeProjectCost([])
    expect(result.projected).toBe(0)
    expect(result.actual).toBe(0)
  })
})
