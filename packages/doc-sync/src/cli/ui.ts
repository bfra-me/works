import type {GlobalOptions, PackageSelectionOption} from './types.js'

import * as p from '@clack/prompts'
import {consola} from 'consola'

export interface Logger {
  readonly info: (message: string) => void
  readonly success: (message: string) => void
  readonly warn: (message: string) => void
  readonly error: (message: string) => void
  readonly debug: (message: string) => void
}

export interface LoggerOptions {
  readonly verbose?: boolean
  readonly quiet?: boolean
}

export function createLogger(options: LoggerOptions): Logger {
  const {verbose = false, quiet = false} = options

  return {
    info(message: string): void {
      if (!quiet) {
        p.log.info(message)
      }
    },
    success(message: string): void {
      if (!quiet) {
        p.log.success(message)
      }
    },
    warn(message: string): void {
      p.log.warn(message)
    },
    error(message: string): void {
      p.log.error(message)
    },
    debug(message: string): void {
      if (verbose) {
        consola.debug(message)
      }
    },
  }
}

export function showIntro(title: string): void {
  p.intro(title)
}

export function showOutro(message: string): void {
  p.outro(message)
}

export function createSpinner(): ReturnType<typeof p.spinner> {
  return p.spinner()
}

export async function selectPackages(
  availablePackages: readonly PackageSelectionOption[],
): Promise<readonly string[] | symbol> {
  if (availablePackages.length === 0) {
    return []
  }

  const options = availablePackages.map(pkg => ({
    value: pkg.value,
    label: pkg.label,
    hint: pkg.hint,
  }))

  const selected = await p.multiselect({
    message: 'Select packages to sync',
    options,
    required: false,
  })

  return selected
}

export async function confirmAction(message: string): Promise<boolean | symbol> {
  return p.confirm({message})
}

export function handleCancel(value: unknown): value is symbol {
  return p.isCancel(value)
}

export function showCancel(message = 'Operation cancelled.'): void {
  p.cancel(message)
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function formatPackageList(packages: readonly string[]): string {
  if (packages.length === 0) {
    return 'no packages'
  }
  if (packages.length === 1) {
    return packages[0] ?? 'unknown'
  }
  if (packages.length <= 3) {
    return packages.join(', ')
  }
  return `${packages.slice(0, 3).join(', ')} and ${packages.length - 3} more`
}

export function createProgressCallback(options: GlobalOptions): (message: string) => void {
  const logger = createLogger(options)
  return (message: string) => {
    logger.debug(message)
  }
}
