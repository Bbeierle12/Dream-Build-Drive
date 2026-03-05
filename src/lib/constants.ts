export const DEFAULT_CATEGORIES = [
  "Engine",
  "Suspension",
  "Brakes",
  "Electrical",
  "Interior",
  "Exterior",
  "Fuel",
  "Cooling",
] as const

export const PART_STATUSES = [
  "researching",
  "planned",
  "ordered",
  "shipped",
  "received",
  "installed",
] as const

export const STATUS_COLORS: Record<string, string> = {
  researching: "bg-yellow-500/20 text-yellow-500",
  planned: "bg-blue-500/20 text-blue-400",
  ordered: "bg-blue-500/20 text-blue-400",
  shipped: "bg-blue-500/20 text-blue-400",
  received: "bg-green-500/20 text-green-400",
  installed: "bg-green-500/20 text-green-400",
}

// ── v2: Task Constants ─────────────────────────────────────

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  backlog: "bg-zinc-500/20 text-zinc-400",
  todo: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-500",
  in_review: "bg-purple-500/20 text-purple-400",
  done: "bg-green-500/20 text-green-400",
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-500/20 text-zinc-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export const KANBAN_COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
] as const

export const CALENDAR_CONFIG = {
  WEEK_DAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const,
  VIEWS: ["month", "week"] as const,
} as const

export const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS_PER_TYPE: 5,
} as const

// ── v3: Specification Constants ──────────────────────────────

export const SPEC_TYPES = [
  "torque",
  "fluid",
  "clearance",
  "wire_gauge",
  "pressure",
  "custom",
] as const

export const SPEC_TYPE_LABELS: Record<string, string> = {
  torque: "Torque",
  fluid: "Fluid",
  clearance: "Clearance",
  wire_gauge: "Wire Gauge",
  pressure: "Pressure",
  custom: "Custom",
}

export const SPEC_TYPE_UNITS: Record<string, string[]> = {
  torque: ["ft-lbs", "N-m", "in-lbs"],
  fluid: ["quarts", "liters", "gallons", "oz"],
  clearance: ["in", "mm", "thou"],
  wire_gauge: ["AWG"],
  pressure: ["psi", "bar", "kPa", "V"],
  custom: [""],
}

export const SPEC_TYPE_COLORS: Record<string, string> = {
  torque: "bg-orange-500/20 text-orange-400",
  fluid: "bg-blue-500/20 text-blue-400",
  clearance: "bg-green-500/20 text-green-400",
  wire_gauge: "bg-yellow-500/20 text-yellow-500",
  pressure: "bg-purple-500/20 text-purple-400",
  custom: "bg-zinc-500/20 text-zinc-400",
}

// ── v3: Analytics Constants ──────────────────────────────────

export const CHART_COLORS = [
  "#C0392B", // primary red
  "#3498DB",
  "#2ECC71",
  "#F39C12",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#E74C3C",
] as const

export const GANTT_CONFIG = {
  ROW_HEIGHT: 40,
  HEADER_HEIGHT: 48,
  DAY_WIDTH: 32,
  MIN_BAR_WIDTH: 8,
} as const
