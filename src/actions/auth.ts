"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const origin = headers().get("origin")
  const host = headers().get("host")
  const proto = headers().get("x-forwarded-proto") ?? "https"
  const baseUrl = origin || `${proto}://${host}`

  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  })

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message))
  }

  // Supabase returns a user with empty identities when the email already exists
  // but doesn't surface it as an error
  if (signUpData?.user?.identities?.length === 0) {
    redirect("/signup?error=" + encodeURIComponent("An account with this email already exists"))
  }

  revalidatePath("/", "layout")
  redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account"))
}

export async function signout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
