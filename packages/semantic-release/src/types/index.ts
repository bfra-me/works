/**
 * TypeScript types for semantic-release configuration and ecosystem.
 *
 * This module provides comprehensive type definitions for:
 * - Core semantic-release configuration options
 * - Plugin-specific configuration interfaces
 * - Runtime validation schemas with Zod
 */

// Core types
export type * from './core.js'

// Plugin-specific types
export type * from './plugins/changelog.js'
export type * from './plugins/commit-analyzer.js'
export type * from './plugins/git.js'
export type * from './plugins/github.js'
export type * from './plugins/npm.js'
export type * from './plugins/release-notes-generator.js'
