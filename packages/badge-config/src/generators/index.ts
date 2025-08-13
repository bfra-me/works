/**
 * @bfra.me/badge-config - Preset badge generators
 *
 * This module exports all preset badge generators for common use cases.
 */

/**
 * @module
 * This module serves as an export barrel for all preset badge generators.
 * It simplifies importing generators by providing a single entry point.
 *
 * @example
 * ```typescript
 * import { buildStatus, coverage } from '@bfra.me/badge-config/generators';
 *
 * const successBadge = buildStatus('success');
 * const coverageBadge = coverage(95);
 * ```
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
