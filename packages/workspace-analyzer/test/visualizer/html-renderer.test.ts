/**
 * Tests for HTML renderer and visualization template generation.
 */

import type {VisualizationData, VisualizationNode} from '../../src/visualizer/types'

import {isOk} from '@bfra.me/es/result'
import {describe, expect, it} from 'vitest'

import {
  estimateHtmlSize,
  exportVisualizationJson,
  isWithinSizeLimit,
  renderMinimalHtml,
  renderVisualizationHtml,
  sanitizeFilePath,
  sanitizeHtml,
  sanitizeJsString,
  sanitizeVisualizationData,
} from '../../src/visualizer/html-renderer'
import {
  calculateChargeStrength,
  calculateLinkDistance,
  calculateNodeRadius,
  generateControlPanelScript,
  generateGraphInitScript,
} from '../../src/visualizer/templates/graph-template'
import {
  generateStyles,
  getEdgeTypeClass,
  getLayerClass,
  getSeverityClass,
} from '../../src/visualizer/templates/styles'

describe('visualizer/html-renderer', () => {
  describe('sanitizeHtml', () => {
    it.concurrent('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
      )
    })

    it.concurrent('should escape ampersands', () => {
      expect(sanitizeHtml('foo & bar')).toBe('foo &amp; bar')
    })

    it.concurrent('should escape quotes', () => {
      expect(sanitizeHtml('test\'value"end')).toBe('test&#039;value&quot;end')
    })

    it.concurrent('should escape backticks and equals', () => {
      expect(sanitizeHtml('`test=value`')).toBe('&#x60;test&#x3D;value&#x60;')
    })

    it.concurrent('should return empty string for non-string input', () => {
      expect(sanitizeHtml(null as unknown as string)).toBe('')
      expect(sanitizeHtml(undefined as unknown as string)).toBe('')
      expect(sanitizeHtml(123 as unknown as string)).toBe('')
    })

    it.concurrent('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('')
    })
  })

  describe('sanitizeJsString', () => {
    it.concurrent('should escape backslashes', () => {
      expect(sanitizeJsString(String.raw`path\to\file`)).toBe(String.raw`path\\to\\file`)
    })

    it.concurrent('should escape quotes', () => {
      expect(sanitizeJsString(`it's a "test"`)).toBe(String.raw`it\'s a \"test\"`)
    })

    it.concurrent('should escape newlines and tabs', () => {
      expect(sanitizeJsString('line1\nline2\ttab')).toBe(String.raw`line1\nline2\ttab`)
    })

    it.concurrent('should escape script closing tags', () => {
      expect(sanitizeJsString('</script>')).toBe(String.raw`<\/script>`)
    })

    it.concurrent('should escape line separators', () => {
      expect(sanitizeJsString('test\u2028value\u2029end')).toBe(
        String.raw`test\u2028value\u2029end`,
      )
    })

    it.concurrent('should return empty string for non-string input', () => {
      expect(sanitizeJsString(null as unknown as string)).toBe('')
    })
  })

  describe('sanitizeFilePath', () => {
    it.concurrent('should remove null bytes', () => {
      expect(sanitizeFilePath('path\0to\0file')).toBe('pathtofile')
    })

    it.concurrent('should remove path traversal attempts', () => {
      expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc/passwd')
      expect(sanitizeFilePath('path/../../secret')).toBe('path/secret')
    })

    it.concurrent('should handle trailing double dots', () => {
      expect(sanitizeFilePath('path/..')).toBe('path/')
    })

    it.concurrent('should return empty string for non-string input', () => {
      expect(sanitizeFilePath(null as unknown as string)).toBe('')
    })

    it.concurrent('should preserve valid paths', () => {
      expect(sanitizeFilePath('/src/index.ts')).toBe('/src/index.ts')
      expect(sanitizeFilePath('packages/es/src/result.ts')).toBe('packages/es/src/result.ts')
    })
  })

  describe('sanitizeVisualizationData', () => {
    it.concurrent('should sanitize node fields', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({
            id: '<script>',
            name: 'test"name',
            filePath: '../etc/passwd',
          }),
        ],
      })

      const sanitized = sanitizeVisualizationData(data)

      expect(sanitized.nodes[0]?.id).toBe('<script>')
      expect(sanitized.nodes[0]?.name).toBe(String.raw`test\"name`)
      expect(sanitized.nodes[0]?.filePath).toBe('etc/passwd')
    })

    it.concurrent('should sanitize edge fields', () => {
      const data = createVisualizationData({
        edges: [
          {
            source: '<xss>',
            target: '</script>',
            type: 'static',
            isInCycle: false,
            cycleId: undefined,
          },
        ],
      })

      const sanitized = sanitizeVisualizationData(data)

      expect(sanitized.edges[0]?.source).toBe('<xss>')
      expect(sanitized.edges[0]?.target).toBe(String.raw`<\/script>`)
    })

    it.concurrent('should sanitize metadata', () => {
      const data = createVisualizationData({
        metadata: {
          workspacePath: '../../../root',
          generatedAt: '2024-01-01',
          analyzerVersion: '1.0.0</script>',
        },
      })

      const sanitized = sanitizeVisualizationData(data)

      expect(sanitized.metadata.workspacePath).toBe('root')
      expect(sanitized.metadata.analyzerVersion).toBe(String.raw`1.0.0<\/script>`)
    })

    it.concurrent('should sanitize violations', () => {
      const data = createVisualizationData({
        nodes: [
          createNode({
            violations: [
              {
                id: 'rule<1>',
                message: 'Error: "value"',
                severity: 'error',
                ruleId: 'test-rule',
              },
            ],
          }),
        ],
      })

      const sanitized = sanitizeVisualizationData(data)

      expect(sanitized.nodes[0]?.violations[0]?.message).toBe(String.raw`Error: \"value\"`)
    })
  })

  describe('renderVisualizationHtml', () => {
    it.concurrent('should generate valid HTML document', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data, {title: 'Test Graph'})

      expect(isOk(result)).toBe(true)
      expect(result.success).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html lang="en">')
      expect(html).toContain('Test Graph')
      expect(html).toContain('</html>')
    })

    it.concurrent('should embed visualization data as JSON', () => {
      const data = createVisualizationData({
        nodes: [createNode({id: 'test-node'})],
      })

      const result = renderVisualizationHtml(data)

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('window.VISUALIZATION_DATA')
      expect(html).toContain('test-node')
    })

    it.concurrent('should include CSS styles', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data)

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('<style>')
      expect(html).toContain('--sidebar-width')
      expect(html).toContain('.graph-node')
    })

    it.concurrent('should include D3.js script', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data, {inlineD3: true})

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('d3.forceSimulation')
    })

    it.concurrent('should include sidebar with statistics', () => {
      const data = createVisualizationData({
        statistics: {
          totalNodes: 42,
          totalEdges: 100,
          totalCycles: 3,
          nodesByLayer: {},
          violationsBySeverity: {critical: 1, error: 2, warning: 3, info: 0},
          packagesAnalyzed: 5,
          filesAnalyzed: 42,
        },
      })

      const result = renderVisualizationHtml(data)

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('42') // totalNodes
      expect(html).toContain('Nodes')
      expect(html).toContain('Edges')
      expect(html).toContain('Cycles')
    })

    it.concurrent('should include zoom controls', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data)

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('zoom-in')
      expect(html).toContain('zoom-out')
      expect(html).toContain('zoom-reset')
    })

    it.concurrent('should include custom CSS when provided', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data, {
        customCss: '.custom-class { color: red; }',
      })

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('.custom-class { color: red; }')
    })

    it.concurrent('should include custom JS when provided', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data, {
        customJs: 'console.log("custom script");',
      })

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).toContain('console.log("custom script");')
    })

    it.concurrent('should escape title in HTML', () => {
      const data = createVisualizationData()

      const result = renderVisualizationHtml(data, {title: '<script>alert("xss")</script>'})

      expect(isOk(result)).toBe(true)
      const html = result.success ? result.data : ''
      expect(html).not.toContain('<script>alert')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  describe('renderMinimalHtml', () => {
    it.concurrent('should generate minimal HTML', () => {
      const data = createVisualizationData({
        statistics: {
          totalNodes: 10,
          totalEdges: 20,
          totalCycles: 1,
          nodesByLayer: {},
          violationsBySeverity: {critical: 0, error: 0, warning: 0, info: 0},
          packagesAnalyzed: 2,
          filesAnalyzed: 10,
        },
      })

      const html = renderMinimalHtml(data, 'Test')

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Test</title>')
      expect(html).toContain('Nodes: 10')
      expect(html).toContain('Edges: 20')
      expect(html).toContain('Cycles: 1')
    })

    it.concurrent('should embed visualization data', () => {
      const data = createVisualizationData()

      const html = renderMinimalHtml(data, 'Test')

      expect(html).toContain('window.VISUALIZATION_DATA')
    })
  })

  describe('exportVisualizationJson', () => {
    it.concurrent('should export as formatted JSON', () => {
      const data = createVisualizationData({
        nodes: [createNode({id: 'node-1'})],
      })

      const json = exportVisualizationJson(data)
      const parsed = JSON.parse(json) as VisualizationData

      expect(parsed.nodes).toHaveLength(1)
      expect(parsed.nodes[0]?.id).toBe('node-1')
    })

    it.concurrent('should sanitize data before export', () => {
      const data = createVisualizationData({
        nodes: [createNode({id: '<script>xss</script>'})],
      })

      const json = exportVisualizationJson(data)

      expect(json).not.toContain('<script>xss</script>')
    })
  })

  describe('estimateHtmlSize', () => {
    it.concurrent('should estimate size based on data', () => {
      const smallData = createVisualizationData()
      const largeData = createVisualizationData({
        nodes: Array.from({length: 100}, (_, i) => createNode({id: `node-${i}`})),
      })

      const smallSize = estimateHtmlSize(smallData)
      const largeSize = estimateHtmlSize(largeData)

      expect(smallSize).toBeGreaterThan(0)
      expect(largeSize).toBeGreaterThan(smallSize)
    })
  })

  describe('isWithinSizeLimit', () => {
    it.concurrent('should return true for small data', () => {
      const data = createVisualizationData()

      expect(isWithinSizeLimit(data)).toBe(true)
    })

    it.concurrent('should respect custom limit', () => {
      const data = createVisualizationData()

      expect(isWithinSizeLimit(data, 1000)).toBe(false) // 1KB is too small
      expect(isWithinSizeLimit(data, 1000000)).toBe(true) // 1MB should be enough
    })
  })
})

