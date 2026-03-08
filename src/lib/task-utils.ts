import type { TaskDependency, TaskWithDependencies } from "@/lib/types"

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

/**
 * Computes the critical path through a task dependency DAG.
 * Uses forward/backward pass to find tasks with zero total float.
 * Returns a Set of task IDs on the critical path.
 */
export function computeCriticalPath(tasks: TaskWithDependencies[]): Set<string> {
  if (tasks.length === 0) return new Set()

  const taskMap = new Map(tasks.map((t) => [t.id, t]))

  // Build adjacency: task -> tasks that depend on it (successors)
  const successors = new Map<string, string[]>()
  const predecessors = new Map<string, string[]>()
  for (const t of tasks) {
    successors.set(t.id, [])
    predecessors.set(t.id, [])
  }
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (taskMap.has(dep.depends_on_task_id)) {
        successors.get(dep.depends_on_task_id)?.push(t.id)
        predecessors.get(t.id)?.push(dep.depends_on_task_id)
      }
    }
  }

  // Compute duration for each task in days
  function getDuration(t: TaskWithDependencies): number {
    if (!t.start_date && !t.due_date) return 1
    if (!t.start_date || !t.due_date) return 1
    const start = new Date(t.start_date).getTime()
    const end = new Date(t.due_date).getTime()
    return Math.max(1, Math.round((end - start) / 86_400_000) + 1)
  }

  // Forward pass: compute earliest start (ES) and earliest finish (EF)
  const es = new Map<string, number>()
  const ef = new Map<string, number>()

  // Topological sort via Kahn's algorithm
  const inDegree = new Map<string, number>()
  for (const t of tasks) {
    inDegree.set(t.id, predecessors.get(t.id)?.length ?? 0)
  }

  const queue: string[] = []
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id)
  })

  const sorted: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    sorted.push(id)
    for (const succ of successors.get(id) ?? []) {
      const newDegree = (inDegree.get(succ) ?? 1) - 1
      inDegree.set(succ, newDegree)
      if (newDegree === 0) queue.push(succ)
    }
  }

  // If we couldn't sort all tasks (cycle), return empty set
  if (sorted.length !== tasks.length) return new Set()

  // Forward pass
  for (const id of sorted) {
    const task = taskMap.get(id)!
    const preds = predecessors.get(id) ?? []
    const maxPredEF = preds.length > 0
      ? Math.max(...preds.map((p) => ef.get(p) ?? 0))
      : 0
    es.set(id, maxPredEF)
    ef.set(id, maxPredEF + getDuration(task))
  }

  // Backward pass: compute latest start (LS) and latest finish (LF)
  const ls = new Map<string, number>()
  const lf = new Map<string, number>()
  const projectEnd = Math.max(...Array.from(ef.values()))

  for (let i = sorted.length - 1; i >= 0; i--) {
    const id = sorted[i]
    const task = taskMap.get(id)!
    const succs = successors.get(id) ?? []
    const minSuccLS = succs.length > 0
      ? Math.min(...succs.map((s) => ls.get(s) ?? projectEnd))
      : projectEnd
    lf.set(id, minSuccLS)
    ls.set(id, minSuccLS - getDuration(task))
  }

  // Critical path: tasks where ES === LS (zero total float)
  const critical = new Set<string>()
  for (const id of sorted) {
    if ((es.get(id) ?? 0) === (ls.get(id) ?? -1)) {
      critical.add(id)
    }
  }

  return critical
}
