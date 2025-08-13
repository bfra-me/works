/**
 * @bfra.me/badge-config - TypeScript API for generating shields.io badge URLs
 */

// Core functions
export {createBadge, createBadgeUrl} from './create-badge'

// Types
export type {
  BadgeColor,
  BadgeNamedColor,
  BadgeOptions,
  BadgeResult,
  BadgeStyle,
  FetchOptions,
} from './types'
export {BadgeError} from './types'

// Utilities
export {
  encodeText,
  sanitizeInput,
  validateCacheSeconds,
  validateColor,
  validateLogoWidth,
} from './utils'
