import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase, setupServerActionMocks } from "../helpers/mock-supabase"

setupServerActionMocks()

const mockSupabase = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

import { createPart, updatePart, deletePart, updatePartStatus } from "@/actions/parts"

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

describe("createPart", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("inserts a part with correct fields", async () => {
    mockSupabase.from.mockImplementation(() => {
      const chain = {
        insert: vi.fn().mockReturnThis(),
        then: (resolve: (v: { data: null; error: null }) => void) => {
          resolve({ data: null, error: null })
          return { catch: () => ({}) }
        },
      }
      return chain
    })

    const fd = makeFormData({
      name: "Turbo",
      part_number: "TB-001",
      vendor: "Summit",
      vendor_url: "",
      estimated_cost: "500",
      actual_cost: "",
      status: "ordered",
      notes: "Big one",
    })

    const result = await createPart("proj-1", "cat-1", fd)
    expect(result).toBeUndefined() // no error returned

    expect(mockSupabase.from).toHaveBeenCalledWith("parts")
  })

  it("returns error on Supabase failure", async () => {
    mockSupabase.from.mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        then: (resolve: (v: { error: { message: string } }) => void) => {
          resolve({ error: { message: "duplicate key" } })
          return { catch: () => ({}) }
        },
      }),
    }))

    const fd = makeFormData({ name: "Dup" })
    const result = await createPart("proj-1", "cat-1", fd)
    expect(result).toEqual({ error: "duplicate key" })
  })
})

describe("updatePart", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: { error: { message: string } }) => void) => {
            resolve({ error: { message: "not found" } })
            return { catch: () => ({}) }
          },
        }),
      }),
    }))

    const fd = makeFormData({ name: "Updated" })
    const result = await updatePart("part-1", "proj-1", fd)
    expect(result).toEqual({ error: "not found" })
  })
})

describe("deletePart", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: { error: { message: string } }) => void) => {
            resolve({ error: { message: "FK constraint" } })
            return { catch: () => ({}) }
          },
        }),
      }),
    }))

    const result = await deletePart("part-1", "proj-1")
    expect(result).toEqual({ error: "FK constraint" })
  })

  it("returns undefined on success", async () => {
    mockSupabase.from.mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: (resolve: (v: { error: null }) => void) => {
            resolve({ error: null })
            return { catch: () => ({}) }
          },
        }),
      }),
    }))

    const result = await deletePart("part-1", "proj-1")
    expect(result).toBeUndefined()
  })
})

describe("updatePartStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls update with the new status", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: (resolve: (v: { error: null }) => void) => {
          resolve({ error: null })
          return { catch: () => ({}) }
        },
      }),
    })

    mockSupabase.from.mockImplementation(() => ({
      update: mockUpdate,
    }))

    const result = await updatePartStatus("part-1", "proj-1", "installed")
    expect(result).toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ status: "installed" })
  })
})
