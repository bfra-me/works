/**
 * Shared test utilities for creating temporary workspace structures.
 *
 * These utilities reduce duplication across integration tests by providing
 * a consistent way to create and clean up test workspaces.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

/**
 * Package setup configuration for test workspaces.
 */
export interface PackageSetup {
  readonly name: string
  readonly version?: string
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly files?: Record<string, string>
  readonly tsconfig?: Record<string, unknown>
}

/**
 * Creates a temporary directory for test workspace isolation.
 */
export async function createTempWorkspace(prefix = 'workspace-analyzer-test-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

/**
 * Cleans up a temporary workspace directory.
 */
export async function cleanupTempWorkspace(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

/**
 * Creates a monorepo structure in the specified directory.
 *
 * This helper sets up:
 * - Root package.json with workspaces configuration
 * - pnpm-workspace.yaml
 * - Individual packages with their own package.json, tsconfig.json, and source files
 */
export async function createMonorepoStructure(
  baseDir: string,
  packages: readonly PackageSetup[],
): Promise<void> {
  await fs.mkdir(path.join(baseDir, 'packages'), {recursive: true})

  await fs.writeFile(
    path.join(baseDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-monorepo',
        private: true,
        workspaces: ['packages/*'],
      },
      null,
      2,
    ),
  )

  await fs.writeFile(path.join(baseDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

  for (const pkg of packages) {
    const packageName = pkg.name.replace('@', '').replace('/', '-')
    const packageDir = path.join(baseDir, 'packages', packageName)
    const srcDir = path.join(packageDir, 'src')

    await fs.mkdir(srcDir, {recursive: true})

    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(
        {
          name: pkg.name,
          version: pkg.version ?? '1.0.0',
          type: 'module',
          main: './lib/index.js',
          types: './lib/index.d.ts',
          exports: {
            '.': {
              types: './lib/index.d.ts',
              import: './lib/index.js',
            },
          },
          dependencies: pkg.dependencies ?? {},
          devDependencies: pkg.devDependencies ?? {},
        },
        null,
        2,
      ),
    )

    await fs.writeFile(
      path.join(packageDir, 'tsconfig.json'),
      JSON.stringify(
        pkg.tsconfig ?? {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            outDir: './lib',
            rootDir: './src',
            strict: true,
          },
          include: ['src/**/*'],
        },
        null,
        2,
      ),
    )

    if (pkg.files == null) {
      await fs.writeFile(path.join(srcDir, 'index.ts'), `export const value = 'test'`)
    } else {
      for (const [filePath, content] of Object.entries(pkg.files)) {
        const fullPath = path.join(srcDir, filePath)
        const fileDir = path.dirname(fullPath)
        await fs.mkdir(fileDir, {recursive: true})
        await fs.writeFile(fullPath, content)
      }
    }
  }
}

/**
 * Gets all TypeScript source files from a workspace.
 */
export async function getSourceFiles(workspacePath: string): Promise<string[]> {
  const files: string[] = []
  const packagesDir = path.join(workspacePath, 'packages')

  try {
    const packageDirs = await fs.readdir(packagesDir)
    for (const pkg of packageDirs) {
      const srcDir = path.join(packagesDir, pkg, 'src')
      try {
        const entries = await fs.readdir(srcDir, {recursive: true, withFileTypes: true})
        for (const entry of entries) {
          if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            const parentDir = entry.parentPath ?? ''
            const relativePath = path.relative(srcDir, parentDir)
            const filePath =
              relativePath.length > 0
                ? path.join(srcDir, relativePath, entry.name)
                : path.join(srcDir, entry.name)
            files.push(filePath)
          }
        }
      } catch {
        // Skip packages without src directory
      }
    }
  } catch {
    // Empty packages directory
  }

  return files
}
