/**
 * Workspace scanner tests verifying package discovery and source file collection.
 */

import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {
  createWorkspaceScanner,
  filterPackagesByPattern,
  getPackageScope,
  getUnscopedName,
  groupPackagesByScope,
} from '../../src/scanner/workspace-scanner'

async function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'workspace-analyzer-test-'))
}

async function cleanupTempDir(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

async function createPackage(
  name: string,
  version: string,
  baseDir: string,
  options: {hasTsConfig?: boolean; hasEslint?: boolean; sourceFiles?: string[]} = {},
): Promise<string> {
  const packageDir = path.join(baseDir, 'packages', name.replace('@', '').replace('/', '-'))
  await fs.mkdir(packageDir, {recursive: true})

  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({name, version}, null, 2),
  )

  if (options.hasTsConfig !== false) {
    await fs.writeFile(
      path.join(packageDir, 'tsconfig.json'),
      JSON.stringify({compilerOptions: {target: 'ES2022'}}, null, 2),
    )
  }

  if (options.hasEslint !== false) {
    await fs.writeFile(path.join(packageDir, 'eslint.config.ts'), 'export default {}')
  }

  const srcDir = path.join(packageDir, 'src')
  await fs.mkdir(srcDir, {recursive: true})

  const files = options.sourceFiles ?? ['index.ts']
  for (const file of files) {
    const filePath = path.join(srcDir, file)
    const fileDir = path.dirname(filePath)
    await fs.mkdir(fileDir, {recursive: true})
    await fs.writeFile(filePath, `// ${file}`)
  }

  return packageDir
}

