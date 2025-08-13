/**
 * @module
 * This module provides a preset generator for creating build status badges.
 * It simplifies the creation of badges for common CI/CD states like success, failure, and pending.
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Defines the possible states for a build status badge.
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
 * Configuration options for creating a build status badge.
 */
export interface BuildStatusOptions {
  /** The current status of the build. */
  status: BuildStatus
  /** The text for the left side of the badge. @default 'build' */
  label?: string
  /** The visual style of the badge. */
  style?: BadgeStyle
  /** Overrides the default color for the status. */
  color?: BadgeColor
  /** A logo to embed in the badge. */
  logo?: string
  /** The color of the embedded logo. */
  logoColor?: BadgeColor
  /** The number of seconds to cache the badge URL. */
  cacheSeconds?: number
}

/**
 * A map of build statuses to their default colors.
 * @internal
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
 * A map of build statuses to their default messages.
 * @internal
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
 * Generates the configuration for a build status badge.
 *
 * @param options - The build status configuration.
 * @returns Badge options that can be passed to the `createBadge` function.
 *
 * @example
 * ```typescript
 * import { buildStatus } from '@bfra.me/badge-config/generators';
 * import { createBadge } from '@bfra.me/badge-config';
 *
 * // Generate a success badge
 * const successOptions = buildStatus({ status: 'success' });
 * const successBadge = await createBadge(successOptions);
 * console.log(successBadge.url);
 * // => https://img.shields.io/badge/build-passing-brightgreen
 *
 * // Generate a failing badge with a custom label
 * const failureOptions = buildStatus({ status: 'failure', label: 'tests' });
 * const failureBadge = await createBadge(failureOptions);
 * console.log(failureBadge.url);
 * // => https://img.shields.io/badge/tests-failing-red
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
