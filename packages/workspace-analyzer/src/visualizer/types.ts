/**
 * Type definitions for dependency graph visualization.
 *
 * These types define the data structures used to transform a DependencyGraph
 * into a format suitable for interactive D3.js visualization.
 */

import type {Severity} from '../types/index'

/**
 * A node in the visualization graph representing a module.
 */
export interface VisualizationNode {
  /** Unique identifier (typically the normalized file path) */
  readonly id: string
  /** Display name for the node */
  readonly name: string
  /** Full file path of the module */
  readonly filePath: string
  /** Package name if the module belongs to a workspace package */
  readonly packageName: string | undefined
  /** Architectural layer (e.g., 'domain', 'application', 'infrastructure') */
  readonly layer: string | undefined
  /** Number of modules this node imports */
  readonly importsCount: number
  /** Number of modules that import this node */
  readonly importedByCount: number
  /** Whether this node is part of a dependency cycle */
  readonly isInCycle: boolean
  /** Violations associated with this node */
  readonly violations: readonly VisualizationViolation[]
  /** Highest severity level among violations (undefined if no violations) */
  readonly highestViolationSeverity: Severity | undefined
}

/**
 * An edge in the visualization graph representing an import relationship.
 */
export interface VisualizationEdge {
  /** Source node ID (the importing module) */
  readonly source: string
  /** Target node ID (the imported module) */
  readonly target: string
  /** Import type classification */
  readonly type: 'static' | 'dynamic' | 'type-only' | 'require'
  /** Whether this edge is part of a dependency cycle */
  readonly isInCycle: boolean
  /** ID of the cycle this edge belongs to (undefined if not in a cycle) */
  readonly cycleId: string | undefined
}

/**
 * A violation displayed on a node or edge in the visualization.
 */
export interface VisualizationViolation {
  /** Unique identifier for this violation */
  readonly id: string
  /** Human-readable message describing the violation */
  readonly message: string
  /** Severity level of the violation */
  readonly severity: Severity
  /** ID of the rule that generated this violation */
  readonly ruleId: string
}

/**
 * Cycle information for visualization highlighting.
 */
export interface VisualizationCycle {
  /** Unique identifier for this cycle */
  readonly id: string
  /** Node IDs participating in the cycle, in order */
  readonly nodes: readonly string[]
  /** Edges forming the cycle path */
  readonly edges: readonly {readonly from: string; readonly to: string}[]
  /** Number of nodes in the cycle */
  readonly length: number
  /** Human-readable description of the cycle path */
  readonly description: string
}

/**
 * Statistics summary for the visualization.
 */
export interface VisualizationStatistics {
  /** Total number of nodes in the graph */
  readonly totalNodes: number
  /** Total number of edges (import relationships) */
  readonly totalEdges: number
  /** Total number of dependency cycles detected */
  readonly totalCycles: number
  /** Count of nodes grouped by architectural layer */
  readonly nodesByLayer: Readonly<Record<string, number>>
  /** Count of violations grouped by severity level */
  readonly violationsBySeverity: Readonly<Record<Severity, number>>
  /** Number of workspace packages analyzed */
  readonly packagesAnalyzed: number
  /** Number of source files analyzed */
  readonly filesAnalyzed: number
}

/**
 * Metadata about the visualization generation.
 */
export interface VisualizationMetadata {
  /** Root path of the analyzed workspace */
  readonly workspacePath: string
  /** ISO 8601 timestamp when the visualization was generated */
  readonly generatedAt: string
  /** Version of the workspace-analyzer that generated this data */
  readonly analyzerVersion: string
}

/**
 * Layer definition for architectural boundary visualization.
 */
export interface VisualizationLayerDefinition {
  /** Layer name (e.g., 'domain', 'application') */
  readonly name: string
  /** Layers this layer is allowed to depend on */
  readonly allowedDependencies: readonly string[]
}

/**
 * Complete visualization data ready for rendering.
 */
export interface VisualizationData {
  /** All nodes in the visualization graph */
  readonly nodes: readonly VisualizationNode[]
  /** All edges (import relationships) in the graph */
  readonly edges: readonly VisualizationEdge[]
  /** Detected dependency cycles */
  readonly cycles: readonly VisualizationCycle[]
  /** Summary statistics */
  readonly statistics: VisualizationStatistics
  /** Architectural layer definitions for filtering */
  readonly layers: readonly VisualizationLayerDefinition[]
  /** Generation metadata */
  readonly metadata: VisualizationMetadata
}

/**
 * Filter configuration for the visualization UI.
 */
export interface VisualizationFilters {
  /** Layers to display (empty = all layers) */
  readonly layers: readonly string[]
  /** Severity levels to display (empty = all severities) */
  readonly severities: readonly Severity[]
  /** Package scopes to display (e.g., '@bfra.me/*') */
  readonly packages: readonly string[]
  /** Show only nodes that are part of cycles */
  readonly showCyclesOnly: boolean
  /** Show only nodes with violations */
  readonly showViolationsOnly: boolean
}

/**
 * Options for configuring visualization generation.
 */
export interface VisualizerOptions {
  /** Output path for the generated HTML file */
  readonly outputPath: string
  /** Output format(s) to generate */
  readonly format: 'html' | 'json' | 'both'
  /** Whether to auto-open the generated file in the browser */
  readonly autoOpen: boolean
  /** Title displayed in the visualization */
  readonly title: string
  /** Pre-applied filters for the initial visualization state */
  readonly filters: Partial<VisualizationFilters>
  /** Include type-only imports in the graph */
  readonly includeTypeImports: boolean
  /** Maximum number of nodes to render (for performance) */
  readonly maxNodes: number
}

/**
 * Default visualization options.
 */
export const DEFAULT_VISUALIZER_OPTIONS: VisualizerOptions = {
  outputPath: './workspace-graph.html',
  format: 'html',
  autoOpen: true,
  title: 'Workspace Dependency Graph',
  filters: {},
  includeTypeImports: true,
  maxNodes: 1000,
}

/**
 * Severity levels ordered by importance (highest first).
 */
export const SEVERITY_ORDER: readonly Severity[] = ['critical', 'error', 'warning', 'info'] as const

/**
 * Error type for visualization generation failures.
 */
export interface VisualizationError {
  /** Error code for programmatic handling */
  readonly code: 'INVALID_GRAPH' | 'TRANSFORM_FAILED' | 'LIMIT_EXCEEDED'
  /** Human-readable error message */
  readonly message: string
  /** Optional details about the error */
  readonly details?: Record<string, unknown>
}

/**
 * Gets the highest severity from a list of severities.
 *
 * @param severities - Array of severity levels
 * @returns The highest severity, or undefined if the array is empty
 */
export function getHighestSeverity(severities: readonly Severity[]): Severity | undefined {
  if (severities.length === 0) {
    return undefined
  }

  for (const level of SEVERITY_ORDER) {
    if (severities.includes(level)) {
      return level
    }
  }

  return severities[0]
}
