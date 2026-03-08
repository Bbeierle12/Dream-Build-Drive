import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase, setupServerActionMocks } from "../helpers/mock-supabase"

setupServerActionMocks()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { login, signup, signout } from "@/actions/auth"

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

describe("auth actions", () => {
  const mockSupabase = createMockSupabase()

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe("login", () => {
    it("redirects to / on successful login", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      await login(makeFormData({ email: "test@example.com", password: "password123" }))

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
      expect(redirect).toHaveBeenCalledWith("/")
    })

    it("redirects to /login with error on invalid credentials", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: "Invalid login credentials" },
      })

      await login(makeFormData({ email: "bad@example.com", password: "wrong" }))

      expect(redirect).toHaveBeenCalledWith(
        "/login?error=" + encodeURIComponent("Invalid login credentials")
      )
    })
  })

  describe("signup", () => {
    it("redirects to /login with success message on signup", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await signup(makeFormData({ email: "new@example.com", password: "password123" }))

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
      })
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
      expect(redirect).toHaveBeenCalledWith(
        "/login?message=" + encodeURIComponent("Check your email to confirm your account")
      )
    })

    it("redirects to /signup with error on duplicate email", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        error: { message: "User already registered" },
      })

      await signup(makeFormData({ email: "existing@example.com", password: "password123" }))

      expect(redirect).toHaveBeenCalledWith(
        "/signup?error=" + encodeURIComponent("User already registered")
      )
    })
  })

  describe("signout", () => {
    it("signs out and redirects to /login", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await signout()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith("/login")
    })
  })
})
