/**
 * Coverage badge generator with dynamic colors based on percentage thresholds
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Coverage percentage thresholds for color determination
 */
export interface CoverageThresholds {
  /** Excellent coverage threshold (default: 90) */
  excellent?: number
  /** Good coverage threshold (default: 80) */
  good?: number
  /** Moderate coverage threshold (default: 60) */
  moderate?: number
  /** Poor coverage threshold (default: 40) */
  poor?: number
}

/**
 * Configuration options for coverage badges
 */
export interface CoverageOptions {
  /** Coverage percentage (0-100) */
  percentage: number
  /** Badge label text */
  label?: string
  /** Badge style */
  style?: BadgeStyle
  /** Custom color override */
  color?: BadgeColor
  /** Custom thresholds for color determination */
  thresholds?: CoverageThresholds
  /** Custom logo */
  logo?: string
  /** Logo color */
  logoColor?: BadgeColor
  /** Cache seconds */
  cacheSeconds?: number
}

/**
 * Default coverage thresholds
 */
const DEFAULT_THRESHOLDS: Required<CoverageThresholds> = {
  excellent: 90,
  good: 80,
  moderate: 60,
  poor: 40,
}

/**
 * Determine color based on coverage percentage and thresholds
 */
function getCoverageColor(
  percentage: number,
  thresholds: Required<CoverageThresholds>,
): BadgeColor {
  if (percentage >= thresholds.excellent) {
    return 'brightgreen'
  }
  if (percentage >= thresholds.good) {
    return 'green'
  }
  if (percentage >= thresholds.moderate) {
    return 'yellow'
  }
  if (percentage >= thresholds.poor) {
    return 'orange'
  }
  return 'red'
}

/**
 * Format coverage percentage for display
 */
function formatCoverageMessage(percentage: number): string {
  // Round to 1 decimal place if needed, otherwise show as integer
  const rounded = Math.round(percentage * 10) / 10
  return rounded % 1 === 0 ? `${Math.round(rounded)}%` : `${rounded}%`
}

/**
 * Generate badge options for coverage percentage
 *
 * @param options - Coverage configuration
 * @returns Badge options for use with createBadge
 *
 * @example
 * ```typescript
 * // Basic usage
 * const badgeOptions = coverage({ percentage: 85.5 })
 * const badge = createBadge(badgeOptions)
 *
 * // Custom thresholds and label
 * const badgeOptions = coverage({
 *   percentage: 73.2,
 *   label: 'test coverage',
 *   thresholds: {
 *     excellent: 95,
 *     good: 85,
 *     moderate: 70,
 *     poor: 50
 *   }
 * })
 * ```
 */
export function coverage(options: CoverageOptions): BadgeOptions {
  const {
    percentage,
    label = 'coverage',
    style,
    color,
    thresholds = {},
    logo,
    logoColor,
    cacheSeconds,
  } = options

  // Validate percentage range
  if (percentage < 0 || percentage > 100) {
    throw new Error(`Coverage percentage must be between 0 and 100, got ${percentage}`)
  }

  // Merge with default thresholds
  const resolvedThresholds: Required<CoverageThresholds> = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  }

  const message = formatCoverageMessage(percentage)
  const badgeColor = color ?? getCoverageColor(percentage, resolvedThresholds)

  return {
    label,
    message,
    color: badgeColor,
    style,
    logo,
    logoColor,
    cacheSeconds,
  }
}
