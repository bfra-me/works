/**
 * Dependency graph builder for tracking import relationships.
 *
 * Builds an adjacency list representation of module dependencies
 * for cycle detection and dependency analysis using Tarjan's algorithm.
 *
 * This module uses types from import-extractor.ts which depends on ts-morph
 * (provided as a peer dependency via @bfra.me/doc-sync).
 */

import type {ExtractedImport, ImportExtractionResult} from '../parser/import-extractor'

import path from 'node:path'

/**
 * A node in the dependency graph representing a module.
 */
export interface DependencyNode {
  /** Unique identifier (typically the file path) */
  readonly id: string
  /** Display name for the node */
  readonly name: string
  /** File path of the module */
  readonly filePath: string
  /** Package name if this is the root of a package */
  readonly packageName?: string
  /** Outgoing edges (modules this node imports from) */
  readonly imports: readonly string[]
  /** Incoming edges (modules that import this node) */
  readonly importedBy: readonly string[]
  /** All import details for this node */
  readonly importDetails: readonly ExtractedImport[]
}

/**
 * An edge in the dependency graph representing an import relationship.
 */
export interface DependencyEdge {
  /** Source node (the importing module) */
  readonly from: string
  /** Target node (the imported module) */
  readonly to: string
  /** Import type */
  readonly type: ExtractedImport['type']
  /** Whether this is a type-only import */
  readonly isTypeOnly: boolean
}

/**
 * A cycle detected in the dependency graph.
 */
export interface DependencyCycle {
  /** Nodes in the cycle, in order */
  readonly nodes: readonly string[]
  /** Edges forming the cycle */
  readonly edges: readonly DependencyEdge[]
  /** Human-readable representation of the cycle */
  readonly description: string
}

/**
 * The complete dependency graph.
 */
export interface DependencyGraph {
  /** All nodes in the graph */
  readonly nodes: ReadonlyMap<string, DependencyNode>
  /** All edges in the graph */
  readonly edges: readonly DependencyEdge[]
  /** Root workspace path */
  readonly rootPath: string
  /** Total number of modules */
  readonly moduleCount: number
  /** Total number of edges (import relationships) */
  readonly edgeCount: number
}

/**
 * Statistics about the dependency graph.
 */
export interface GraphStatistics {
  /** Total number of nodes */
  readonly nodeCount: number
  /** Total number of edges */
  readonly edgeCount: number
  /** Number of external dependencies */
  readonly externalDependencies: number
  /** Number of workspace dependencies */
  readonly workspaceDependencies: number
  /** Most imported modules (by incoming edge count) */
  readonly mostImported: readonly {readonly id: string; readonly count: number}[]
  /** Modules with most imports (by outgoing edge count) */
  readonly mostImporting: readonly {readonly id: string; readonly count: number}[]
}

/**
 * Options for building a dependency graph.
 */
export interface DependencyGraphOptions {
  /** Root path of the workspace */
  readonly rootPath: string
  /** Include type-only imports in the graph */
  readonly includeTypeImports?: boolean
  /** Resolve relative imports to absolute paths */
  readonly resolveRelativeImports?: boolean
}

/**
 * Builds a dependency graph from import extraction results.
 *
 * @example
 * ```ts
 * const results: ImportExtractionResult[] = [...]
 * const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
 *
 * for (const [id, node] of graph.nodes) {
 *   console.log(`${node.name} imports ${node.imports.length} modules`)
 * }
 * ```
 */
export function buildDependencyGraph(
  results: readonly ImportExtractionResult[],
  options: DependencyGraphOptions,
): DependencyGraph {
  const {rootPath, includeTypeImports = true, resolveRelativeImports = true} = options

  const nodes = new Map<string, DependencyNode>()
  const edges: DependencyEdge[] = []
  const importedByMap = new Map<string, string[]>()

  // First pass: create nodes for all files
  for (const result of results) {
    const nodeId = normalizeNodeId(result.filePath, rootPath)
    const imports: string[] = []
    const importDetails: ExtractedImport[] = []

    for (const imp of result.imports) {
      if (imp.type === 'type-only' && !includeTypeImports) {
        continue
      }

      let targetId: string
      if (imp.isRelative && resolveRelativeImports) {
        targetId = resolveRelativeImportPath(result.filePath, imp.moduleSpecifier)
        targetId = normalizeNodeId(targetId, rootPath)
      } else {
        targetId = imp.moduleSpecifier
      }

      if (!imports.includes(targetId)) {
        imports.push(targetId)
      }
      importDetails.push(imp)

      edges.push({
        from: nodeId,
        to: targetId,
        type: imp.type,
        isTypeOnly: imp.type === 'type-only',
      })

      // Track reverse edges
      const importedBy = importedByMap.get(targetId)
      if (importedBy === undefined) {
        importedByMap.set(targetId, [nodeId])
      } else if (!importedBy.includes(nodeId)) {
        importedBy.push(nodeId)
      }
    }

    nodes.set(nodeId, {
      id: nodeId,
      name: getNodeDisplayName(result.filePath, rootPath),
      filePath: result.filePath,
      imports,
      importedBy: [],
      importDetails,
    })
  }

  // Second pass: populate importedBy references
  for (const [nodeId, node] of nodes) {
    const importedBy = importedByMap.get(nodeId) ?? []
    nodes.set(nodeId, {
      ...node,
      importedBy,
    })
  }

  return {
    nodes,
    edges,
    rootPath,
    moduleCount: nodes.size,
    edgeCount: edges.length,
  }
}

