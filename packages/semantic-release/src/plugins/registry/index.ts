/**
 * Plugin registry system for discovering and managing custom plugins.
 *
 * This module provides comprehensive registry utilities for plugin discovery,
 * registration, and management of custom semantic-release plugins.
 *
 * ## Key Features
 *
 * - **Plugin Discovery**: Find plugins from local filesystem, node_modules, and npm registry
 * - **Plugin Registration**: Register and manage plugin metadata and dependencies
 * - **Plugin Validation**: Validate plugin compatibility and dependencies
 * - **Plugin Collections**: Group and organize plugins into collections
 * - **Dependency Resolution**: Check and resolve plugin dependencies
 *
 * ## Basic Usage
 *
 * ```typescript
 * import { createPluginRegistry, defaultRegistry } from '@bfra.me/semantic-release'
 *
 * // Use default registry
 * const plugins = await defaultRegistry.discoverPlugins()
 *
 * // Create custom registry
 * const registry = createPluginRegistry({
 *   cacheDir: './custom-cache',
 *   autoDiscover: true
 * })
 * ```
 */

// Dependency resolution
export {PluginDependencyResolver} from './dependency-resolver.js'

// Discovery services
export {PluginDiscoveryService} from './discovery.js'

// Core registry functionality
export {createPluginRegistry, defaultRegistry, PluginRegistry} from './registry.js'

// Type definitions
export type {
  PluginAuthor,
  PluginCollection,
  PluginDependencyConflict,
  PluginDependencyResult,
  PluginDiscoveryError,
  PluginDiscoveryMetrics,
  PluginDiscoveryOptions,
  PluginDiscoveryResult,
  PluginDiscoverySource,
  PluginInstallOptions,
  PluginLifecycleHook,
  PluginQueryOptions,
  PluginRegistryConfig,
  PluginRegistryEntry,
  PluginRegistryValidationContext,
  PluginRepository,
  PluginSortCriteria,
} from './types.js'
