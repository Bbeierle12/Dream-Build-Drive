import { describe, it, expect } from "vitest"
import { DEFAULT_CATEGORIES, PART_STATUSES, STATUS_COLORS } from "@/lib/constants"

describe("DEFAULT_CATEGORIES", () => {
  it("contains 8 default categories", () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(8)
  })

  it("includes Engine and Suspension", () => {
    expect(DEFAULT_CATEGORIES).toContain("Engine")
    expect(DEFAULT_CATEGORIES).toContain("Suspension")
  })
})

describe("PART_STATUSES", () => {
  it("contains 6 statuses", () => {
    expect(PART_STATUSES).toHaveLength(6)
  })

  it("starts with researching and ends with installed", () => {
    expect(PART_STATUSES[0]).toBe("researching")
    expect(PART_STATUSES[PART_STATUSES.length - 1]).toBe("installed")
  })
})

describe("STATUS_COLORS", () => {
  it("has a color mapping for every status", () => {
    for (const status of PART_STATUSES) {
      expect(STATUS_COLORS[status]).toBeDefined()
      expect(typeof STATUS_COLORS[status]).toBe("string")
    }
  })
})
