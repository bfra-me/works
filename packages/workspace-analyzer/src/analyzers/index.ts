/**
 * Analyzer registry and exports for workspace analysis.
 *
 * Provides a plugin architecture for registering and managing analyzers,
 * with built-in analyzers for configuration validation and dependency analysis.
 */

import type {Analyzer, AnalyzerRegistration} from './analyzer'

import {createBuildConfigAnalyzer} from './build-config-analyzer'
import {createCircularImportAnalyzer} from './circular-import-analyzer'
import {createConfigConsistencyAnalyzer} from './config-consistency-analyzer'
import {createDuplicateDependencyAnalyzer} from './duplicate-dependency-analyzer'
import {createEslintConfigAnalyzer} from './eslint-config-analyzer'
import {createExportsFieldAnalyzer} from './exports-field-analyzer'
import {createPackageJsonAnalyzer} from './package-json-analyzer'
import {createPeerDependencyAnalyzer} from './peer-dependency-analyzer'
import {createTsconfigAnalyzer} from './tsconfig-analyzer'
import {createUnusedDependencyAnalyzer} from './unused-dependency-analyzer'
import {createVersionAlignmentAnalyzer} from './version-alignment-analyzer'

export type {
  AnalysisContext,
  Analyzer,
  AnalyzerError,
  AnalyzerFactory,
  AnalyzerMetadata,
  AnalyzerOptions,
  AnalyzerRegistration,
} from './analyzer'
export {createIssue, filterIssues, meetsMinSeverity, shouldAnalyzeCategory} from './analyzer'

export type {BuildConfigAnalyzerOptions} from './build-config-analyzer'
export {buildConfigAnalyzerMetadata, createBuildConfigAnalyzer} from './build-config-analyzer'

// Dependency analysis exports
export type {CircularImportAnalyzerOptions} from './circular-import-analyzer'
export {
  circularImportAnalyzerMetadata,
  computeCycleStats,
  createCircularImportAnalyzer,
  generateCycleVisualization,
} from './circular-import-analyzer'

export type {
  CircularImportStats,
  CycleEdge,
  CycleNode,
  CycleVisualization,
} from './circular-import-analyzer'
export type {ConfigConsistencyAnalyzerOptions} from './config-consistency-analyzer'

export {
  configConsistencyAnalyzerMetadata,
  createConfigConsistencyAnalyzer,
} from './config-consistency-analyzer'
export type {DuplicateDependencyAnalyzerOptions} from './duplicate-dependency-analyzer'

export {
  computeDuplicateStats,
  createDuplicateDependencyAnalyzer,
  duplicateDependencyAnalyzerMetadata,
} from './duplicate-dependency-analyzer'
export type {DuplicateDependencyStats} from './duplicate-dependency-analyzer'

export type {EslintConfigAnalyzerOptions} from './eslint-config-analyzer'
export {createEslintConfigAnalyzer, eslintConfigAnalyzerMetadata} from './eslint-config-analyzer'

export type {ExportsFieldAnalyzerOptions} from './exports-field-analyzer'
export {createExportsFieldAnalyzer, exportsFieldAnalyzerMetadata} from './exports-field-analyzer'

export type {PackageJsonAnalyzerOptions} from './package-json-analyzer'
export {createPackageJsonAnalyzer, packageJsonAnalyzerMetadata} from './package-json-analyzer'
export type {PeerDependencyAnalyzerOptions} from './peer-dependency-analyzer'

export {
  createPeerDependencyAnalyzer,
  peerDependencyAnalyzerMetadata,
} from './peer-dependency-analyzer'
export type {TsconfigAnalyzerOptions} from './tsconfig-analyzer'

export {createTsconfigAnalyzer, tsconfigAnalyzerMetadata} from './tsconfig-analyzer'
export type {UnusedDependencyAnalyzerOptions} from './unused-dependency-analyzer'

export {
  aggregatePackageImports,
  createUnusedDependencyAnalyzer,
  unusedDependencyAnalyzerMetadata,
} from './unused-dependency-analyzer'
export type {VersionAlignmentAnalyzerOptions} from './version-alignment-analyzer'
export {
  createVersionAlignmentAnalyzer,
  versionAlignmentAnalyzerMetadata,
} from './version-alignment-analyzer'

/**
 * Registry for managing analyzer registrations.
 */
export interface AnalyzerRegistry {
  /** Register an analyzer */
  readonly register: (id: string, registration: AnalyzerRegistration) => void
  /** Unregister an analyzer */
  readonly unregister: (id: string) => boolean
  /** Get a registered analyzer */
  readonly get: (id: string) => AnalyzerRegistration | undefined
  /** Get all registered analyzers */
  readonly getAll: () => Map<string, AnalyzerRegistration>
  /** Get enabled analyzers sorted by priority */
  readonly getEnabled: () => Analyzer[]
  /** Check if an analyzer is registered */
  readonly has: (id: string) => boolean
}

/**
 * Creates a new analyzer registry.
 *
 * @example
 * ```ts
 * const registry = createAnalyzerRegistry()
 *
 * // Register a custom analyzer
 * registry.register('my-analyzer', {
 *   analyzer: createMyAnalyzer(),
 *   enabled: true,
 *   priority: 50,
 * })
 *
 * // Get all enabled analyzers
 * const analyzers = registry.getEnabled()
 * ```
 */
