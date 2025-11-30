import isCI from 'is-in-ci'

/**
 * Check if the process is running in a CI environment.
 * Uses the is-in-ci package for comprehensive CI detection.
 */
export function isInCI(): boolean {
  return isCI
}
