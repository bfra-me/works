/**
 * CircularImportAnalyzer - Detects circular import chains in workspace packages.
 *
 * Uses the dependency graph builder and Tarjan's algorithm to identify
 * circular dependencies, providing full path reporting and cycle visualization.
 *
 * Reports:
 * - Direct cycles (A → B → A)
 * - Transitive cycles (A → B → C → A)
 * - Self-imports (A → A)
 * - Cycle severity based on depth and involvement
 */

import type {DependencyCycle, DependencyGraph} from '../graph/dependency-graph'
import type {ImportExtractionResult, ImportExtractorOptions} from '../parser/import-extractor'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import path from 'node:path'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'

import {buildDependencyGraph, findCycles} from '../graph/dependency-graph'
import {extractImports} from '../parser/import-extractor'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to CircularImportAnalyzer.
 */
export interface CircularImportAnalyzerOptions {
  /** Maximum cycle length to report (helps avoid reporting very large cycles) */
  readonly maxCycleLength?: number
  /** Whether to include type-only imports in cycle detection */
  readonly includeTypeImports?: boolean
  /** Severity for direct (2-node) cycles */
  readonly directCycleSeverity?: Severity
  /** Severity for transitive cycles */
  readonly transitiveCycleSeverity?: Severity
  /** File patterns to exclude from analysis */
  readonly excludePatterns?: readonly string[]
  /** Workspace package prefixes */
  readonly workspacePrefixes?: readonly string[]
}

