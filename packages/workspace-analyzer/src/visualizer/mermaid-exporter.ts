/**
 * Mermaid diagram exporter for dependency graph visualization.
 *
 * Generates Mermaid-compatible graph markup from VisualizationData,
 * providing an alternative visualization format for external tools
 * and documentation.
 */

import type {VisualizationCycle, VisualizationData, VisualizationEdge} from './types'

/**
 * Options for Mermaid diagram generation.
 */
export interface MermaidExportOptions {
  /** Include only cycles in the diagram (default: false) */
  readonly cyclesOnly?: boolean
  /** Maximum number of nodes to include (default: unlimited) */
  readonly maxNodes?: number
  /** Include violations in node labels (default: true) */
  readonly includeViolations?: boolean
  /** Graph direction: LR (left-right) or TD (top-down) (default: 'LR') */
  readonly direction?: 'LR' | 'TD'
}

const DEFAULT_MERMAID_OPTIONS: Required<MermaidExportOptions> = {
  cyclesOnly: false,
  maxNodes: Number.POSITIVE_INFINITY,
  includeViolations: true,
  direction: 'LR',
}

/**
 * Sanitizes a node ID for use in Mermaid diagrams.
 *
 * Mermaid has specific requirements for node IDs:
 * - No special characters
 * - No spaces
 * - Must be unique
 */
function sanitizeMermaidId(id: string): string {
  return id.replaceAll(/\W/g, '_')
}

/**
 * Sanitizes text for safe embedding in Mermaid labels.
 */
function sanitizeMermaidLabel(label: string): string {
  return label.replaceAll('"', String.raw`\"`).replaceAll('\n', ' ')
}

/**
 * Gets a short display name for a file path.
 */
function getShortName(filePath: string): string {
  const parts = filePath.split('/')
  return parts.at(-1) ?? filePath
}

/**
 * Generates a Mermaid node definition with styling based on violations.
 */
function generateNodeDefinition(
  nodeId: string,
  label: string,
  violations: readonly {severity: string}[],
  includeViolations: boolean,
): string {
  const sanitizedId = sanitizeMermaidId(nodeId)
  const sanitizedLabel = sanitizeMermaidLabel(label)

  let nodeLabel = sanitizedLabel
  if (includeViolations && violations.length > 0) {
    const violationSummary = violations.reduce<Record<string, number>>((acc, v) => {
      acc[v.severity] = (acc[v.severity] ?? 0) + 1
      return acc
    }, {})

    const violationText = Object.entries(violationSummary)
      .map(([severity, count]) => `${count} ${severity}`)
      .join(', ')

    nodeLabel = `${sanitizedLabel}<br/>(${violationText})`
  }

  const highestSeverity =
    violations.length > 0
      ? violations.reduce<string | undefined>((highest, v) => {
          if (highest === undefined) return v.severity
          const severityOrder = {critical: 0, error: 1, warning: 2, info: 3}
          const currentOrder = severityOrder[v.severity as keyof typeof severityOrder] ?? 999
          const highestOrder = severityOrder[highest as keyof typeof severityOrder] ?? 999
          return currentOrder < highestOrder ? v.severity : highest
        }, undefined)
      : undefined

  const styleClass =
    highestSeverity !== undefined && highestSeverity.length > 0
      ? `class-${highestSeverity}`
      : 'class-normal'

  return `  ${sanitizedId}["${nodeLabel}"]:::${styleClass}`
}

/**
 * Generates a Mermaid edge definition with styling based on type and cycles.
 */
function generateEdgeDefinition(edge: VisualizationEdge): string {
  const fromId = sanitizeMermaidId(edge.source)
  const toId = sanitizeMermaidId(edge.target)

  const edgeStyle = edge.isInCycle
    ? '==>'
    : edge.type === 'type-only'
      ? '-.->'
      : edge.type === 'dynamic'
        ? '-..->'
        : '-->'

  const linkClass = edge.isInCycle ? 'linkStyle cycle' : ''

  return `  ${fromId} ${edgeStyle} ${toId}${linkClass ? ` :::${linkClass}` : ''}`
}

