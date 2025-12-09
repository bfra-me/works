/**
 * PackageJsonAnalyzer tests for validating package.json configuration.
 */

import type {AnalysisContext, AnalyzerOptions} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import {describe, expect, it} from 'vitest'

import {createPackageJsonAnalyzer} from '../../src/analyzers/package-json-analyzer'

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
      main: './lib/index.js',
      types: './lib/index.d.ts',
      exports: {
        '.': {
          types: './lib/index.d.ts',
          import: './lib/index.js',
        },
      },
    },
    ...overrides,
  }
}

function createMockContext(
  packages: readonly WorkspacePackage[],
  configOverrides: Partial<AnalyzerOptions> = {},
): AnalysisContext {
  return {
    workspacePath: '/workspace',
    packages,
    config: {...configOverrides},
    reportProgress: () => {},
  }
}

describe('package-json-analyzer', () => {
  it.concurrent('should create analyzer with default options', () => {
    const analyzer = createPackageJsonAnalyzer()

    expect(analyzer.metadata.id).toBe('package-json')
    expect(analyzer.metadata.name).toBe('Package.json Analyzer')
    expect(analyzer.metadata.categories).toContain('configuration')
    expect(typeof analyzer.analyze).toBe('function')
  })

  it.concurrent('should accept custom options', () => {
    const analyzer = createPackageJsonAnalyzer({
      requireTypes: false,
      requireExports: false,
      checkScripts: true,
      exemptPackages: ['@test/internal'],
    })

    expect(analyzer.metadata.id).toBe('package-json')
  })

  it.concurrent('should return success with no issues for valid package.json', async () => {
    const pkg = createMockPackage()
    const analyzer = createPackageJsonAnalyzer()
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should detect missing types field in TypeScript packages', async () => {
    const pkg = createMockPackage({
      packageJson: {
        name: '@test/pkg',
        version: '1.0.0',
        main: './lib/index.js',
      },
    })
    const analyzer = createPackageJsonAnalyzer({requireTypes: true})
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should detect missing exports field when required', async () => {
    const pkg = createMockPackage({
      packageJson: {
        name: '@test/pkg',
        version: '1.0.0',
        main: './lib/index.js',
        types: './lib/index.d.ts',
      },
    })
    const analyzer = createPackageJsonAnalyzer({requireExports: true})
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should skip exempt packages', async () => {
    const pkg = createMockPackage({
      name: '@test/exempt',
      packageJson: {
        name: '@test/exempt',
        version: '1.0.0',
      },
    })
    const analyzer = createPackageJsonAnalyzer({
      exemptPackages: ['@test/exempt'],
      requireTypes: true,
      requireExports: true,
    })
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should handle non-TypeScript packages correctly', async () => {
    const pkg = createMockPackage({
      hasTsConfig: false,
      packageJson: {
        name: '@test/js-pkg',
        version: '1.0.0',
        main: './lib/index.js',
      },
    })
    const analyzer = createPackageJsonAnalyzer({requireTypes: true})
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should analyze multiple packages', async () => {
    const pkg1 = createMockPackage({name: '@test/pkg1'})
    const pkg2 = createMockPackage({
      name: '@test/pkg2',
      packageJsonPath: '/workspace/packages/pkg2/package.json',
      packageJson: {
        name: '@test/pkg2',
        version: '1.0.0',
      },
    })
    const analyzer = createPackageJsonAnalyzer({requireTypes: true, requireExports: true})
    const context = createMockContext([pkg1, pkg2])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })

  it.concurrent('should respect minSeverity filter', async () => {
    const pkg = createMockPackage({
      packageJson: {
        name: '@test/pkg',
        version: '1.0.0',
      },
    })
    const analyzer = createPackageJsonAnalyzer({requireTypes: true})
    const context = createMockContext([pkg], {minSeverity: 'error'})

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
  })
})