/**
 * Finds all cycles in a dependency graph using Tarjan's algorithm.
 *
 * @example
 * ```ts
 * const cycles = findCycles(graph)
 * for (const cycle of cycles) {
 *   console.log(`Cycle detected: ${cycle.description}`)
 * }
 * ```
 */
export function findCycles(graph: DependencyGraph): readonly DependencyCycle[] {
  const cycles: DependencyCycle[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const path: string[] = []

  function dfs(nodeId: string): void {
    if (recursionStack.has(nodeId)) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeId)
      if (cycleStart !== -1) {
        const cycleNodes = path.slice(cycleStart)
        cycleNodes.push(nodeId)

        const cycleEdges: DependencyEdge[] = []
        for (let i = 0; i < cycleNodes.length - 1; i++) {
          const from = cycleNodes[i]
          const to = cycleNodes[i + 1]
          const edge = graph.edges.find(e => e.from === from && e.to === to)
          if (edge !== undefined) {
            cycleEdges.push(edge)
          }
        }

        cycles.push({
          nodes: cycleNodes.slice(0, -1),
          edges: cycleEdges,
          description: cycleNodes.join(' → '),
        })
      }
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)

    const node = graph.nodes.get(nodeId)
    if (node !== undefined) {
      for (const importId of node.imports) {
        dfs(importId)
      }
    }

    path.pop()
    recursionStack.delete(nodeId)
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId)
    }
  }

  return cycles
}

/**
 * Computes statistics about the dependency graph.
 */
export function computeGraphStatistics(graph: DependencyGraph, topN = 10): GraphStatistics {
  let externalDependencies = 0
  let workspaceDependencies = 0
  const importCounts: {id: string; count: number}[] = []
  const importedByCounts: {id: string; count: number}[] = []

  for (const [id, node] of graph.nodes) {
    importCounts.push({id, count: node.imports.length})
    importedByCounts.push({id, count: node.importedBy.length})
  }

  // Count external and workspace imports from edges
  const seenExternal = new Set<string>()
  const seenWorkspace = new Set<string>()

  for (const edge of graph.edges) {
    if (!graph.nodes.has(edge.to)) {
      // Target is external
      if (edge.to.startsWith('@')) {
        if (!seenWorkspace.has(edge.to)) {
          workspaceDependencies++
          seenWorkspace.add(edge.to)
        }
      } else if (!seenExternal.has(edge.to)) {
        externalDependencies++
        seenExternal.add(edge.to)
      }
    }
  }

  // Sort by count descending
  importCounts.sort((a, b) => b.count - a.count)
  importedByCounts.sort((a, b) => b.count - a.count)

  return {
    nodeCount: graph.nodes.size,
    edgeCount: graph.edges.length,
    externalDependencies,
    workspaceDependencies,
    mostImported: importedByCounts.slice(0, topN),
    mostImporting: importCounts.slice(0, topN),
  }
}

/**
 * Gets all transitive dependencies of a node.
 */
export function getTransitiveDependencies(
  graph: DependencyGraph,
  nodeId: string,
): readonly string[] {
  const dependencies = new Set<string>()
  const visited = new Set<string>()

  function traverse(id: string): void {
    if (visited.has(id)) {
      return
    }
    visited.add(id)

    const node = graph.nodes.get(id)
    if (node !== undefined) {
      for (const importId of node.imports) {
        dependencies.add(importId)
        traverse(importId)
      }
    }
  }

  traverse(nodeId)
  dependencies.delete(nodeId)

  return [...dependencies]
}

/**
 * Gets all modules that transitively depend on a node.
 */
export function getTransitiveDependents(graph: DependencyGraph, nodeId: string): readonly string[] {
  const dependents = new Set<string>()
  const visited = new Set<string>()

  function traverse(id: string): void {
    if (visited.has(id)) {
      return
    }
    visited.add(id)

    const node = graph.nodes.get(id)
    if (node !== undefined) {
      for (const dependentId of node.importedBy) {
        dependents.add(dependentId)
        traverse(dependentId)
      }
    }
  }

  traverse(nodeId)
  dependents.delete(nodeId)

  return [...dependents]
}

/**
 * Normalizes a file path to a node ID.
 */
function normalizeNodeId(filePath: string, rootPath: string): string {
  if (filePath.startsWith(rootPath)) {
    return filePath.slice(rootPath.length).replace(/^\//, '')
  }
  return filePath
}

/**
 * Gets a display name for a node from its file path.
 */
function getNodeDisplayName(filePath: string, rootPath: string): string {
  const relativePath = normalizeNodeId(filePath, rootPath)
  return relativePath
}

/**
 * Resolves a relative import path to an absolute path.
 */
function resolveRelativeImportPath(fromFile: string, moduleSpecifier: string): string {
  const fromDir = path.dirname(fromFile)
  let resolved = path.resolve(fromDir, moduleSpecifier)

  const hasExtension = /\.(?:ts|tsx|js|jsx|mts|cts|mjs|cjs)$/.test(resolved)
  if (!hasExtension) {
    // Default to .ts extension for TypeScript projects
    resolved = `${resolved}.ts`
  }

  return resolved
}
