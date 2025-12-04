import type {Result} from '@bfra.me/es/result'
import type {DocConfig, FileChangeEvent, SyncError, SyncInfo, SyncSummary} from '../types'

import fs from 'node:fs/promises'
import path from 'node:path'

import {err, ok} from '@bfra.me/es/result'

import {generateMDXDocument, mergeContent} from '../generators'
import {
  createDocChangeDetector,
  createDocDebouncer,
  createDocWatcher,
  determineRegenerationScope,
  groupChangesByPackage,
  type DocDebouncer,
  type DocFileWatcher,
} from '../watcher'

import {createPackageScanner, type ScannedPackage} from './package-scanner'
import {createValidationPipeline} from './validation-pipeline'

export interface SyncOrchestratorOptions {
  readonly config: DocConfig
  readonly dryRun?: boolean
  readonly verbose?: boolean
  readonly onProgress?: (message: string) => void
  readonly onError?: (error: SyncError) => void
}

export interface SyncOrchestrator {
  readonly syncAll: () => Promise<SyncSummary>
  readonly syncPackages: (packageNames: readonly string[]) => Promise<SyncSummary>
  readonly handleChanges: (events: readonly FileChangeEvent[]) => Promise<SyncSummary>
  readonly startWatching: () => Promise<void>
  readonly stopWatching: () => Promise<void>
  readonly isWatching: () => boolean
}

