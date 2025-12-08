/**
 * Dependency graph tests for verifying graph building, cycle detection, and traversal.
 */

import type {ImportExtractionResult} from '../../src/parser/import-extractor'

import {describe, expect, it} from 'vitest'

import {
  buildDependencyGraph,
  computeGraphStatistics,
  findCycles,
  getTransitiveDependencies,
  getTransitiveDependents,
} from '../../src/graph/dependency-graph'

describe('dependency-graph', () => {
  describe('buildDependencyGraph', () => {
    it.concurrent('should build a graph from import extraction results', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b', './c']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})

      expect(graph.moduleCount).toBe(3)
      expect(graph.edgeCount).toBe(3)
      expect(graph.rootPath).toBe('/workspace')
    })

    it.concurrent('should track import relationships correctly', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/index.ts', ['./utils', './types']),
        createImportResult('/workspace/src/utils.ts', []),
        createImportResult('/workspace/src/types.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})

      const indexNode = graph.nodes.get('src/index.ts')
      expect(indexNode?.imports).toContain('src/utils.ts')
      expect(indexNode?.imports).toContain('src/types.ts')
    })

    it.concurrent('should track importedBy relationships', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./shared']),
        createImportResult('/workspace/src/b.ts', ['./shared']),
        createImportResult('/workspace/src/shared.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})

      const sharedNode = graph.nodes.get('src/shared.ts')
      expect(sharedNode?.importedBy).toContain('src/a.ts')
      expect(sharedNode?.importedBy).toContain('src/b.ts')
    })

    it.concurrent('should handle external dependencies', () => {
      const results: ImportExtractionResult[] = [
        {
          imports: [
            createImport('lodash', 'static', false, false),
            createImport('@types/node', 'static', false, false),
          ],
          filePath: '/workspace/src/index.ts',
          externalDependencies: ['lodash', '@types/node'],
          workspaceDependencies: [],
          relativeImports: [],
        },
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})

      expect(graph.moduleCount).toBe(1)
      expect(graph.edgeCount).toBe(2)
    })

    it.concurrent('should respect includeTypeImports option', () => {
      const results: ImportExtractionResult[] = [
        {
          imports: [
            createImport('./types', 'type-only', true, false),
            createImport('./utils', 'static', true, false),
          ],
          filePath: '/workspace/src/index.ts',
          externalDependencies: [],
          workspaceDependencies: [],
          relativeImports: ['./types', './utils'],
        },
      ]

      const graphWithTypes = buildDependencyGraph(results, {
        rootPath: '/workspace',
        includeTypeImports: true,
      })

      const graphWithoutTypes = buildDependencyGraph(results, {
        rootPath: '/workspace',
        includeTypeImports: false,
      })

      expect(graphWithTypes.edgeCount).toBe(2)
      expect(graphWithoutTypes.edgeCount).toBe(1)
    })
  })

  describe('findCycles', () => {
    it.concurrent('should detect simple two-node cycles', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./a']),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const cycles = findCycles(graph)

      expect(cycles.length).toBeGreaterThan(0)
    })

    it.concurrent('should detect longer cycles', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', ['./a']),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const cycles = findCycles(graph)

      expect(cycles.length).toBeGreaterThan(0)
      const cycle = cycles[0]
      expect(cycle?.nodes.length).toBeGreaterThanOrEqual(3)
    })

    it.concurrent('should return empty array for acyclic graphs', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const cycles = findCycles(graph)

      expect(cycles).toHaveLength(0)
    })

    it.concurrent('should include cycle description', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./a']),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const cycles = findCycles(graph)

      expect(cycles[0]?.description).toContain('→')
    })
  })

  describe('computeGraphStatistics', () => {
    it.concurrent('should compute basic statistics', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b', './c']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const stats = computeGraphStatistics(graph)

      expect(stats.nodeCount).toBe(3)
      expect(stats.edgeCount).toBe(3)
    })

    it.concurrent('should identify most imported modules', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./shared']),
        createImportResult('/workspace/src/b.ts', ['./shared']),
        createImportResult('/workspace/src/c.ts', ['./shared']),
        createImportResult('/workspace/src/shared.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const stats = computeGraphStatistics(graph)

      expect(stats.mostImported[0]?.id).toBe('src/shared.ts')
      expect(stats.mostImported[0]?.count).toBe(3)
    })

    it.concurrent('should identify modules with most imports', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/main.ts', ['./a', './b', './c', './d']),
        createImportResult('/workspace/src/a.ts', []),
        createImportResult('/workspace/src/b.ts', []),
        createImportResult('/workspace/src/c.ts', []),
        createImportResult('/workspace/src/d.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const stats = computeGraphStatistics(graph)

      expect(stats.mostImporting[0]?.id).toBe('src/main.ts')
      expect(stats.mostImporting[0]?.count).toBe(4)
    })

    it.concurrent('should respect topN parameter', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./x']),
        createImportResult('/workspace/src/b.ts', ['./x', './y']),
        createImportResult('/workspace/src/c.ts', ['./x', './y', './z']),
        createImportResult('/workspace/src/x.ts', []),
        createImportResult('/workspace/src/y.ts', []),
        createImportResult('/workspace/src/z.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const stats = computeGraphStatistics(graph, 2)

      expect(stats.mostImported.length).toBeLessThanOrEqual(2)
      expect(stats.mostImporting.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getTransitiveDependencies', () => {
    it.concurrent('should find all transitive dependencies', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', ['./d']),
        createImportResult('/workspace/src/d.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const deps = getTransitiveDependencies(graph, 'src/a.ts')

      expect(deps).toContain('src/b.ts')
      expect(deps).toContain('src/c.ts')
      expect(deps).toContain('src/d.ts')
    })

    it.concurrent('should not include the source node', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const deps = getTransitiveDependencies(graph, 'src/a.ts')

      expect(deps).not.toContain('src/a.ts')
    })

    it.concurrent('should handle cycles without infinite loop', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./a']),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const deps = getTransitiveDependencies(graph, 'src/a.ts')

      expect(deps).toContain('src/b.ts')
    })
  })

  describe('getTransitiveDependents', () => {
    it.concurrent('should find all transitive dependents', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', ['./c']),
        createImportResult('/workspace/src/c.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const dependents = getTransitiveDependents(graph, 'src/c.ts')

      expect(dependents).toContain('src/b.ts')
      expect(dependents).toContain('src/a.ts')
    })

    it.concurrent('should not include the target node', () => {
      const results: ImportExtractionResult[] = [
        createImportResult('/workspace/src/a.ts', ['./b']),
        createImportResult('/workspace/src/b.ts', []),
      ]

      const graph = buildDependencyGraph(results, {rootPath: '/workspace'})
      const dependents = getTransitiveDependents(graph, 'src/b.ts')

      expect(dependents).not.toContain('src/b.ts')
    })
  })
})

function createImportResult(filePath: string, relativeImports: string[]): ImportExtractionResult {
  return {
    imports: relativeImports.map(spec => createImport(spec, 'static', true, false)),
    filePath,
    externalDependencies: [],
    workspaceDependencies: [],
    relativeImports,
  }
}

function createImport(
  moduleSpecifier: string,
  type: 'static' | 'dynamic' | 'require' | 'type-only',
  isRelative: boolean,
  isWorkspacePackage: boolean,
) {
  return {
    moduleSpecifier,
    type,
    isSideEffectOnly: false,
    isRelative,
    isWorkspacePackage,
    line: 1,
    column: 1,
  }
}