const DEFAULT_OPTIONS: Required<CircularImportAnalyzerOptions> = {
  maxCycleLength: 20,
  includeTypeImports: false,
  directCycleSeverity: 'error',
  transitiveCycleSeverity: 'warning',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/__mocks__/**'],
  workspacePrefixes: ['@bfra.me/'],
}

export const circularImportAnalyzerMetadata: AnalyzerMetadata = {
  id: 'circular-import',
  name: 'Circular Import Analyzer',
  description: 'Detects circular import chains using dependency graph analysis',
  categories: ['circular-import'],
  defaultSeverity: 'warning',
}

/**
 * Creates a CircularImportAnalyzer instance.
 *
 * @example
 * ```ts
 * const analyzer = createCircularImportAnalyzer({
 *   maxCycleLength: 10,
 *   directCycleSeverity: 'error',
 * })
 * const result = await analyzer.analyze(context)
 * ```
 */
export function createCircularImportAnalyzer(
  options: CircularImportAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: circularImportAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing circular imports in ${pkg.name}...`)

        const packageIssues = await analyzePackageCircularImports(
          pkg,
          context.workspacePath,
          resolvedOptions,
        )
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Visualization data for a detected cycle.
 */
export interface CycleVisualization {
  /** Nodes in the cycle with display names */
  readonly nodes: readonly CycleNode[]
  /** Edges in the cycle */
  readonly edges: readonly CycleEdge[]
  /** ASCII art representation of the cycle */
  readonly ascii: string
  /** Mermaid diagram code for rendering */
  readonly mermaid: string
}

/**
 * A node in the cycle visualization.
 */
export interface CycleNode {
  /** Unique identifier */
  readonly id: string
  /** Display name */
  readonly name: string
  /** Full file path */
  readonly filePath: string
  /** Whether this node starts the cycle */
  readonly isStart: boolean
}

/**
 * An edge in the cycle visualization.
 */
export interface CycleEdge {
  /** Source node ID */
  readonly from: string
  /** Target node ID */
  readonly to: string
  /** Import type */
  readonly importType: string
}

/**
 * Analyzes a single package for circular imports.
 */
async function analyzePackageCircularImports(
  pkg: WorkspacePackage,
  workspacePath: string,
  options: Required<CircularImportAnalyzerOptions>,
): Promise<Issue[]> {
  const issues: Issue[] = []

  const sourceFiles = filterSourceFiles(pkg.sourceFiles, options.excludePatterns)
  if (sourceFiles.length === 0) {
    return issues
  }

  const importResults = await extractAllImports(sourceFiles, options)
  if (importResults.length === 0) {
    return issues
  }

  const graph = buildDependencyGraph(importResults, {
    rootPath: workspacePath,
    includeTypeImports: options.includeTypeImports,
    resolveRelativeImports: true,
  })

  const cycles = findCycles(graph)

  const filteredCycles = cycles.filter(cycle => cycle.nodes.length <= options.maxCycleLength)

  const seenCycles = new Set<string>()
  for (const cycle of filteredCycles) {
    const cycleKey = normalizeCycleKey(cycle)
    if (seenCycles.has(cycleKey)) {
      continue
    }
    seenCycles.add(cycleKey)

    const visualization = generateCycleVisualization(cycle, graph, workspacePath)
    issues.push(createCycleIssue(pkg, cycle, visualization, options, workspacePath))
  }

  return issues
}

/**
 * Filters source files based on exclude patterns.
 */
function filterSourceFiles(
  sourceFiles: readonly string[],
  excludePatterns: readonly string[],
): string[] {
  return sourceFiles.filter(filePath => {
    const fileName = path.basename(filePath)
    const relativePath = filePath

    return !excludePatterns.some(pattern => {
      if (pattern.includes('**')) {
        const parts = pattern.split('**')
        if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
          const prefix = parts[0].replaceAll('/', '')
          const suffix = parts[1].replaceAll('/', '')
          return (
            (prefix.length === 0 || relativePath.includes(prefix)) &&
            (suffix.length === 0 || relativePath.endsWith(suffix))
          )
        }
      }
      return fileName.includes(pattern.replaceAll('*', '')) || relativePath.includes(pattern)
    })
  })
}

/**
 * Extracts imports from all source files.
 */
async function extractAllImports(
  sourceFiles: readonly string[],
  options: Required<CircularImportAnalyzerOptions>,
): Promise<ImportExtractionResult[]> {
  const results: ImportExtractionResult[] = []
  const project = createProject()

  const extractorOptions: ImportExtractorOptions = {
    workspacePrefixes: options.workspacePrefixes,
    includeTypeImports: options.includeTypeImports,
    includeDynamicImports: true,
    includeRequireCalls: true,
  }

  for (const filePath of sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const result = extractImports(sourceFile, extractorOptions)
      results.push(result)
    } catch {
      // Skip files that can't be parsed
    }
  }

  return results
}

/**
 * Creates a normalized key for a cycle to detect duplicates.
 * Sorts nodes to ensure A→B→C→A is considered the same as B→C→A→B.
 */
function normalizeCycleKey(cycle: DependencyCycle): string {
  const sorted = [...cycle.nodes].sort()
  return sorted.join('|')
}

/**
 * Generates visualization data for a cycle.
 */
export function generateCycleVisualization(
  cycle: DependencyCycle,
  _graph: DependencyGraph,
  workspacePath: string,
): CycleVisualization {
  const nodes: CycleNode[] = cycle.nodes.map((nodeId, index) => ({
    id: nodeId,
    name: getShortName(nodeId),
    filePath: path.join(workspacePath, nodeId),
    isStart: index === 0,
  }))

  const edges: CycleEdge[] = cycle.edges.map(edge => ({
    from: edge.from,
    to: edge.to,
    importType: edge.type,
  }))

  const ascii = generateAsciiDiagram(cycle)
  const mermaid = generateMermaidDiagram(nodes, edges)

  return {nodes, edges, ascii, mermaid}
}

/**
 * Gets a short display name for a node.
 */
function getShortName(nodeId: string): string {
  const parts = nodeId.split('/')
  return parts.at(-1) ?? nodeId
}

/**
 * Generates an ASCII art diagram of the cycle.
 */
function generateAsciiDiagram(cycle: DependencyCycle): string {
  const nodes = cycle.nodes
  const lines: string[] = []

  let isFirst = true
  for (const node of nodes) {
    const current = getShortName(node)

    if (isFirst) {
      lines.push(`┌─> ${current}`)
      isFirst = false
    } else {
      lines.push(`│   ${current}`)
    }
    lines.push(`│     ↓`)
  }

  lines[lines.length - 1] = `└─────┘`

  return lines.join('\n')
}

/**
 * Generates a Mermaid diagram for the cycle.
 */
function generateMermaidDiagram(nodes: readonly CycleNode[], edges: readonly CycleEdge[]): string {
  const lines: string[] = ['graph LR']

  for (const node of nodes) {
    const sanitizedId = node.id.replaceAll('/', '_').replaceAll('.', '_')
    lines.push(`  ${sanitizedId}["${node.name}"]`)
  }

  for (const edge of edges) {
    const fromId = edge.from.replaceAll('/', '_').replaceAll('.', '_')
    const toId = edge.to.replaceAll('/', '_').replaceAll('.', '_')
    lines.push(`  ${fromId} --> ${toId}`)
  }

  return lines.join('\n')
}

/**
 * Creates an issue for a detected cycle.
 */
function createCycleIssue(
  pkg: WorkspacePackage,
  cycle: DependencyCycle,
  visualization: CycleVisualization,
  options: Required<CircularImportAnalyzerOptions>,
  workspacePath: string,
): Issue {
  const cycleLength = cycle.nodes.length
  const isDirectCycle = cycleLength === 2
  const severity = isDirectCycle ? options.directCycleSeverity : options.transitiveCycleSeverity

  const firstNode = cycle.nodes[0]
  const location: IssueLocation = {
    filePath: firstNode === undefined ? pkg.packagePath : path.join(workspacePath, firstNode),
  }

  const relatedLocations: IssueLocation[] = cycle.nodes.slice(1).map(nodeId => ({
    filePath: path.join(workspacePath, nodeId),
  }))

  const cycleDescription =
    cycleLength === 2
      ? `Direct circular import between ${getShortName(cycle.nodes[0] ?? '')} and ${getShortName(cycle.nodes[1] ?? '')}`
      : `Circular import chain of ${cycleLength} files`

  return createIssue({
    id: 'circular-import',
    title: cycleDescription,
    description: `Detected circular import: ${cycle.description}`,
    severity,
    category: 'circular-import',
    location,
    relatedLocations,
    suggestion: generateFixSuggestion(cycle, cycleLength),
    metadata: {
      packageName: pkg.name,
      cycleLength,
      cycleNodes: cycle.nodes,
      cycleDescription: cycle.description,
      visualization: {
        ascii: visualization.ascii,
        mermaid: visualization.mermaid,
      },
    },
  })
}

/**
 * Generates a fix suggestion based on cycle characteristics.
 */
function generateFixSuggestion(_cycle: DependencyCycle, cycleLength: number): string {
  if (cycleLength === 2) {
    return 'Consider extracting shared types/interfaces to a separate module, or restructuring to break the bidirectional dependency'
  }

  if (cycleLength <= 4) {
    return 'Identify the most general module in the cycle and ensure other modules depend on it, not vice versa'
  }

  return 'This is a complex circular dependency. Consider using dependency inversion, extracting interfaces, or restructuring the module hierarchy'
}

/**
 * Statistics about circular imports in a package.
 */
export interface CircularImportStats {
  /** Total number of cycles detected */
  readonly totalCycles: number
  /** Number of direct (2-node) cycles */
  readonly directCycles: number
  /** Number of transitive cycles */
  readonly transitiveCycles: number
  /** Files involved in cycles */
  readonly affectedFiles: readonly string[]
  /** Average cycle length */
  readonly averageCycleLength: number
  /** Maximum cycle length found */
  readonly maxCycleLength: number
}

/**
 * Computes statistics about detected cycles.
 */
export function computeCycleStats(cycles: readonly DependencyCycle[]): CircularImportStats {
  if (cycles.length === 0) {
    return {
      totalCycles: 0,
      directCycles: 0,
      transitiveCycles: 0,
      affectedFiles: [],
      averageCycleLength: 0,
      maxCycleLength: 0,
    }
  }

  let directCycles = 0
  let transitiveCycles = 0
  let totalLength = 0
  let maxLength = 0
  const affectedFiles = new Set<string>()

  for (const cycle of cycles) {
    const length = cycle.nodes.length
    totalLength += length
    maxLength = Math.max(maxLength, length)

    if (length === 2) {
      directCycles++
    } else {
      transitiveCycles++
    }

    for (const node of cycle.nodes) {
      affectedFiles.add(node)
    }
  }

  return {
    totalCycles: cycles.length,
    directCycles,
    transitiveCycles,
    affectedFiles: [...affectedFiles].sort(),
    averageCycleLength: totalLength / cycles.length,
    maxCycleLength: maxLength,
  }
}
