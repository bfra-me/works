/**
 * Consistent progress indicators and user feedback systems
 * Part of Phase 4: Command Interface Consolidation (TASK-031)
 *
 * Provides unified progress indicators and user feedback patterns
 * across all command operations.
 */

import {intro, log, outro, spinner} from '@clack/prompts'
import {consola} from 'consola'

/**
 * Progress indicator state
 */
export type ProgressState = 'pending' | 'running' | 'success' | 'error' | 'skipped'

/**
 * Progress step definition
 */
export interface ProgressStep {
  id: string
  label: string
  state: ProgressState
  duration?: number
}

/**
 * Progress indicator options
 */
export interface ProgressIndicatorOptions {
  title?: string
  showDuration?: boolean
  verbose?: boolean
}

/**
 * Creates a unified progress indicator for multi-step operations
 */
export function createProgressIndicator(options: ProgressIndicatorOptions = {}) {
  const {title, showDuration = true, verbose = false} = options
  const steps: ProgressStep[] = []
  const startTime = Date.now()
  const currentSpinner = spinner()

  return {
    /**
     * Starts the progress indicator with intro message
     */
    start(message?: string): void {
      if (title != null) {
        intro(title)
      }
      if (message != null) {
        log.info(message)
      }
    },

    /**
     * Begins a new step
     */
    beginStep(id: string, label: string): void {
      const step: ProgressStep = {
        id,
        label,
        state: 'running',
      }
      steps.push(step)
      currentSpinner.start(label)
    },

    /**
     * Completes the current step
     */
    completeStep(message?: string): void {
      const currentStep = steps.at(-1)
      if (currentStep != null) {
        currentStep.state = 'success'
        currentStep.duration = Date.now() - startTime
      }

      const displayMessage = message ?? currentStep?.label ?? 'Step complete'
      currentSpinner.stop(`✓ ${displayMessage}`)

      if (verbose && currentStep?.duration != null && showDuration) {
        log.info(`  Duration: ${formatDuration(currentStep.duration)}`)
      }
    },

    /**
     * Marks the current step as failed
     */
    failStep(error: string): void {
      const currentStep = steps.at(-1)
      if (currentStep != null) {
        currentStep.state = 'error'
        currentStep.duration = Date.now() - startTime
      }

      currentSpinner.stop(`✗ ${error}`)
    },

    /**
     * Skips the current step
     */
    skipStep(reason?: string): void {
      const currentStep = steps.at(-1)
      if (currentStep != null) {
        currentStep.state = 'skipped'
      }

      const skipMessage = reason == null ? '⊘ Skipped' : `⊘ ${reason}`
      currentSpinner.stop(skipMessage)
    },

    /**
     * Updates the spinner message
     */
    updateMessage(message: string): void {
      currentSpinner.message(message)
    },

    /**
     * Finishes the progress indicator
     */
    finish(message?: string): void {
      const totalDuration = Date.now() - startTime
      const successCount = steps.filter(s => s.state === 'success').length
      const failCount = steps.filter(s => s.state === 'error').length
      const skipCount = steps.filter(s => s.state === 'skipped').length

      let summary = message ?? '🎉 Operation complete'

      if (verbose) {
        const parts = [`${successCount} succeeded`]
        if (failCount > 0) {
          parts.push(`${failCount} failed`)
        }
        if (skipCount > 0) {
          parts.push(`${skipCount} skipped`)
        }
        if (showDuration) {
          parts.push(`Total: ${formatDuration(totalDuration)}`)
        }
        summary = `${summary} (${parts.join(', ')})`
      } else if (showDuration) {
        summary = `${summary} in ${formatDuration(totalDuration)}`
      }

      outro(summary)
    },

    /**
     * Gets the current progress state
     */
    getState(): {steps: ProgressStep[]; duration: number} {
      return {
        steps: [...steps],
        duration: Date.now() - startTime,
      }
    },
  }
}

/**
 * Simple spinner wrapper for single operations
 */
export function createSimpleSpinner() {
  const s = spinner()

  return {
    start(message: string): void {
      s.start(message)
    },
    stop(message?: string): void {
      s.stop(message)
    },
    message(text: string): void {
      s.message(text)
    },
  }
}

/**
 * Runs an operation with a spinner
 */
export async function withProgressSpinner<T>(
  message: string,
  operation: () => Promise<T>,
): Promise<T> {
  const s = spinner()
  s.start(message)

  try {
    const result = await operation()
    s.stop(`✓ ${message}`)
    return result
  } catch (error) {
    s.stop(`✗ ${message}`)
    throw error
  }
}

/**
 * Shows a success message
 */
export function showSuccess(message: string): void {
  log.success(message)
}

/**
 * Shows an info message
 */
export function showInfo(message: string): void {
  log.info(message)
}

/**
 * Shows a warning message
 */
export function showWarning(message: string): void {
  log.warn(message)
}

/**
 * Shows an error message
 */
export function showError(message: string): void {
  log.error(message)
}

/**
 * Shows a step message with status indicator
 */
export function showStep(step: number, total: number, message: string): void {
  const percentage = Math.round((step / total) * 100)
  log.step(`[${step}/${total}] ${message} (${percentage}%)`)
}

/**
 * Creates a progress bar string
 */
export function createProgressBar(current: number, total: number, width = 20): string {
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Shows operation summary
 */
export function showOperationSummary(
  title: string,
  items: {label: string; status: 'success' | 'error' | 'skipped'; detail?: string}[],
): void {
  consola.log('')
  consola.log(`📋 ${title}`)
  consola.log('─'.repeat(40))

  for (const item of items) {
    const icon = item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : '⊘'
    const detail = item.detail == null ? '' : ` (${item.detail})`
    consola.log(`  ${icon} ${item.label}${detail}`)
  }

  consola.log('')
}

/**
 * Shows next steps after operation completion
 */
export function showNextSteps(steps: string[]): void {
  if (steps.length === 0) {
    return
  }

  consola.log('')
  consola.log('📝 Next steps:')
  for (const step of steps) {
    consola.log(`  → ${step}`)
  }
  consola.log('')
}

/**
 * Shows command to run
 */
export function showCommand(command: string, description?: string): void {
  if (description != null) {
    consola.log(`  ${description}:`)
  }
  consola.log(`    $ ${command}`)
}

/**
 * Project creation summary display
 */
export function showProjectSummary(info: {
  name: string
  path: string
  template: string
  packageManager?: string
  features?: string[]
}): void {
  consola.log('')
  consola.box({
    title: '🎉 Project Created Successfully',
    message: [
      `📦 Name: ${info.name}`,
      `📁 Location: ${info.path}`,
      `📋 Template: ${info.template}`,
      info.packageManager == null ? null : `📦 Package Manager: ${info.packageManager}`,
      info.features != null && info.features.length > 0
        ? `🔧 Features: ${info.features.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
    style: {
      borderColor: 'green',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Feature addition summary display
 */
export function showFeatureSummary(info: {
  feature: string
  filesModified: number
  filesCreated: number
  dependenciesAdded?: string[]
}): void {
  consola.log('')
  consola.box({
    title: `✅ Feature "${info.feature}" Added`,
    message: [
      `📝 Files modified: ${info.filesModified}`,
      `📄 Files created: ${info.filesCreated}`,
      info.dependenciesAdded != null && info.dependenciesAdded.length > 0
        ? `📦 Dependencies: ${info.dependenciesAdded.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
    style: {
      borderColor: 'green',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Formats duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = Math.round(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}
