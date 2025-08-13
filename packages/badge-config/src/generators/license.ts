/**
 * License badge generator for common open source and proprietary licenses
 */

import type {BadgeColor, BadgeOptions, BadgeStyle} from '../types'

/**
 * License categories with associated colors
 */
export type LicenseCategory = 'permissive' | 'copyleft' | 'creative-commons' | 'proprietary' | 'custom'

/**
 * Common license identifiers and their metadata
 */
interface LicenseInfo {
  name: string
  category: LicenseCategory
  url?: string
}

/**
 * Configuration options for license badges
 */
export interface LicenseOptions {
  /** License identifier (e.g., 'MIT', 'Apache-2.0', 'GPL-3.0') */
  license: string
  /** Badge label text */
  label?: string
  /** Badge style */
  style?: BadgeStyle
  /** Custom color override */
  color?: BadgeColor
  /** License category override */
  category?: LicenseCategory
  /** Custom license URL */
  url?: string
  /** Custom logo */
  logo?: string
  /** Logo color */
  logoColor?: BadgeColor
  /** Cache seconds */
  cacheSeconds?: number
}

/**
 * Colors for license categories
 */
const LICENSE_CATEGORY_COLORS: Record<LicenseCategory, BadgeColor> = {
  permissive: 'blue',
  copyleft: 'orange',
  'creative-commons': 'purple',
  proprietary: 'lightgrey',
  custom: 'lightgrey',
} as const

/**
 * Common license information database
 */
const COMMON_LICENSES: Record<string, LicenseInfo> = {
  // Permissive licenses
  'MIT': {
    name: 'MIT',
    category: 'permissive',
    url: 'https://opensource.org/licenses/MIT',
  },
  'Apache-2.0': {
    name: 'Apache 2.0',
    category: 'permissive',
    url: 'https://www.apache.org/licenses/LICENSE-2.0',
  },
  'BSD-2-Clause': {
    name: 'BSD 2-Clause',
    category: 'permissive',
    url: 'https://opensource.org/licenses/BSD-2-Clause',
  },
  'BSD-3-Clause': {
    name: 'BSD 3-Clause',
    category: 'permissive',
    url: 'https://opensource.org/licenses/BSD-3-Clause',
  },
  'ISC': {
    name: 'ISC',
    category: 'permissive',
    url: 'https://opensource.org/licenses/ISC',
  },
  'Unlicense': {
    name: 'Unlicense',
    category: 'permissive',
    url: 'https://unlicense.org/',
  },

  // Copyleft licenses
  'GPL-2.0': {
    name: 'GPL 2.0',
    category: 'copyleft',
    url: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
  },
  'GPL-3.0': {
    name: 'GPL 3.0',
    category: 'copyleft',
    url: 'https://www.gnu.org/licenses/gpl-3.0.html',
  },
  'LGPL-2.1': {
    name: 'LGPL 2.1',
    category: 'copyleft',
    url: 'https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html',
  },
  'LGPL-3.0': {
    name: 'LGPL 3.0',
    category: 'copyleft',
    url: 'https://www.gnu.org/licenses/lgpl-3.0.html',
  },
  'AGPL-3.0': {
    name: 'AGPL 3.0',
    category: 'copyleft',
    url: 'https://www.gnu.org/licenses/agpl-3.0.html',
  },

  // Creative Commons licenses
  'CC-BY-4.0': {
    name: 'CC BY 4.0',
    category: 'creative-commons',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  'CC-BY-SA-4.0': {
    name: 'CC BY-SA 4.0',
    category: 'creative-commons',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  'CC0-1.0': {
    name: 'CC0 1.0',
    category: 'creative-commons',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },

  // Proprietary
  'UNLICENSED': {
    name: 'Proprietary',
    category: 'proprietary',
  },
} as const

/**
 * Normalize license identifier for lookup
 */
function normalizeLicenseId(license: string): string {
  return license.trim().toUpperCase()
}

/**
 * Get license information from the common licenses database
 */
function getLicenseInfo(license: string): LicenseInfo | undefined {
  const normalized = normalizeLicenseId(license)

  // Direct lookup
  if (normalized in COMMON_LICENSES) {
    return COMMON_LICENSES[normalized]
  }

  // Try some common variations
  const variations = [
    license.trim(), // Original case
    license.trim().toLowerCase(),
    license.trim().toUpperCase(),
  ]

  for (const variation of variations) {
    if (variation in COMMON_LICENSES) {
      return COMMON_LICENSES[variation]
    }
  }

  return undefined
}

/**
 * Generate badge options for license information
 *
 * @param options - License configuration
 * @returns Badge options for use with createBadge
 *
 * @example
 * ```typescript
 * // Common license
 * const badgeOptions = license({ license: 'MIT' })
 * const badge = createBadge(badgeOptions)
 *
 * // Custom license with category
 * const badgeOptions = license({
 *   license: 'Custom Commercial',
 *   category: 'proprietary',
 *   label: 'license'
 * })
 *
 * // License with URL
 * const badgeOptions = license({
 *   license: 'Apache-2.0',
 *   url: 'https://example.com/license'
 * })
 * ```
 */
export function license(options: LicenseOptions): BadgeOptions {
  const {
    license: licenseId,
    label = 'license',
    style,
    color,
    category,
    logo,
    logoColor,
    cacheSeconds,
  } = options

  // Look up license information
  const licenseInfo = getLicenseInfo(licenseId)

  // Determine display name
  const displayName = licenseInfo?.name ?? licenseId

  // Determine category
  const resolvedCategory = category ?? licenseInfo?.category ?? 'custom'

  // Determine color
  const badgeColor = color ?? LICENSE_CATEGORY_COLORS[resolvedCategory]

  return {
    label,
    message: displayName,
    color: badgeColor,
    style,
    logo,
    logoColor,
    cacheSeconds,
  }
}