describe('visualizer/templates/styles', () => {
  describe('generateStyles', () => {
    it.concurrent('should generate CSS variables', () => {
      const styles = generateStyles()

      expect(styles).toContain(':root')
      expect(styles).toContain('--sidebar-width')
      expect(styles).toContain('--severity-critical')
    })

    it.concurrent('should include layout styles', () => {
      const styles = generateStyles()

      expect(styles).toContain('.app-container')
      expect(styles).toContain('.sidebar')
      expect(styles).toContain('.main-content')
    })

    it.concurrent('should include graph element styles', () => {
      const styles = generateStyles()

      expect(styles).toContain('.graph-node')
      expect(styles).toContain('.graph-edge')
      expect(styles).toContain('.node-circle')
      expect(styles).toContain('.edge-line')
    })

    it.concurrent('should include tooltip styles', () => {
      const styles = generateStyles()

      expect(styles).toContain('.tooltip')
      expect(styles).toContain('.tooltip-header')
    })

    it.concurrent('should include animation keyframes', () => {
      const styles = generateStyles()

      expect(styles).toContain('@keyframes')
      expect(styles).toContain('pulse-edge')
    })
  })

  describe('getSeverityClass', () => {
    it.concurrent('should return severity class', () => {
      expect(getSeverityClass('critical')).toBe('severity-critical')
      expect(getSeverityClass('error')).toBe('severity-error')
      expect(getSeverityClass('warning')).toBe('severity-warning')
      expect(getSeverityClass('info')).toBe('severity-info')
    })

    it.concurrent('should return default for undefined', () => {
      expect(getSeverityClass(undefined)).toBe('default')
    })
  })

  describe('getLayerClass', () => {
    it.concurrent('should return layer class', () => {
      expect(getLayerClass('domain')).toBe('layer-domain')
      expect(getLayerClass('application')).toBe('layer-application')
      expect(getLayerClass('infrastructure')).toBe('layer-infrastructure')
    })

    it.concurrent('should normalize case', () => {
      expect(getLayerClass('DOMAIN')).toBe('layer-domain')
      expect(getLayerClass('Application')).toBe('layer-application')
    })

    it.concurrent('should return unknown for undefined or unknown layer', () => {
      expect(getLayerClass(undefined)).toBe('layer-unknown')
      expect(getLayerClass('nonexistent')).toBe('layer-unknown')
    })
  })

  describe('getEdgeTypeClass', () => {
    it.concurrent('should return edge type class', () => {
      expect(getEdgeTypeClass('static')).toBe('type-static')
      expect(getEdgeTypeClass('dynamic')).toBe('type-dynamic')
      expect(getEdgeTypeClass('type-only')).toBe('type-type-only')
    })
  })
})

