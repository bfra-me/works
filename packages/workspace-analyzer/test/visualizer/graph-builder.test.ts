/**
 * Tests for visualization graph builder transformations.
 */

import type {
  DependencyCycle,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
} from '../../src/graph/dependency-graph'
import type {LayerConfiguration} from '../../src/rules/rule-engine'
import type {Issue} from '../../src/types/index'
import type {GraphBuilderContext} from '../../src/visualizer/graph-builder'

import {isOk} from '@bfra.me/es/result'
import {describe, expect, it} from 'vitest'

import {
  buildVisualizationData,
  transformCycleToVisualization,
  transformEdgeToVisualization,
  transformNodeToVisualization,
} from '../../src/visualizer/graph-builder'
import {getHighestSeverity} from '../../src/visualizer/types'

describe('visualizer/graph-builder', () => {
  describe('transformNodeToVisualization', () => {
    it.concurrent('should transform a basic node', () => {
      const node = createDependencyNode('src/index.ts', {
        imports: ['src/utils.ts', 'src/types.ts'],
        importedBy: ['src/main.ts'],
      })
      const context = createContext({node})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.id).toBe('src/index.ts')
      expect(vizNode.name).toBe('src/index.ts')
      expect(vizNode.filePath).toBe('/workspace/src/index.ts')
      expect(vizNode.importsCount).toBe(2)
      expect(vizNode.importedByCount).toBe(1)
      expect(vizNode.isInCycle).toBe(false)
      expect(vizNode.violations).toHaveLength(0)
      expect(vizNode.highestViolationSeverity).toBeUndefined()
    })

    it.concurrent('should mark node as in cycle when part of a cycle', () => {
      const node = createDependencyNode('src/a.ts', {
        imports: ['src/b.ts'],
        importedBy: ['src/b.ts'],
      })
      const cycle = createCycle(['src/a.ts', 'src/b.ts'])
      const context = createContext({node, cycles: [cycle]})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.isInCycle).toBe(true)
    })

    it.concurrent('should attach violations to node', () => {
      const node = createDependencyNode('src/index.ts')
      const issue = createIssue('/workspace/src/index.ts', 'error')
      const context = createContext({node, issues: [issue]})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.violations).toHaveLength(1)
      expect(vizNode.violations[0]?.severity).toBe('error')
      expect(vizNode.highestViolationSeverity).toBe('error')
    })

    it.concurrent('should determine highest severity from multiple violations', () => {
      const node = createDependencyNode('src/index.ts')
      const issues = [
        createIssue('/workspace/src/index.ts', 'info'),
        createIssue('/workspace/src/index.ts', 'critical'),
        createIssue('/workspace/src/index.ts', 'warning'),
      ]
      const context = createContext({node, issues})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.violations).toHaveLength(3)
      expect(vizNode.highestViolationSeverity).toBe('critical')
    })

    it.concurrent('should detect layer from layer configuration', () => {
      const node = createDependencyNode('src/domain/user.ts')
      const layerConfig: LayerConfiguration = {
        layers: [{name: 'domain', allowedDependencies: []}],
        patterns: [{pattern: '**/domain/**', layer: 'domain'}],
      }
      const context = createContext({node, layerConfig})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.layer).toBe('domain')
    })

    it.concurrent('should use package name from context map', () => {
      const node = createDependencyNode('packages/utils/src/index.ts')
      const packageMap = new Map([['/workspace/packages/utils/src/index.ts', '@scope/utils']])
      const context = createContext({node, packageMap})

      const vizNode = transformNodeToVisualization(node, context)

      expect(vizNode.packageName).toBe('@scope/utils')
    })
  })

  describe('transformEdgeToVisualization', () => {
    it.concurrent('should transform a basic edge', () => {
      const edge = createEdge('src/a.ts', 'src/b.ts', 'static')
      const cycleEdgeSet = new Set<string>()
      const edgeToCycleId = new Map<string, string>()

      const vizEdge = transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId)

      expect(vizEdge.source).toBe('src/a.ts')
      expect(vizEdge.target).toBe('src/b.ts')
      expect(vizEdge.type).toBe('static')
      expect(vizEdge.isInCycle).toBe(false)
      expect(vizEdge.cycleId).toBeUndefined()
    })

    it.concurrent('should mark edge as in cycle', () => {
      const edge = createEdge('src/a.ts', 'src/b.ts', 'static')
      const cycleEdgeSet = new Set(['src/a.ts->src/b.ts'])
      const edgeToCycleId = new Map([['src/a.ts->src/b.ts', 'cycle-1']])

      const vizEdge = transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId)

      expect(vizEdge.isInCycle).toBe(true)
      expect(vizEdge.cycleId).toBe('cycle-1')
    })

    it.concurrent('should transform type-only imports', () => {
      const edge = createEdge('src/a.ts', 'src/types.ts', 'type-only', true)
      const cycleEdgeSet = new Set<string>()
      const edgeToCycleId = new Map<string, string>()

      const vizEdge = transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId)

      expect(vizEdge.type).toBe('type-only')
    })

    it.concurrent('should transform dynamic imports', () => {
      const edge = createEdge('src/a.ts', 'src/lazy.ts', 'dynamic')
      const cycleEdgeSet = new Set<string>()
      const edgeToCycleId = new Map<string, string>()

      const vizEdge = transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId)

      expect(vizEdge.type).toBe('dynamic')
    })

    it.concurrent('should transform require imports', () => {
      const edge = createEdge('src/a.ts', 'src/legacy.ts', 'require')
      const cycleEdgeSet = new Set<string>()
      const edgeToCycleId = new Map<string, string>()

      const vizEdge = transformEdgeToVisualization(edge, cycleEdgeSet, edgeToCycleId)

      expect(vizEdge.type).toBe('require')
    })
  })

  describe('transformCycleToVisualization', () => {
    it.concurrent('should transform a simple cycle', () => {
      const cycle = createCycle(['src/a.ts', 'src/b.ts'])

      const vizCycle = transformCycleToVisualization(cycle, 0)

      expect(vizCycle.id).toBe('cycle-1')
      expect(vizCycle.nodes).toEqual(['src/a.ts', 'src/b.ts'])
      expect(vizCycle.length).toBe(2)
      expect(vizCycle.description).toBe('src/a.ts → src/b.ts → src/a.ts')
    })

    it.concurrent('should include edges in cycle', () => {
      const cycle = createCycle(['src/a.ts', 'src/b.ts', 'src/c.ts'])

      const vizCycle = transformCycleToVisualization(cycle, 1)

      expect(vizCycle.id).toBe('cycle-2')
      expect(vizCycle.edges).toHaveLength(3)
      expect(vizCycle.edges).toContainEqual({from: 'src/a.ts', to: 'src/b.ts'})
      expect(vizCycle.edges).toContainEqual({from: 'src/b.ts', to: 'src/c.ts'})
      expect(vizCycle.edges).toContainEqual({from: 'src/c.ts', to: 'src/a.ts'})
    })

    it.concurrent('should generate sequential cycle IDs', () => {
      const cycle = createCycle(['src/a.ts', 'src/b.ts'])

      expect(transformCycleToVisualization(cycle, 0).id).toBe('cycle-1')
      expect(transformCycleToVisualization(cycle, 4).id).toBe('cycle-5')
      expect(transformCycleToVisualization(cycle, 99).id).toBe('cycle-100')
    })
  })

  describe('buildVisualizationData', () => {
    it.concurrent('should build complete visualization data', () => {
      const graph = createGraph([
        createDependencyNode('src/a.ts', {imports: ['src/b.ts']}),
        createDependencyNode('src/b.ts', {imports: [], importedBy: ['src/a.ts']}),
      ])
      const context = createFullContext(graph)

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.nodes).toHaveLength(2)
      expect(result.data.edges).toHaveLength(1)
      expect(result.data.cycles).toHaveLength(0)
      expect(result.data.metadata.workspacePath).toBe('/workspace')
      expect(result.data.metadata.analyzerVersion).toBe('0.1.0')
    })

    it.concurrent('should include cycles in visualization', () => {
      const graph = createGraph([
        createDependencyNode('src/a.ts', {imports: ['src/b.ts'], importedBy: ['src/b.ts']}),
        createDependencyNode('src/b.ts', {imports: ['src/a.ts'], importedBy: ['src/a.ts']}),
      ])
      const cycles = [createCycle(['src/a.ts', 'src/b.ts'])]
      const context = createFullContext(graph, {cycles})

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.cycles).toHaveLength(1)
      expect(result.data.cycles[0]?.id).toBe('cycle-1')

      const cycleEdges = result.data.edges.filter(e => e.isInCycle)
      expect(cycleEdges.length).toBeGreaterThan(0)

      const cycleNodes = result.data.nodes.filter(n => n.isInCycle)
      expect(cycleNodes.length).toBe(2)
    })

    it.concurrent('should compute statistics', () => {
      const graph = createGraph([
        createDependencyNode('src/domain/user.ts', {imports: ['src/shared/utils.ts']}),
        createDependencyNode('src/app/service.ts', {imports: ['src/domain/user.ts']}),
        createDependencyNode('src/shared/utils.ts'),
      ])
      const layerConfig: LayerConfiguration = {
        layers: [
          {name: 'domain', allowedDependencies: ['shared']},
          {name: 'application', allowedDependencies: ['domain', 'shared']},
          {name: 'shared', allowedDependencies: []},
        ],
        patterns: [
          {pattern: '**/domain/**', layer: 'domain'},
          {pattern: '**/app/**', layer: 'application'},
          {pattern: '**/shared/**', layer: 'shared'},
        ],
      }
      const context = createFullContext(graph, {layerConfig})

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.statistics.totalNodes).toBe(3)
      expect(result.data.statistics.totalEdges).toBe(2)
      expect(result.data.statistics.totalCycles).toBe(0)
      expect(result.data.statistics.nodesByLayer).toHaveProperty('domain')
      expect(result.data.statistics.nodesByLayer).toHaveProperty('application')
      expect(result.data.statistics.nodesByLayer).toHaveProperty('shared')
    })

    it.concurrent('should include layer definitions', () => {
      const graph = createGraph([createDependencyNode('src/index.ts')])
      const layerConfig: LayerConfiguration = {
        layers: [
          {name: 'domain', allowedDependencies: ['shared']},
          {name: 'shared', allowedDependencies: []},
        ],
        patterns: [],
      }
      const context = createFullContext(graph, {layerConfig})

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.layers).toHaveLength(2)
      expect(result.data.layers[0]?.name).toBe('domain')
      expect(result.data.layers[0]?.allowedDependencies).toContain('shared')
    })

    it.concurrent('should filter type-only imports when option is false', () => {
      const nodeA = createDependencyNode('src/a.ts', {imports: ['src/types.ts', 'src/utils.ts']})
      const nodeTypes = createDependencyNode('src/types.ts')
      const nodeUtils = createDependencyNode('src/utils.ts', {importedBy: ['src/a.ts']})
      const graph = createGraph(
        [nodeA, nodeTypes, nodeUtils],
        [
          createEdge('src/a.ts', 'src/types.ts', 'type-only', true),
          createEdge('src/a.ts', 'src/utils.ts', 'static'),
        ],
      )
      const context = createFullContext(graph)

      const withTypesResult = buildVisualizationData(context, {includeTypeImports: true})
      const withoutTypesResult = buildVisualizationData(context, {includeTypeImports: false})

      expect(isOk(withTypesResult)).toBe(true)
      expect(isOk(withoutTypesResult)).toBe(true)
      if (!isOk(withTypesResult) || !isOk(withoutTypesResult)) return

      expect(withTypesResult.data.edges).toHaveLength(2)
      expect(withoutTypesResult.data.edges).toHaveLength(1)
      expect(withoutTypesResult.data.edges[0]?.type).toBe('static')
    })

    it.concurrent('should limit nodes when exceeding maxNodes', () => {
      const nodes = Array.from({length: 20}, (_, i) =>
        createDependencyNode(`src/file${i}.ts`, {
          imports: i > 0 ? [`src/file${i - 1}.ts`] : [],
          importedBy: i < 19 ? [`src/file${i + 1}.ts`] : [],
        }),
      )
      const graph = createGraph(nodes)
      const context = createFullContext(graph)

      const result = buildVisualizationData(context, {maxNodes: 5})

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.nodes.length).toBeLessThanOrEqual(5)
    })

    it.concurrent('should prioritize cycle nodes when limiting', () => {
      const nodes = [
        createDependencyNode('src/a.ts', {imports: ['src/b.ts'], importedBy: ['src/b.ts']}),
        createDependencyNode('src/b.ts', {imports: ['src/a.ts'], importedBy: ['src/a.ts']}),
        createDependencyNode('src/c.ts'),
        createDependencyNode('src/d.ts'),
        createDependencyNode('src/e.ts'),
      ]
      const cycle = createCycle(['src/a.ts', 'src/b.ts'])
      const graph = createGraph(nodes)
      const context = createFullContext(graph, {cycles: [cycle]})

      const result = buildVisualizationData(context, {maxNodes: 2})

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      const nodeIds = result.data.nodes.map(n => n.id)
      expect(nodeIds).toContain('src/a.ts')
      expect(nodeIds).toContain('src/b.ts')
    })

    it.concurrent('should set metadata timestamp', () => {
      const graph = createGraph([createDependencyNode('src/index.ts')])
      const context = createFullContext(graph)

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it.concurrent('should compute violations by severity', () => {
      const nodeA = createDependencyNode('src/index.ts', {imports: ['src/utils.ts']})
      const nodeB = createDependencyNode('src/utils.ts', {importedBy: ['src/index.ts']})
      const issues = [
        createIssue('/workspace/src/index.ts', 'error'),
        createIssue('/workspace/src/index.ts', 'warning'),
        createIssue('/workspace/src/index.ts', 'error'),
      ]
      const graph = createGraph([nodeA, nodeB])
      const context = createFullContext(graph, {issues})

      const result = buildVisualizationData(context)

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      expect(result.data.statistics.violationsBySeverity.error).toBe(2)
      expect(result.data.statistics.violationsBySeverity.warning).toBe(1)
      expect(result.data.statistics.violationsBySeverity.info).toBe(0)
    })
  })

  describe('getHighestSeverity', () => {
    it.concurrent('should return critical as highest', () => {
      expect(getHighestSeverity(['warning', 'critical', 'info'])).toBe('critical')
    })

    it.concurrent('should return error over warning', () => {
      expect(getHighestSeverity(['warning', 'error', 'info'])).toBe('error')
    })

    it.concurrent('should return undefined for empty array', () => {
      expect(getHighestSeverity([])).toBeUndefined()
    })

    it.concurrent('should return single severity', () => {
      expect(getHighestSeverity(['warning'])).toBe('warning')
    })

    it.concurrent('should handle all same severities', () => {
      expect(getHighestSeverity(['info', 'info', 'info'])).toBe('info')
    })
  })
})

