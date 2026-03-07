import { describe, expect, it } from "vitest"
import { normalizeOptionalSelectValue } from "@/lib/form-utils"

describe("normalizeOptionalSelectValue", () => {
  it("returns null for missing values", () => {
    expect(normalizeOptionalSelectValue(null)).toBeNull()
  })

  it("returns null for empty values", () => {
    expect(normalizeOptionalSelectValue("")).toBeNull()
    expect(normalizeOptionalSelectValue("   ")).toBeNull()
  })

  it("returns null for the UI none sentinel", () => {
    expect(normalizeOptionalSelectValue("none")).toBeNull()
  })

  it("preserves real selected values", () => {
    expect(normalizeOptionalSelectValue("abc-123")).toBe("abc-123")
  })
})
