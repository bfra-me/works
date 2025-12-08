/**
 * UnusedDependencyAnalyzer tests for verifying unused dependency detection.
 */

import type {AnalysisContext, AnalyzerOptions} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {createUnusedDependencyAnalyzer} from '../../src/analyzers/unused-dependency-analyzer'
import {createWorkspaceScanner} from '../../src/scanner/workspace-scanner'

async function createTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'unused-dep-test-'))
}

async function cleanupTempWorkspace(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

async function createPackageWithDeps(
  baseDir: string,
  name: string,
  options: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    sourceContent?: string
  },
): Promise<string> {
  const packageName = name.replace('@', '').replace('/', '-')
  const packageDir = path.join(baseDir, 'packages', packageName)
  const srcDir = path.join(packageDir, 'src')

  await fs.mkdir(srcDir, {recursive: true})

  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '1.0.0',
        type: 'module',
        dependencies: options.dependencies ?? {},
        devDependencies: options.devDependencies ?? {},
      },
      null,
      2,
    ),
  )

  await fs.writeFile(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify({compilerOptions: {target: 'ES2022'}}, null, 2),
  )

  await fs.writeFile(path.join(srcDir, 'index.ts'), options.sourceContent ?? 'export const x = 1')

  return packageDir
}

function createMockContext(packages: readonly WorkspacePackage[]): AnalysisContext {
  const config: AnalyzerOptions = {}

  return {
    workspacePath: '/workspace',
    packages,
    config,
    reportProgress: () => {},
  }
}

describe('unused-dependency-analyzer', () => {
  describe('createUnusedDependencyAnalyzer', () => {
    it.concurrent('should create analyzer with default options', () => {
      const analyzer = createUnusedDependencyAnalyzer()

      expect(analyzer.metadata.id).toBe('unused-dependency')
      expect(analyzer.metadata.name).toBe('Unused Dependency Analyzer')
      expect(typeof analyzer.analyze).toBe('function')
    })

    it.concurrent('should accept custom options', () => {
      const analyzer = createUnusedDependencyAnalyzer({
        checkDevDependencies: false,
        ignorePatterns: ['@types/*'],
      })

      expect(analyzer.metadata.id).toBe('unused-dependency')
    })
  })

  describe('analyze', () => {
    it('should detect unused production dependencies', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/unused', {
          dependencies: {
            lodash: '^4.17.21',
            ramda: '^0.29.0',
          },
          sourceContent: `import {debounce} from 'lodash'
export const debouncedFn = debounce(() => {}, 100)`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeGreaterThanOrEqual(1)
        const ramdaIssue = result.success && result.data.find(i => i.description?.includes('ramda'))
        expect(ramdaIssue).toBeDefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not report used dependencies', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/all-used', {
          dependencies: {
            lodash: '^4.17.21',
          },
          sourceContent: `import {debounce, throttle} from 'lodash'
export const debouncedFn = debounce(() => {}, 100)
export const throttledFn = throttle(() => {}, 100)`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const lodashIssue =
          result.success && result.data.find(i => i.description?.includes('lodash'))
        expect(lodashIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should handle dynamic imports', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/dynamic', {
          dependencies: {
            'dynamic-pkg': '^1.0.0',
          },
          sourceContent: `export async function loadDynamic() {
  const mod = await import('dynamic-pkg')
  return mod.default
}`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const dynamicIssue =
          result.success && result.data.find(i => i.description?.includes('dynamic-pkg'))
        expect(dynamicIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should respect ignorePatterns option', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/ignore', {
          dependencies: {
            '@types/node': '^20.0.0',
            'some-unused': '^1.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer({
          ignorePatterns: ['@types/*'],
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const typesIssue =
          result.success && result.data.find(i => i.description?.includes('@types/node'))
        expect(typesIssue).toBeFalsy()

        const someUnusedIssue =
          result.success && result.data.find(i => i.description?.includes('some-unused'))
        expect(someUnusedIssue).toBeTruthy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should skip implicitly used packages', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/implicit', {
          devDependencies: {
            typescript: '^5.0.0',
            vitest: '^1.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer({
          checkDevDependencies: true,
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const typescriptIssue =
          result.success && result.data.find(i => i.description?.includes('typescript'))
        expect(typescriptIssue).toBeFalsy()

        const vitestIssue =
          result.success && result.data.find(i => i.description?.includes('vitest'))
        expect(vitestIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should skip devDependencies when checkDevDependencies is false', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/skip-dev', {
          devDependencies: {
            'unused-dev-dep': '^1.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer({
          checkDevDependencies: false,
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const devDepIssue =
          result.success && result.data.find(i => i.description?.includes('unused-dev-dep'))
        expect(devDepIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should handle packages with no dependencies', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/no-deps', {
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should detect multiple unused dependencies in the same package', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/multiple-unused', {
          dependencies: {
            'unused-a': '^1.0.0',
            'unused-b': '^2.0.0',
            'unused-c': '^3.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeGreaterThanOrEqual(3)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should include file location in issue', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/location', {
          dependencies: {
            'unused-pkg': '^1.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const issue = result.success ? result.data[0] : undefined
        expect(issue?.location.filePath).toContain('package.json')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should include suggestion in issue', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/suggestion', {
          dependencies: {
            'unused-pkg': '^1.0.0',
          },
          sourceContent: 'export const x = 1',
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createUnusedDependencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const issue = result.success ? result.data[0] : undefined
        expect(issue?.suggestion).toBeDefined()
        expect(issue?.suggestion?.toLowerCase()).toContain('remove')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('workspace package detection', () => {
    it('should recognize workspace: protocol dependencies as used if imported', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithDeps(tempDir, '@test/lib', {
          sourceContent: 'export const lib = "lib"',
        })

        await createPackageWithDeps(tempDir, '@test/app', {
          dependencies: {
            '@test/lib': 'workspace:*',
          },
          sourceContent: `import {lib} from '@test/lib'
export const app = lib`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const appPkg = scanResult.packages.find(p => p.name === '@test/app')

        expect(appPkg).toBeDefined()

        const context = createMockContext(appPkg ? [appPkg] : [])
        const analyzer = createUnusedDependencyAnalyzer({
          workspacePrefixes: ['@test/'],
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const libIssue =
          result.success && result.data.find(i => i.description?.includes('@test/lib'))
        expect(libIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })
})
