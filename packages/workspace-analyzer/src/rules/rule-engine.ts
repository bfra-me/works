/**
 * Architectural rule engine for validating code patterns and enforcing best practices.
 *
 * Provides a plugin architecture for extensible analysis rules that detect
 * architectural violations, anti-patterns, and best practice deviations.
 */

import type {SourceFile} from 'ts-morph'

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation, Severity} from '../types/index'
import type {Result} from '../types/result'

import {ok} from '@bfra.me/es/result'

import {matchPattern, normalizePath} from '../utils/pattern-matcher'

/**
 * Context provided to rules during evaluation.
 */
export interface RuleContext {
  /** The source file being evaluated */
  readonly sourceFile: SourceFile
  /** The package containing the source file */
  readonly pkg: WorkspacePackage
  /** Root path of the workspace */
  readonly workspacePath: string
  /** All packages in the workspace for cross-package analysis */
  readonly allPackages: readonly WorkspacePackage[]
  /** Resolved tsconfig paths for alias validation */
  readonly tsconfigPaths?: Readonly<Record<string, readonly string[]>>
  /** Layer configuration for architectural validation */
  readonly layerConfig?: LayerConfiguration
  /** Report progress during evaluation */
  readonly reportProgress?: (message: string) => void
}

/**
 * Layer configuration for enforcing architectural boundaries.
 */
export interface LayerConfiguration {
  /** Layer definitions with allowed dependencies */
  readonly layers: readonly LayerDefinition[]
  /** File patterns to layer mapping */
  readonly patterns: readonly LayerPattern[]
}

/**
 * Defines an architectural layer with its allowed dependencies.
 */
export interface LayerDefinition {
  /** Layer name (e.g., 'domain', 'application', 'infrastructure') */
  readonly name: string
  /** Other layers this layer can import from */
  readonly allowedDependencies: readonly string[]
}

/**
 * Maps file patterns to architectural layers.
 */
export interface LayerPattern {
  /** Glob pattern to match files */
  readonly pattern: string
  /** Layer this pattern belongs to */
  readonly layer: string
}

/**
 * Result of a single rule violation.
 */
