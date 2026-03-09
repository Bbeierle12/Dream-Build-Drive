import { vi } from "vitest"

type MockQueryResult = { data: unknown; error: { message: string } | null }

type MockChain = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  textSearch: ReturnType<typeof vi.fn>
}

export function createMockChain(result: MockQueryResult): MockChain {
  const chain: MockChain = {} as MockChain

  const self = () => chain

  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.textSearch = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)

  // Make most methods also resolve to the result when awaited
  for (const method of ["select", "insert", "update", "delete", "eq", "order", "limit", "textSearch"] as const) {
    chain[method].mockReturnValue({
      ...chain,
      then: (resolve: (value: MockQueryResult) => void) => {
        resolve(result)
        return { catch: () => ({}) }
      },
    })
    // Re-apply chaining so chained calls still work
    chain[method].mockImplementation(() => {
      return new Proxy(chain, {
        get(target, prop) {
          if (prop === "then") {
            return (resolve: (value: MockQueryResult) => void) => {
              resolve(result)
              return { catch: self }
            }
          }
          return (target as Record<string | symbol, unknown>)[prop]
        },
      })
    })
  }

  chain.single.mockImplementation(() => {
    return new Proxy(chain, {
      get(target, prop) {
        if (prop === "then") {
          return (resolve: (value: MockQueryResult) => void) => {
            resolve(result)
            return { catch: self }
          }
        }
        return (target as Record<string | symbol, unknown>)[prop]
      },
    })
  })

  return chain
}

export function createMockSupabase(fromResults: Record<string, MockQueryResult> = {}) {
  const defaultResult: MockQueryResult = { data: [], error: null }

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    return createMockChain(fromResults[table] ?? defaultResult)
  })

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      createSignedUploadUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: "https://mock.url", token: "mock-token" },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://mock-public.url" },
      }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }),
  }

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  }

  return {
    from: mockFrom,
    storage: mockStorage,
    auth: mockAuth,
  }
}

export function setupServerActionMocks() {
  vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
  }))

  vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
    notFound: vi.fn(),
  }))

  vi.mock("next/headers", () => ({
    cookies: vi.fn().mockReturnValue({
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    }),
    headers: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue("http://localhost:3000"),
    }),
  }))
}
