/**
 * Tests for Mermaid diagram export functionality.
 */

import type {
  VisualizationCycle,
  VisualizationData,
  VisualizationEdge,
  VisualizationNode,
} from '../../src/visualizer/types'

import {describe, expect, it} from 'vitest'

import {exportCycleMermaid, exportVisualizationMermaid} from '../../src/visualizer/mermaid-exporter'

/**
 * Creates a minimal visualization node for testing.
 */
function createNode(overrides: Partial<VisualizationNode> = {}): VisualizationNode {
  return {
    id: 'src/test/file.ts',
    name: 'file.ts',
    filePath: 'src/test/file.ts',
    packageName: '@test/package',
    layer: undefined,
    importsCount: 0,
    importedByCount: 0,
    isInCycle: false,
    violations: [],
    highestViolationSeverity: undefined,
    ...overrides,
  }
}

/**
 * Creates a minimal visualization edge for testing.
 */
function createEdge(overrides: Partial<VisualizationEdge> = {}): VisualizationEdge {
  return {
    source: 'src/test/a.ts',
    target: 'src/test/b.ts',
    type: 'static',
    isInCycle: false,
    cycleId: undefined,
    ...overrides,
  }
}

/**
 * Creates minimal visualization data for testing.
 */
function createVisualizationData(overrides: Partial<VisualizationData> = {}): VisualizationData {
  return {
    nodes: [createNode()],
    edges: [createEdge()],
    cycles: [],
    statistics: {
      totalNodes: 1,
      totalEdges: 1,
      totalCycles: 0,
      nodesByLayer: {},
      violationsBySeverity: {critical: 0, error: 0, warning: 0, info: 0},
      packagesAnalyzed: 1,
      filesAnalyzed: 1,
    },
    layers: [],
    metadata: {
      workspacePath: '/test/workspace',
      generatedAt: '2025-12-10T00:00:00Z',
      analyzerVersion: '0.1.0',
    },
    ...overrides,
  }
}

