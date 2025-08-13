/**
 * @module
 * This module provides a preset generator for creating code coverage badges.
 * It dynamically sets the badge color based on the coverage percentage.
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Defines the percentage thresholds for determining the badge color for coverage.
 */
export interface CoverageThresholds {
  /** Threshold for 'excellent' coverage. @default 90 */
  excellent?: number
  /** Threshold for 'good' coverage. @default 80 */
  good?: number
  /** Threshold for 'moderate' coverage. @default 60 */
  moderate?: number
  /** Threshold for 'poor' coverage. @default 40 */
  poor?: number
}

/**
 * Configuration options for creating a coverage badge.
 */
export interface CoverageOptions {
  /** The code coverage percentage (0-100). */
  percentage: number
  /** The text for the left side of the badge. @default 'coverage' */
  label?: string
  /** The visual style of the badge. */
  style?: BadgeStyle
  /** Overrides the default dynamic color. */
  color?: BadgeColor
  /** Custom thresholds for determining the badge color. */
  thresholds?: CoverageThresholds
  /** A logo to embed in the badge. */
  logo?: string
  /** The color of the embedded logo. */
  logoColor?: BadgeColor
  /** The number of seconds to cache the badge URL. */
  cacheSeconds?: number
}

/**

 * The default thresholds for coverage percentage colors.
 * @internal
 */
const DEFAULT_THRESHOLDS: Required<CoverageThresholds> = {
  excellent: 90,
  good: 80,
  moderate: 60,
  poor: 40,
}

/**
 * Determines the badge color based on the coverage percentage and defined thresholds.
 * @internal
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
 * Formats the coverage percentage for display in the badge message.
 * @internal
 */
function formatCoverageMessage(percentage: number): string {
  // Round to 1 decimal place if needed, otherwise show as integer
  const rounded = Math.round(percentage * 10) / 10
  return rounded % 1 === 0 ? `${Math.round(rounded)}%` : `${rounded}%`
}

/**
 * Generates the configuration for a code coverage badge.
 *
 * The color of the badge is determined by the coverage percentage, but can be overridden.
 *
 * @param options - The coverage configuration.
 * @returns Badge options that can be passed to the `createBadge` function.
 *
 * @example
 * ```typescript
 * import { coverage } from '@bfra.me/badge-config/generators';
 * import { createBadge } from '@bfra.me/badge-config';
 *
 * // Generate a badge for 85% coverage
 * const highCoverageOptions = coverage({ percentage: 85 });
 * const highCoverageBadge = await createBadge(highCoverageOptions);
 * console.log(highCoverageBadge.url);
 * // => https://img.shields.io/badge/coverage-85%25-green
 *
 * // Generate a badge for 55% coverage with a custom label
 * const lowCoverageOptions = coverage({ percentage: 55, label: 'unit tests' });
 * const lowCoverageBadge = await createBadge(lowCoverageOptions);
 * console.log(lowCoverageBadge.url);
 * // => https://img.shields.io/badge/unit%20tests-55%25-yellow
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
