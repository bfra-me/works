/**
 * @bfra.me/badge-config - TypeScript API for generating shields.io badge URLs
 */

// Core functions
export {createBadge, createBadgeUrl} from './create-badge'

// Preset generators
export {buildStatus, coverage, license, social, version} from './generators'
export type {
  BuildStatus,
  BuildStatusOptions,
  CoverageOptions,
  CoverageThresholds,
  LicenseCategory,
  LicenseOptions,
  SocialBadgeOptions,
  SocialBadgeType,
  VersionOptions,
  VersionSource,
} from './generators'

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