export interface RuleViolation {
  /** Rule that was violated */
  readonly ruleId: string
  /** Location of the violation */
  readonly location: IssueLocation
  /** Human-readable message explaining the violation */
  readonly message: string
  /** Suggested fix for the violation */
  readonly suggestion?: string
  /** Related locations (e.g., the imported module) */
  readonly relatedLocations?: readonly IssueLocation[]
  /** Additional metadata for machine processing */
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Result of evaluating a rule on a source file.
 */
export interface RuleResult {
  /** Violations found */
  readonly violations: readonly RuleViolation[]
  /** Whether the evaluation completed successfully */
  readonly success: boolean
  /** Error message if evaluation failed */
  readonly error?: string
}

/**
 * Metadata describing a rule.
 */
export interface RuleMetadata {
  /** Unique identifier for the rule */
  readonly id: string
  /** Human-readable name */
  readonly name: string
  /** Description of what the rule checks */
  readonly description: string
  /** Default severity for violations */
  readonly defaultSeverity: Severity
  /** Category for grouping */
  readonly category: 'layer-violation' | 'barrel-export' | 'public-api' | 'side-effect' | 'boundary'
  /** Documentation URL */
  readonly docsUrl?: string
}

/**
 * Configuration options for a rule.
 */
export interface RuleOptions {
  /** Whether the rule is enabled */
  readonly enabled?: boolean
  /** Severity override */
  readonly severity?: Severity
  /** File patterns to include */
  readonly include?: readonly string[]
  /** File patterns to exclude */
  readonly exclude?: readonly string[]
  /** Rule-specific options */
  readonly options?: Readonly<Record<string, unknown>>
}

/**
 * Core interface that all architectural rules must implement.
 */
export interface Rule {
  /** Metadata describing the rule */
  readonly metadata: RuleMetadata
  /**
   * Evaluate the rule against a source file.
   *
   * @param context - Rule evaluation context
   * @returns Result containing violations found
   */
  readonly evaluate: (context: RuleContext) => Promise<RuleResult>
}

/**
 * Factory function signature for creating rules.
 */
export type RuleFactory = (options?: RuleOptions) => Rule

/**
 * Registration entry for a rule in the engine.
 */
export interface RuleRegistration {
  /** The rule instance or factory */
  readonly rule: Rule | RuleFactory
  /** Whether the rule is enabled */
  readonly enabled: boolean
  /** Priority for execution order (lower runs first) */
  readonly priority: number
  /** Configuration options */
  readonly options?: RuleOptions
}

/**
 * Rule engine for managing and executing architectural rules.
 */
export interface RuleEngine {
  /** Register a rule */
  readonly register: (id: string, registration: RuleRegistration) => void
  /** Unregister a rule */
  readonly unregister: (id: string) => boolean
  /** Get a registered rule */
  readonly get: (id: string) => RuleRegistration | undefined
  /** Get all registered rules */
  readonly getAll: () => Map<string, RuleRegistration>
  /** Get enabled rules sorted by priority */
  readonly getEnabled: () => Rule[]
  /** Check if a rule is registered */
  readonly has: (id: string) => boolean
  /** Evaluate all enabled rules against a source file */
  readonly evaluateFile: (
    context: RuleContext,
  ) => Promise<Result<readonly Issue[], RuleEngineError>>
  /** Evaluate all enabled rules against multiple source files */
  readonly evaluateFiles: (
    contexts: readonly RuleContext[],
  ) => Promise<Result<readonly Issue[], RuleEngineError>>
}

/**
 * Error from rule engine operations.
 */
export interface RuleEngineError {
  /** Error code for programmatic handling */
  readonly code: 'RULE_EXECUTION_ERROR' | 'RULE_NOT_FOUND' | 'INVALID_CONFIGURATION'
  /** Human-readable error message */
  readonly message: string
  /** Rule ID that caused the error (if applicable) */
  readonly ruleId?: string
  /** Additional context about the error */
  readonly context?: Readonly<Record<string, unknown>>
}

/**
 * Resolves a rule registration to a Rule instance.
 */
function resolveRule(registration: RuleRegistration): Rule {
  if (typeof registration.rule === 'function') {
    return registration.rule(registration.options)
  }
  return registration.rule
}

/**
 * Converts a rule violation to an Issue.
 */
function violationToIssue(violation: RuleViolation, rule: Rule): Issue {
  return {
    id: violation.ruleId,
    title: `${rule.metadata.name}: ${violation.message.slice(0, 60)}${violation.message.length > 60 ? '...' : ''}`,
    description: violation.message,
    severity: rule.metadata.defaultSeverity,
    category: 'architecture',
    location: violation.location,
    relatedLocations: violation.relatedLocations,
    suggestion: violation.suggestion,
    metadata: violation.metadata,
  }
}

/**
 * Creates a new rule engine instance.
 *
 * @example
 * ```ts
 * const engine = createRuleEngine()
 *
 * engine.register('no-barrel-exports', {
 *   rule: createBarrelExportRule(),
 *   enabled: true,
 *   priority: 10,
 * })
 *
 * const issues = await engine.evaluateFile(context)
 * ```
 */
export function createRuleEngine(): RuleEngine {
  const registrations = new Map<string, RuleRegistration>()

  return {
    register(id: string, registration: RuleRegistration): void {
      registrations.set(id, registration)
    },

    unregister(id: string): boolean {
      return registrations.delete(id)
    },

    get(id: string): RuleRegistration | undefined {
      return registrations.get(id)
    },

    getAll(): Map<string, RuleRegistration> {
      return new Map(registrations)
    },

    getEnabled(): Rule[] {
      return Array.from(registrations.entries())
        .filter(([, reg]) => reg.enabled)
        .sort((a, b) => a[1].priority - b[1].priority)
        .map(([, reg]) => resolveRule(reg))
    },

    has(id: string): boolean {
      return registrations.has(id)
    },

    async evaluateFile(context: RuleContext): Promise<Result<readonly Issue[], RuleEngineError>> {
      const issues: Issue[] = []
      const enabledRules = this.getEnabled()

      for (const rule of enabledRules) {
        try {
          const result = await rule.evaluate(context)
          if (result.success) {
            for (const violation of result.violations) {
              issues.push(violationToIssue(violation, rule))
            }
          }
        } catch (error) {
          return {
            success: false,
            error: {
              code: 'RULE_EXECUTION_ERROR',
              message: `Rule ${rule.metadata.id} threw an error: ${error instanceof Error ? error.message : String(error)}`,
              ruleId: rule.metadata.id,
            },
          }
        }
      }

      return ok(issues)
    },

    async evaluateFiles(
      contexts: readonly RuleContext[],
    ): Promise<Result<readonly Issue[], RuleEngineError>> {
      const allIssues: Issue[] = []

      for (const context of contexts) {
        const result = await this.evaluateFile(context)
        if (!result.success) {
          return result
        }
        allIssues.push(...result.data)
      }

      return ok(allIssues)
    },
  }
}

/**
 * Default layer configuration for typical TypeScript projects.
 */
export const DEFAULT_LAYER_CONFIG: LayerConfiguration = {
  layers: [
    {name: 'domain', allowedDependencies: []},
    {name: 'application', allowedDependencies: ['domain']},
    {name: 'infrastructure', allowedDependencies: ['domain', 'application']},
    {name: 'presentation', allowedDependencies: ['domain', 'application']},
    {name: 'shared', allowedDependencies: []},
  ],
  patterns: [
    {pattern: '**/domain/**', layer: 'domain'},
    {pattern: '**/models/**', layer: 'domain'},
    {pattern: '**/entities/**', layer: 'domain'},
    {pattern: '**/application/**', layer: 'application'},
    {pattern: '**/services/**', layer: 'application'},
    {pattern: '**/use-cases/**', layer: 'application'},
    {pattern: '**/infrastructure/**', layer: 'infrastructure'},
    {pattern: '**/adapters/**', layer: 'infrastructure'},
    {pattern: '**/repositories/**', layer: 'infrastructure'},
    {pattern: '**/presentation/**', layer: 'presentation'},
    {pattern: '**/ui/**', layer: 'presentation'},
    {pattern: '**/components/**', layer: 'presentation'},
    {pattern: '**/shared/**', layer: 'shared'},
    {pattern: '**/utils/**', layer: 'shared'},
    {pattern: '**/lib/**', layer: 'shared'},
  ],
}

/**
 * Determines the architectural layer for a file path based on patterns.
 *
 * @param filePath - File path to check
 * @param config - Layer configuration
 * @returns Layer name or undefined if no match
 */
export function getFileLayer(filePath: string, config: LayerConfiguration): string | undefined {
  const normalizedPath = normalizePath(filePath)

  for (const {pattern, layer} of config.patterns) {
    if (matchPattern(normalizedPath, pattern)) {
      return layer
    }
  }

  return undefined
}

/**
 * Checks if an import from one layer to another is allowed.
 *
 * @param sourceLayer - Layer of the importing file
 * @param targetLayer - Layer of the imported module
 * @param config - Layer configuration
 * @returns Whether the import is allowed
 */
export function isLayerImportAllowed(
  sourceLayer: string,
  targetLayer: string,
  config: LayerConfiguration,
): boolean {
  if (sourceLayer === targetLayer) {
    return true
  }

  const sourceLayerDef = config.layers.find(l => l.name === sourceLayer)
  if (sourceLayerDef === undefined) {
    return true
  }

  return sourceLayerDef.allowedDependencies.includes(targetLayer)
}

/**
 * Built-in rule IDs.
 */
export const BUILTIN_RULE_IDS = {
  LAYER_VIOLATION: 'layer-violation',
  BARREL_EXPORT: 'barrel-export',
  PUBLIC_API: 'public-api',
  SIDE_EFFECT: 'side-effect',
  PATH_ALIAS: 'path-alias',
  PACKAGE_BOUNDARY: 'package-boundary',
} as const