describe('visualizer/mermaid-exporter', () => {
  describe('exportVisualizationMermaid', () => {
    it.concurrent('should generate valid Mermaid diagram', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts'}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts'}),
        ],
        edges: [createEdge({source: 'src/a.ts', target: 'src/b.ts'})],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('graph LR')
      expect(mermaid).toContain('src_a_ts')
      expect(mermaid).toContain('src_b_ts')
      expect(mermaid).toContain('-->')
    })

    it.concurrent('should sanitize node IDs', () => {
      const data = createVisualizationData({
        nodes: [createNode({id: 'src/test-file.ts', filePath: 'src/test-file.ts'})],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('src_test_file_ts')
    })

    it.concurrent('should include violations in node labels', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({
            id: 'src/test.ts',
            filePath: 'src/test.ts',
            violations: [
              {id: 'v1', message: 'Error', severity: 'error', ruleId: 'test-rule'},
              {id: 'v2', message: 'Warning', severity: 'warning', ruleId: 'test-rule'},
            ],
          }),
        ],
      })

      const mermaid = exportVisualizationMermaid(data, {includeViolations: true})

      expect(mermaid).toContain('1 error')
      expect(mermaid).toContain('1 warning')
    })

    it.concurrent('should support cycles-only mode', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts', isInCycle: true}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts', isInCycle: true}),
          createNode({id: 'src/c.ts', filePath: 'src/c.ts', isInCycle: false}),
        ],
        edges: [
          createEdge({source: 'src/a.ts', target: 'src/b.ts', isInCycle: true}),
          createEdge({source: 'src/b.ts', target: 'src/a.ts', isInCycle: true}),
          createEdge({source: 'src/c.ts', target: 'src/a.ts', isInCycle: false}),
        ],
        cycles: [
          {
            id: 'cycle-1',
            nodes: ['src/a.ts', 'src/b.ts'],
            edges: [
              {from: 'src/a.ts', to: 'src/b.ts'},
              {from: 'src/b.ts', to: 'src/a.ts'},
            ],
            length: 2,
            description: 'Test cycle',
          },
        ],
      })

      const mermaid = exportVisualizationMermaid(data, {cyclesOnly: true})

      expect(mermaid).toContain('src_a_ts')
      expect(mermaid).toContain('src_b_ts')
      expect(mermaid).not.toContain('src_c_ts')
    })

    it.concurrent('should respect maxNodes option', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts'}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts'}),
          createNode({id: 'src/c.ts', filePath: 'src/c.ts'}),
        ],
      })

      const mermaid = exportVisualizationMermaid(data, {maxNodes: 2})

      const nodeCount = (mermaid.match(/\["[^"]+"\]/g) ?? []).length
      expect(nodeCount).toBeLessThanOrEqual(2)
    })

    it.concurrent('should support different graph directions', () => {
      const data = createVisualizationData()

      const mermaidLR = exportVisualizationMermaid(data, {direction: 'LR'})
      const mermaidTD = exportVisualizationMermaid(data, {direction: 'TD'})

      expect(mermaidLR).toContain('graph LR')
      expect(mermaidTD).toContain('graph TD')
    })

    it.concurrent('should style edges based on type', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts'}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts'}),
          createNode({id: 'src/c.ts', filePath: 'src/c.ts'}),
        ],
        edges: [
          createEdge({source: 'src/a.ts', target: 'src/b.ts', type: 'static'}),
          createEdge({source: 'src/b.ts', target: 'src/c.ts', type: 'type-only'}),
          createEdge({source: 'src/a.ts', target: 'src/c.ts', type: 'dynamic'}),
        ],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('-->') // Static
      expect(mermaid).toContain('-.->') // Type-only
      expect(mermaid).toContain('-..->')
    })

    it.concurrent('should highlight cycle edges', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts', isInCycle: true}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts', isInCycle: true}),
        ],
        edges: [
          createEdge({source: 'src/a.ts', target: 'src/b.ts', isInCycle: true, cycleId: 'c1'}),
          createEdge({source: 'src/b.ts', target: 'src/a.ts', isInCycle: true, cycleId: 'c1'}),
        ],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('==>')
    })

    it.concurrent('should include style definitions', () => {
      const data = createVisualizationData()

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('classDef class-critical')
      expect(mermaid).toContain('classDef class-error')
      expect(mermaid).toContain('classDef class-warning')
      expect(mermaid).toContain('classDef class-info')
      expect(mermaid).toContain('classDef class-normal')
    })

    it.concurrent('should apply severity-based styling to nodes', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({
            id: 'src/test.ts',
            filePath: 'src/test.ts',
            violations: [{id: 'v1', message: 'Critical', severity: 'critical', ruleId: 'test'}],
            highestViolationSeverity: 'critical',
          }),
        ],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain('class-critical')
    })
  })

  describe('exportCycleMermaid', () => {
    it.concurrent('should generate Mermaid diagram for single cycle', () => {
      const cycle: VisualizationCycle = {
        id: 'cycle-1',
        nodes: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        edges: [
          {from: 'src/a.ts', to: 'src/b.ts'},
          {from: 'src/b.ts', to: 'src/c.ts'},
          {from: 'src/c.ts', to: 'src/a.ts'},
        ],
        length: 3,
        description: 'Test cycle',
      }

      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts'}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts'}),
          createNode({id: 'src/c.ts', filePath: 'src/c.ts'}),
        ],
        cycles: [cycle],
      })

      const mermaid = exportCycleMermaid(cycle, data)

      expect(mermaid).toContain('graph LR')
      expect(mermaid).toContain('src_a_ts')
      expect(mermaid).toContain('src_b_ts')
      expect(mermaid).toContain('src_c_ts')
      expect(mermaid).toContain('==>')
    })

    it.concurrent('should include only cycle nodes', () => {
      const cycle: VisualizationCycle = {
        id: 'cycle-1',
        nodes: ['src/a.ts', 'src/b.ts'],
        edges: [
          {from: 'src/a.ts', to: 'src/b.ts'},
          {from: 'src/b.ts', to: 'src/a.ts'},
        ],
        length: 2,
        description: 'Test cycle',
      }

      const data = createVisualizationData({
        nodes: [
          createNode({id: 'src/a.ts', filePath: 'src/a.ts'}),
          createNode({id: 'src/b.ts', filePath: 'src/b.ts'}),
          createNode({id: 'src/c.ts', filePath: 'src/c.ts'}),
        ],
      })

      const mermaid = exportCycleMermaid(cycle, data)

      expect(mermaid).toContain('src_a_ts')
      expect(mermaid).toContain('src_b_ts')
      expect(mermaid).not.toContain('src_c_ts')
    })

    it.concurrent('should handle missing nodes gracefully', () => {
      const cycle: VisualizationCycle = {
        id: 'cycle-1',
        nodes: ['src/a.ts', 'src/missing.ts'],
        edges: [{from: 'src/a.ts', to: 'src/missing.ts'}],
        length: 2,
        description: 'Test cycle',
      }

      const data = createVisualizationData({
        nodes: [createNode({id: 'src/a.ts', filePath: 'src/a.ts'})],
      })

      expect(() => exportCycleMermaid(cycle, data)).not.toThrow()
      const mermaid = exportCycleMermaid(cycle, data)
      expect(mermaid).toContain('src_a_ts')
    })
  })

  describe('label sanitization', () => {
    it.concurrent('should escape special characters in labels', () => {
      const data = createVisualizationData({
        nodes: [createNode({id: 'src/test.ts', filePath: 'src/test"file.ts'})],
      })

      const mermaid = exportVisualizationMermaid(data)

      expect(mermaid).toContain(String.raw`test\"file`)
    })

    it.concurrent('should replace newlines in labels', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({
            id: 'src/test.ts',
            filePath: 'src/test.ts',
            violations: [{id: 'v1', message: 'Line 1\nLine 2', severity: 'error', ruleId: 'test'}],
          }),
        ],
      })

      const mermaid = exportVisualizationMermaid(data, {includeViolations: true})

      expect(mermaid).not.toContain('\n"')
    })
  })
})
