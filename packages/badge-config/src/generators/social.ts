/**
 * @module
 * This module provides a preset generator for creating social media badges,
 * such as GitHub stars, forks, and followers.
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Defines the supported types of social media badges.
 */
export type SocialBadgeType = 'stars' | 'forks' | 'watchers' | 'issues' | 'followers' | 'downloads'

/**
 * Configuration options for creating a social media badge.
 */
export interface SocialBadgeOptions {
  /** The type of social badge to create. */
  type: SocialBadgeType
  /** The repository name in 'owner/repo' format (required for most GitHub badges). */
  repository?: string
  /** The user or organization name (required for followers). */
  user?: string
  /** The name of the package (required for downloads). */
  packageName?: string
  /** A custom count to display, overriding any fetched value. */
  count?: number
  /** Overrides the default label for the badge type. */
  label?: string
  /** The visual style of the badge. */
  style?: BadgeStyle
  /** Overrides the default color for the badge type. */
  color?: BadgeColor
  /** Overrides the default logo for the badge type. */
  logo?: string
  /** The color of the embedded logo. */
  logoColor?: BadgeColor
  /** The number of seconds to cache the badge URL. */
  cacheSeconds?: number
}

/**
 * A map of social badge types to their default colors.
 * @internal
 */
const SOCIAL_BADGE_COLORS: Record<SocialBadgeType, BadgeColor> = {
  stars: 'yellow',
  forks: 'blue',
  watchers: 'green',
  issues: 'red',
  followers: 'blue',
  downloads: 'green',
} as const

/**
 * A map of social badge types to their default labels.
 * @internal
 */
const SOCIAL_BADGE_LABELS: Record<SocialBadgeType, string> = {
  stars: 'stars',
  forks: 'forks',
  watchers: 'watchers',
  issues: 'issues',
  followers: 'followers',
  downloads: 'downloads',
} as const

/**
 * A map of social badge types to their default logos.
 * @internal
 */
const SOCIAL_BADGE_LOGOS: Partial<Record<SocialBadgeType, string>> = {
  stars: 'github',
  forks: 'github',
  watchers: 'github',
  issues: 'github',
  followers: 'github',
} as const

/**
 * Formats a number into a compact string representation (e.g., 1.2k, 3M).
 * @internal
 */
function formatCount(count: number): string {
  if (count >= 1_000_000) {
    const millions = count / 1_000_000
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
  }

  if (count >= 1_000) {
    const thousands = count / 1_000
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`
  }

  return count.toString()
}

/**
 * Generates the configuration for a social media badge.
 *
 * @param options - The social badge configuration.
 * @returns Badge options that can be passed to the `createBadge` function.
 *
 * @example
 * ```typescript
 * import { social } from '@bfra.me/badge-config/generators';
 * import { createBadge } from '@bfra.me/badge-config';
 *
 * // Generate a GitHub stars badge
 * const starsOptions = social({ type: 'stars', repository: 'bfra-me/works' });
 * const starsBadge = await createBadge(starsOptions);
 * console.log(starsBadge.url);
 * // => https://img.shields.io/github/stars/bfra-me/works?style=social
 *
 * // Generate a followers badge with a custom count
 * const followersOptions = social({ type: 'followers', user: 'marcusrbrown', count: 1234 });
 * const followersBadge = await createBadge(followersOptions);
 * console.log(followersBadge.url);
 * // => https://img.shields.io/badge/followers-1.2k-blue?logo=github
 * ```
 */
export function social(options: SocialBadgeOptions): BadgeOptions {
  const {
    type,
    repository,
    user,
    packageName,
    count,
    label,
    style,
    color,
    logo,
    logoColor,
    cacheSeconds,
  } = options

  // Validate required parameters based on type
  if (
    (type === 'stars' || type === 'forks' || type === 'watchers' || type === 'issues') &&
    (repository === undefined || repository === '')
  ) {
    throw new Error(`repository is required for ${type} badges`)
  }

  if (type === 'followers' && (user === undefined || user === '')) {
    throw new Error('user is required for followers badges')
  }

  if (type === 'downloads' && (packageName === undefined || packageName === '')) {
    throw new Error('packageName is required for downloads badges')
  }

  // Determine label
  const resolvedLabel = label ?? SOCIAL_BADGE_LABELS[type]

  // Format count message
  const message = count === undefined ? '0' : formatCount(count)

  // Determine color
  const badgeColor = color ?? SOCIAL_BADGE_COLORS[type]

  // Determine logo
  const badgeLogo = logo ?? SOCIAL_BADGE_LOGOS[type]

  return {
    label: resolvedLabel,
    message,
    color: badgeColor,
    style,
    logo: badgeLogo,
    logoColor,
    cacheSeconds,
  }
}
