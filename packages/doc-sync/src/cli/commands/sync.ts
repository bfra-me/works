import type {SyncError} from '../../types.js'
import type {GlobalOptions, PackageSelectionOption} from '../types.js'
import type {Logger} from '../ui.js'

import path from 'node:path'
import process from 'node:process'

import {createPackageScanner} from '../../orchestrator/package-scanner.js'
import {createSyncOrchestrator} from '../../orchestrator/sync-orchestrator.js'
import {
  createLogger,
  createProgressCallback,
  createSpinner,
  formatDuration,
  formatPackageList,
  handleCancel,
  selectPackages,
  showCancel,
  showIntro,
  showOutro,
} from '../ui.js'

export async function runSync(packages: string[], options: GlobalOptions): Promise<void> {
  const logger = createLogger(options)
  const rootDir = path.resolve(options.root)
  const outputDir = path.join(rootDir, 'docs', 'src', 'content', 'docs', 'packages')

  if (options.quiet !== true) {
    showIntro('📚 doc-sync')
  }

  let selectedPackages: readonly string[] = packages

  if (options.interactive === true && packages.length === 0) {
    const scanner = createPackageScanner({
      rootDir,
      parseSourceFiles: false,
      parseReadme: false,
    })

    const scanResult = await scanner.scan()
    const availablePackages: PackageSelectionOption[] = scanResult.packages.map(pkg => ({
      value: pkg.info.name,
      label: pkg.info.name,
      hint: pkg.needsDocumentation ? 'needs docs' : 'up to date',
    }))

    const selection = await selectPackages(availablePackages)

    if (handleCancel(selection)) {
      showCancel()
      process.exit(0)
    }

    selectedPackages = selection
  }

  const spinner = options.quiet === true ? undefined : createSpinner()
  const errors: SyncError[] = []

  const orchestrator = createSyncOrchestrator({
    config: {
      rootDir,
      outputDir,
      includePatterns: ['packages/*'],
      excludePatterns: [],
    },
    dryRun: options.dryRun ?? false,
    verbose: options.verbose ?? false,
    onProgress: createProgressCallback(options),
    onError(error: SyncError): void {
      errors.push(error)
      logger.error(`Error syncing ${error.packageName ?? 'unknown'}: ${error.message}`)
    },
  })

  const actionPrefix = options.dryRun === true ? '[DRY RUN] ' : ''

  if (selectedPackages.length > 0) {
    spinner?.start(`${actionPrefix}Syncing ${formatPackageList(selectedPackages)}...`)
    const result = await orchestrator.syncPackages(selectedPackages)
    spinner?.stop(`${actionPrefix}Sync complete`)

    reportSyncResult(result, logger, options)
  } else {
    spinner?.start(`${actionPrefix}Syncing all packages...`)
    const result = await orchestrator.syncAll()
    spinner?.stop(`${actionPrefix}Sync complete`)

    reportSyncResult(result, logger, options)
  }

  if (errors.length > 0) {
    if (options.quiet !== true) {
      showOutro(`⚠️  Completed with ${errors.length} error${errors.length === 1 ? '' : 's'}`)
    }
    process.exit(1)
  }

  if (options.quiet !== true) {
    showOutro('✨ Documentation sync complete!')
  }
}

interface SyncResult {
  readonly totalPackages: number
  readonly successCount: number
  readonly failureCount: number
  readonly unchangedCount: number
  readonly durationMs: number
  readonly details: readonly {
    readonly packageName: string
    readonly action: 'created' | 'updated' | 'unchanged'
    readonly outputPath: string
  }[]
}

function reportSyncResult(result: SyncResult, logger: Logger, options: GlobalOptions): void {
  const {successCount, failureCount, unchangedCount, durationMs, details} = result

  if (options.verbose === true) {
    for (const detail of details) {
      switch (detail.action) {
        case 'created':
          logger.success(`Created: ${detail.packageName}`)
          break
        case 'updated':
          logger.info(`Updated: ${detail.packageName}`)
          break
        case 'unchanged':
          logger.debug(`Unchanged: ${detail.packageName}`)
          break
      }
    }
  }

  const summary = [
    successCount > 0 ? `${successCount} synced` : null,
    unchangedCount > 0 ? `${unchangedCount} unchanged` : null,
    failureCount > 0 ? `${failureCount} failed` : null,
  ]
    .filter(Boolean)
    .join(', ')

  logger.info(`${summary} in ${formatDuration(durationMs)}`)
}
