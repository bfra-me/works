/**
 * Release helpers for plugin development.
 *
 * Utilities for working with release information and version management.
 */

import type {NextRelease, Release} from '../context.js'

/**
 * Checks if the current release is a prerelease.
 *
 * @param release - Release information
 * @returns True if this is a prerelease
 *
 * @example
 * ```typescript
 * if (isPrerelease(context.nextRelease)) {
 *   // Handle prerelease logic
 * }
 * ```
 */
export function isPrerelease(release: NextRelease | Release): boolean {
  if ('type' in release) {
    return release.version.includes('-') || release.type.startsWith('pre')
  }
  return release.version.includes('-')
}

/**
 * Checks if the current release is a major version bump.
 *
 * @param release - Next release information
 * @returns True if this is a major release
 *
 * @example
 * ```typescript
 * if (isMajorRelease(context.nextRelease)) {
 *   // Handle breaking changes
 * }
 * ```
 */
export function isMajorRelease(release: NextRelease): boolean {
  return release.type === 'major'
}

/**
 * Checks if the current release is a minor version bump.
 *
 * @param release - Next release information
 * @returns True if this is a minor release
 */
export function isMinorRelease(release: NextRelease): boolean {
  return release.type === 'minor'
}

/**
 * Checks if the current release is a patch version bump.
 *
 * @param release - Next release information
 * @returns True if this is a patch release
 */
export function isPatchRelease(release: NextRelease): boolean {
  return release.type === 'patch'
}

/**
 * Gets the version without any 'v' prefix.
 *
 * @param version - Version string (may include 'v' prefix)
 * @returns Version without 'v' prefix
 *
 * @example
 * ```typescript
 * const clean = getCleanVersion('v1.2.3') // '1.2.3'
 * ```
 */
export function getCleanVersion(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version
}

/**
 * Gets the version with 'v' prefix.
 *
 * @param version - Version string
 * @returns Version with 'v' prefix
 *
 * @example
 * ```typescript
 * const tagged = getTaggedVersion('1.2.3') // 'v1.2.3'
 * ```
 */
export function getTaggedVersion(version: string): string {
  return version.startsWith('v') ? version : `v${version}`
}

/**
 * Compares two version strings using semantic versioning rules.
 *
 * @param version1 - First version to compare
 * @param version2 - Second version to compare
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 *
 * @example
 * ```typescript
 * const result = compareVersions('1.2.3', '1.2.4') // -1
 * ```
 */
export function compareVersions(version1: string, version2: string): number {
  const clean1 = getCleanVersion(version1)
  const clean2 = getCleanVersion(version2)

  const parts1 = clean1.split(/[.-]/).map(part => {
    const num = Number.parseInt(part, 10)
    return Number.isNaN(num) ? part : num
  })

  const parts2 = clean2.split(/[.-]/).map(part => {
    const num = Number.parseInt(part, 10)
    return Number.isNaN(num) ? part : num
  })

  const maxLength = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] ?? 0
    const part2 = parts2[i] ?? 0

    if (typeof part1 === 'number' && typeof part2 === 'number') {
      if (part1 < part2) return -1
      if (part1 > part2) return 1
    } else {
      const str1 = String(part1)
      const str2 = String(part2)
      if (str1 < str2) return -1
      if (str1 > str2) return 1
    }
  }

  return 0
}

/**
 * Extracts the major.minor version from a version string.
 *
 * @param version - Full version string
 * @returns Major.minor version string
 *
 * @example
 * ```typescript
 * const majorMinor = getMajorMinorVersion('1.2.3-beta.1') // '1.2'
 * ```
 */
export function getMajorMinorVersion(version: string): string {
  const clean = getCleanVersion(version)
  const parts = clean.split('.')
  return `${parts[0] ?? '0'}.${parts[1] ?? '0'}`
}

/**
 * Extracts version parts (major, minor, patch).
 *
 * @param version - Version string to parse
 * @returns Object with major, minor, patch numbers
 *
 * @example
 * ```typescript
 * const parts = parseVersion('1.2.3-beta.1')
 * // { major: 1, minor: 2, patch: 3 }
 * ```
 */
export function parseVersion(version: string): {major: number; minor: number; patch: number} {
  const clean = getCleanVersion(version)
  const parts = clean.split(/[.-]/)

  return {
    major: Number.parseInt(parts[0] ?? '0', 10) || 0,
    minor: Number.parseInt(parts[1] ?? '0', 10) || 0,
    patch: Number.parseInt(parts[2] ?? '0', 10) || 0,
  }
}

