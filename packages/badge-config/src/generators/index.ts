/**
 * @bfra.me/badge-config - Preset badge generators
 *
 * This module exports all preset badge generators for common use cases.
 */

// Build status generator
export {buildStatus} from './build-status'
export type {BuildStatus, BuildStatusOptions} from './build-status'

// Coverage generator
export {coverage} from './coverage'
export type {CoverageOptions, CoverageThresholds} from './coverage'

// License generator
export {license} from './license'
export type {LicenseCategory, LicenseOptions} from './license'

// Social badges generator
export {social} from './social'
export type {SocialBadgeOptions, SocialBadgeType} from './social'

// Version generator
export {version} from './version'
export type {VersionOptions, VersionSource} from './version'
