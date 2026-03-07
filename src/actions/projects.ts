"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createProject(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: formData.get("name") as string,
      year: formData.get("year") ? Number(formData.get("year")) : null,
      make: (formData.get("make") as string) || null,
      model: (formData.get("model") as string) || null,
      trim: (formData.get("trim") as string) || null,
      vin: (formData.get("vin") as string) || null,
      color: (formData.get("color") as string) || null,
      budget: formData.get("budget") ? Number(formData.get("budget")) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  redirect(`/projects/${data.id}`)
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase
    .from("projects")
    .update({
      name: formData.get("name") as string,
      year: formData.get("year") ? Number(formData.get("year")) : null,
      make: (formData.get("make") as string) || null,
      model: (formData.get("model") as string) || null,
      trim: (formData.get("trim") as string) || null,
      vin: (formData.get("vin") as string) || null,
      color: (formData.get("color") as string) || null,
      budget: formData.get("budget") ? Number(formData.get("budget")) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
}

export async function deleteProject(projectId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  redirect("/")
}
