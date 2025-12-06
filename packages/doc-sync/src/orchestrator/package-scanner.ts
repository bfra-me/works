import type {Result} from '@bfra.me/es/result'
import type {PackageAPI, PackageInfo, ReadmeContent, SyncError} from '../types'

import fs from 'node:fs/promises'
import path from 'node:path'

import {err, ok} from '@bfra.me/es/result'

import {analyzePublicAPI, parsePackageComplete, parseReadmeFile} from '../parsers'

export interface PackageScannerOptions {
  readonly rootDir: string
  readonly includePatterns?: readonly string[]
  readonly excludePackages?: readonly string[]
  readonly parseSourceFiles?: boolean
  readonly parseReadme?: boolean
}

export interface ScannedPackage {
  readonly info: PackageInfo
  readonly readme?: ReadmeContent
  readonly api?: PackageAPI
  readonly sourceFiles: readonly string[]
  readonly needsDocumentation: boolean
  readonly existingDocPath?: string
}

export interface ScanResult {
  readonly packages: readonly ScannedPackage[]
  readonly packagesNeedingDocs: readonly ScannedPackage[]
  readonly errors: readonly SyncError[]
  readonly durationMs: number
}

const DEFAULT_OPTIONS: Required<Omit<PackageScannerOptions, 'rootDir' | 'excludePackages'>> = {
  includePatterns: ['packages/*'],
  parseSourceFiles: true,
  parseReadme: true,
}

export function createPackageScanner(options: PackageScannerOptions): {
  readonly scan: () => Promise<ScanResult>
  readonly scanPackage: (packagePath: string) => Promise<Result<ScannedPackage, SyncError>>
} {
  const {
    rootDir,
    includePatterns = DEFAULT_OPTIONS.includePatterns,
    excludePackages = [],
    parseSourceFiles = DEFAULT_OPTIONS.parseSourceFiles,
    parseReadme = DEFAULT_OPTIONS.parseReadme,
  } = options

  const docsOutputDir = path.join(rootDir, 'docs', 'src', 'content', 'docs', 'packages')

  async function discoverPackages(): Promise<string[]> {
    const packagePaths: string[] = []

    for (const pattern of includePatterns) {
      const baseDir = path.join(rootDir, pattern.replace('/*', ''))

      try {
        const entries = await fs.readdir(baseDir, {withFileTypes: true})

        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue
          }

          const packagePath = path.join(baseDir, entry.name)
          const packageJsonPath = path.join(packagePath, 'package.json')

          try {
            await fs.access(packageJsonPath)
            packagePaths.push(packagePath)
          } catch {
            // No package.json, skip this directory
          }
        }
      } catch {
        // Pattern directory doesn't exist, skip
      }
    }

    return packagePaths
  }

  async function findSourceFiles(srcDir: string): Promise<string[]> {
    const sourceFiles: string[] = []

    try {
      await collectSourceFiles(srcDir, sourceFiles)
    } catch {
      // Source directory doesn't exist
    }

    return sourceFiles
  }

  async function collectSourceFiles(dir: string, files: string[]): Promise<void> {
    const entries = await fs.readdir(dir, {withFileTypes: true})

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip test directories
        if (entry.name === '__tests__' || entry.name === '__mocks__') {
          continue
        }
        await collectSourceFiles(fullPath, files)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (
          (ext === '.ts' || ext === '.tsx') &&
          !entry.name.includes('.test.') &&
          !entry.name.includes('.spec.')
        ) {
          files.push(fullPath)
        }
      }
    }
  }

  async function scanPackage(packagePath: string): Promise<Result<ScannedPackage, SyncError>> {
    const packageResult = await parsePackageComplete(packagePath)

    if (!packageResult.success) {
      return err({
        code: 'PACKAGE_NOT_FOUND',
        message: `Failed to parse package at ${packagePath}: ${packageResult.error.message}`,
        filePath: packagePath,
        cause: packageResult.error,
      })
    }

    const info = packageResult.data
    const sourceFiles = await findSourceFiles(info.srcPath)

    let readme: ReadmeContent | undefined
    if (parseReadme && info.readmePath !== undefined) {
      const readmeResult = await parseReadmeFile(info.readmePath)
      if (readmeResult.success) {
        readme = readmeResult.data
      }
    }

    let api: PackageAPI | undefined
    if (parseSourceFiles && sourceFiles.length > 0) {
      const entryFile = findEntryFile(sourceFiles, info.srcPath)
      if (entryFile !== undefined) {
        const analysisResult = analyzePublicAPI(entryFile)
        if (analysisResult.success) {
          api = analysisResult.data.api
        }
      }
    }

    const docSlug = buildDocSlug(info.name)
    const existingDocPath = path.join(docsOutputDir, `${docSlug}.mdx`)
    let hasExistingDoc = false

    try {
      await fs.access(existingDocPath)
      hasExistingDoc = true
    } catch {
      // Doc doesn't exist yet
    }

    return ok({
      info,
      readme,
      api,
      sourceFiles,
      needsDocumentation: true,
      existingDocPath: hasExistingDoc ? existingDocPath : undefined,
    })
  }

  return {
    async scan(): Promise<ScanResult> {
      const startTime = Date.now()
      const packagePaths = await discoverPackages()
      const packages: ScannedPackage[] = []
      const errors: SyncError[] = []

      for (const packagePath of packagePaths) {
        const result = await scanPackage(packagePath)

        if (result.success) {
          const scanned = result.data

          // Check if this package should be excluded
          if (excludePackages.includes(scanned.info.name)) {
            continue
          }

          packages.push(scanned)
        } else {
          errors.push(result.error)
        }
      }

      const packagesNeedingDocs = packages.filter(pkg => pkg.needsDocumentation)

      return {
        packages,
        packagesNeedingDocs,
        errors,
        durationMs: Date.now() - startTime,
      }
    },

    scanPackage,
  }
}

/**
 * Finds the entry file (index.ts) from a list of source files
 */
function findEntryFile(sourceFiles: readonly string[], srcDir: string): string | undefined {
  const indexPath = path.join(srcDir, 'index.ts')
  return sourceFiles.find(file => file === indexPath) ?? sourceFiles[0]
}

function buildDocSlug(packageName: string): string {
  return getUnscopedName(packageName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')
}

function getUnscopedName(packageName: string): string {
  if (packageName.startsWith('@')) {
    const slashIndex = packageName.indexOf('/')
    if (slashIndex > 0) {
      return packageName.slice(slashIndex + 1)
    }
  }
  return packageName
}

export function filterPackagesByPattern(
  packages: readonly ScannedPackage[],
  pattern: string,
): ScannedPackage[] {
  const regex = new RegExp(pattern.replaceAll('*', '.*'), 'i')
  return packages.filter(pkg => regex.test(pkg.info.name))
}

export function groupPackagesByScope(
  packages: readonly ScannedPackage[],
): Map<string, ScannedPackage[]> {
  const grouped = new Map<string, ScannedPackage[]>()

  for (const pkg of packages) {
    const scope = getPackageScope(pkg.info.name) ?? '__unscoped__'
    const existing = grouped.get(scope)

    if (existing === undefined) {
      grouped.set(scope, [pkg])
    } else {
      existing.push(pkg)
    }
  }

  return grouped
}

function getPackageScope(packageName: string): string | undefined {
  if (packageName.startsWith('@')) {
    const slashIndex = packageName.indexOf('/')
    if (slashIndex > 0) {
      return packageName.slice(0, slashIndex)
    }
  }
  return undefined
}
