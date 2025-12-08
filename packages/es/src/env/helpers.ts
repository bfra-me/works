import process from 'node:process'

/**
 * Check if an environment variable exists and has a non-empty string value.
 * Whitespace-only values are considered empty.
 */
export function hasNonEmptyEnv(key: string): boolean {
  const value = process.env[key]
  return typeof value === 'string' && value.trim().length > 0
}
