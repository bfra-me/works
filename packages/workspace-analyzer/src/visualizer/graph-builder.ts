/**
 * Graph builder for transforming DependencyGraph data into visualization-ready structures.
 *
 * Converts the internal dependency graph representation into a format optimized
 * for D3.js force-directed graph visualization with cycle highlighting,
 * layer information, and violation annotations.
 */

import type {
  DependencyCycle,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
} from '../graph/dependency-graph'
import type {LayerConfiguration} from '../rules/rule-engine'
import type {Issue, Result, Severity} from '../types/index'
import type {
  VisualizationCycle,
  VisualizationData,
  VisualizationEdge,
  VisualizationError,
  VisualizationMetadata,
  VisualizationNode,
  VisualizationStatistics,
  VisualizationViolation,
} from './types'

import {ok} from '@bfra.me/es/result'

import {getFileLayer} from '../rules/rule-engine'
import {getHighestSeverity, SEVERITY_ORDER} from './types'

/**
 * Context for graph transformation containing all necessary data.
 */
export interface GraphBuilderContext {
  /** The dependency graph to transform */
  readonly graph: DependencyGraph
  /** Detected cycles in the graph */
  readonly cycles: readonly DependencyCycle[]
  /** Issues/violations from analysis */
  readonly issues: readonly Issue[]
  /** Layer configuration for architectural boundaries */
  readonly layerConfig: LayerConfiguration | undefined
  /** Package name mapping (file path -> package name) */
  readonly packageMap: ReadonlyMap<string, string>
  /** Analyzer version for metadata */
  readonly analyzerVersion: string
}

/**
 * Options for building visualization data.
 */
export interface BuildVisualizationOptions {
  /** Include type-only imports */
  readonly includeTypeImports: boolean
  /** Maximum number of nodes to include */
  readonly maxNodes: number
  /** Title for the visualization */
  readonly title: string
}

/**
 * Default options for visualization building.
 */
export const DEFAULT_BUILD_OPTIONS: BuildVisualizationOptions = {
  includeTypeImports: true,
  maxNodes: 1000,
  title: 'Workspace Dependency Graph',
}

/**
 * Transforms a DependencyNode into a VisualizationNode.
 *
 * @param node - The dependency node to transform
 * @param context - Context containing cycles and violations
 * @param nodeIdsInCycles - Pre-computed set of node IDs in cycles (for performance)
 * @returns A visualization-ready node
 */
export function transformNodeToVisualization(
  node: DependencyNode,
  context: GraphBuilderContext,
  nodeIdsInCycles?: ReadonlySet<string>,
): VisualizationNode {
  const {cycles, issues, layerConfig, packageMap} = context

  const cycleNodeSet = nodeIdsInCycles ?? buildCycleNodeSet(cycles)
  const isInCycle = cycleNodeSet.has(node.id)

  const nodeViolations = mapIssuesToViolations(node.id, issues)

  const severities = nodeViolations.map(v => v.severity)
  const highestSeverity = getHighestSeverity(severities)

  const layer = layerConfig === undefined ? undefined : getFileLayer(node.filePath, layerConfig)

  const packageName = packageMap.get(node.filePath) ?? node.packageName

  return {
    id: node.id,
    name: node.name,
    filePath: node.filePath,
    packageName,
    layer,
    importsCount: node.imports.length,
    importedByCount: node.importedBy.length,
    isInCycle,
    violations: nodeViolations,
    highestViolationSeverity: highestSeverity,
  }
}

/**
 * Transforms a DependencyEdge into a VisualizationEdge.
 *
 * @param edge - The dependency edge to transform
 * @param cycleEdgeSet - Set of "from->to" strings representing edges in cycles
 * @param edgeToCycleId - Map of edge keys to cycle IDs
 * @returns A visualization-ready edge
 */
export function transformEdgeToVisualization(
  edge: DependencyEdge,
  cycleEdgeSet: ReadonlySet<string>,
  edgeToCycleId: ReadonlyMap<string, string>,
): VisualizationEdge {
  const edgeKey = `${edge.from}->${edge.to}`
  const isInCycle = cycleEdgeSet.has(edgeKey)
  const cycleId = edgeToCycleId.get(edgeKey)

  const type = mapImportType(edge.type, edge.isTypeOnly)

  return {
    source: edge.from,
    target: edge.to,
    type,
    isInCycle,
    cycleId,
  }
}

/**
 * Transforms a DependencyCycle into a VisualizationCycle.
 *
 * @param cycle - The dependency cycle to transform
 * @param index - Index of the cycle (used for ID generation)
 * @returns A visualization-ready cycle
 */
export function transformCycleToVisualization(
  cycle: DependencyCycle,
  index: number,
): VisualizationCycle {
  const id = `cycle-${index + 1}`

  const edges = cycle.edges.map(edge => ({
    from: edge.from,
    to: edge.to,
  }))

  return {
    id,
    nodes: cycle.nodes,
    edges,
    length: cycle.nodes.length,
    description: cycle.description,
  }
}

/**
 * Builds complete visualization data from a dependency graph.
 *
 * @param context - Context containing all necessary data
 * @param options - Build options
 * @returns Result containing visualization data ready for rendering
 */
