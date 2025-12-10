/**
 * E2E tests for visualization filtering functionality.
 *
 * These tests verify that the interactive HTML visualization's filtering
 * controls are properly generated and integrated.
 */

import type {VisualizationData} from '../../../src/visualizer/types.js'

import {isOk} from '@bfra.me/es/result'
import {describe, expect, it} from 'vitest'

import {renderVisualizationHtml} from '../../../src/visualizer/html-renderer.js'

/**
 * Creates minimal test visualization data.
 */
function createTestData(overrides?: Partial<VisualizationData>): VisualizationData {
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
    layers: [
      {name: 'domain', allowedDependencies: []},
      {name: 'application', allowedDependencies: ['domain']},
    ],
    metadata: {
      workspacePath: '/test',
      generatedAt: new Date().toISOString(),
      analyzerVersion: '1.0.0',
    },
    ...overrides,
  }
}

describe('visualization filtering (E2E)', () => {
  it('should generate valid HTML with filter controls', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify filter controls are present
    expect(html).toContain('layer-checkbox')
    expect(html).toContain('severity-checkbox')
    expect(html).toContain('view-mode-btn')
    expect(html).toContain('search-input')
  })

  it('should include layer filter checkboxes for all defined layers', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify layer checkboxes exist
    expect(html).toContain('data-layer="domain"')
    expect(html).toContain('data-layer="application"')
  })

  it('should include severity filter checkboxes', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify all severity checkboxes exist
    expect(html).toContain('data-severity="critical"')
    expect(html).toContain('data-severity="error"')
    expect(html).toContain('data-severity="warning"')
    expect(html).toContain('data-severity="info"')
  })

  it('should include view mode buttons', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify view mode buttons
    expect(html).toContain('data-mode="all"')
    expect(html).toContain('data-mode="cycles"')
    expect(html).toContain('data-mode="violations"')
  })

  it('should include search input control', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify search input exists
    expect(html).toContain('id="search-input"')
    expect(html).toContain('Filter nodes')
  })

  it('should include zoom controls', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify zoom controls
    expect(html).toContain('id="zoom-in"')
    expect(html).toContain('id="zoom-out"')
    expect(html).toContain('id="zoom-reset"')
    expect(html).toContain('class="zoom-level"')
  })

  it('should include statistics display elements', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify statistics elements
    expect(html).toContain('id="stat-nodes"')
    expect(html).toContain('id="stat-edges"')
    expect(html).toContain('id="stat-cycles"')
    expect(html).toContain('id="stat-critical"')
    expect(html).toContain('id="stat-error"')
    expect(html).toContain('id="stat-warning"')
    expect(html).toContain('id="stat-info"')
  })

  it('should include filter event handlers in control panel script', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify event handlers are registered
    expect(html).toContain('layer-checkbox')
    expect(html).toContain('severity-checkbox')
    expect(html).toContain('addEventListener')
    expect(html).toContain('setLayerFilter')
    expect(html).toContain('setSeverityFilter')
    expect(html).toContain('setViewMode')
    expect(html).toContain('setSearchQuery')
  })

  it('should expose graph API for filter controls', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify graph API is exposed
    expect(html).toContain('window.graphAPI')
    expect(html).toContain('zoomIn')
    expect(html).toContain('zoomOut')
    expect(html).toContain('zoomReset')
    expect(html).toContain('setLayerFilter')
    expect(html).toContain('setSeverityFilter')
    expect(html).toContain('setViewMode')
    expect(html).toContain('setSearchQuery')
  })

  it('should include keyboard shortcut handlers', () => {
    const vizData = createTestData()
    const htmlResult = renderVisualizationHtml(vizData)

    expect(isOk(htmlResult)).toBe(true)
    if (!isOk(htmlResult)) return

    const html = htmlResult.data

    // Verify keyboard event handler
    expect(html).toContain('keydown')
    expect(html).toContain('Escape')
  })
})
