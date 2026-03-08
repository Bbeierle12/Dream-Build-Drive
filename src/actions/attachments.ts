"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createSignedUploadUrl(
  projectId: string,
  fileName: string
) {
  const supabase = createClient()

  const path = `${projectId}/${Date.now()}-${fileName}`

  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(path)

  if (error) {
    return { error: error.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("attachments").getPublicUrl(path)

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
  }
}

export async function createAttachment({
  projectId,
  categoryId,
  partId,
  fileName,
  fileType,
  fileSize,
  storagePath,
  url,
  title,
  description,
}: {
  projectId: string
  categoryId?: string | null
  partId?: string | null
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  url: string
  title?: string | null
  description?: string | null
}) {
  const supabase = createClient()

  const { error } = await supabase.from("attachments").insert({
    project_id: projectId,
    category_id: categoryId ?? null,
    part_id: partId ?? null,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    storage_path: storagePath,
    url,
    title: title || null,
    description: description || null,
  })

  if (error) {
    await supabase.storage.from("attachments").remove([storagePath])
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/media`)
}

export async function deleteAttachment(attachmentId: string, storagePath: string, projectId: string) {
  const supabase = createClient()

  const { data: attachment, error: loadError } = await supabase
    .from("attachments")
    .select("project_id, storage_path")
    .eq("id", attachmentId)
    .single()

  if (loadError || !attachment) {
    return { error: loadError?.message ?? "Attachment not found" }
  }

  if (attachment.project_id !== projectId) {
    return { error: "Attachment does not belong to this project" }
  }

  const pathToDelete = attachment.storage_path || storagePath
  const { error: storageError } = await supabase.storage
    .from("attachments")
    .remove([pathToDelete])

  if (storageError) {
    return { error: storageError.message }
  }

  const { error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath(`/projects/${projectId}/media`)
}
