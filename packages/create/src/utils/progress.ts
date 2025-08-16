/**
 * Progress indicators and status feedback utilities
 */

import process from 'node:process'
import {consola} from 'consola'

export interface ProgressStep {
  name: string
  message: string
  duration?: number
}

export interface ProgressOptions {
  total: number
  current: number
  message: string
}

/**
 * Enhanced progress tracking with visual feedback
 */
export class ProgressTracker {
  private readonly steps: ProgressStep[] = []
  private currentStep = 0
  private readonly startTime = Date.now()

  constructor(private readonly totalSteps: number) {}

  /**
   * Add a step to the progress tracker
   */
  addStep(step: ProgressStep): void {
    this.steps.push(step)
  }

  /**
   * Start the next step with progress feedback
   */
  async startStep(message: string): Promise<void> {
    this.currentStep++
    const progress = Math.round((this.currentStep / this.totalSteps) * 100)

    consola.start(`[${this.currentStep}/${this.totalSteps}] ${message} (${progress}%)`)
  }

  /**
   * Complete the current step
   */
  async completeStep(message?: string): Promise<void> {
    const progress = Math.round((this.currentStep / this.totalSteps) * 100)
    const elapsed = Date.now() - this.startTime

    if (message != null && message.trim().length > 0) {
      consola.success(`✅ ${message} (${progress}% - ${this.formatDuration(elapsed)})`)
    } else {
      consola.success(`✅ Step ${this.currentStep} completed (${progress}%)`)
    }
  }

  /**
   * Mark step as failed
   */
  async failStep(error: string): Promise<void> {
    const progress = Math.round((this.currentStep / this.totalSteps) * 100)
    consola.error(`❌ Step ${this.currentStep} failed: ${error} (${progress}%)`)
  }

  /**
   * Complete all progress tracking
   */
  async complete(): Promise<void> {
    const elapsed = Date.now() - this.startTime
    consola.success(`🎉 All steps completed! Total time: ${this.formatDuration(elapsed)}`)
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(ms: number): string {
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
}

/**
 * Simple progress bar for longer operations
 */
export function showProgress(options: ProgressOptions): void {
  const {total, current, message} = options
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * 20)
  const empty = 20 - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  consola.info(`${message} [${bar}] ${percentage}% (${current}/${total})`)
}

/**
 * Show a spinner for indeterminate operations
 */
export async function withSpinner<T>(message: string, operation: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let frameIndex = 0

    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[frameIndex]} ${message}`)
      frameIndex = (frameIndex + 1) % frames.length
    }, 100)

    operation()
      .then(result => {
        clearInterval(spinner)
        process.stdout.write(`\r✅ ${message}\n`)
        resolve(result)
      })
      .catch(error => {
        clearInterval(spinner)
        process.stdout.write(`\r❌ ${message}\n`)
        reject(error)
      })
  })
}

/**
 * Estimate operation time based on file size or complexity
 */
export function estimateOperationTime(
  operation: 'download' | 'extract' | 'process' | 'install',
  sizeOrComplexity: number,
): number {
  const baseTime = {
    download: 100, // ms per KB
    extract: 50, // ms per file
    process: 10, // ms per file
    install: 1000, // ms per dependency
  }

  return Math.max(500, sizeOrComplexity * baseTime[operation])
}

/**
 * Progress feedback for template operations
 */
export class TemplateProgress {
  private readonly tracker: ProgressTracker

  constructor() {
    this.tracker = new ProgressTracker(6)
  }

  async startTemplateResolution(): Promise<void> {
    await this.tracker.startStep('Resolving template source')
  }

  async completeTemplateResolution(): Promise<void> {
    await this.tracker.completeStep('Template source resolved')
  }

  async startTemplateDownload(): Promise<void> {
    await this.tracker.startStep('Downloading template files')
  }

  async completeTemplateDownload(): Promise<void> {
    await this.tracker.completeStep('Template files downloaded')
  }

  async startTemplateProcessing(): Promise<void> {
    await this.tracker.startStep('Processing template variables')
  }

  async completeTemplateProcessing(): Promise<void> {
    await this.tracker.completeStep('Template variables processed')
  }

  async startProjectGeneration(): Promise<void> {
    await this.tracker.startStep('Generating project files')
  }

  async completeProjectGeneration(): Promise<void> {
    await this.tracker.completeStep('Project files generated')
  }

  async startDependencyInstallation(): Promise<void> {
    await this.tracker.startStep('Installing dependencies')
  }

  async completeDependencyInstallation(): Promise<void> {
    await this.tracker.completeStep('Dependencies installed')
  }

  async startPostProcessing(): Promise<void> {
    await this.tracker.startStep('Running post-processing tasks')
  }

  async completePostProcessing(): Promise<void> {
    await this.tracker.completeStep('Post-processing completed')
  }

  async complete(): Promise<void> {
    await this.tracker.complete()
  }

  async fail(step: string, error: string): Promise<void> {
    await this.tracker.failStep(`${step}: ${error}`)
  }
}

/**
 * Progress feedback for feature addition
 */
export class FeatureProgress {
  private readonly tracker: ProgressTracker

  constructor(private readonly featureName: string) {
    this.tracker = new ProgressTracker(4)
  }

  async startAnalysis(): Promise<void> {
    await this.tracker.startStep(`Analyzing project for ${this.featureName}`)
  }

  async completeAnalysis(): Promise<void> {
    await this.tracker.completeStep('Project analysis completed')
  }

  async startDependencies(): Promise<void> {
    await this.tracker.startStep('Adding dependencies')
  }

  async completeDependencies(): Promise<void> {
    await this.tracker.completeStep('Dependencies added')
  }

  async startConfiguration(): Promise<void> {
    await this.tracker.startStep('Updating configuration files')
  }

  async completeConfiguration(): Promise<void> {
    await this.tracker.completeStep('Configuration files updated')
  }

  async startFinalization(): Promise<void> {
    await this.tracker.startStep('Finalizing feature integration')
  }

  async completeFinalization(): Promise<void> {
    await this.tracker.completeStep(`${this.featureName} feature added successfully`)
  }

  async complete(): Promise<void> {
    await this.tracker.complete()
  }

  async fail(step: string, error: string): Promise<void> {
    await this.tracker.failStep(`${step}: ${error}`)
  }
}
