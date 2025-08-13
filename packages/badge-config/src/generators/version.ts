/**
 * Version badge generator supporting npm, git tag, and semantic version formats
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Version source types
 */
export type VersionSource = 'npm' | 'git' | 'github' | 'custom'

/**
 * Configuration options for version badges
 */
export interface VersionOptions {
  /** Version string */
  version: string
  /** Version source type */
  source?: VersionSource
  /** Package name for npm source */
  packageName?: string
  /** Repository for git/github source */
  repository?: string
  /** Badge label text */
  label?: string
  /** Badge style */
  style?: BadgeStyle
  /** Custom color override */
  color?: BadgeColor
  /** Custom logo */
  logo?: string
  /** Logo color */
  logoColor?: BadgeColor
  /** Cache seconds */
  cacheSeconds?: number
}

/**
 * Default colors for version sources
 */
const VERSION_SOURCE_COLORS: Record<VersionSource, BadgeColor> = {
  npm: 'red',
  git: 'blue',
  github: 'blue',
  custom: 'blue',
} as const

/**
 * Default labels for version sources
 */
const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  npm: 'npm',
  git: 'version',
  github: 'version',
  custom: 'version',
} as const

/**
 * Validate semantic version format
 */
function isValidSemver(version: string): boolean {
  // Basic semver pattern: major.minor.patch with optional prerelease and build metadata
  const semverPattern =
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i
  return semverPattern.test(version)
}

/**
 * Format version string for display
 */
function formatVersionMessage(version: string, source: VersionSource): string {
  // Remove 'v' prefix if present for cleaner display
  const cleanVersion = version.replace(/^v/, '')

  // For npm packages, show the version as-is
  if (source === 'npm') {
    return cleanVersion
  }

  // For git tags, add 'v' prefix if it looks like a semantic version
  if (source === 'git' && isValidSemver(cleanVersion)) {
    return `v${cleanVersion}`
  }

  // For other sources, return as-is
  return cleanVersion
}

/**
 * Generate badge options for version information
 *
 * @param options - Version configuration
 * @returns Badge options for use with createBadge
 *
 * @example
 * ```typescript
 * // NPM package version
 * const badgeOptions = version({
 *   version: '1.2.3',
 *   source: 'npm',
 *   packageName: '@bfra.me/badge-config'
 * })
 *
 * // Git tag version
 * const badgeOptions = version({
 *   version: 'v2.1.0',
 *   source: 'git',
 *   repository: 'bfra-me/works'
 * })
 *
 * // Custom version
 * const badgeOptions = version({
 *   version: '2025.01.15',
 *   source: 'custom',
 *   label: 'release',
 *   color: 'purple'
 * })
 * ```
 */
export function version(options: VersionOptions): BadgeOptions {
  const {
    version: rawVersion,
    source = 'custom',
    packageName,
    repository,
    label,
    style,
    color,
    logo,
    logoColor,
    cacheSeconds,
  } = options

  // Validate required parameters based on source
  if (source === 'npm' && (packageName === undefined || packageName === '')) {
    throw new Error('packageName is required when source is "npm"')
  }

  if (
    (source === 'git' || source === 'github') &&
    (repository === undefined || repository === '')
  ) {
    throw new Error('repository is required when source is "git" or "github"')
  }

  // Determine label based on source and options
  let resolvedLabel = label
  if (resolvedLabel === undefined || resolvedLabel === '') {
    if (source === 'npm' && packageName !== undefined && packageName !== '') {
      resolvedLabel = packageName
    } else {
      resolvedLabel = VERSION_SOURCE_LABELS[source]
    }
  }

  // Format version message
  const message = formatVersionMessage(rawVersion, source)

  // Determine color
  const badgeColor = color ?? VERSION_SOURCE_COLORS[source]

  return {
    label: resolvedLabel,
    message,
    color: badgeColor,
    style,
    logo,
    logoColor,
    cacheSeconds,
  }
}