export function createSyncOrchestrator(options: SyncOrchestratorOptions): SyncOrchestrator {
  const {config, dryRun = false, verbose = false, onProgress, onError} = options

  const scanner = createPackageScanner({
    rootDir: config.rootDir,
    includePatterns: config.includePatterns,
    excludePackages: config.excludePatterns as string[] | undefined,
  })

  const validationPipeline = createValidationPipeline()

  let watcher: DocFileWatcher | undefined
  let debouncer: DocDebouncer | undefined
  let watching = false

  function log(message: string): void {
    if (verbose && onProgress !== undefined) {
      onProgress(message)
    }
  }

  function reportError(error: SyncError): void {
    if (onError !== undefined) {
      onError(error)
    }
  }

  async function syncPackage(pkg: ScannedPackage): Promise<Result<SyncInfo, SyncError>> {
    log(`Syncing documentation for ${pkg.info.name}...`)

    const docResult = generateMDXDocument(pkg.info, pkg.readme, pkg.api)

    if (!docResult.success) {
      return docResult
    }

    const doc = docResult.data
    const validationResult = validationPipeline.validate(doc)

    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ')
      return err({
        code: 'VALIDATION_ERROR',
        message: `Validation failed for ${pkg.info.name}: ${errorMessages}`,
        packageName: pkg.info.name,
      })
    }

    const outputPath = getOutputPath(pkg.info.name, config.outputDir)
    let action: SyncInfo['action'] = 'created'
    let contentToWrite = doc.rendered

    if (pkg.existingDocPath === undefined) {
      // New documentation file
      if (!dryRun) {
        await writeFile(outputPath, contentToWrite)
      }
    } else {
      // Existing documentation file - try to merge
      try {
        const existingContent = await fs.readFile(pkg.existingDocPath, 'utf-8')
        const mergedResult = mergeContent(existingContent, doc.rendered)

        if (!mergedResult.success) {
          // Merge failed - use new content
          if (!dryRun) {
            await writeFile(outputPath, contentToWrite)
          }
          action = 'updated'
        } else if (mergedResult.data.content === existingContent) {
          return ok({
            packageName: pkg.info.name,
            outputPath,
            action: 'unchanged',
            timestamp: new Date(),
          })
        } else {
          contentToWrite = mergedResult.data.content
          action = 'updated'

          if (!dryRun) {
            await writeFile(outputPath, contentToWrite)
          }
        }
      } catch {
        // Error reading existing file - write new content
        if (!dryRun) {
          await writeFile(outputPath, contentToWrite)
        }
      }
    }

    log(`${dryRun ? '[DRY RUN] Would write' : 'Wrote'} ${outputPath}`)

    return ok({
      packageName: pkg.info.name,
      outputPath,
      action,
      timestamp: new Date(),
    })
  }

  async function syncAll(): Promise<SyncSummary> {
    const startTime = Date.now()
    log('Starting full documentation sync...')

    const scanResult = await scanner.scan()
    const details: SyncInfo[] = []
    const errors: SyncError[] = [...scanResult.errors]

    for (const pkg of scanResult.packagesNeedingDocs) {
      const result = await syncPackage(pkg)

      if (result.success) {
        details.push(result.data)
      } else {
        errors.push(result.error)
        reportError(result.error)
      }
    }

    const successCount = details.filter(d => d.action !== 'unchanged').length
    const unchangedCount = details.filter(d => d.action === 'unchanged').length

    log(
      `Sync complete: ${successCount} updated, ${unchangedCount} unchanged, ${errors.length} errors`,
    )

    return {
      totalPackages: scanResult.packages.length,
      successCount,
      failureCount: errors.length,
      unchangedCount,
      details,
      errors,
      durationMs: Date.now() - startTime,
    }
  }

  async function syncPackages(packageNames: readonly string[]): Promise<SyncSummary> {
    const startTime = Date.now()
    log(`Syncing specific packages: ${packageNames.join(', ')}...`)

    const scanResult = await scanner.scan()
    const packagesToSync = scanResult.packages.filter(pkg => packageNames.includes(pkg.info.name))

    const details: SyncInfo[] = []
    const errors: SyncError[] = []

    for (const pkg of packagesToSync) {
      const result = await syncPackage(pkg)

      if (result.success) {
        details.push(result.data)
      } else {
        errors.push(result.error)
        reportError(result.error)
      }
    }

    const successCount = details.filter(d => d.action !== 'unchanged').length
    const unchangedCount = details.filter(d => d.action === 'unchanged').length

    return {
      totalPackages: packagesToSync.length,
      successCount,
      failureCount: errors.length,
      unchangedCount,
      details,
      errors,
      durationMs: Date.now() - startTime,
    }
  }

  async function handleChanges(events: readonly FileChangeEvent[]): Promise<SyncSummary> {
    const startTime = Date.now()
    const groupedChanges = groupChangesByPackage(events)
    const packageNames: string[] = []

    for (const [packageName, packageEvents] of groupedChanges) {
      if (packageName === '__unknown__') {
        continue
      }

      const categories = packageEvents.map(e => {
        const basename = path.basename(e.path).toLowerCase()
        if (basename === 'readme.md' || basename === 'readme') return 'readme' as const
        if (basename === 'package.json') return 'package-json' as const
        if (e.path.endsWith('.ts') || e.path.endsWith('.tsx')) return 'source' as const
        return 'unknown' as const
      })

      const scope = determineRegenerationScope(categories)
      if (scope !== 'none') {
        packageNames.push(packageName)
        log(`Package ${packageName} needs ${scope} regeneration`)
      }
    }

    if (packageNames.length === 0) {
      return {
        totalPackages: 0,
        successCount: 0,
        failureCount: 0,
        unchangedCount: 0,
        details: [],
        errors: [],
        durationMs: Date.now() - startTime,
      }
    }

    return syncPackages(packageNames)
  }

  async function startWatching(): Promise<void> {
    if (watching) {
      return
    }

    log('Starting watch mode...')

    watcher = createDocWatcher({
      rootDir: config.rootDir,
      debounceMs: config.debounceMs ?? 300,
    })

    debouncer = createDocDebouncer(
      async events => {
        const result = await handleChanges(events)
        log(`Watch mode sync: ${result.successCount} updated, ${result.failureCount} errors`)
      },
      {debounceMs: config.debounceMs ?? 300},
    )

    watcher.onChanges(events => {
      for (const event of events) {
        debouncer?.add(event)
      }
    })

    await watcher.start()
    watching = true
    log('Watch mode started')
  }

  async function stopWatching(): Promise<void> {
    if (!watching) {
      return
    }

    log('Stopping watch mode...')

    debouncer?.cancel()
    await watcher?.close()

    watcher = undefined
    debouncer = undefined
    watching = false

    log('Watch mode stopped')
  }

  return {
    syncAll,
    syncPackages,
    handleChanges,
    startWatching,
    stopWatching,
    isWatching: () => watching,
  }
}

function getOutputPath(packageName: string, outputDir: string): string {
  const slug = getUnscopedName(packageName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')

  return path.join(outputDir, `${slug}.mdx`)
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

async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, {recursive: true})
  await fs.writeFile(filePath, content, 'utf-8')
}

// Prevents directory traversal attacks (SEC-002)
export function isValidFilePath(filePath: string, rootDir: string): boolean {
  const resolvedPath = path.resolve(filePath)
  const resolvedRoot = path.resolve(rootDir)

  return resolvedPath.startsWith(resolvedRoot)
}

// Export changeDetector factory for external use
export {createDocChangeDetector}
