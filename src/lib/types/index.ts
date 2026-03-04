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

// ── v2: Tasks ──────────────────────────────────────────────

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export type Task = {
  id: string
  project_id: string
  category_id: string | null
  part_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string | null
  due_date: string | null
  is_milestone: boolean
  time_estimate_min: number | null
  time_actual_min: number | null
  created_at: string
  updated_at: string
}

export type TaskDependency = {
  task_id: string
  depends_on_task_id: string
}

export type TaskWithDependencies = Task & {
  dependencies: TaskDependency[]
  blocked_by: TaskDependency[]
}

export type SearchResult = {
  type: "task" | "part" | "category" | "attachment"
  id: string
  title: string
  subtitle: string | null
  project_id: string
  url: string
}
