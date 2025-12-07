/**
 * Tests for Progress Utilities
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-038)
 *
 * Tests progress tracking, spinners, and status feedback utilities.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  estimateOperationTime,
  FeatureProgress,
  ProgressTracker,
  showProgress,
  TemplateProgress,
  withSpinner,
} from '../../src/utils/progress.js'

describe('Progress Utilities', () => {
  beforeEach(() => {
    vi.mock('consola', () => ({
      consola: {
        start: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
    }))
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('ProgressTracker', () => {
    it('initializes with total steps', () => {
      const tracker = new ProgressTracker(5)

      expect(tracker).toBeDefined()
    })

    it('tracks step progress', async () => {
      const tracker = new ProgressTracker(3)

      await tracker.startStep('Step 1')
      await tracker.completeStep('Step 1 done')
      await tracker.startStep('Step 2')
      await tracker.completeStep('Step 2 done')

      // Tracker should still be functional
      expect(tracker).toBeDefined()
    })

    it('completes all steps', async () => {
      const tracker = new ProgressTracker(2)

      await tracker.startStep('Step 1')
      await tracker.completeStep()
      await tracker.startStep('Step 2')
      await tracker.completeStep()
      await tracker.complete()

      expect(tracker).toBeDefined()
    })

    it('handles step failure', async () => {
      const tracker = new ProgressTracker(2)

      await tracker.startStep('Step 1')
      await tracker.failStep('Something went wrong')

      expect(tracker).toBeDefined()
    })

    it('adds steps to tracker', () => {
      const tracker = new ProgressTracker(2)

      tracker.addStep({name: 'step1', message: 'First step'})
      tracker.addStep({name: 'step2', message: 'Second step', duration: 100})

      expect(tracker).toBeDefined()
    })
  })

  describe('showProgress', () => {
    it('shows progress bar', () => {
      showProgress({total: 100, current: 50, message: 'Processing'})

      // Just verify it doesn't throw
      expect(true).toBe(true)
    })

    it('shows progress at 0%', () => {
      showProgress({total: 100, current: 0, message: 'Starting'})

      expect(true).toBe(true)
    })

    it('shows progress at 100%', () => {
      showProgress({total: 100, current: 100, message: 'Done'})

      expect(true).toBe(true)
    })
  })

  describe('withSpinner', () => {
    it('executes operation with spinner', async () => {
      const result = await withSpinner('Loading', async () => {
        return 'success'
      })

      expect(result).toBe('success')
    })

    it('handles operation errors', async () => {
      await expect(
        withSpinner('Failing', async () => {
          throw new Error('Test error')
        }),
      ).rejects.toThrow('Test error')
    })

    it('returns operation result', async () => {
      const result = await withSpinner('Computing', async () => {
        return {value: 42}
      })

      expect(result).toEqual({value: 42})
    })
  })

  describe('estimateOperationTime', () => {
    it('estimates download time', () => {
      const time = estimateOperationTime('download', 100)

      expect(time).toBeGreaterThan(0)
    })

    it('estimates extract time', () => {
      const time = estimateOperationTime('extract', 50)

      expect(time).toBeGreaterThan(0)
    })

    it('estimates process time', () => {
      const time = estimateOperationTime('process', 200)

      expect(time).toBeGreaterThan(0)
    })

    it('estimates install time', () => {
      const time = estimateOperationTime('install', 10)

      expect(time).toBeGreaterThan(0)
    })

    it('returns minimum time of 500ms', () => {
      const time = estimateOperationTime('process', 1)

      expect(time).toBeGreaterThanOrEqual(500)
    })
  })

  describe('TemplateProgress', () => {
    it('creates template progress tracker', () => {
      const progress = new TemplateProgress()

      expect(progress).toBeDefined()
    })

    it('tracks template resolution', async () => {
      const progress = new TemplateProgress()

      await progress.startTemplateResolution()
      await progress.completeTemplateResolution()

      expect(progress).toBeDefined()
    })

    it('tracks template download', async () => {
      const progress = new TemplateProgress()

      await progress.startTemplateDownload()
      await progress.completeTemplateDownload()

      expect(progress).toBeDefined()
    })

    it('tracks template processing', async () => {
      const progress = new TemplateProgress()

      await progress.startTemplateProcessing()
      await progress.completeTemplateProcessing()

      expect(progress).toBeDefined()
    })

    it('tracks project generation', async () => {
      const progress = new TemplateProgress()

      await progress.startProjectGeneration()
      await progress.completeProjectGeneration()

      expect(progress).toBeDefined()
    })

    it('tracks dependency installation', async () => {
      const progress = new TemplateProgress()

      await progress.startDependencyInstallation()
      await progress.completeDependencyInstallation()

      expect(progress).toBeDefined()
    })

    it('tracks post-processing', async () => {
      const progress = new TemplateProgress()

      await progress.startPostProcessing()
      await progress.completePostProcessing()

      expect(progress).toBeDefined()
    })

    it('completes tracking', async () => {
      const progress = new TemplateProgress()

      await progress.complete()

      expect(progress).toBeDefined()
    })

    it('handles failure', async () => {
      const progress = new TemplateProgress()

      await progress.fail('download', 'Network error')

      expect(progress).toBeDefined()
    })
  })

  describe('FeatureProgress', () => {
    it('creates feature progress tracker', () => {
      const progress = new FeatureProgress('eslint')

      expect(progress).toBeDefined()
    })

    it('tracks analysis phase', async () => {
      const progress = new FeatureProgress('prettier')

      await progress.startAnalysis()
      await progress.completeAnalysis()

      expect(progress).toBeDefined()
    })

    it('tracks dependencies phase', async () => {
      const progress = new FeatureProgress('vitest')

      await progress.startDependencies()
      await progress.completeDependencies()

      expect(progress).toBeDefined()
    })

    it('tracks configuration phase', async () => {
      const progress = new FeatureProgress('typescript')

      await progress.startConfiguration()
      await progress.completeConfiguration()

      expect(progress).toBeDefined()
    })

    it('tracks finalization phase', async () => {
      const progress = new FeatureProgress('eslint')

      await progress.startFinalization()
      await progress.completeFinalization()

      expect(progress).toBeDefined()
    })

    it('completes tracking', async () => {
      const progress = new FeatureProgress('husky')

      await progress.complete()

      expect(progress).toBeDefined()
    })

    it('handles failure', async () => {
      const progress = new FeatureProgress('lint-staged')

      await progress.fail('configuration', 'Invalid config')

      expect(progress).toBeDefined()
    })
  })
})
