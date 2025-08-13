/**
 * @module
 * This module provides a preset generator for creating version badges.
 * It supports versions from various sources like npm, Git, and custom strings.
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Defines the source of the version information.
 */
export type VersionSource = 'npm' | 'git' | 'github' | 'custom'

/**
 * Configuration options for creating a version badge.
 */
export interface VersionOptions {
  /** The version string to display (e.g., '1.2.3'). */
  version: string
  /** The source of the version information. @default 'custom' */
  source?: VersionSource
  /** The name of the package (required for 'npm' source). */
  packageName?: string
  /** The repository name in 'owner/repo' format (for 'git' or 'github' source). */
  repository?: string
  /** The text for the left side of the badge. */
  label?: string
  /** The visual style of the badge. */
  style?: BadgeStyle
  /** Overrides the default color for the version source. */
  color?: BadgeColor
  /** A logo to embed in the badge. */
  logo?: string
  /** The color of the embedded logo. */
  logoColor?: BadgeColor
  /** The number of seconds to cache the badge URL. */
  cacheSeconds?: number
}

/**
 * A map of version sources to their default colors.
 * @internal
 */
const VERSION_SOURCE_COLORS: Record<VersionSource, BadgeColor> = {
  npm: 'red',
  git: 'blue',
  github: 'blue',
  custom: 'blue',
} as const

/**
 * A map of version sources to their default labels.
 * @internal
 */
const VERSION_SOURCE_LABELS: Record<VersionSource, string> = {
  npm: 'npm',
  git: 'version',
  github: 'version',
  custom: 'version',
} as const

/**
 * Validates if a string follows the semantic versioning format.
 * @internal
 */
function isValidSemver(version: string): boolean {
  // Basic semver pattern: major.minor.patch with optional prerelease and build metadata
  const semverPattern =
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i
  return semverPattern.test(version)
}

/**
 * Formats a version string for display, adding or removing 'v' prefix as needed.
 * @internal
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
 * Generates the configuration for a version badge.
 *
 * @param options - The version configuration.
 * @returns Badge options that can be passed to the `createBadge` function.
 *
 * @example
 * ```typescript
 * import { version } from '@bfra.me/badge-config/generators';
 * import { createBadge } from '@bfra.me/badge-config';
 *
 * // Generate a badge for an npm package version
 * const npmOptions = version({ version: '1.2.3', source: 'npm', packageName: 'react' });
 * const npmBadge = await createBadge(npmOptions);
 * console.log(npmBadge.url);
 * // => https://img.shields.io/badge/npm-1.2.3-red
 *
 * // Generate a badge for a Git tag
 * const gitOptions = version({ version: 'v2.0.1', source: 'git' });
 * const gitBadge = await createBadge(gitOptions);
 * console.log(gitBadge.url);
 * // => https://img.shields.io/badge/version-v2.0.1-blue
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