/**
 * Gets the appropriate release channel for a version.
 *
 * @param version - Version string
 * @returns Release channel name
 *
 * @example
 * ```typescript
 * const channel = getReleaseChannel('1.2.3-beta.1') // 'beta'
 * const channel2 = getReleaseChannel('1.2.3') // 'stable'
 * ```
 */
export function getReleaseChannel(version: string): string {
  const clean = getCleanVersion(version)

  if (clean.includes('-alpha')) return 'alpha'
  if (clean.includes('-beta')) return 'beta'
  if (clean.includes('-rc')) return 'rc'
  if (clean.includes('-next')) return 'next'
  if (clean.includes('-canary')) return 'canary'
  if (clean.includes('-')) return 'prerelease'

  return 'stable'
}

/**
 * Checks if a version satisfies a range pattern.
 *
 * @param version - Version to check
 * @param range - Range pattern (supports ^, ~, >=, <=, >, <, =)
 * @returns True if version satisfies the range
 *
 * @example
 * ```typescript
 * const satisfies = satisfiesRange('1.2.3', '^1.0.0') // true
 * ```
 */
export function satisfiesRange(version: string, range: string): boolean {
  const cleanVersion = getCleanVersion(version)
  const cleanRange = range.trim()

  // Exact match
  if (cleanRange === cleanVersion) return true

  // Parse range operators
  const operators = ['>=', '<=', '>', '<', '^', '~', '=']
  let operator = ''
  let targetVersion = cleanRange

  for (const op of operators) {
    if (cleanRange.startsWith(op)) {
      operator = op
      targetVersion = cleanRange.slice(op.length).trim()
      break
    }
  }

  const comparison = compareVersions(cleanVersion, targetVersion)
  const versionParts = parseVersion(cleanVersion)
  const targetParts = parseVersion(targetVersion)

  switch (operator) {
    case '>=':
      return comparison >= 0
    case '<=':
      return comparison <= 0
    case '>':
      return comparison > 0
    case '<':
      return comparison < 0
    case '=':
      return comparison === 0
    case '^': // Compatible within major version
      return versionParts.major === targetParts.major && comparison >= 0
    case '~': // Compatible within minor version
      return (
        versionParts.major === targetParts.major &&
        versionParts.minor === targetParts.minor &&
        comparison >= 0
      )
    default:
      return comparison === 0
  }
}

/**
 * Creates a release URL based on repository information.
 *
 * @param baseUrl - Base repository URL
 * @param version - Release version
 * @returns Release URL
 *
 * @example
 * ```typescript
 * const url = createReleaseUrl('https://github.com/user/repo', 'v1.2.3')
 * // 'https://github.com/user/repo/releases/tag/v1.2.3'
 * ```
 */
export function createReleaseUrl(baseUrl: string, version: string): string {
  const cleanUrl = baseUrl.replace(/\/$/, '')
  const taggedVersion = getTaggedVersion(version)

  let hostname = '';
  try {
    hostname = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    hostname = '';
  }

  if (hostname === 'github.com') {
    return `${cleanUrl}/releases/tag/${taggedVersion}`
  }

  if (hostname === 'gitlab.com') {
    return `${cleanUrl}/-/releases/${taggedVersion}`
  }

  // Generic fallback
  return `${cleanUrl}/releases/${taggedVersion}`
}

/**
 * Formats release notes with standard sections.
 *
 * @param sections - Release notes sections
 * @param sections.features - List of new features
 * @param sections.fixes - List of bug fixes
 * @param sections.breaking - List of breaking changes
 * @param sections.other - List of other changes
 * @returns Formatted release notes
 *
 * @example
 * ```typescript
 * const notes = formatReleaseNotes({
 *   features: ['Add new API endpoint'],
 *   fixes: ['Fix memory leak'],
 *   breaking: ['Remove deprecated method']
 * })
 * ```
 */
export function formatReleaseNotes(sections: {
  features?: string[]
  fixes?: string[]
  breaking?: string[]
  other?: string[]
}): string {
  const parts: string[] = []

  if (sections.breaking != null && sections.breaking.length > 0) {
    parts.push('## ⚠️ Breaking Changes\n')
    for (const item of sections.breaking) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  if (sections.features != null && sections.features.length > 0) {
    parts.push('## ✨ Features\n')
    for (const item of sections.features) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  if (sections.fixes != null && sections.fixes.length > 0) {
    parts.push('## 🐛 Bug Fixes\n')
    for (const item of sections.fixes) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  if (sections.other != null && sections.other.length > 0) {
    parts.push('## 📝 Other Changes\n')
    for (const item of sections.other) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  return parts.join('\n').trim()
}
