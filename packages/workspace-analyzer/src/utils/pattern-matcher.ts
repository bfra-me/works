/**
 * Pattern matching utilities for glob-style file path matching.
 *
 * Provides simple glob pattern matching supporting ** (any path segments)
 * and * (single segment) without external dependencies.
 */

/**
 * Matches a file path against a glob pattern.
 *
 * Supported patterns:
 * - `**` matches any number of path segments
 * - `*` matches any characters except path separator
 */
export function matchPattern(filePath: string, pattern: string): boolean {
  const normalizedPath = normalizePath(filePath)

  const DOUBLE_STAR_PLACEHOLDER = '\0DOUBLE_STAR\0'
  const regexPattern = pattern
    .replaceAll('**', DOUBLE_STAR_PLACEHOLDER)
    .replaceAll('*', '[^/]*')
    .replaceAll(DOUBLE_STAR_PLACEHOLDER, '.*')
    .replaceAll('/', String.raw`\/`)

  const regex = new RegExp(regexPattern)
  return regex.test(normalizedPath)
}

/**
 * Checks if a file path matches any of the given patterns.
 */
export function matchAnyPattern(filePath: string, patterns: readonly string[]): boolean {
  for (const pattern of patterns) {
    if (matchPattern(filePath, pattern)) {
      return true
    }
  }
  return false
}

/**
 * Normalizes a file path for consistent pattern matching.
 *
 * Converts backslashes to forward slashes for cross-platform compatibility.
 */
export function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}
