/**
 * @bfra.me/doc-sync/__mocks__/fs - Mock file system using memfs for testing
 *
 * Provides an in-memory file system implementation to enable comprehensive
 * testing of file operations without touching the real filesystem.
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
 * Creates a fresh mock file system instance for isolated testing
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

export interface PackageMockOptions {
  readonly version?: string
  readonly description?: string
  readonly hasReadme?: boolean
  readonly hasSrc?: boolean
  readonly srcContent?: string
  readonly readmeContent?: string
}

const DEFAULT_SRC_CONTENT = `/**
 * @module {packageName}
 * Test module for {packageName}
 */

/**
 * Adds two numbers together
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 * @example
 * const result = add(1, 2)
 * console.log(result) // 3
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Represents a configuration option
 */
export interface Config {
  /** The name of the configuration */
  readonly name: string
  /** Whether the configuration is enabled */
  readonly enabled: boolean
  /** Optional metadata */
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

/**
 * Result type for operations
 */
export type Result<T> = {success: true; data: T} | {success: false; error: string}
`

const DEFAULT_README_CONTENT = `# @test/{packageName}

A test package for documentation sync.

## Installation

\`\`\`bash
pnpm add @test/{packageName}
\`\`\`

## Usage

\`\`\`typescript
import { add } from '@test/{packageName}'

const result = add(1, 2)
console.log(result) // 3
\`\`\`

## API

See the API documentation for details.

## License

MIT
`

/**
 * Creates a mock file system with a typical package structure
 */
export function createPackageMockFs(
  packageName: string,
  options?: PackageMockOptions,
): MockFileSystem {
  const {
    version = '1.0.0',
    description = `A test package: ${packageName}`,
    hasReadme = true,
    hasSrc = true,
    srcContent = DEFAULT_SRC_CONTENT,
    readmeContent = DEFAULT_README_CONTENT,
  } = options ?? {}

  const files: Record<string, string> = {
    [`/packages/${packageName}/package.json`]: JSON.stringify(
      {
        name: `@test/${packageName}`,
        version,
        description,
        type: 'module',
        exports: {
          '.': {
            types: './lib/index.d.ts',
            import: './lib/index.js',
          },
        },
        main: './lib/index.js',
        types: './lib/index.d.ts',
      },
      null,
      2,
    ),
  }

  if (hasReadme) {
    files[`/packages/${packageName}/README.md`] = readmeContent.replaceAll(
      '{packageName}',
      packageName,
    )
  }

  if (hasSrc) {
    files[`/packages/${packageName}/src/index.ts`] = srcContent.replaceAll(
      '{packageName}',
      packageName,
    )
  }

  return createMockFileSystem(files)
}
