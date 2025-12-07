/**
 * Tests for logging and telemetry factory
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-033)
 */

import {beforeEach, describe, expect, it, vi} from 'vitest'
import {CLIErrorCode, createCLIError} from '../../src/utils/errors.js'
import {
  consola,
  createLogger,
  createProgressReporter,
  createSpinner,
  displayInfoBox,
  displaySuccessBox,
  displayWarningBox,
  logDebug,
  logError,
  logInfo,
  logSuccess,
  logValidationErrors,
  logValidationWarnings,
  logWarning,
} from '../../src/utils/logger.js'

describe('logger utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const logger = createLogger()
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('should create a logger with custom tag', () => {
      const logger = createLogger({tag: 'test-tag'})
      expect(logger).toBeDefined()
    })

    it('should create a logger with custom level', () => {
      const logger = createLogger({level: 3})
      expect(logger).toBeDefined()
    })

    it('should create a verbose logger', () => {
      const logger = createLogger({verbose: true})
      expect(logger).toBeDefined()
    })

    it('should create a logger with all options', () => {
      const logger = createLogger({
        tag: 'full-options',
        level: 5,
        verbose: true,
      })
      expect(logger).toBeDefined()
    })
  })

  describe('logError', () => {
    it('should log BaseError with user-friendly message', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const error = createCLIError('Test validation error', CLIErrorCode.VALIDATION_FAILED)

      logError(error)

      expect(errorSpy).toHaveBeenCalled()
    })

    it('should log BaseError with verbose details', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const boxSpy = vi.spyOn(consola, 'box').mockImplementation(() => {})
      const error = createCLIError('Test validation error', CLIErrorCode.VALIDATION_FAILED)

      logError(error, {verbose: true})

      expect(errorSpy).toHaveBeenCalled()
      expect(boxSpy).toHaveBeenCalled()
    })

    it('should log standard Error', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const error = new Error('Standard error message')

      logError(error)

      expect(errorSpy).toHaveBeenCalledWith('Standard error message')
    })

    it('should log standard Error with verbose stack trace', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const debugSpy = vi.spyOn(consola, 'debug').mockImplementation(() => {})
      const error = new Error('Error with stack')

      logError(error, {verbose: true})

      expect(errorSpy).toHaveBeenCalled()
      expect(debugSpy).toHaveBeenCalled()
    })

    it('should log unknown error types', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})

      logError('string error')
      expect(errorSpy).toHaveBeenCalledWith('string error')

      logError(123)
      expect(errorSpy).toHaveBeenCalledWith('123')

      logError(null)
      expect(errorSpy).toHaveBeenCalledWith('null')
    })

    it('should handle undefined options', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const error = new Error('Test')

      logError(error, undefined)

      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('logWarning', () => {
    it('should log warning message', () => {
      const warnSpy = vi.spyOn(consola, 'warn').mockImplementation(() => {})

      logWarning('Warning message')

      expect(warnSpy).toHaveBeenCalledWith('Warning message')
    })
  })

  describe('logInfo', () => {
    it('should log info message', () => {
      const infoSpy = vi.spyOn(consola, 'info').mockImplementation(() => {})

      logInfo('Info message')

      expect(infoSpy).toHaveBeenCalledWith('Info message')
    })
  })

  describe('logSuccess', () => {
    it('should log success message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})

      logSuccess('Success message')

      expect(successSpy).toHaveBeenCalledWith('Success message')
    })
  })

  describe('logDebug', () => {
    it('should not log debug message when verbose is false', () => {
      const debugSpy = vi.spyOn(consola, 'debug').mockImplementation(() => {})

      logDebug('Debug message')

      expect(debugSpy).not.toHaveBeenCalled()
    })

    it('should log debug message when verbose is true', () => {
      const debugSpy = vi.spyOn(consola, 'debug').mockImplementation(() => {})

      logDebug('Debug message', {verbose: true})

      expect(debugSpy).toHaveBeenCalledWith('Debug message')
    })

    it('should handle undefined options', () => {
      const debugSpy = vi.spyOn(consola, 'debug').mockImplementation(() => {})

      logDebug('Debug message', undefined)

      expect(debugSpy).not.toHaveBeenCalled()
    })
  })

  describe('displayInfoBox', () => {
    it('should display info box with blue border', () => {
      const boxSpy = vi.spyOn(consola, 'box').mockImplementation(() => {})

      displayInfoBox('Info Title', 'Info message content')

      expect(boxSpy).toHaveBeenCalledWith({
        title: 'Info Title',
        message: 'Info message content',
        style: {
          borderColor: 'blue',
          borderStyle: 'rounded',
        },
      })
    })
  })

  describe('displaySuccessBox', () => {
    it('should display success box with green border', () => {
      const boxSpy = vi.spyOn(consola, 'box').mockImplementation(() => {})

      displaySuccessBox('Success Title', 'Success message content')

      expect(boxSpy).toHaveBeenCalledWith({
        title: 'Success Title',
        message: 'Success message content',
        style: {
          borderColor: 'green',
          borderStyle: 'rounded',
        },
      })
    })
  })

  describe('displayWarningBox', () => {
    it('should display warning box with yellow border', () => {
      const boxSpy = vi.spyOn(consola, 'box').mockImplementation(() => {})

      displayWarningBox('Warning Title', 'Warning message content')

      expect(boxSpy).toHaveBeenCalledWith({
        title: 'Warning Title',
        message: 'Warning message content',
        style: {
          borderColor: 'yellow',
          borderStyle: 'rounded',
        },
      })
    })
  })

  describe('logValidationErrors', () => {
    it('should log validation errors with formatting', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})

      logValidationErrors(['Error 1', 'Error 2', 'Error 3'])

      expect(errorSpy).toHaveBeenCalledWith('Validation failed:')
      expect(errorSpy).toHaveBeenCalledWith('  • Error 1')
      expect(errorSpy).toHaveBeenCalledWith('  • Error 2')
      expect(errorSpy).toHaveBeenCalledWith('  • Error 3')
    })

    it('should handle empty error array', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})

      logValidationErrors([])

      expect(errorSpy).toHaveBeenCalledWith('Validation failed:')
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('logValidationWarnings', () => {
    it('should log validation warnings with formatting', () => {
      const warnSpy = vi.spyOn(consola, 'warn').mockImplementation(() => {})

      logValidationWarnings(['Warning 1', 'Warning 2'])

      expect(warnSpy).toHaveBeenCalledWith('Validation warnings:')
      expect(warnSpy).toHaveBeenCalledWith('  ⚠ Warning 1')
      expect(warnSpy).toHaveBeenCalledWith('  ⚠ Warning 2')
    })

    it('should handle empty warnings array', () => {
      const warnSpy = vi.spyOn(consola, 'warn').mockImplementation(() => {})

      logValidationWarnings([])

      expect(warnSpy).toHaveBeenCalledWith('Validation warnings:')
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('createProgressReporter', () => {
    it('should create a progress reporter with correct interface', () => {
      const reporter = createProgressReporter(5, 'Test Operation')

      expect(reporter).toBeDefined()
      expect(typeof reporter.start).toBe('function')
      expect(typeof reporter.complete).toBe('function')
      expect(typeof reporter.fail).toBe('function')
      expect(typeof reporter.finish).toBe('function')
      expect(typeof reporter.formatDuration).toBe('function')
    })

    it('should format duration in milliseconds', () => {
      const reporter = createProgressReporter(3, 'Test')
      expect(reporter.formatDuration(500)).toBe('500ms')
      expect(reporter.formatDuration(999)).toBe('999ms')
    })

    it('should format duration in seconds', () => {
      const reporter = createProgressReporter(3, 'Test')
      expect(reporter.formatDuration(1000)).toBe('1s')
      expect(reporter.formatDuration(2000)).toBe('2s')
      expect(reporter.formatDuration(59000)).toBe('59s')
    })

    it('should format duration in minutes and seconds', () => {
      const reporter = createProgressReporter(3, 'Test')
      expect(reporter.formatDuration(60000)).toBe('1m 0s')
      expect(reporter.formatDuration(65000)).toBe('1m 5s')
      expect(reporter.formatDuration(125000)).toBe('2m 5s')
    })

    it('should track progress through start calls', () => {
      const startSpy = vi.spyOn(consola, 'start').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      expect(startSpy).toHaveBeenCalledWith(expect.stringContaining('[1/3]'))

      reporter.start('Second step')
      expect(startSpy).toHaveBeenCalledWith(expect.stringContaining('[2/3]'))
    })

    it('should complete step with message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      reporter.complete('Step completed')

      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Step completed'))
    })

    it('should complete step without message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      reporter.complete()

      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1 completed'))
    })

    it('should complete step with empty message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      reporter.complete('   ')

      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1 completed'))
    })

    it('should fail with BaseError', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')
      const error = createCLIError('Validation failed', CLIErrorCode.VALIDATION_FAILED)

      reporter.start('First step')
      reporter.fail(error)

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('❌'))
    })

    it('should fail with standard Error', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      reporter.fail(new Error('Something went wrong'))

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'))
    })

    it('should fail with unknown error type', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test')

      reporter.start('First step')
      reporter.fail('String error')

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('String error'))
    })

    it('should finish with completion message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const reporter = createProgressReporter(3, 'Test Operation')

      reporter.finish()

      expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('Test Operation completed'))
    })
  })

  describe('createSpinner', () => {
    it('should create spinner with correct interface', () => {
      const spinner = createSpinner('Loading...')

      expect(typeof spinner.start).toBe('function')
      expect(typeof spinner.update).toBe('function')
      expect(typeof spinner.success).toBe('function')
      expect(typeof spinner.fail).toBe('function')
    })

    it('should start spinner', () => {
      const startSpy = vi.spyOn(consola, 'start').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.start()

      expect(startSpy).toHaveBeenCalledWith('Loading...')
    })

    it('should update spinner message', () => {
      const startSpy = vi.spyOn(consola, 'start').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.update('Still loading...')

      expect(startSpy).toHaveBeenCalledWith('Still loading...')
    })

    it('should complete with success message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.success('Done!')

      expect(successSpy).toHaveBeenCalledWith('Done!')
    })

    it('should complete with default message', () => {
      const successSpy = vi.spyOn(consola, 'success').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.success()

      expect(successSpy).toHaveBeenCalledWith('Loading...')
    })

    it('should fail with error message', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.fail('Failed!')

      expect(errorSpy).toHaveBeenCalledWith('Failed!')
    })

    it('should fail with default message', () => {
      const errorSpy = vi.spyOn(consola, 'error').mockImplementation(() => {})
      const spinner = createSpinner('Loading...')

      spinner.fail()

      expect(errorSpy).toHaveBeenCalledWith('Failed: Loading...')
    })
  })

  describe('consola export', () => {
    it('should export consola instance', () => {
      expect(consola).toBeDefined()
      expect(typeof consola.info).toBe('function')
      expect(typeof consola.error).toBe('function')
    })
  })
})
