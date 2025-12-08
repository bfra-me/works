/**
 * ConfigConsistencyAnalyzer tests for verifying cross-config validation.
 */

import type {AnalysisContext, AnalyzerOptions} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {createConfigConsistencyAnalyzer} from '../../src/analyzers/config-consistency-analyzer'
import {createWorkspaceScanner} from '../../src/scanner/workspace-scanner'

async function createTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'config-consistency-test-'))
}

async function cleanupTempWorkspace(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

interface PackageSetup {
  name: string
  packageJson: Record<string, unknown>
  tsconfig?: Record<string, unknown>
  files?: Record<string, string>
}

async function createPackages(baseDir: string, packages: PackageSetup[]): Promise<void> {
  for (const pkg of packages) {
    const packageName = pkg.name.replace('@', '').replace('/', '-')
    const packageDir = path.join(baseDir, 'packages', packageName)
    const srcDir = path.join(packageDir, 'src')

    await fs.mkdir(srcDir, {recursive: true})

    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(pkg.packageJson, null, 2),
    )

    if (pkg.tsconfig) {
      await fs.writeFile(
        path.join(packageDir, 'tsconfig.json'),
        JSON.stringify(pkg.tsconfig, null, 2),
      )
    }

    if (pkg.files) {
      for (const [filePath, content] of Object.entries(pkg.files)) {
        const fullPath = path.join(srcDir, filePath)
        const fileDir = path.dirname(fullPath)
        await fs.mkdir(fileDir, {recursive: true})
        await fs.writeFile(fullPath, content)
      }
    } else {
      await fs.writeFile(path.join(srcDir, 'index.ts'), `export const value = 'test'`)
    }
  }
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

describe('config-consistency-analyzer', () => {
  describe('createConfigConsistencyAnalyzer', () => {
    it.concurrent('should create analyzer with default options', () => {
      const analyzer = createConfigConsistencyAnalyzer()

      expect(analyzer.metadata.id).toBe('config-consistency')
      expect(analyzer.metadata.name).toBe('Configuration Consistency Analyzer')
      expect(typeof analyzer.analyze).toBe('function')
    })

    it.concurrent('should accept custom options', () => {
      const analyzer = createConfigConsistencyAnalyzer({
        checkTsconfigPackageJson: false,
        checkCrossPackage: false,
        exemptPackages: ['@test/exempt'],
      })

      expect(analyzer.metadata.id).toBe('config-consistency')
    })
  })

  describe('analyze - package.json/tsconfig consistency', () => {
    it('should detect ESM package with non-ESM tsconfig module', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/esm-mismatch',
            packageJson: {
              name: '@test/esm-mismatch',
              version: '1.0.0',
              type: 'module',
              main: 'lib/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'CommonJS',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const esmIssue = result.success
          ? result.data.find(i => i.id === 'config-esm-cjs-module')
          : undefined
        expect(esmIssue).toBeDefined()
        expect(esmIssue?.severity).toBe('warning')
        expect(esmIssue?.description).toContain('type": "module"')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should detect CJS package with ESM tsconfig module', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/cjs-esm',
            packageJson: {
              name: '@test/cjs-esm',
              version: '1.0.0',
              main: 'lib/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const cjsIssue = result.success
          ? result.data.find(i => i.id === 'config-cjs-esm-module')
          : undefined
        expect(cjsIssue).toBeDefined()
        expect(cjsIssue?.severity).toBe('info')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not report issue for consistent ESM configuration', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/consistent-esm',
            packageJson: {
              name: '@test/consistent-esm',
              version: '1.0.0',
              type: 'module',
              main: 'lib/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const moduleIssue = result.success
          ? result.data.find(i => i.id?.includes('module'))
          : undefined
        expect(moduleIssue).toBeUndefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('analyze - outDir consistency', () => {
    it('should detect outDir/main entry mismatch', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/outdir-mismatch',
            packageJson: {
              name: '@test/outdir-mismatch',
              version: '1.0.0',
              type: 'module',
              main: 'dist/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const outDirIssue = result.success
          ? result.data.find(i => i.id === 'config-outdir-main-mismatch')
          : undefined
        expect(outDirIssue).toBeDefined()
        expect(outDirIssue?.description).toContain('lib')
        expect(outDirIssue?.description).toContain('dist')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should detect outDir/exports mismatch', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/exports-mismatch',
            packageJson: {
              name: '@test/exports-mismatch',
              version: '1.0.0',
              type: 'module',
              exports: {
                '.': {
                  import: 'build/index.js',
                  types: 'build/index.d.ts',
                },
              },
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const exportsIssue = result.success
          ? result.data.find(i => i.id === 'config-outdir-exports-mismatch')
          : undefined
        expect(exportsIssue).toBeDefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not report issue for consistent outDir/main', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/consistent-outdir',
            packageJson: {
              name: '@test/consistent-outdir',
              version: '1.0.0',
              type: 'module',
              main: 'lib/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const outDirIssue = result.success
          ? result.data.find(i => i.id?.includes('outdir'))
          : undefined
        expect(outDirIssue).toBeUndefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('analyze - rootDir suggestions', () => {
    it('should suggest rootDir when src directory exists', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/no-rootdir',
            packageJson: {
              name: '@test/no-rootdir',
              version: '1.0.0',
              type: 'module',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                outDir: './lib',
              },
            },
            files: {
              'index.ts': `export const value = 'test'`,
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const rootDirIssue = result.success
          ? result.data.find(i => i.id === 'config-no-rootdir')
          : undefined
        expect(rootDirIssue).toBeDefined()
        expect(rootDirIssue?.severity).toBe('info')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not suggest rootDir when already set', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/has-rootdir',
            packageJson: {
              name: '@test/has-rootdir',
              version: '1.0.0',
              type: 'module',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                rootDir: './src',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const rootDirIssue = result.success
          ? result.data.find(i => i.id === 'config-no-rootdir')
          : undefined
        expect(rootDirIssue).toBeUndefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('analyze - cross-package consistency', () => {
    it('should detect mixed module types in workspace', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/esm-1',
            packageJson: {name: '@test/esm-1', version: '1.0.0', type: 'module'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'NodeNext'}},
          },
          {
            name: '@test/esm-2',
            packageJson: {name: '@test/esm-2', version: '1.0.0', type: 'module'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'NodeNext'}},
          },
          {
            name: '@test/esm-3',
            packageJson: {name: '@test/esm-3', version: '1.0.0', type: 'module'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'NodeNext'}},
          },
          {
            name: '@test/esm-4',
            packageJson: {name: '@test/esm-4', version: '1.0.0', type: 'module'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'NodeNext'}},
          },
          {
            name: '@test/cjs-outlier',
            packageJson: {name: '@test/cjs-outlier', version: '1.0.0'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'CommonJS'}},
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const mixedIssue = result.success
          ? result.data.find(i => i.id === 'config-mixed-module-types')
          : undefined
        expect(mixedIssue).toBeDefined()
        expect(mixedIssue?.description).toContain('mostly ESM')
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should not report mixed types for small workspaces', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/esm',
            packageJson: {name: '@test/esm', version: '1.0.0', type: 'module'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'NodeNext'}},
          },
          {
            name: '@test/cjs',
            packageJson: {name: '@test/cjs', version: '1.0.0'},
            tsconfig: {compilerOptions: {target: 'ES2022', module: 'CommonJS'}},
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const mixedIssue = result.success
          ? result.data.find(i => i.id === 'config-mixed-module-types')
          : undefined
        expect(mixedIssue).toBeUndefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('analyze - options', () => {
    it('should skip exempt packages', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/exempt',
            packageJson: {
              name: '@test/exempt',
              version: '1.0.0',
              type: 'module',
              main: 'dist/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'CommonJS',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer({
          exemptPackages: ['@test/exempt'],
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should skip tsconfig checks when disabled', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/no-check',
            packageJson: {
              name: '@test/no-check',
              version: '1.0.0',
              type: 'module',
              main: 'dist/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'CommonJS',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer({
          checkTsconfigPackageJson: false,
          checkCrossPackage: false,
        })
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })

    it('should skip packages without tsconfig', async () => {
      const tempDir = await createTempWorkspace()
      try {
        const packageDir = path.join(tempDir, 'packages', 'test-no-tsconfig')
        await fs.mkdir(packageDir, {recursive: true})
        await fs.writeFile(
          path.join(packageDir, 'package.json'),
          JSON.stringify({name: '@test/no-tsconfig', version: '1.0.0'}),
        )

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(0)
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })

  describe('analyze - issue metadata', () => {
    it('should include relevant metadata in issues', async () => {
      const tempDir = await createTempWorkspace()
      try {
        await createPackages(tempDir, [
          {
            name: '@test/metadata',
            packageJson: {
              name: '@test/metadata',
              version: '1.0.0',
              type: 'module',
              main: 'dist/index.js',
            },
            tsconfig: {
              compilerOptions: {
                target: 'ES2022',
                module: 'CommonJS',
                outDir: './lib',
              },
            },
          },
        ])

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const scanResult = await scanner.scan()
        const context = createMockContext(scanResult.packages)

        const analyzer = createConfigConsistencyAnalyzer()
        const result = await analyzer.analyze(context)

        expect(result.success).toBe(true)
        const issue = result.success ? result.data[0] : undefined
        expect(issue?.metadata).toBeDefined()
        expect(issue?.suggestion).toBeDefined()
      } finally {
        await cleanupTempWorkspace(tempDir)
      }
    })
  })
})
