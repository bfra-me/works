/**
 * @bfra.me/workspace-analyzer/__mocks__/fs - Mock file system using memfs for testing
 *
 * Provides an in-memory file system implementation to enable comprehensive
 * testing of file operations without touching the real filesystem.
 * Adapts patterns from @bfra.me/doc-sync for workspace analyzer testing.
 */

import {memfs, type IFs} from 'memfs'

export interface MockFileSystem {
  readonly fs: IFs
  readonly vol: ReturnType<typeof memfs>['vol']
  reset: () => void
  populate: (files: Record<string, string>) => void
  readFile: (path: string) => string | undefined
  writeFile: (path: string, content: string) => void
  exists: (path: string) => boolean
  mkdir: (path: string) => void
  readdir: (path: string) => string[]
  stat: (path: string) => {isFile: () => boolean; isDirectory: () => boolean} | undefined
  unlink: (path: string) => void
  rmdir: (path: string) => void
}

/**
 * Creates a fresh mock file system instance for isolated testing.
 */
export function createMockFileSystem(initialFiles?: Record<string, string>): MockFileSystem {
  const {fs, vol} = memfs()

  const mockFs: MockFileSystem = {
    fs,
    vol,

    reset() {
      vol.reset()
    },

    populate(files: Record<string, string>) {
      vol.fromJSON(files)
    },

    readFile(path: string): string | undefined {
      try {
        return vol.readFileSync(path, 'utf-8') as string
      } catch {
        return undefined
      }
    },

    writeFile(path: string, content: string) {
      const dir = path.slice(0, path.lastIndexOf('/'))
      if (dir && !vol.existsSync(dir)) {
        vol.mkdirSync(dir, {recursive: true})
      }
      vol.writeFileSync(path, content)
    },

    exists(path: string): boolean {
      return vol.existsSync(path)
    },

    mkdir(path: string) {
      vol.mkdirSync(path, {recursive: true})
    },

    readdir(path: string): string[] {
      try {
        return vol.readdirSync(path) as string[]
      } catch {
        return []
      }
    },

    stat(path: string) {
      try {
        const stats = vol.statSync(path)
        return {
          isFile: () => stats.isFile(),
          isDirectory: () => stats.isDirectory(),
        }
      } catch {
        return undefined
      }
    },

    unlink(path: string) {
      try {
        vol.unlinkSync(path)
      } catch {
        // Ignore errors for missing files
      }
    },

    rmdir(path: string) {
      try {
        vol.rmdirSync(path, {recursive: true})
      } catch {
        // Ignore errors for missing directories
      }
    },
  }

  if (initialFiles) {
    mockFs.populate(initialFiles)
  }

  return mockFs
}

export interface WorkspaceMockOptions {
  readonly packages?: readonly WorkspacePackageMockOptions[]
  readonly workspaceName?: string
  readonly hasRootPackageJson?: boolean
  readonly pnpmWorkspaceYaml?: string
}

export interface WorkspacePackageMockOptions {
  readonly name: string
  readonly version?: string
  readonly description?: string
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly peerDependencies?: Record<string, string>
  readonly hasTsConfig?: boolean
  readonly hasEslintConfig?: boolean
  readonly sourceFiles?: Record<string, string>
  readonly exports?: Record<string, unknown>
  readonly type?: 'module' | 'commonjs'
}

const DEFAULT_SRC_CONTENT = `/**
 * @module {packageName}
 * Test module for {packageName}
 */

/**
 * Adds two numbers together
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Represents a configuration option
 */
export interface Config {
  readonly name: string
  readonly enabled: boolean
  readonly metadata?: Record<string, unknown>
}

/**
 * Status codes for operations
 */
export enum Status {
  Success = 'success',
  Error = 'error',
  Pending = 'pending',
}

export type Result<T> = {success: true; data: T} | {success: false; error: string}
`

/**
 * Creates a mock workspace with typical monorepo structure for testing.
 */
export function createWorkspaceMockFs(options: WorkspaceMockOptions = {}): MockFileSystem {
  const {
    packages = [],
    workspaceName = 'test-workspace',
    hasRootPackageJson = true,
    pnpmWorkspaceYaml = 'packages:\n  - packages/*',
  } = options

  const files: Record<string, string> = {}

  if (hasRootPackageJson) {
    files['/workspace/package.json'] = JSON.stringify(
      {
        name: workspaceName,
        private: true,
        workspaces: ['packages/*'],
      },
      null,
      2,
    )
  }

  if (pnpmWorkspaceYaml) {
    files['/workspace/pnpm-workspace.yaml'] = pnpmWorkspaceYaml
  }

  for (const pkg of packages) {
    const packageName = pkg.name.replace('@', '').replace('/', '-')
    const packagePath = `/workspace/packages/${packageName}`

    files[`${packagePath}/package.json`] = JSON.stringify(
      {
        name: pkg.name,
        version: pkg.version ?? '1.0.0',
        description: pkg.description ?? `Test package: ${pkg.name}`,
        type: pkg.type ?? 'module',
        exports: pkg.exports ?? {
          '.': {
            types: './lib/index.d.ts',
            import: './lib/index.js',
          },
        },
        main: './lib/index.js',
        types: './lib/index.d.ts',
        ...(pkg.dependencies && {dependencies: pkg.dependencies}),
        ...(pkg.devDependencies && {devDependencies: pkg.devDependencies}),
        ...(pkg.peerDependencies && {peerDependencies: pkg.peerDependencies}),
      },
      null,
      2,
    )

    if (pkg.hasTsConfig !== false) {
      files[`${packagePath}/tsconfig.json`] = JSON.stringify(
        {
          extends: '@bfra.me/tsconfig',
          compilerOptions: {
            outDir: './lib',
            rootDir: './src',
          },
          include: ['src/**/*.ts'],
        },
        null,
        2,
      )
    }

    if (pkg.hasEslintConfig !== false) {
      files[`${packagePath}/eslint.config.ts`] =
        `import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({})
`
    }

    if (pkg.sourceFiles) {
      for (const [filePath, content] of Object.entries(pkg.sourceFiles)) {
        files[`${packagePath}/src/${filePath}`] = content
      }
    } else {
      files[`${packagePath}/src/index.ts`] = DEFAULT_SRC_CONTENT.replaceAll(
        '{packageName}',
        pkg.name,
      )
    }
  }

  return createMockFileSystem(files)
}

