/**
 * Build status badge generator for CI/CD workflows
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Supported build status types
 */
export type BuildStatus =
  | 'success'
  | 'failure'
  | 'pending'
  | 'error'
  | 'cancelled'
  | 'skipped'
  | 'unknown'

/**
 * Configuration options for build status badges
 */
export interface BuildStatusOptions {
  /** Build status */
  status: BuildStatus
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
 * Default colors for build status types
 */
const BUILD_STATUS_COLORS: Record<BuildStatus, BadgeColor> = {
  success: 'brightgreen',
  failure: 'red',
  pending: 'yellow',
  error: 'red',
  cancelled: 'lightgrey',
  skipped: 'lightgrey',
  unknown: 'lightgrey',
} as const

/**
 * Default messages for build status types
 */
const BUILD_STATUS_MESSAGES: Record<BuildStatus, string> = {
  success: 'passing',
  failure: 'failing',
  pending: 'pending',
  error: 'error',
  cancelled: 'cancelled',
  skipped: 'skipped',
  unknown: 'unknown',
} as const

/**
 * Generate badge options for build status
 *
 * @param options - Build status configuration
 * @returns Badge options for use with createBadge
 *
 * @example
 * ```typescript
 * // Basic usage
 * const badgeOptions = buildStatus({ status: 'success' })
 * const badge = createBadge(badgeOptions)
 *
 * // Custom label and style
 * const badgeOptions = buildStatus({
 *   status: 'failure',
 *   label: 'tests',
 *   style: 'flat-square'
 * })
 * ```
 */
export function buildStatus(options: BuildStatusOptions): BadgeOptions {
  const {status, label = 'build', style, color, logo, logoColor, cacheSeconds} = options

  return {
    label,
    message: BUILD_STATUS_MESSAGES[status],
    color: color ?? BUILD_STATUS_COLORS[status],
    style,
    logo,
    logoColor,
    cacheSeconds,
  }
}
