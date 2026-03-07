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
  getExportParts,
  getExportTasks,
  getExportSpecs,
  getExportCostReport,
  getExportProjectInfo,
} from "@/actions/export"

function mockTableResults(tableMap: Record<string, { data: unknown; error: { message: string } | null }>) {
  mockSupabase.from.mockImplementation((table: string) => {
    const result = tableMap[table] ?? { data: [], error: null }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: (resolve: (v: typeof result) => void) => {
        resolve(result)
        return { catch: () => ({}) }
      },
    }
  })
}

describe("getExportParts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("joins category names onto parts", async () => {
    mockTableResults({
      categories: {
        data: [{ id: "c1", name: "Engine" }],
        error: null,
      },
      parts: {
        data: [
          { id: "p1", category_id: "c1", name: "Turbo" },
          { id: "p2", category_id: "c-unknown", name: "Mystery" },
        ],
        error: null,
      },
    })

    const result = await getExportParts("proj-1")
    expect(result).toHaveLength(2)
    expect(result[0].category_name).toBe("Engine")
    expect(result[1].category_name).toBe("Uncategorized")
  })

  it("throws on categories error", async () => {
    mockTableResults({
      categories: { data: null, error: { message: "DB fail" } },
    })

    await expect(getExportParts("proj-1")).rejects.toThrow("DB fail")
  })

  it("throws on parts error", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      const result =
        table === "categories"
          ? { data: [], error: null }
          : { data: null, error: { message: "parts fail" } }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (v: typeof result) => void) => {
          resolve(result)
          return { catch: () => ({}) }
        },
      }
    })

    await expect(getExportParts("proj-1")).rejects.toThrow("parts fail")
  })
})

describe("getExportTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps category names onto tasks", async () => {
    mockTableResults({
      categories: {
        data: [{ id: "c1", name: "Engine" }],
        error: null,
      },
      tasks: {
        data: [
          { id: "t1", category_id: "c1", title: "Install" },
          { id: "t2", category_id: null, title: "Plan" },
        ],
        error: null,
      },
    })

    const result = await getExportTasks("proj-1")
    expect(result[0].category_name).toBe("Engine")
    expect(result[1].category_name).toBeNull()
  })
})

describe("getExportSpecs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps category and part names onto specs", async () => {
    // getExportSpecs uses Promise.all so all three tables resolve from the same mock
    mockTableResults({
      categories: {
        data: [{ id: "c1", name: "Engine" }],
        error: null,
      },
      parts: {
        data: [{ id: "p1", name: "Turbo" }],
        error: null,
      },
      specifications: {
        data: [
          { id: "s1", category_id: "c1", part_id: "p1", label: "Torque" },
          { id: "s2", category_id: null, part_id: null, label: "Note" },
        ],
        error: null,
      },
    })

    const result = await getExportSpecs("proj-1")
    expect(result[0].category_name).toBe("Engine")
    expect(result[0].part_name).toBe("Turbo")
    expect(result[1].category_name).toBeNull()
    expect(result[1].part_name).toBeNull()
  })
})

describe("getExportCostReport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("nests parts under their categories", async () => {
    mockTableResults({
      categories: {
        data: [
          { id: "c1", name: "Engine", sort_order: 0 },
          { id: "c2", name: "Interior", sort_order: 1 },
        ],
        error: null,
      },
      parts: {
        data: [
          { id: "p1", category_id: "c1", name: "Turbo" },
          { id: "p2", category_id: "c1", name: "Manifold" },
          { id: "p3", category_id: "c2", name: "Seat" },
        ],
        error: null,
      },
    })

    const result = await getExportCostReport("proj-1")
    expect(result).toHaveLength(2)
    expect(result[0].parts).toHaveLength(2)
    expect(result[1].parts).toHaveLength(1)
  })
})

describe("getExportProjectInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns project data", async () => {
    const project = { id: "proj-1", name: "My Build" }
    mockTableResults({
      projects: { data: project, error: null },
    })

    const result = await getExportProjectInfo("proj-1")
    expect(result).toEqual(project)
  })

  it("throws on error", async () => {
    mockTableResults({
      projects: { data: null, error: { message: "not found" } },
    })

    await expect(getExportProjectInfo("proj-1")).rejects.toThrow("not found")
  })
})
