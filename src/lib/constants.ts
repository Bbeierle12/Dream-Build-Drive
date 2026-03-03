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