function createDependencyNode(
  id: string,
  options: {
    imports?: string[]
    importedBy?: string[]
    packageName?: string
  } = {},
): DependencyNode {
  return {
    id,
    name: id,
    filePath: `/workspace/${id}`,
    packageName: options.packageName,
    imports: options.imports ?? [],
    importedBy: options.importedBy ?? [],
    importDetails: [],
  }
}

function createEdge(
  from: string,
  to: string,
  type: DependencyEdge['type'] = 'static',
  isTypeOnly = false,
): DependencyEdge {
  return {from, to, type, isTypeOnly}
}

function createCycle(nodes: string[]): DependencyCycle {
  const edges: DependencyEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    const from = nodes[i] ?? ''
    const to = nodes[(i + 1) % nodes.length] ?? ''
    edges.push({from, to, type: 'static', isTypeOnly: false})
  }
  return {
    nodes,
    edges,
    description: `${nodes.join(' → ')} → ${nodes[0]}`,
  }
}

function createIssue(filePath: string, severity: Issue['severity']): Issue {
  return {
    id: 'test-issue',
    title: 'Test Issue',
    description: 'Test description',
    severity,
    category: 'architecture',
    location: {filePath},
  }
}

function createGraph(nodes: DependencyNode[], edges?: DependencyEdge[]): DependencyGraph {
  const nodeMap = new Map<string, DependencyNode>()
  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  const graphEdges =
    edges ?? nodes.flatMap(node => node.imports.map(target => createEdge(node.id, target)))

  return {
    nodes: nodeMap,
    edges: graphEdges,
    rootPath: '/workspace',
    moduleCount: nodes.length,
    edgeCount: graphEdges.length,
  }
}

function createContext(options: {
  node?: DependencyNode
  cycles?: DependencyCycle[]
  issues?: Issue[]
  layerConfig?: LayerConfiguration
  packageMap?: Map<string, string>
}): GraphBuilderContext {
  const node = options.node ?? createDependencyNode('src/index.ts')
  return {
    graph: createGraph([node]),
    cycles: options.cycles ?? [],
    issues: options.issues ?? [],
    layerConfig: options.layerConfig,
    packageMap: options.packageMap ?? new Map(),
    analyzerVersion: '0.1.0',
  }
}

function createFullContext(
  graph: DependencyGraph,
  options: {
    cycles?: DependencyCycle[]
    issues?: Issue[]
    layerConfig?: LayerConfiguration
    packageMap?: Map<string, string>
  } = {},
): GraphBuilderContext {
  return {
    graph,
    cycles: options.cycles ?? [],
    issues: options.issues ?? [],
    layerConfig: options.layerConfig,
    packageMap: options.packageMap ?? new Map(),
    analyzerVersion: '0.1.0',
  }
}
