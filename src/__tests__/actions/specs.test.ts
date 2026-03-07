import { describe, it, expect, vi, beforeEach } from "vitest"
import { setupServerActionMocks } from "../helpers/mock-supabase"

setupServerActionMocks()

const mockSupabase = {
  from: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

import {
  getSpecifications,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  getSpecTemplates,
} from "@/actions/specs"

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

function mockChainResult(result: { data?: unknown; error: { message: string } | null }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: (v: typeof result) => void) => {
      resolve(result)
      return { catch: () => ({}) }
    },
  }
}

describe("getSpecifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns data on success", async () => {
    const specs = [{ id: "s1", label: "Torque" }]
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: specs, error: null })
    )

    const result = await getSpecifications("proj-1")
    expect(result).toEqual({ data: specs, error: null })
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "DB error" } })
    )

    const result = await getSpecifications("proj-1")
    expect(result).toEqual({ data: null, error: "DB error" })
  })
})

describe("createSpecification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns undefined on success", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: null })
    )

    const fd = makeFormData({
      spec_type: "torque",
      label: "Head bolts",
      value: "72",
      unit: "ft-lb",
    })

    const result = await createSpecification("proj-1", fd)
    expect(result).toBeUndefined()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "insert failed" } })
    )

    const fd = makeFormData({
      spec_type: "torque",
      label: "Fail",
      value: "0",
    })

    const result = await createSpecification("proj-1", fd)
    expect(result).toEqual({ error: "insert failed" })
  })
})

describe("updateSpecification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "not found" } })
    )

    const fd = makeFormData({
      spec_type: "torque",
      label: "Updated",
      value: "80",
    })

    const result = await updateSpecification("spec-1", "proj-1", fd)
    expect(result).toEqual({ error: "not found" })
  })
})

describe("deleteSpecification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns undefined on success", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: null })
    )

    const result = await deleteSpecification("spec-1", "proj-1")
    expect(result).toBeUndefined()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "constraint" } })
    )

    const result = await deleteSpecification("spec-1", "proj-1")
    expect(result).toEqual({ error: "constraint" })
  })
})

describe("getSpecTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("defaults to universal platform", async () => {
    const mockEq = vi.fn().mockReturnThis()
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: mockEq,
        order: vi.fn().mockReturnThis(),
        then: (resolve: (v: { data: []; error: null }) => void) => {
          resolve({ data: [], error: null })
          return { catch: () => ({}) }
        },
      }),
    }))

    // Need a more precise mock for this test
    let capturedPlatform: string | undefined
    mockSupabase.from.mockImplementation(() => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((_col: string, value: string) => {
          capturedPlatform = value
          return chain
        }),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (v: { data: []; error: null }) => void) => {
          resolve({ data: [], error: null })
          return { catch: () => ({}) }
        },
      }
      return chain
    })

    await getSpecTemplates()
    expect(capturedPlatform).toBe("universal")
  })
})
