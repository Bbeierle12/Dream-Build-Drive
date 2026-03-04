import type { TaskDependency } from "@/lib/types"

/**
 * Detects cycles in the task dependency graph using DFS.
 * Returns true if adding `fromId -> toId` would create a cycle.
 */
export function detectCycle(
  fromId: string,
  toId: string,
  dependencies: TaskDependency[]
): boolean {
  // Would adding fromId depends on toId create a cycle?
  // A cycle exists if toId can reach fromId through the dependency graph.
  const adjacency = new Map<string, string[]>()
  for (const dep of dependencies) {
    const list = adjacency.get(dep.task_id) ?? []
    list.push(dep.depends_on_task_id)
    adjacency.set(dep.task_id, list)
  }

  // Also add the proposed edge
  const fromList = adjacency.get(fromId) ?? []
  fromList.push(toId)
  adjacency.set(fromId, fromList)

  // DFS from fromId following depends_on edges — if we reach fromId again, cycle
  const visited = new Set<string>()
  const stack = [toId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === fromId) return true
    if (visited.has(current)) continue
    visited.add(current)
    const neighbors = adjacency.get(current) ?? []
    for (const neighbor of neighbors) {
      stack.push(neighbor)
    }
  }

  return false
}

/**
 * Formats minutes into a human-readable time estimate.
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}
