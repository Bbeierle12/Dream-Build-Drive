type ErrorContext = {
  action: string
  projectId?: string
  meta?: Record<string, unknown>
}

/**
 * Centralized error reporter. Currently logs structured errors to console.
 * Replace the body with Sentry, LogRocket, or any other provider when ready.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  const payload = {
    ...context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  }

  console.error("[Dream Build Drive]", payload)
}
