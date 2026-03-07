import { describe, it, expect, vi, beforeEach } from "vitest"
import { setupServerActionMocks } from "../helpers/mock-supabase"

setupServerActionMocks()

const mockSupabase = {
  from: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

import { createCategory, updateCategory, deleteCategory } from "@/actions/categories"

function mockChainResult(result: { data?: unknown; error: { message: string } | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (v: typeof result) => void) => {
      resolve(result)
      return { catch: () => ({}) }
    },
  }
}

describe("createCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries for max sort_order then inserts", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // sort_order query
        return mockChainResult({ data: [{ sort_order: 3 }], error: null })
      }
      // insert
      return mockChainResult({ data: null, error: null })
    })

    const result = await createCategory("proj-1", "Suspension")
    expect(result).toBeUndefined()
    expect(mockSupabase.from).toHaveBeenCalledWith("categories")
  })

  it("defaults sort_order to 0 when no existing categories", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return mockChainResult({ data: [], error: null })
      }
      return mockChainResult({ data: null, error: null })
    })

    const result = await createCategory("proj-1", "Body")
    expect(result).toBeUndefined()
  })

  it("returns error on insert failure", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return mockChainResult({ data: [], error: null })
      }
      return mockChainResult({ error: { message: "unique violation" } })
    })

    const result = await createCategory("proj-1", "Dupe")
    expect(result).toEqual({ error: "unique violation" })
  })
})

describe("updateCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ error: { message: "not found" } })
    )

    const result = await updateCategory("cat-1", "proj-1", "New Name")
    expect(result).toEqual({ error: "not found" })
  })

  it("returns undefined on success", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ error: null })
    )

    const result = await updateCategory("cat-1", "proj-1", "New Name")
    expect(result).toBeUndefined()
  })
})

describe("deleteCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ error: { message: "has parts" } })
    )

    const result = await deleteCategory("cat-1", "proj-1")
    expect(result).toEqual({ error: "has parts" })
  })
})