export function buildVisualizationData(
  context: GraphBuilderContext,
  options: Partial<BuildVisualizationOptions> = {},
): Result<VisualizationData, VisualizationError> {
  const opts: BuildVisualizationOptions = {...DEFAULT_BUILD_OPTIONS, ...options}
  const {graph, cycles, layerConfig, analyzerVersion} = context

  const vizCycles = cycles.map((cycle, index) => transformCycleToVisualization(cycle, index))

  const {cycleEdgeSet, edgeToCycleId} = buildCycleEdgeMaps(vizCycles)
  const cycleNodeIds = buildCycleNodeSet(cycles)

  const filteredEdges = opts.includeTypeImports
    ? graph.edges
    : graph.edges.filter(e => !e.isTypeOnly)

  const vizEdges = filteredEdges.map(edge =>
    transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId),
  )

  const nodeIds = new Set<string>()
  for (const edge of filteredEdges) {
    nodeIds.add(edge.from)
    nodeIds.add(edge.to)
  }

  let vizNodes: VisualizationNode[] = []
  for (const nodeId of nodeIds) {
    const node = graph.nodes.get(nodeId)
    if (node !== undefined) {
      vizNodes.push(transformNodeToVisualization(node, context, cycleNodeIds))
    }
  }

  if (vizNodes.length > opts.maxNodes) {
    vizNodes = prioritizeNodes(vizNodes, opts.maxNodes)
  }

  const includedNodeIds = new Set(vizNodes.map(n => n.id))
  const filteredVizEdges = vizEdges.filter(
    e => includedNodeIds.has(e.source) && includedNodeIds.has(e.target),
  )

  const statistics = computeVisualizationStatistics(vizNodes, filteredVizEdges, vizCycles, context)

  const layers =
    layerConfig?.layers.map(layer => ({
      name: layer.name,
      allowedDependencies: layer.allowedDependencies,
    })) ?? []

  const metadata: VisualizationMetadata = {
    workspacePath: graph.rootPath,
    generatedAt: new Date().toISOString(),
    analyzerVersion,
  }

  return ok({
    nodes: vizNodes,
    edges: filteredVizEdges,
    cycles: vizCycles,
    statistics,
    layers,
    metadata,
  })
}

/**
 * Builds maps for efficient cycle edge lookup.
 */
function buildCycleEdgeMaps(cycles: readonly VisualizationCycle[]): {
  cycleEdgeSet: Set<string>
  edgeToCycleId: Map<string, string>
} {
  const cycleEdgeSet = new Set<string>()
  const edgeToCycleId = new Map<string, string>()

  for (const cycle of cycles) {
    for (const edge of cycle.edges) {
      const key = `${edge.from}->${edge.to}`
      cycleEdgeSet.add(key)
      edgeToCycleId.set(key, cycle.id)
    }
  }

  return {cycleEdgeSet, edgeToCycleId}
}

/**
 * Builds a set of node IDs that are part of any cycle.
 * Pre-computing this set improves performance when transforming multiple nodes.
 */
function buildCycleNodeSet(cycles: readonly DependencyCycle[]): ReadonlySet<string> {
  const nodeIds = new Set<string>()
  for (const cycle of cycles) {
    for (const nodeId of cycle.nodes) {
      nodeIds.add(nodeId)
    }
  }
  return nodeIds
}

/**
 * Maps import type from dependency graph format to visualization format.
 */
function mapImportType(
  type: DependencyEdge['type'],
  isTypeOnly: boolean,
): VisualizationEdge['type'] {
  if (isTypeOnly || type === 'type-only') {
    return 'type-only'
  }
  if (type === 'dynamic') {
    return 'dynamic'
  }
  if (type === 'require') {
    return 'require'
  }
  return 'static'
}

/**
 * Maps issues to violations for a specific node.
 */
function mapIssuesToViolations(nodeId: string, issues: readonly Issue[]): VisualizationViolation[] {
  const violations: VisualizationViolation[] = []

  for (const issue of issues) {
    const normalizedIssuePath = issue.location.filePath.replaceAll('\\', '/')
    const normalizedNodeId = nodeId.replaceAll('\\', '/')

    if (
      normalizedIssuePath.endsWith(normalizedNodeId) ||
      normalizedIssuePath === normalizedNodeId
    ) {
      violations.push({
        id: `${issue.id}-${violations.length}`,
        message: issue.description,
        severity: issue.severity,
        ruleId: issue.id,
      })
    }
  }

  return violations
}

/**
 * Prioritizes nodes when exceeding maxNodes limit.
 * Prioritizes nodes that are in cycles or have violations.
 */
function prioritizeNodes(
  nodes: readonly VisualizationNode[],
  maxNodes: number,
): VisualizationNode[] {
  const scored = nodes.map(node => {
    let score = 0

    if (node.isInCycle) {
      score += 100
    }

    if (node.highestViolationSeverity !== undefined) {
      const severityIndex = SEVERITY_ORDER.indexOf(node.highestViolationSeverity)
      score += (SEVERITY_ORDER.length - severityIndex) * 20
    }

    score += node.importsCount + node.importedByCount

    return {node, score}
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, maxNodes).map(s => s.node)
}

/**
 * Computes statistics for the visualization.
 */
function computeVisualizationStatistics(
  nodes: readonly VisualizationNode[],
  edges: readonly VisualizationEdge[],
  cycles: readonly VisualizationCycle[],
  _context: GraphBuilderContext,
): VisualizationStatistics {
  const nodesByLayer: Record<string, number> = {}
  const violationsBySeverity: Record<Severity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  }

  const packagesSet = new Set<string>()
  const filesSet = new Set<string>()

  for (const node of nodes) {
    filesSet.add(node.filePath)

    if (node.packageName !== undefined) {
      packagesSet.add(node.packageName)
    }

    if (node.layer !== undefined) {
      nodesByLayer[node.layer] = (nodesByLayer[node.layer] ?? 0) + 1
    }

    for (const violation of node.violations) {
      violationsBySeverity[violation.severity]++
    }
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalCycles: cycles.length,
    nodesByLayer,
    violationsBySeverity,
    packagesAnalyzed: packagesSet.size,
    filesAnalyzed: filesSet.size,
  }
}
