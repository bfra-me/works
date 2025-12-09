/**
 * ArchitecturalAnalyzer tests for validating architectural patterns.
 */

import type {AnalysisContext} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import {describe, expect, it} from 'vitest'

import {createArchitecturalAnalyzer} from '../../src/analyzers/architectural-analyzer'

function createMockPackage(overrides: Partial<WorkspacePackage> = {}): WorkspacePackage {
  return {
    name: '@test/pkg',
    version: '1.0.0',
    packagePath: '/workspace/packages/pkg',
    packageJsonPath: '/workspace/packages/pkg/package.json',
    srcPath: '/workspace/packages/pkg/src',
    sourceFiles: [],
    hasTsConfig: true,
    hasEslintConfig: false,
    packageJson: {
      name: '@test/pkg',
      version: '1.0.0',
    },
    ...overrides,
  }
}

function createMockContext(packages: readonly WorkspacePackage[]): AnalysisContext {
  return {
    workspacePath: '/workspace',
    packages,
    config: {},
    reportProgress: () => {},
  }
}

describe('architectural-analyzer', () => {
  it.concurrent('should create analyzer with default options', () => {
    const analyzer = createArchitecturalAnalyzer()

    expect(analyzer.metadata.id).toBe('architectural')
    expect(analyzer.metadata.name).toBe('Architectural Analyzer')
    expect(analyzer.metadata.categories).toContain('architecture')
    expect(typeof analyzer.analyze).toBe('function')
  })

  it.concurrent('should accept custom options with layer configuration', () => {
    const analyzer = createArchitecturalAnalyzer({
      checkLayerViolations: true,
      checkBarrelExports: false,
      layerConfig: {
        layers: [
          {name: 'domain', allowedDependencies: []},
          {name: 'application', allowedDependencies: ['domain']},
        ],
        patterns: [
          {pattern: '**/domain/**', layer: 'domain'},
          {pattern: '**/application/**', layer: 'application'},
        ],
      },
    })

    expect(analyzer.metadata.id).toBe('architectural')
  })

  it.concurrent('should accept all architectural check options', () => {
    const analyzer = createArchitecturalAnalyzer({
      checkLayerViolations: false,
      checkBarrelExports: true,
      checkPublicApi: true,
      checkSideEffects: true,
      checkPathAliases: true,
      checkPackageBoundaries: true,
    })

    expect(analyzer.metadata.id).toBe('architectural')
  })

  it.concurrent('should return success for package without TypeScript project', async () => {
    const pkg = createMockPackage({hasTsConfig: false})
    const analyzer = createArchitecturalAnalyzer()
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should handle analysis of multiple packages', async () => {
    const pkg1 = createMockPackage({name: '@test/pkg1'})
    const pkg2 = createMockPackage({name: '@test/pkg2'})
    const analyzer = createArchitecturalAnalyzer({
      checkLayerViolations: true,
      checkBarrelExports: true,
    })
    const context = createMockContext([pkg1, pkg2])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should support exempt patterns configuration', () => {
    const analyzer = createArchitecturalAnalyzer({
      allowedBarrelPatterns: ['**/index.ts'],
      sharedPackages: ['@bfra.me/es', '@test/utils'],
      entryPointPatterns: ['**/index.ts', '**/main.ts'],
    })

    expect(analyzer.metadata.id).toBe('architectural')
  })

  it.concurrent('should support custom severity configuration', () => {
    const analyzer = createArchitecturalAnalyzer({
      layerViolationSeverity: 'error',
      barrelExportSeverity: 'warning',
      publicApiSeverity: 'info',
      sideEffectSeverity: 'critical',
    })

    expect(analyzer.metadata.id).toBe('architectural')
  })
})