describe('workspace-scanner', () => {
  describe('createWorkspaceScanner', () => {
    it('should discover packages in the workspace', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/pkg-a', '1.0.0', tempDir)
        await createPackage('@test/pkg-b', '2.0.0', tempDir)

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        expect(result.packages).toHaveLength(2)
        expect(result.errors).toHaveLength(0)
        expect(result.workspacePath).toBe(tempDir)
        expect(result.durationMs).toBeGreaterThanOrEqual(0)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should collect source files from packages', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/pkg', '1.0.0', tempDir, {
          sourceFiles: ['index.ts', 'utils/helpers.ts', 'types.ts'],
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        expect(result.packages).toHaveLength(1)
        const pkg = result.packages[0] as WorkspacePackage
        expect(pkg.sourceFiles).toHaveLength(3)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should exclude specified packages', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/include-me', '1.0.0', tempDir)
        await createPackage('@test/exclude-me', '1.0.0', tempDir)

        const scanner = createWorkspaceScanner({
          rootDir: tempDir,
          excludePackages: ['@test/exclude-me'],
        })
        const result = await scanner.scan()

        expect(result.packages).toHaveLength(1)
        expect(result.packages[0]?.name).toBe('@test/include-me')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should detect tsconfig.json presence', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/with-tsconfig', '1.0.0', tempDir, {hasTsConfig: true})
        await createPackage('@test/without-tsconfig', '1.0.0', tempDir, {hasTsConfig: false})

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        const withTsconfig = result.packages.find(p => p.name === '@test/with-tsconfig')
        const withoutTsconfig = result.packages.find(p => p.name === '@test/without-tsconfig')

        expect(withTsconfig?.hasTsConfig).toBe(true)
        expect(withoutTsconfig?.hasTsConfig).toBe(false)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should detect eslint config presence', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/with-eslint', '1.0.0', tempDir, {hasEslint: true})
        await createPackage('@test/without-eslint', '1.0.0', tempDir, {hasEslint: false})

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        const withEslint = result.packages.find(p => p.name === '@test/with-eslint')
        const withoutEslint = result.packages.find(p => p.name === '@test/without-eslint')

        expect(withEslint?.hasEslintConfig).toBe(true)
        expect(withoutEslint?.hasEslintConfig).toBe(false)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should handle invalid package.json gracefully', async () => {
      const tempDir = await createTempDir()
      try {
        await createPackage('@test/valid', '1.0.0', tempDir)

        const invalidPkgDir = path.join(tempDir, 'packages', 'invalid')
        await fs.mkdir(invalidPkgDir, {recursive: true})
        await fs.writeFile(path.join(invalidPkgDir, 'package.json'), 'invalid json')

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        expect(result.packages).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.code).toBe('INVALID_PACKAGE_JSON')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should exclude test files from source collection', async () => {
      const tempDir = await createTempDir()
      try {
        const pkgDir = await createPackage('@test/pkg', '1.0.0', tempDir, {
          sourceFiles: ['index.ts', 'helper.ts'],
        })

        await fs.writeFile(path.join(pkgDir, 'src', 'index.test.ts'), '// test')
        await fs.writeFile(path.join(pkgDir, 'src', 'helper.spec.ts'), '// spec')

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scan()

        const pkg = result.packages[0] as WorkspacePackage
        expect(pkg.sourceFiles.some(f => f.includes('.test.'))).toBe(false)
        expect(pkg.sourceFiles.some(f => f.includes('.spec.'))).toBe(false)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should support custom include patterns', async () => {
      const tempDir = await createTempDir()
      try {
        const appsDir = path.join(tempDir, 'apps')
        await fs.mkdir(path.join(appsDir, 'test-app', 'src'), {recursive: true})
        await fs.writeFile(
          path.join(appsDir, 'test-app', 'package.json'),
          JSON.stringify({name: '@test/app', version: '1.0.0'}),
        )
        await fs.writeFile(path.join(appsDir, 'test-app', 'src', 'index.ts'), '// app')

        const scanner = createWorkspaceScanner({
          rootDir: tempDir,
          includePatterns: ['apps/*'],
        })
        const result = await scanner.scan()

        expect(result.packages).toHaveLength(1)
        expect(result.packages[0]?.name).toBe('@test/app')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })

  describe('scanPackage', () => {
    it('should scan a single package directory', async () => {
      const tempDir = await createTempDir()
      try {
        const pkgDir = await createPackage('@test/single', '3.0.0', tempDir)

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scanPackage(pkgDir)

        expect(result.success).toBe(true)
        expect(result.success && result.data.name).toBe('@test/single')
        expect(result.success && result.data.version).toBe('3.0.0')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should return error for missing package.json', async () => {
      const tempDir = await createTempDir()
      try {
        const emptyDir = path.join(tempDir, 'empty')
        await fs.mkdir(emptyDir, {recursive: true})

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const result = await scanner.scanPackage(emptyDir)

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('READ_ERROR')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })

  describe('collectSourceFiles', () => {
    it('should recursively collect source files', async () => {
      const tempDir = await createTempDir()
      try {
        const pkgDir = await createPackage('@test/deep', '1.0.0', tempDir, {
          sourceFiles: ['index.ts', 'utils/index.ts', 'utils/deep/nested.ts'],
        })

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const files = await scanner.collectSourceFiles(path.join(pkgDir, 'src'))

        expect(files).toHaveLength(3)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should exclude node_modules directories', async () => {
      const tempDir = await createTempDir()
      try {
        const pkgDir = await createPackage('@test/pkg', '1.0.0', tempDir)

        const nodeModulesDir = path.join(pkgDir, 'src', 'node_modules')
        await fs.mkdir(nodeModulesDir, {recursive: true})
        await fs.writeFile(path.join(nodeModulesDir, 'some-dep.js'), '// dep')

        const scanner = createWorkspaceScanner({rootDir: tempDir})
        const files = await scanner.collectSourceFiles(path.join(pkgDir, 'src'))

        expect(files.some(f => f.includes('node_modules'))).toBe(false)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })

  describe('helper functions', () => {
    describe('filterPackagesByPattern', () => {
      it.concurrent('should filter packages by name pattern', () => {
        const packages: WorkspacePackage[] = [
          createMockPackage('@scope/utils'),
          createMockPackage('@scope/core'),
          createMockPackage('@other/lib'),
        ]

        const filtered = filterPackagesByPattern(packages, '@scope/*')
        expect(filtered).toHaveLength(2)
      })

      it.concurrent('should support case-insensitive matching', () => {
        const packages: WorkspacePackage[] = [createMockPackage('@Scope/Utils')]

        const filtered = filterPackagesByPattern(packages, '@scope/*')
        expect(filtered).toHaveLength(1)
      })
    })

    describe('groupPackagesByScope', () => {
      it.concurrent('should group packages by npm scope', () => {
        const packages: WorkspacePackage[] = [
          createMockPackage('@scope-a/utils'),
          createMockPackage('@scope-a/core'),
          createMockPackage('@scope-b/lib'),
          createMockPackage('unscoped'),
        ]

        const grouped = groupPackagesByScope(packages)

        expect(grouped.get('@scope-a')).toHaveLength(2)
        expect(grouped.get('@scope-b')).toHaveLength(1)
        expect(grouped.get('__unscoped__')).toHaveLength(1)
      })
    })

    describe('getPackageScope', () => {
      it.concurrent('should extract scope from scoped package name', () => {
        expect(getPackageScope('@scope/pkg')).toBe('@scope')
        expect(getPackageScope('@bfra.me/utils')).toBe('@bfra.me')
      })

      it.concurrent('should return undefined for unscoped packages', () => {
        expect(getPackageScope('lodash')).toBeUndefined()
        expect(getPackageScope('express')).toBeUndefined()
      })
    })

    describe('getUnscopedName', () => {
      it.concurrent('should extract unscoped name from scoped package', () => {
        expect(getUnscopedName('@scope/pkg')).toBe('pkg')
        expect(getUnscopedName('@bfra.me/workspace-analyzer')).toBe('workspace-analyzer')
      })

      it.concurrent('should return name unchanged for unscoped packages', () => {
        expect(getUnscopedName('lodash')).toBe('lodash')
      })
    })
  })
})

function createMockPackage(name: string): WorkspacePackage {
  return {
    name,
    version: '1.0.0',
    packagePath: `/workspace/${name}`,
    packageJsonPath: `/workspace/${name}/package.json`,
    srcPath: `/workspace/${name}/src`,
    packageJson: {name, version: '1.0.0'},
    sourceFiles: [],
    hasTsConfig: true,
    hasEslintConfig: true,
  }
}
