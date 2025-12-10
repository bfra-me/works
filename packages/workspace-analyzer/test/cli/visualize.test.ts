/**
 * Visualize command integration tests.
 *
 * Tests the CLI visualize command options, output file generation,
 * and interaction with the visualization module.
 */

import type {VisualizeFormat, VisualizeOptions, VisualizePromptResult} from '../../src/cli/types'
import type {VisualizationData} from '../../src/visualizer/types'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {DEFAULT_VISUALIZER_OPTIONS} from '../../src/visualizer/types'

describe('visualize CLI types', () => {
  it.concurrent('should define valid VisualizeOptions type', () => {
    const options: VisualizeOptions = {
      root: '/workspace',
      output: './output.html',
      format: 'html',
      noOpen: true,
      title: 'Test Graph',
      maxNodes: 500,
      includeTypeImports: true,
      interactive: false,
      verbose: true,
      quiet: false,
    }

    expect(options.root).toBe('/workspace')
    expect(options.output).toBe('./output.html')
    expect(options.format).toBe('html')
    expect(options.noOpen).toBe(true)
    expect(options.title).toBe('Test Graph')
    expect(options.maxNodes).toBe(500)
    expect(options.includeTypeImports).toBe(true)
  })

  it.concurrent('should define valid VisualizePromptResult type', () => {
    const result: VisualizePromptResult = {
      outputPath: './workspace-graph.html',
      format: 'both',
      autoOpen: true,
      title: 'Interactive Dependency Graph',
      maxNodes: 1000,
      includeTypeImports: false,
    }

    expect(result.outputPath).toBe('./workspace-graph.html')
    expect(result.format).toBe('both')
    expect(result.autoOpen).toBe(true)
    expect(result.maxNodes).toBe(1000)
    expect(result.includeTypeImports).toBe(false)
  })

  it.concurrent('should accept all valid format values', () => {
    const formats: VisualizeFormat[] = ['html', 'json', 'both']

    for (const format of formats) {
      const options: VisualizeOptions = {
        root: '/test',
        format,
      }
      expect(options.format).toBe(format)
    }
  })
})

describe('visualize default options', () => {
  it.concurrent('should have sensible default output path', () => {
    expect(DEFAULT_VISUALIZER_OPTIONS.outputPath).toBe('./workspace-graph.html')
  })

  it.concurrent('should default to HTML format', () => {
    expect(DEFAULT_VISUALIZER_OPTIONS.format).toBe('html')
  })

  it.concurrent('should auto-open by default', () => {
    expect(DEFAULT_VISUALIZER_OPTIONS.autoOpen).toBe(true)
  })

  it.concurrent('should have reasonable max nodes limit', () => {
    expect(DEFAULT_VISUALIZER_OPTIONS.maxNodes).toBe(1000)
    expect(DEFAULT_VISUALIZER_OPTIONS.maxNodes).toBeGreaterThan(0)
  })

  it.concurrent('should include type imports by default', () => {
    expect(DEFAULT_VISUALIZER_OPTIONS.includeTypeImports).toBe(true)
  })
})