export function createAnalyzerRegistry(): AnalyzerRegistry {
  const registrations = new Map<string, AnalyzerRegistration>()

  function resolveAnalyzer(registration: AnalyzerRegistration): Analyzer {
    if (typeof registration.analyzer === 'function') {
      return registration.analyzer()
    }
    return registration.analyzer
  }

  return {
    register(id: string, registration: AnalyzerRegistration): void {
      registrations.set(id, registration)
    },

    unregister(id: string): boolean {
      return registrations.delete(id)
    },

    get(id: string): AnalyzerRegistration | undefined {
      return registrations.get(id)
    },

    getAll(): Map<string, AnalyzerRegistration> {
      return new Map(registrations)
    },

    getEnabled(): Analyzer[] {
      const enabled = Array.from(registrations.entries())
        .filter(([_id, reg]) => reg.enabled)
        .sort((a, b) => a[1].priority - b[1].priority)
        .map(([_id, reg]) => resolveAnalyzer(reg))

      return enabled
    },

    has(id: string): boolean {
      return registrations.has(id)
    },
  }
}

/**
 * Built-in analyzer IDs.
 */
export const BUILTIN_ANALYZER_IDS = {
  PACKAGE_JSON: 'package-json',
  TSCONFIG: 'tsconfig',
  ESLINT_CONFIG: 'eslint-config',
  BUILD_CONFIG: 'build-config',
  CONFIG_CONSISTENCY: 'config-consistency',
  VERSION_ALIGNMENT: 'version-alignment',
  EXPORTS_FIELD: 'exports-field',
  // Dependency analyzers
  UNUSED_DEPENDENCY: 'unused-dependency',
  CIRCULAR_IMPORT: 'circular-import',
  PEER_DEPENDENCY: 'peer-dependency',
  DUPLICATE_DEPENDENCY: 'duplicate-dependency',
} as const

/**
 * Creates a registry with all built-in analyzers registered.
 *
 * @example
 * ```ts
 * const registry = createDefaultRegistry()
 *
 * // Disable a specific analyzer
 * const registration = registry.get('eslint-config')
 * if (registration) {
 *   registry.register('eslint-config', {...registration, enabled: false})
 * }
 *
 * // Run enabled analyzers
 * const analyzers = registry.getEnabled()
 * ```
 */
export function createDefaultRegistry(): AnalyzerRegistry {
  const registry = createAnalyzerRegistry()

  // Register built-in analyzers with default priorities
  registry.register(BUILTIN_ANALYZER_IDS.PACKAGE_JSON, {
    analyzer: createPackageJsonAnalyzer(),
    enabled: true,
    priority: 10,
  })

  registry.register(BUILTIN_ANALYZER_IDS.TSCONFIG, {
    analyzer: createTsconfigAnalyzer(),
    enabled: true,
    priority: 20,
  })

  registry.register(BUILTIN_ANALYZER_IDS.ESLINT_CONFIG, {
    analyzer: createEslintConfigAnalyzer(),
    enabled: true,
    priority: 30,
  })

  registry.register(BUILTIN_ANALYZER_IDS.BUILD_CONFIG, {
    analyzer: createBuildConfigAnalyzer(),
    enabled: true,
    priority: 40,
  })

  registry.register(BUILTIN_ANALYZER_IDS.CONFIG_CONSISTENCY, {
    analyzer: createConfigConsistencyAnalyzer(),
    enabled: true,
    priority: 50,
  })

  registry.register(BUILTIN_ANALYZER_IDS.VERSION_ALIGNMENT, {
    analyzer: createVersionAlignmentAnalyzer(),
    enabled: true,
    priority: 60,
  })

  registry.register(BUILTIN_ANALYZER_IDS.EXPORTS_FIELD, {
    analyzer: createExportsFieldAnalyzer(),
    enabled: true,
    priority: 70,
  })

  // Dependency analyzers
  registry.register(BUILTIN_ANALYZER_IDS.UNUSED_DEPENDENCY, {
    analyzer: createUnusedDependencyAnalyzer(),
    enabled: true,
    priority: 80,
  })

  registry.register(BUILTIN_ANALYZER_IDS.CIRCULAR_IMPORT, {
    analyzer: createCircularImportAnalyzer(),
    enabled: true,
    priority: 90,
  })

  registry.register(BUILTIN_ANALYZER_IDS.PEER_DEPENDENCY, {
    analyzer: createPeerDependencyAnalyzer(),
    enabled: true,
    priority: 100,
  })

  registry.register(BUILTIN_ANALYZER_IDS.DUPLICATE_DEPENDENCY, {
    analyzer: createDuplicateDependencyAnalyzer(),
    enabled: true,
    priority: 110,
  })

  return registry
}

/**
 * All built-in analyzer factories for direct use.
 */
export const builtinAnalyzers = {
  packageJson: createPackageJsonAnalyzer,
  tsconfig: createTsconfigAnalyzer,
  eslintConfig: createEslintConfigAnalyzer,
  buildConfig: createBuildConfigAnalyzer,
  configConsistency: createConfigConsistencyAnalyzer,
  versionAlignment: createVersionAlignmentAnalyzer,
  exportsField: createExportsFieldAnalyzer,
  // Dependency analyzers
  unusedDependency: createUnusedDependencyAnalyzer,
  circularImport: createCircularImportAnalyzer,
  peerDependency: createPeerDependencyAnalyzer,
  duplicateDependency: createDuplicateDependencyAnalyzer,
} as const
