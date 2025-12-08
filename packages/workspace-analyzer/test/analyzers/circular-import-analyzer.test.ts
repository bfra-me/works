/**
 * CircularImportAnalyzer tests for verifying circular dependency detection.
 */

import type {AnalysisContext, AnalyzerOptions} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {createCircularImportAnalyzer} from '../../src/analyzers/circular-import-analyzer'
import {createWorkspaceScanner} from '../../src/scanner/workspace-scanner'

async function createTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'circular-import-test-'))
}

async function cleanupTempWorkspace(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

async function createPackageWithFiles(
  baseDir: string,
  name: string,
  files: Record<string, string>,
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
      },
      null,
      2,
    ),
  )

  await fs.writeFile(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify({compilerOptions: {target: 'ES2022'}}, null, 2),
  )

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(srcDir, filePath)
    const fileDir = path.dirname(fullPath)
    await fs.mkdir(fileDir, {recursive: true})
    await fs.writeFile(fullPath, content)
  }

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

describe('circular-import-analyzer', () => {
  describe('createCircularImportAnalyzer', () => {
    it.concurrent('should create analyzer with default options', () => {
      const analyzer = createCircularImportAnalyzer()

      expect(analyzer.metadata.id).toBe('circular-import')
      expect(analyzer.metadata.name).toBe('Circular Import Analyzer')
      expect(typeof analyzer.analyze).toBe('function')
    })

    it.concurrent('should accept custom options', () => {
      const analyzer = createCircularImportAnalyzer({
        maxCycleLength: 5,
        directCycleSeverity: 'critical',
      })

      expect(analyzer.metadata.id).toBe('circular-import')
    })
  })

  describe('analyze', () => {
    it('should detect direct two-node cycles', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/direct-cycle', {
          'a.ts': `import {b} from './b'
export const a = 'a'
export function useB() { return b }`,
          'b.ts': `import {a} from './a'
export const b = 'b'
export function useA() { return a }`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer({
          directCycleSeverity: 'error',
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeGreaterThanOrEqual(1)

        const cycleIssue = result.success
          ? result.data.find(i => i.category === 'circular-import')
          : undefined
        expect(cycleIssue).toBeDefined()
        expect(cycleIssue?.severity).toBe('error')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should detect transitive three-node cycles', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/transitive-cycle', {
          'a.ts': `import {b} from './b'
export const a = 'a'
export function useB() { return b }`,
          'b.ts': `import {c} from './c'
export const b = 'b'
export function useC() { return c }`,
          'c.ts': `import {a} from './a'
export const c = 'c'
export function useA() { return a }`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer({
          transitiveCycleSeverity: 'warning',
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeGreaterThanOrEqual(1)

        const cycleIssue = result.success && result.data.find(i => i.category === 'circular-import')
        expect(cycleIssue).toBeDefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not report issues for acyclic imports', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/acyclic', {
          'index.ts': `import {util} from './util'
import {helper} from './helper'
export { util, helper }`,
          'util.ts': `export const util = 'util'`,
          'helper.ts': `import {util} from './util'
export const helper = util + 'helper'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should respect maxCycleLength option', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/long-cycle', {
          'a.ts': `import {b} from './b'
export const a = 'a'`,
          'b.ts': `import {c} from './c'
export const b = 'b'`,
          'c.ts': `import {d} from './d'
export const c = 'c'`,
          'd.ts': `import {e} from './e'
export const d = 'd'`,
          'e.ts': `import {a} from './a'
export const e = 'e'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzerWithLimit = createCircularImportAnalyzer({
          maxCycleLength: 3,
        })
        const resultWithLimit = await analyzerWithLimit.analyze(context)

        expect(resultWithLimit.success).toBe(true)
        const longCycleWithLimit =
          resultWithLimit.success &&
          resultWithLimit.data.find(
            i => i.category === 'circular-import' && i.description?.includes('e.ts'),
          )
        expect(longCycleWithLimit).toBeFalsy()

        const analyzerNoLimit = createCircularImportAnalyzer({
          maxCycleLength: 20,
        })
        const resultNoLimit = await analyzerNoLimit.analyze(context)

        expect(resultNoLimit.success).toBe(true)
        expect(resultNoLimit.success && resultNoLimit.data.length).toBeGreaterThanOrEqual(1)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should exclude test files by default', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/with-tests', {
          'main.ts': `export const main = 'main'`,
          'main.test.ts': `import {main} from './main'
import {testHelper} from './test-helper'
export const test = main + testHelper`,
          'test-helper.ts': `import {main} from './main'
export const testHelper = main + 'helper'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const testFileIssue =
          result.success && result.data.find(i => i.description?.includes('.test.ts'))
        expect(testFileIssue).toBeFalsy()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should include cycle visualization in issue metadata', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/visualize', {
          'x.ts': `import {y} from './y'
export const x = 'x'`,
          'y.ts': `import {x} from './x'
export const y = 'y'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const cycleIssue = result.success ? result.data[0] : undefined
        expect(cycleIssue?.metadata).toBeDefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should include related locations for cycle participants', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/related', {
          'one.ts': `import {two} from './two'
export const one = 'one'`,
          'two.ts': `import {three} from './three'
export const two = 'two'`,
          'three.ts': `import {one} from './one'
export const three = 'three'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const cycleIssue = result.success ? result.data[0] : undefined
        expect(cycleIssue?.relatedLocations).toBeDefined()
        expect(cycleIssue?.relatedLocations?.length).toBeGreaterThanOrEqual(2)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should handle packages with no source files', async () => {
      const tempDir = await createTempWorkspace()
      try {
        const packageName = 'test-empty'
        const packageDir = path.join(tempDir, 'packages', packageName)
        await fs.mkdir(packageDir, {recursive: true})
        await fs.writeFile(
          path.join(packageDir, 'package.json'),
          JSON.stringify({name: '@test/empty', version: '1.0.0'}),
        )

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should detect multiple independent cycles', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/multi-cycle', {
          'cycle1/a.ts': `import {b} from './b'
export const a = 'a'`,
          'cycle1/b.ts': `import {a} from './a'
export const b = 'b'`,
          'cycle2/x.ts': `import {y} from './y'
export const x = 'x'`,
          'cycle2/y.ts': `import {x} from './x'
export const y = 'y'`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createCircularImportAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeGreaterThanOrEqual(2)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not include type-only imports by default', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackageWithFiles(tempDir, '@test/type-only', {
          'types.ts': `import type {Data} from './data'
export type Types = Data`,
          'data.ts': `import type {Types} from './types'
export type Data = Types`,
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzerDefault = createCircularImportAnalyzer({
          includeTypeImports: false,
        })
        const resultDefault = await analyzerDefault.analyze(context)

        expect(resultDefault.success).toBe(true)
        expect(resultDefault.success && resultDefault.data).toHaveLength(0)

        const analyzerWithTypes = createCircularImportAnalyzer({
          includeTypeImports: true,
        })
        const resultWithTypes = await analyzerWithTypes.analyze(context)

        expect(resultWithTypes.success).toBe(true)
        expect(resultWithTypes.success && resultWithTypes.data.length).toBeGreaterThanOrEqual(1)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })
})
