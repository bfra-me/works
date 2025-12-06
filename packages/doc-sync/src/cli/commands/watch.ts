import type {GlobalOptions} from '../types.js'

import path from 'node:path'
import process from 'node:process'

import {createSyncOrchestrator} from '../../orchestrator/sync-orchestrator.js'
import {createLogger, createProgressCallback, createSpinner, showIntro, showOutro} from '../ui.js'

export async function runWatch(packages: string[], options: GlobalOptions): Promise<void> {
  const logger = createLogger(options)
  const rootDir = path.resolve(options.root)
  const outputDir = path.join(rootDir, 'docs', 'src', 'content', 'docs', 'packages')

  if (options.quiet !== true) {
    showIntro('👁️  doc-sync watch')
  }

  const spinner = options.quiet === true ? undefined : createSpinner()

  const orchestrator = createSyncOrchestrator({
    config: {
      rootDir,
      outputDir,
      includePatterns: ['packages/*'],
      excludePatterns: [],
      watch: true,
      debounceMs: 300,
    },
    dryRun: options.dryRun ?? false,
    verbose: options.verbose ?? false,
    onProgress: createProgressCallback(options),
    onError(error): void {
      logger.error(`Error: ${error.message}`)
    },
  })

  if (packages.length > 0) {
    logger.info(`Watching packages: ${packages.join(', ')}`)
    spinner?.start('Performing initial sync...')
    await orchestrator.syncPackages(packages)
    spinner?.stop('Initial sync complete')
  } else {
    spinner?.start('Performing initial sync of all packages...')
    await orchestrator.syncAll()
    spinner?.stop('Initial sync complete')
  }

  logger.info('Starting watch mode...')
  spinner?.start('Watching for changes... (Ctrl+C to stop)')

  await orchestrator.startWatching()

  const shutdown = async (): Promise<void> => {
    spinner?.stop('Stopping watch mode...')
    await orchestrator.stopWatching()

    if (options.quiet !== true) {
      showOutro('👋 Watch mode stopped')
    }

    process.exit(0)
  }

  process.on('SIGINT', () => {
    shutdown().catch(() => process.exit(1))
  })

  process.on('SIGTERM', () => {
    shutdown().catch(() => process.exit(1))
  })

  // Keep the process running until interrupted
  setInterval(() => {}, 1 << 30)
}
