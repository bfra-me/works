/**
 * Plugin development toolkit for semantic-release.
 *
 * This module provides comprehensive TypeScript support for developing
 * semantic-release plugins, including:
 * - Typed lifecycle hook interfaces
 * - Context objects for each plugin stage
 * - Development utilities and helpers
 * - Testing utilities with mock context
 * - Plugin validation and compatibility checking
 */

// Core plugin interfaces
export type * from './context.js'
export type * from './lifecycle.js'

// Plugin registry and discovery
export * from './registry/index.js'

// Plugin template and scaffolding
export * from './template/index.js'

// Plugin testing utilities
export * from './testing/index.js'

// Plugin development utilities
export * from './utilities/index.js'

// Plugin validation utilities
export * from './validation/index.js'
