import { describe, it, expect, vi, beforeEach } from "vitest"
import { setupServerActionMocks } from "../helpers/mock-supabase"

setupServerActionMocks()

const mockSupabase = {
  from: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

import { createTask, updateTask, deleteTask, updateTaskStatus } from "@/actions/tasks"

function makeFormData(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v)
    } else {
      fd.set(key, value)
    }
  }
  return fd
}

function mockChainResult(result: { data?: unknown; error: { message: string } | null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: (v: typeof result) => void) => {
      resolve(result)
      return { catch: () => ({}) }
    },
  }
  return chain
}

describe("createTask", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("inserts a task and returns undefined on success (no deps)", async () => {
    // createTask flow: insert into tasks (returns id), then queries tasks + task_dependencies for validation
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "tasks") {
        return mockChainResult({ data: { id: "task-new" }, error: null })
      }
      if (table === "task_dependencies") {
        return mockChainResult({ data: [], error: null })
      }
      return mockChainResult({ data: [], error: null })
    })

    // Override: the insert().select().single() chain needs to return { data: { id }, error: null }
    // but the select("id").eq() chain for getProjectDependencies needs to return { data: [], error: null }
    let tasksCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "tasks") {
        tasksCallCount++
        if (tasksCallCount === 1) {
          // insert call
          return mockChainResult({ data: { id: "task-new" }, error: null })
        }
        // subsequent select for validation
        return mockChainResult({ data: [{ id: "task-new" }], error: null })
      }
      if (table === "task_dependencies") {
        return mockChainResult({ data: [], error: null })
      }
      return mockChainResult({ data: [], error: null })
    })

    const fd = makeFormData({
      title: "Install exhaust",
      status: "todo",
      priority: "high",
    })

    const result = await createTask("proj-1", fd)
    expect(result).toBeUndefined()
  })

  it("returns error on insert failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "DB error" } })
    )

    const fd = makeFormData({ title: "Fail" })
    const result = await createTask("proj-1", fd)
    expect(result).toEqual({ error: "DB error" })
  })
})

describe("updateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error if dependency validation fails (self-dependency)", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "tasks") {
        return mockChainResult({
          data: [{ id: "task-1" }],
          error: null,
        })
      }
      if (table === "task_dependencies") {
        return mockChainResult({ data: [], error: null })
      }
      return mockChainResult({ data: null, error: null })
    })

    const fd = makeFormData({
      title: "Self dep",
      dependency_ids: ["task-1"],
    })

    const result = await updateTask("task-1", "proj-1", fd)
    expect(result).toEqual({ error: "A task cannot depend on itself" })
  })
})

describe("deleteTask", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns undefined on success", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: null })
    )

    const result = await deleteTask("task-1", "proj-1")
    expect(result).toBeUndefined()
  })

  it("returns error on failure", async () => {
    mockSupabase.from.mockImplementation(() =>
      mockChainResult({ data: null, error: { message: "constraint" } })
    )

    const result = await deleteTask("task-1", "proj-1")
    expect(result).toEqual({ error: "constraint" })
  })
})

describe("updateTaskStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates status and returns undefined on success", async () => {
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

    const result = await updateTaskStatus("task-1", "proj-1", "done")
    expect(result).toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ status: "done" })
  })
})
