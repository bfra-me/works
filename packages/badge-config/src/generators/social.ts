/**
 * Social badges generator for GitHub stars, forks, and other social metrics
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * Supported social badge types
 */
export type SocialBadgeType = 'stars' | 'forks' | 'watchers' | 'issues' | 'followers' | 'downloads'

/**
 * Configuration options for social badges
 */
export interface SocialBadgeOptions {
  /** Type of social badge */
  type: SocialBadgeType
  /** Repository name in format 'owner/repo' (for GitHub badges) */
  repository?: string
  /** User/organization name (for followers) */
  user?: string
  /** Package name (for downloads) */
  packageName?: string
  /** Count value (if providing custom count) */
  count?: number
  /** Badge label text override */
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
 * Default colors for social badge types
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
 * Default labels for social badge types
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
 * Default logos for social badge types
 */
const SOCIAL_BADGE_LOGOS: Partial<Record<SocialBadgeType, string>> = {
  stars: 'github',
  forks: 'github',
  watchers: 'github',
  issues: 'github',
  followers: 'github',
} as const

/**
 * Format count for display (adds 'k' suffix for thousands, 'M' for millions)
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
 * Generate badge options for social metrics
 *
 * @param options - Social badge configuration
 * @returns Badge options for use with createBadge
 *
 * @example
 * ```typescript
 * // GitHub stars
 * const badgeOptions = social({
 *   type: 'stars',
 *   repository: 'bfra-me/works'
 * })
 *
 * // GitHub forks with custom count
 * const badgeOptions = social({
 *   type: 'forks',
 *   repository: 'bfra-me/works',
 *   count: 42
 * })
 *
 * // User followers
 * const badgeOptions = social({
 *   type: 'followers',
 *   user: 'marcusrbrown',
 *   count: 150
 * })
 *
 * // NPM downloads
 * const badgeOptions = social({
 *   type: 'downloads',
 *   packageName: '@bfra.me/badge-config',
 *   count: 1250,
 *   label: 'weekly downloads'
 * })
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