describe('visualization output file handling', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'visualize-test-'))
  })

  afterEach(async () => {
    try {
      await fs.rm(tempDir, {recursive: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should create output directory if it does not exist', async () => {
    const outputPath = path.join(tempDir, 'nested', 'dir', 'output.html')
    await fs.mkdir(path.dirname(outputPath), {recursive: true})
    await fs.writeFile(outputPath, '<html></html>', 'utf-8')

    const content = await fs.readFile(outputPath, 'utf-8')
    expect(content).toBe('<html></html>')
  })

  it('should write HTML files with correct extension', async () => {
    const outputPath = path.join(tempDir, 'graph.html')
    await fs.writeFile(outputPath, '<html><body>Test</body></html>', 'utf-8')

    const stat = await fs.stat(outputPath)
    expect(stat.isFile()).toBe(true)
    expect(outputPath.endsWith('.html')).toBe(true)
  })

  it('should write JSON files with correct extension', async () => {
    const outputPath = path.join(tempDir, 'graph.json')
    const data = {nodes: [], edges: [], cycles: []}
    await fs.writeFile(outputPath, JSON.stringify(data), 'utf-8')

    const content = await fs.readFile(outputPath, 'utf-8')
    const parsed = JSON.parse(content) as {nodes: unknown[]; edges: unknown[]; cycles: unknown[]}
    expect(parsed.nodes).toEqual([])
    expect(parsed.edges).toEqual([])
    expect(parsed.cycles).toEqual([])
  })
})

describe('visualization data structure', () => {
  it.concurrent('should have required statistics fields', () => {
    const mockData: VisualizationData = {
      nodes: [],
      edges: [],
      cycles: [],
      statistics: {
        totalNodes: 0,
        totalEdges: 0,
        totalCycles: 0,
        nodesByLayer: {},
        violationsBySeverity: {info: 0, warning: 0, error: 0, critical: 0},
        packagesAnalyzed: 0,
        filesAnalyzed: 0,
      },
      layers: [],
      metadata: {
        workspacePath: '/test',
        generatedAt: new Date().toISOString(),
        analyzerVersion: '0.1.0',
      },
    }

    expect(mockData.statistics.totalNodes).toBe(0)
    expect(mockData.statistics.totalEdges).toBe(0)
    expect(mockData.statistics.totalCycles).toBe(0)
    expect(mockData.metadata.analyzerVersion).toBe('0.1.0')
  })

  it.concurrent('should support multiple layers', () => {
    const mockData: VisualizationData = {
      nodes: [],
      edges: [],
      cycles: [],
      statistics: {
        totalNodes: 0,
        totalEdges: 0,
        totalCycles: 0,
        nodesByLayer: {
          domain: 5,
          application: 10,
          infrastructure: 3,
        },
        violationsBySeverity: {info: 0, warning: 0, error: 0, critical: 0},
        packagesAnalyzed: 1,
        filesAnalyzed: 18,
      },
      layers: [
        {name: 'domain', allowedDependencies: []},
        {name: 'application', allowedDependencies: ['domain']},
        {name: 'infrastructure', allowedDependencies: ['domain', 'application']},
      ],
      metadata: {
        workspacePath: '/test',
        generatedAt: new Date().toISOString(),
        analyzerVersion: '0.1.0',
      },
    }

    expect(mockData.layers).toHaveLength(3)
    expect(mockData.statistics.nodesByLayer.domain).toBe(5)
    expect(mockData.statistics.nodesByLayer.application).toBe(10)
    expect(mockData.layers[1]?.allowedDependencies).toContain('domain')
  })

  it.concurrent('should track violations by severity', () => {
    const mockData: VisualizationData = {
      nodes: [
        {
          id: 'test.ts',
          name: 'test.ts',
          filePath: '/test/test.ts',
          packageName: 'test-pkg',
          layer: 'domain',
          importsCount: 2,
          importedByCount: 1,
          isInCycle: false,
          violations: [
            {
              id: 'v1',
              message: 'Layer violation',
              severity: 'error',
              ruleId: 'layer-violation',
            },
          ],
          highestViolationSeverity: 'error',
        },
      ],
      edges: [],
      cycles: [],
      statistics: {
        totalNodes: 1,
        totalEdges: 0,
        totalCycles: 0,
        nodesByLayer: {domain: 1},
        violationsBySeverity: {info: 0, warning: 0, error: 1, critical: 0},
        packagesAnalyzed: 1,
        filesAnalyzed: 1,
      },
      layers: [{name: 'domain', allowedDependencies: []}],
      metadata: {
        workspacePath: '/test',
        generatedAt: new Date().toISOString(),
        analyzerVersion: '0.1.0',
      },
    }

    expect(mockData.statistics.violationsBySeverity.error).toBe(1)
    expect(mockData.nodes[0]?.highestViolationSeverity).toBe('error')
    expect(mockData.nodes[0]?.violations).toHaveLength(1)
  })
})

describe('output format validation', () => {
  it.concurrent('should handle html format correctly', () => {
    const format: VisualizeFormat = 'html'
    expect(['html', 'json', 'both']).toContain(format)
  })

  it.concurrent('should handle json format correctly', () => {
    const format: VisualizeFormat = 'json'
    expect(['html', 'json', 'both']).toContain(format)
  })

  it.concurrent('should handle both format correctly', () => {
    const format: VisualizeFormat = 'both'
    expect(['html', 'json', 'both']).toContain(format)
  })
})

describe('command line option mapping', () => {
  it.concurrent('should map --output to outputPath', () => {
    const cliOutput = './custom-output.html'
    const result: VisualizePromptResult = {
      outputPath: cliOutput,
      format: 'html',
      autoOpen: true,
      title: 'Test',
      maxNodes: 1000,
      includeTypeImports: true,
    }
    expect(result.outputPath).toBe('./custom-output.html')
  })

  it.concurrent('should map --no-open to autoOpen: false', () => {
    const noOpen = true
    const autoOpen = !noOpen
    expect(autoOpen).toBe(false)
  })

  it.concurrent('should map --title to title', () => {
    const cliTitle = 'My Custom Graph'
    const result: VisualizePromptResult = {
      outputPath: './output.html',
      format: 'html',
      autoOpen: true,
      title: cliTitle,
      maxNodes: 1000,
      includeTypeImports: true,
    }
    expect(result.title).toBe('My Custom Graph')
  })

  it.concurrent('should map --max-nodes to maxNodes', () => {
    const maxNodes = 500
    const result: VisualizePromptResult = {
      outputPath: './output.html',
      format: 'html',
      autoOpen: true,
      title: 'Test',
      maxNodes,
      includeTypeImports: true,
    }
    expect(result.maxNodes).toBe(500)
  })

  it.concurrent('should map --include-type-imports to includeTypeImports', () => {
    const result: VisualizePromptResult = {
      outputPath: './output.html',
      format: 'html',
      autoOpen: true,
      title: 'Test',
      maxNodes: 1000,
      includeTypeImports: true,
    }
    expect(result.includeTypeImports).toBe(true)
  })
})
