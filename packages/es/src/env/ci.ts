import isCI from 'is-in-ci'

/**
 * Check if the process is running in a CI environment.
 * Uses the is-in-ci package for comprehensive CI detection.
 *
 * @returns True if running in CI environment
 *
 * @example
 * ```ts
 * if (isInCI()) {
 *   console.log('Running in CI')
 * }
 * ```
 */
export function isInCI(): boolean {
  return isCI
}