/**
 * Generates style definitions for the Mermaid diagram.
 */
function generateStyleDefinitions(): string {
  return `
  classDef class-critical fill:#ff4444,stroke:#cc0000,stroke-width:3px,color:#fff
  classDef class-error fill:#ff8844,stroke:#cc4400,stroke-width:2px,color:#fff
  classDef class-warning fill:#ffcc44,stroke:#ccaa00,stroke-width:2px,color:#000
  classDef class-info fill:#4488ff,stroke:#0044cc,stroke-width:1px,color:#fff
  classDef class-normal fill:#88ccff,stroke:#0088cc,stroke-width:1px,color:#000
  linkStyle cycle stroke:#ff0000,stroke-width:3px,stroke-dasharray:5 5
`
}

/**
 * Exports visualization data as a Mermaid diagram.
 *
 * @param data - The visualization data to export
 * @param options - Mermaid export options
 * @returns Mermaid diagram markup
 *
 * @example
 * ```ts
 * const data = buildVisualizationData(graph, cycles, violations)
 * const mermaid = exportVisualizationMermaid(data, {cyclesOnly: true})
 * await fs.writeFile('graph.mmd', mermaid)
 * ```
 */
export function exportVisualizationMermaid(
  data: VisualizationData,
  options: MermaidExportOptions = {},
): string {
  const opts = {...DEFAULT_MERMAID_OPTIONS, ...options}

  const lines: string[] = [`graph ${opts.direction}`]

  const cycleNodeIds = new Set<string>()
  if (opts.cyclesOnly) {
    for (const cycle of data.cycles) {
      for (const nodeId of cycle.nodes) {
        cycleNodeIds.add(nodeId)
      }
    }
  }

  const filteredNodes = opts.cyclesOnly
    ? data.nodes.filter(n => cycleNodeIds.has(n.id))
    : data.nodes

  const nodesToInclude = filteredNodes.slice(0, opts.maxNodes)

  const nodeIds = new Set(nodesToInclude.map(n => n.id))

  for (const node of nodesToInclude) {
    const label = getShortName(node.filePath)
    const nodeDef = generateNodeDefinition(node.id, label, node.violations, opts.includeViolations)
    lines.push(nodeDef)
  }

  const filteredEdges = data.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target) && (!opts.cyclesOnly || e.isInCycle),
  )

  for (const edge of filteredEdges) {
    lines.push(generateEdgeDefinition(edge))
  }

  lines.push(generateStyleDefinitions())

  return lines.join('\n')
}

/**
 * Exports a single cycle as a Mermaid diagram.
 *
 * Provides a focused view of a specific circular dependency chain.
 *
 * @param cycle - The cycle to export
 * @param data - Full visualization data (for node details)
 * @returns Mermaid diagram markup
 *
 * @example
 * ```ts
 * const cycle = data.cycles[0]
 * const mermaid = exportCycleMermaid(cycle, data)
 * ```
 */
export function exportCycleMermaid(cycle: VisualizationCycle, data: VisualizationData): string {
  const lines: string[] = ['graph LR']

  const nodeMap = new Map(data.nodes.map(n => [n.id, n]))

  for (const nodeId of cycle.nodes) {
    const node = nodeMap.get(nodeId)
    if (node === undefined) continue

    const label = getShortName(node.filePath)
    const nodeDef = generateNodeDefinition(nodeId, label, node.violations, true)
    lines.push(nodeDef)
  }

  for (const edge of cycle.edges) {
    const fromId = sanitizeMermaidId(edge.from)
    const toId = sanitizeMermaidId(edge.to)
    lines.push(`  ${fromId} ==> ${toId}`)
  }

  lines.push(generateStyleDefinitions())

  return lines.join('\n')
}
