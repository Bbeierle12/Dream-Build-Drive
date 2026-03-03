export type Project = {
  id: string
  user_id: string
  name: string
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  vin: string | null
  color: string | null
  budget: number | null
  notes: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  project_id: string
  name: string
  sort_order: number
  created_at: string
}

export type PartStatus =
  | "researching"
  | "planned"
  | "ordered"
  | "shipped"
  | "received"
  | "installed"

export type Part = {
  id: string
  category_id: string
  project_id: string
  name: string
  part_number: string | null
  vendor: string | null
  vendor_url: string | null
  estimated_cost: number | null
  actual_cost: number | null
  status: PartStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type Attachment = {
  id: string
  project_id: string
  category_id: string | null
  part_id: string | null
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  url: string
  created_at: string
}

export type CategoryWithParts = Category & {
  parts: Part[]
}

export type ProjectWithCategories = Project & {
  categories: CategoryWithParts[]
}

export type CostSummary = {
  projected: number
  actual: number
  purchased: number
  planned: number
  overUnder: number
}