/**
 * Creates a mock workspace with circular imports for testing cycle detection.
 */
export function createCircularImportMockFs(): MockFileSystem {
  return createWorkspaceMockFs({
    packages: [
      {
        name: '@test/circular',
        sourceFiles: {
          'index.ts': `export * from './a'
export * from './b'
export * from './c'
`,
          'a.ts': `import {b} from './b'
export const a = 'a'
export function useB() { return b }
`,
          'b.ts': `import {c} from './c'
export const b = 'b'
export function useC() { return c }
`,
          'c.ts': `import {a} from './a'
export const c = 'c'
export function useA() { return a }
`,
        },
      },
    ],
  })
}

/**
 * Creates a mock workspace with unused dependencies for testing.
 */
export function createUnusedDepsMockFs(): MockFileSystem {
  return createWorkspaceMockFs({
    packages: [
      {
        name: '@test/unused-deps',
        dependencies: {
          lodash: '^4.17.21',
          ramda: '^0.29.0',
          'date-fns': '^2.30.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          vitest: '^1.0.0',
          'unused-dev-dep': '^1.0.0',
        },
        sourceFiles: {
          'index.ts': `import {debounce} from 'lodash'
// ramda and date-fns are declared but not imported
export const debouncedFn = debounce(() => {}, 100)
`,
        },
      },
    ],
  })
}

/**
 * Creates a mock workspace with config inconsistencies for testing.
 */
export function createConfigInconsistentMockFs(): MockFileSystem {
  const files: Record<string, string> = {
    '/workspace/package.json': JSON.stringify({
      name: 'test-workspace',
      private: true,
      workspaces: ['packages/*'],
    }),
    '/workspace/pnpm-workspace.yaml': 'packages:\n  - packages/*',

    '/workspace/packages/mismatched/package.json': JSON.stringify({
      name: '@test/mismatched',
      version: '1.0.0',
      type: 'module',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
        },
      },
      main: './dist/index.js',
    }),
    '/workspace/packages/mismatched/tsconfig.json': JSON.stringify({
      compilerOptions: {
        outDir: './lib',
        rootDir: './src',
        module: 'commonjs',
      },
    }),
    '/workspace/packages/mismatched/src/index.ts': 'export const x = 1',

    '/workspace/packages/valid/package.json': JSON.stringify({
      name: '@test/valid',
      version: '1.0.0',
      type: 'module',
      exports: {
        '.': {
          types: './lib/index.d.ts',
          import: './lib/index.js',
        },
      },
    }),
    '/workspace/packages/valid/tsconfig.json': JSON.stringify({
      compilerOptions: {
        outDir: './lib',
        rootDir: './src',
        module: 'ESNext',
      },
    }),
    '/workspace/packages/valid/src/index.ts': 'export const y = 2',
  }

  return createMockFileSystem(files)
}

/**
 * Creates a mock workspace for testing tree-shaking blockers.
 */
export function createTreeShakingBlockerMockFs(): MockFileSystem {
  return createWorkspaceMockFs({
    packages: [
      {
        name: '@test/tree-shaking',
        sourceFiles: {
          'index.ts': `// Re-export everything - tree-shaking blocker
export * from './utils'
export * from './helpers'

// Side effect in module scope
console.log('Module loaded')

// Barrel export pattern
export {default as Component} from './component'
`,
          'utils.ts': `export function util1() { return 'util1' }
export function util2() { return 'util2' }
export function util3() { return 'util3' }
`,
          'helpers.ts': `export const helper1 = () => 'helper1'
export const helper2 = () => 'helper2'
`,
          'component.ts': `const Component = () => null
export default Component
`,
        },
      },
    ],
  })
}

/**
 * Creates a complex multi-package workspace for integration testing.
 */
export function createMultiPackageMockFs(): MockFileSystem {
  return createWorkspaceMockFs({
    packages: [
      {
        name: '@test/core',
        dependencies: {},
        sourceFiles: {
          'index.ts': `export * from './result'
export * from './types'
`,
          'result.ts': `export type Result<T, E> = {success: true; data: T} | {success: false; error: E}
export const ok = <T>(data: T) => ({success: true, data} as const)
export const err = <E>(error: E) => ({success: false, error} as const)
`,
          'types.ts': `export interface BaseConfig {
  readonly name: string
  readonly version: string
}
`,
        },
      },
      {
        name: '@test/utils',
        dependencies: {
          '@test/core': 'workspace:*',
        },
        sourceFiles: {
          'index.ts': `import type {Result} from '@test/core'

export function parseJson<T>(json: string): Result<T, Error> {
  try {
    return {success: true, data: JSON.parse(json)}
  } catch (e) {
    return {success: false, error: e as Error}
  }
}
`,
        },
      },
      {
        name: '@test/cli',
        dependencies: {
          '@test/core': 'workspace:*',
          '@test/utils': 'workspace:*',
          cac: '^6.7.14',
        },
        sourceFiles: {
          'index.ts': `import {parseJson} from '@test/utils'
import cac from 'cac'

const cli = cac('test')
export {cli}
`,
        },
      },
    ],
  })
}
