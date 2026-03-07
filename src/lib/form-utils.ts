export function normalizeOptionalSelectValue(
  value: FormDataEntryValue | null
): string | null {
  if (typeof value !== "string") return null

  const normalized = value.trim()
  if (!normalized || normalized === "none") {
    return null
  }

  return normalized
}