describe('visualizer/templates/graph-template', () => {
  describe('generateGraphInitScript', () => {
    it.concurrent('should generate force simulation code', () => {
      const script = generateGraphInitScript()

      expect(script).toContain('d3.forceSimulation')
      expect(script).toContain('forceLink')
      expect(script).toContain('forceManyBody')
      expect(script).toContain('forceCenter')
    })

    it.concurrent('should include zoom behavior', () => {
      const script = generateGraphInitScript()

      expect(script).toContain('d3.zoom')
      expect(script).toContain('scaleExtent')
    })

    it.concurrent('should include drag behavior', () => {
      const script = generateGraphInitScript()

      expect(script).toContain('d3.drag')
      expect(script).toContain('dragstarted')
      expect(script).toContain('dragged')
      expect(script).toContain('dragended')
    })

    it.concurrent('should include tooltip handling', () => {
      const script = generateGraphInitScript()

      expect(script).toContain('showTooltip')
      expect(script).toContain('hideTooltip')
    })

    it.concurrent('should expose graphAPI', () => {
      const script = generateGraphInitScript()

      expect(script).toContain('window.graphAPI')
      expect(script).toContain('zoomIn')
      expect(script).toContain('zoomOut')
      expect(script).toContain('setLayerFilter')
    })
  })

  describe('generateControlPanelScript', () => {
    it.concurrent('should setup control event handlers', () => {
      const script = generateControlPanelScript()

      expect(script).toContain('zoom-in')
      expect(script).toContain('zoom-out')
      expect(script).toContain('addEventListener')
    })

    it.concurrent('should include keyboard shortcuts', () => {
      const script = generateControlPanelScript()

      expect(script).toContain('keydown')
      expect(script).toContain('Escape')
    })
  })

  describe('calculateNodeRadius', () => {
    it.concurrent('should scale by connectivity', () => {
      const baseRadius = 8
      const lowConnectivity = {importsCount: 1, importedByCount: 1, violations: []}
      const highConnectivity = {importsCount: 10, importedByCount: 10, violations: []}

      const smallRadius = calculateNodeRadius(lowConnectivity, baseRadius)
      const largeRadius = calculateNodeRadius(highConnectivity, baseRadius)

      expect(largeRadius).toBeGreaterThan(smallRadius)
    })

    it.concurrent('should boost for violations', () => {
      const baseRadius = 8
      const noViolations = {importsCount: 5, importedByCount: 5, violations: []}
      const withViolations = {importsCount: 5, importedByCount: 5, violations: [{id: 'v1'}]}

      const normalRadius = calculateNodeRadius(noViolations, baseRadius)
      const boostedRadius = calculateNodeRadius(withViolations, baseRadius)

      expect(boostedRadius).toBeGreaterThan(normalRadius)
    })
  })

  describe('calculateLinkDistance', () => {
    it.concurrent('should increase distance for denser graphs', () => {
      const baseDistance = 80
      const sparse = calculateLinkDistance(100, 50, baseDistance)
      const dense = calculateLinkDistance(100, 500, baseDistance)

      expect(dense).toBeGreaterThan(sparse)
    })
  })

  describe('calculateChargeStrength', () => {
    it.concurrent('should reduce strength for large graphs', () => {
      const baseStrength = -300

      const small = calculateChargeStrength(50, baseStrength)
      const large = calculateChargeStrength(300, baseStrength)

      expect(Math.abs(large)).toBeLessThan(Math.abs(small))
    })

    it.concurrent('should use full strength for small graphs', () => {
      const baseStrength = -300

      const result = calculateChargeStrength(50, baseStrength)

      expect(result).toBe(baseStrength)
    })
  })
})

// Test helpers

function createVisualizationData(overrides: Partial<VisualizationData> = {}): VisualizationData {
  return {
    nodes: [],
    edges: [],
    cycles: [],
    statistics: {
      totalNodes: 0,
      totalEdges: 0,
      totalCycles: 0,
      nodesByLayer: {},
      violationsBySeverity: {critical: 0, error: 0, warning: 0, info: 0},
      packagesAnalyzed: 0,
      filesAnalyzed: 0,
    },
    layers: [],
    metadata: {
      workspacePath: '/workspace',
      generatedAt: '2024-01-01T00:00:00.000Z',
      analyzerVersion: '1.0.0',
    },
    ...overrides,
  }
}

function createNode(overrides: Partial<VisualizationNode> = {}): VisualizationNode {
  return {
    id: 'test-node',
    name: 'test-node',
    filePath: '/workspace/src/test.ts',
    packageName: undefined,
    layer: undefined,
    importsCount: 0,
    importedByCount: 0,
    isInCycle: false,
    violations: [],
    highestViolationSeverity: undefined,
    ...overrides,
  }
}
