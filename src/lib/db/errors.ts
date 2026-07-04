/**
 * Postgres error helpers.
 *
 * Drizzle wraps driver errors in `DrizzleQueryError`, so the underlying
 * postgres.js error (which carries the SQLSTATE `code`) lives on `.cause`,
 * not the top level. This helper walks the cause chain so callers detect
 * constraint violations reliably instead of reading an `undefined` top-level
 * code. Single audited home so every repo checks the same way.
 */

/** SQLSTATE 23505 — unique_violation. */
export function isUniqueViolation(error: unknown): boolean {
  return hasPgCode(error, '23505')
}

function hasPgCode(error: unknown, code: string): boolean {
  let current: unknown = error
  // Bounded walk down the cause chain (DrizzleQueryError -> PostgresError).
  for (let i = 0; i < 5 && current != null; i++) {
    if (
      typeof current === 'object' &&
      'code' in current &&
      (current as { code?: string }).code === code
    ) {
      return true
    }
    current = (current as { cause?: unknown }).cause
  }
  return false
}
