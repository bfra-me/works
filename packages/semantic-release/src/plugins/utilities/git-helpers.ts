/**
 * Git helpers for plugin development.
 *
 * Utilities for working with Git operations and commit information.
 */

import type {Commit} from '../context.js'

/**
 * Filters commits by type using conventional commit format.
 *
 * @param commits - Array of commits to filter
 * @param types - Array of commit types to include (e.g., ['feat', 'fix'])
 * @returns Filtered array of commits
 *
 * @example
 * ```typescript
 * const featCommits = filterCommitsByType(context.commits, ['feat'])
 * ```
 */
export function filterCommitsByType(
  commits: readonly Commit[],
  types: readonly string[],
): Commit[] {
  return commits.filter(commit => {
    const match = commit.subject.match(/^(\w+)(?:\(.+\))?\s*:\s*(.+)/)
    return match != null && match[1] != null && types.includes(match[1])
  })
}

/**
 * Filters commits by scope using conventional commit format.
 *
 * @param commits - Array of commits to filter
 * @param scopes - Array of commit scopes to include
 * @returns Filtered array of commits
 *
 * @example
 * ```typescript
 * const apiCommits = filterCommitsByScope(context.commits, ['api'])
 * ```
 */
export function filterCommitsByScope(
  commits: readonly Commit[],
  scopes: readonly string[],
): Commit[] {
  return commits.filter(commit => {
    const match = commit.subject.match(/^\w+\((.+)\)\s*:\s*/)
    return match != null && match[1] != null && scopes.includes(match[1])
  })
}

/**
 * Checks if a commit is a breaking change.
 *
 * @param commit - Commit to check
 * @returns True if the commit indicates a breaking change
 *
 * @example
 * ```typescript
 * const hasBreaking = context.commits.some(isBreakingChange)
 * ```
 */
export function isBreakingChange(commit: Commit): boolean {
  // Check for exclamation mark in subject (e.g., "feat!: breaking change")
  if (commit.subject.includes('!:')) {
    return true
  }

  // Check for BREAKING CHANGE in footer
  const breakingPattern = /^BREAKING CHANGE:\s+/m
  return breakingPattern.test(commit.body)
}

/**
 * Extracts the commit type from a conventional commit message.
 *
 * @param commit - Commit to extract type from
 * @returns Commit type or null if not conventional format
 *
 * @example
 * ```typescript
 * const type = getCommitType(commit) // 'feat', 'fix', etc.
 * ```
 */
export function getCommitType(commit: Commit): string | null {
  const match = commit.subject.match(/^(\w+)(?:\(.+\))?\s*:\s*/)
  return match?.[1] ?? null
}

/**
 * Extracts the commit scope from a conventional commit message.
 *
 * @param commit - Commit to extract scope from
 * @returns Commit scope or null if no scope
 *
 * @example
 * ```typescript
 * const scope = getCommitScope(commit) // 'api', 'ui', etc.
 * ```
 */
export function getCommitScope(commit: Commit): string | null {
  const match = commit.subject.match(/^\w+\((.+)\)\s*:\s*/)
  return match?.[1] ?? null
}

/**
 * Gets the commit description (the part after the colon).
 *
 * @param commit - Commit to extract description from
 * @returns Commit description or the full subject if not conventional format
 *
 * @example
 * ```typescript
 * const description = getCommitDescription(commit) // 'add new feature'
 * ```
 */
export function getCommitDescription(commit: Commit): string {
  const match = commit.subject.match(/^\w+(?:\(.+\))?\s*:\s*(.+)/)
  return match?.[1] ?? commit.subject
}

/**
 * Groups commits by their type.
 *
 * @param commits - Array of commits to group
 * @returns Object with commit types as keys and arrays of commits as values
 *
 * @example
 * ```typescript
 * const grouped = groupCommitsByType(context.commits)
 * // { feat: [...], fix: [...], docs: [...] }
 * ```
 */
export function groupCommitsByType(commits: readonly Commit[]): Record<string, Commit[]> {
  const groups: Record<string, Commit[]> = {}

  for (const commit of commits) {
    const type = getCommitType(commit) ?? 'other'
    if (groups[type] == null) {
      groups[type] = []
    }
    groups[type].push(commit)
  }

  return groups
}

/**
 * Gets commits since a specific commit hash.
 *
 * @param commits - Array of all commits
 * @param sinceHash - Commit hash to start from (exclusive)
 * @returns Array of commits after the specified hash
 *
 * @example
 * ```typescript
 * const newCommits = getCommitsSince(context.commits, context.lastRelease.gitHead)
 * ```
 */
export function getCommitsSince(commits: readonly Commit[], sinceHash: string): Commit[] {
  const sinceIndex = commits.findIndex(commit => commit.hash === sinceHash)
  if (sinceIndex === -1) {
    return [...commits]
  }
  return commits.slice(0, sinceIndex)
}

/**
 * Checks if any commits have a specific pattern in their message.
 *
 * @param commits - Array of commits to check
 * @param pattern - Regular expression pattern to match
 * @returns True if any commit matches the pattern
 *
 * @example
 * ```typescript
 * const hasSkipCI = hasCommitPattern(context.commits, /\[skip ci\]/i)
 * ```
 */
export function hasCommitPattern(commits: readonly Commit[], pattern: RegExp): boolean {
  return commits.some(commit => pattern.test(commit.subject) || pattern.test(commit.body))
}

/**
 * Formats a commit for display in release notes.
 *
 * @param commit - Commit to format
 * @param options - Formatting options
 * @param options.includeHash - Whether to include commit hash
 * @param options.includeAuthor - Whether to include author name
 * @param options.hashLength - Length of hash to display
 * @returns Formatted commit string
 *
 * @example
 * ```typescript
 * const formatted = formatCommitForReleaseNotes(commit, {
 *   includeHash: true,
 *   includeAuthor: false
 * })
 * ```
 */
export function formatCommitForReleaseNotes(
  commit: Commit,
  options: {
    includeHash?: boolean
    includeAuthor?: boolean
    hashLength?: number
  } = {},
): string {
  const {includeHash = false, includeAuthor = false, hashLength = 7} = options

  let formatted = getCommitDescription(commit)

  if (includeHash) {
    const shortHash = commit.hash.slice(0, hashLength)
    formatted += ` (${shortHash})`
  }

  if (includeAuthor) {
    formatted += ` - ${commit.author.name}`
  }

  return formatted
}

/**
 * Validates that a commit follows conventional commit format.
 *
 * @param commit - Commit to validate
 * @returns True if the commit follows conventional format
 *
 * @example
 * ```typescript
 * const isValid = isConventionalCommit(commit)
 * ```
 */
export function isConventionalCommit(commit: Commit): boolean {
  const conventionalPattern = /^\w+(?:\(.+\))?\s*:\s*.+/
  return conventionalPattern.test(commit.subject)
}
