/**
 * Tests for unified error handling system
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-033)
 */

import {describe, expect, it} from 'vitest'
import {
  AIErrorCode,
  BaseError,
  CLIErrorCode,
  createAIError,
  createCLIError,
  createProjectError,
  createTemplateError,
  getUserFriendlyMessage,
  hasErrorCode,
  isBaseError,
  ProjectErrorCode,
  TemplateErrorCode,
} from '../../src/utils/errors.js'

describe('unified error handling system', () => {
  describe('error code constants', () => {
    describe('TemplateErrorCode', () => {
      it.concurrent('contains all expected template error codes', () => {
        expect(TemplateErrorCode).toMatchObject({
          TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
          TEMPLATE_INVALID: 'TEMPLATE_INVALID',
          TEMPLATE_FETCH_FAILED: 'TEMPLATE_FETCH_FAILED',
          TEMPLATE_PARSE_ERROR: 'TEMPLATE_PARSE_ERROR',
          TEMPLATE_RENDER_ERROR: 'TEMPLATE_RENDER_ERROR',
          TEMPLATE_METADATA_INVALID: 'TEMPLATE_METADATA_INVALID',
          TEMPLATE_VARIABLE_MISSING: 'TEMPLATE_VARIABLE_MISSING',
          TEMPLATE_CACHE_ERROR: 'TEMPLATE_CACHE_ERROR',
        })
      })
    })

    describe('AIErrorCode', () => {
      it.concurrent('contains all expected AI error codes', () => {
        expect(AIErrorCode).toMatchObject({
          AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
          AI_API_KEY_MISSING: 'AI_API_KEY_MISSING',
          AI_API_KEY_INVALID: 'AI_API_KEY_INVALID',
          AI_REQUEST_FAILED: 'AI_REQUEST_FAILED',
          AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
          AI_RATE_LIMIT: 'AI_RATE_LIMIT',
          AI_TIMEOUT: 'AI_TIMEOUT',
          AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
        })
      })
    })

    describe('CLIErrorCode', () => {
      it.concurrent('contains all expected CLI error codes', () => {
        expect(CLIErrorCode).toMatchObject({
          INVALID_INPUT: 'INVALID_INPUT',
          INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
          INVALID_PATH: 'INVALID_PATH',
          PATH_TRAVERSAL_ATTEMPT: 'PATH_TRAVERSAL_ATTEMPT',
          DIRECTORY_EXISTS: 'DIRECTORY_EXISTS',
          DIRECTORY_NOT_EMPTY: 'DIRECTORY_NOT_EMPTY',
          FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
          PERMISSION_DENIED: 'PERMISSION_DENIED',
          COMMAND_FAILED: 'COMMAND_FAILED',
          VALIDATION_FAILED: 'VALIDATION_FAILED',
        })
      })
    })

    describe('ProjectErrorCode', () => {
      it.concurrent('contains all expected project error codes', () => {
        expect(ProjectErrorCode).toMatchObject({
          PROJECT_DETECTION_FAILED: 'PROJECT_DETECTION_FAILED',
          PACKAGE_JSON_NOT_FOUND: 'PACKAGE_JSON_NOT_FOUND',
          PACKAGE_JSON_INVALID: 'PACKAGE_JSON_INVALID',
          PACKAGE_MANAGER_NOT_DETECTED: 'PACKAGE_MANAGER_NOT_DETECTED',
        })
      })
    })
  })

  describe('error factory functions', () => {
    describe('createTemplateError', () => {
      it.concurrent('creates a template error with code and message', () => {
        const error = createTemplateError(
          'Template not found',
          TemplateErrorCode.TEMPLATE_NOT_FOUND,
        )

        expect(error).toBeInstanceOf(BaseError)
        expect(error.message).toBe('Template not found')
        expect(error.code).toBe('TEMPLATE_NOT_FOUND')
      })

      it.concurrent('creates a template error with context', () => {
        const error = createTemplateError(
          'Failed to fetch template',
          TemplateErrorCode.TEMPLATE_FETCH_FAILED,
          {url: 'https://github.com/user/repo'},
        )

        expect(error).toBeInstanceOf(BaseError)
        expect(error.message).toBe('Failed to fetch template')
        expect(error.code).toBe('TEMPLATE_FETCH_FAILED')
        expect(error.context).toEqual({url: 'https://github.com/user/repo'})
      })

      it.concurrent('creates errors for all template error codes', () => {
        const codes = Object.values(TemplateErrorCode)

        for (const code of codes) {
          const error = createTemplateError(`Test error: ${code}`, code)
          expect(error.code).toBe(code)
          expect(isBaseError(error)).toBe(true)
        }
      })
    })

    describe('createAIError', () => {
      it.concurrent('creates an AI error with code and message', () => {
        const error = createAIError('API key is missing', AIErrorCode.AI_API_KEY_MISSING)

        expect(error).toBeInstanceOf(BaseError)
        expect(error.message).toBe('API key is missing')
        expect(error.code).toBe('AI_API_KEY_MISSING')
      })

      it.concurrent('creates an AI error with context', () => {
        const error = createAIError('Rate limit exceeded', AIErrorCode.AI_RATE_LIMIT, {
          provider: 'openai',
          retryAfter: 60,
        })

        expect(error).toBeInstanceOf(BaseError)
        expect(error.code).toBe('AI_RATE_LIMIT')
        expect(error.context).toEqual({provider: 'openai', retryAfter: 60})
      })

      it.concurrent('creates errors for all AI error codes', () => {
        const codes = Object.values(AIErrorCode)

        for (const code of codes) {
          const error = createAIError(`Test error: ${code}`, code)
          expect(error.code).toBe(code)
          expect(isBaseError(error)).toBe(true)
        }
      })
    })

    describe('createCLIError', () => {
      it.concurrent('creates a CLI error with code and message', () => {
        const error = createCLIError('Invalid project name', CLIErrorCode.INVALID_PROJECT_NAME)

        expect(error).toBeInstanceOf(BaseError)
        expect(error.message).toBe('Invalid project name')
        expect(error.code).toBe('INVALID_PROJECT_NAME')
      })

      it.concurrent('creates a CLI error with context', () => {
        const error = createCLIError(
          'Path traversal detected',
          CLIErrorCode.PATH_TRAVERSAL_ATTEMPT,
          {
            path: '../../../etc/passwd',
          },
        )

        expect(error).toBeInstanceOf(BaseError)
        expect(error.code).toBe('PATH_TRAVERSAL_ATTEMPT')
        expect(error.context).toEqual({path: '../../../etc/passwd'})
      })

      it.concurrent('creates errors for all CLI error codes', () => {
        const codes = Object.values(CLIErrorCode)

        for (const code of codes) {
          const error = createCLIError(`Test error: ${code}`, code)
          expect(error.code).toBe(code)
          expect(isBaseError(error)).toBe(true)
        }
      })
    })

    describe('createProjectError', () => {
      it.concurrent('creates a project error with code and message', () => {
        const error = createProjectError(
          'Package.json not found',
          ProjectErrorCode.PACKAGE_JSON_NOT_FOUND,
        )

        expect(error).toBeInstanceOf(BaseError)
        expect(error.message).toBe('Package.json not found')
        expect(error.code).toBe('PACKAGE_JSON_NOT_FOUND')
      })

      it.concurrent('creates a project error with context', () => {
        const error = createProjectError(
          'Project detection failed',
          ProjectErrorCode.PROJECT_DETECTION_FAILED,
          {directory: '/path/to/project'},
        )

        expect(error).toBeInstanceOf(BaseError)
        expect(error.code).toBe('PROJECT_DETECTION_FAILED')
        expect(error.context).toEqual({directory: '/path/to/project'})
      })

      it.concurrent('creates errors for all project error codes', () => {
        const codes = Object.values(ProjectErrorCode)

        for (const code of codes) {
          const error = createProjectError(`Test error: ${code}`, code)
          expect(error.code).toBe(code)
          expect(isBaseError(error)).toBe(true)
        }
      })
    })
  })

  describe('type guards', () => {
    describe('isBaseError', () => {
      it.concurrent('returns true for BaseError instances', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_INVALID)
        expect(isBaseError(error)).toBe(true)
      })

      it.concurrent('returns true for AI errors', () => {
        const error = createAIError('Test', AIErrorCode.AI_REQUEST_FAILED)
        expect(isBaseError(error)).toBe(true)
      })

      it.concurrent('returns true for CLI errors', () => {
        const error = createCLIError('Test', CLIErrorCode.INVALID_INPUT)
        expect(isBaseError(error)).toBe(true)
      })

      it.concurrent('returns false for regular Error instances', () => {
        const error = new Error('Regular error')
        expect(isBaseError(error)).toBe(false)
      })

      it.concurrent('returns false for non-error values', () => {
        expect(isBaseError(null)).toBe(false)
        expect(isBaseError(undefined)).toBe(false)
        expect(isBaseError('string error')).toBe(false)
        expect(isBaseError({message: 'object error'})).toBe(false)
        expect(isBaseError(42)).toBe(false)
      })
    })

    describe('hasErrorCode', () => {
      it.concurrent('returns true when error has matching code', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_NOT_FOUND)
        expect(hasErrorCode(error, TemplateErrorCode.TEMPLATE_NOT_FOUND)).toBe(true)
      })

      it.concurrent('returns false when error has different code', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_NOT_FOUND)
        expect(hasErrorCode(error, TemplateErrorCode.TEMPLATE_INVALID)).toBe(false)
      })

      it.concurrent('returns false for non-BaseError instances', () => {
        const error = new Error('Regular error')
        expect(hasErrorCode(error, TemplateErrorCode.TEMPLATE_NOT_FOUND)).toBe(false)
      })

      it.concurrent('returns false for non-error values', () => {
        expect(hasErrorCode(null, TemplateErrorCode.TEMPLATE_NOT_FOUND)).toBe(false)
        expect(hasErrorCode(undefined, TemplateErrorCode.TEMPLATE_NOT_FOUND)).toBe(false)
        expect(hasErrorCode('string', TemplateErrorCode.TEMPLATE_NOT_FOUND)).toBe(false)
      })

      it.concurrent('works with AI error codes', () => {
        const error = createAIError('Test', AIErrorCode.AI_API_KEY_MISSING)
        expect(hasErrorCode(error, AIErrorCode.AI_API_KEY_MISSING)).toBe(true)
        expect(hasErrorCode(error, AIErrorCode.AI_TIMEOUT)).toBe(false)
      })

      it.concurrent('works with CLI error codes', () => {
        const error = createCLIError('Test', CLIErrorCode.DIRECTORY_EXISTS)
        expect(hasErrorCode(error, CLIErrorCode.DIRECTORY_EXISTS)).toBe(true)
        expect(hasErrorCode(error, CLIErrorCode.INVALID_PATH)).toBe(false)
      })
    })
  })

  describe('getUserFriendlyMessage', () => {
    describe('template errors', () => {
      it.concurrent('returns friendly message for TEMPLATE_NOT_FOUND', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_NOT_FOUND)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Template not found')
        expect(message).toContain('Please check')
      })

      it.concurrent('returns friendly message for TEMPLATE_INVALID', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_INVALID)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Invalid template')
      })

      it.concurrent('returns friendly message for TEMPLATE_FETCH_FAILED', () => {
        const error = createTemplateError('Test', TemplateErrorCode.TEMPLATE_FETCH_FAILED)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Failed to fetch template')
        expect(message).toContain('internet connection')
      })
    })

    describe('AI errors', () => {
      it.concurrent('returns friendly message for AI_API_KEY_MISSING', () => {
        const error = createAIError('Test', AIErrorCode.AI_API_KEY_MISSING)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('API key is missing')
        expect(message).toContain('OPENAI_API_KEY')
        expect(message).toContain('ANTHROPIC_API_KEY')
      })

      it.concurrent('returns friendly message for AI_PROVIDER_UNAVAILABLE', () => {
        const error = createAIError('Test', AIErrorCode.AI_PROVIDER_UNAVAILABLE)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('unavailable')
      })
    })

    describe('CLI errors', () => {
      it.concurrent('returns friendly message for INVALID_PROJECT_NAME', () => {
        const error = createCLIError('Must be lowercase', CLIErrorCode.INVALID_PROJECT_NAME)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Invalid project name')
        expect(message).toContain('Must be lowercase')
      })

      it.concurrent('returns friendly message for PATH_TRAVERSAL_ATTEMPT', () => {
        const error = createCLIError('Test', CLIErrorCode.PATH_TRAVERSAL_ATTEMPT)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Invalid path')
        expect(message).toContain('not allowed')
      })

      it.concurrent('returns friendly message for DIRECTORY_EXISTS', () => {
        const error = createCLIError('Test', CLIErrorCode.DIRECTORY_EXISTS)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Directory already exists')
        expect(message).toContain('--force')
      })

      it.concurrent('returns friendly message for PERMISSION_DENIED', () => {
        const error = createCLIError('Test', CLIErrorCode.PERMISSION_DENIED)
        const message = getUserFriendlyMessage(error)
        expect(message).toContain('Permission denied')
      })
    })

    describe('fallback behavior', () => {
      it.concurrent('returns original message for unrecognized BaseError codes', () => {
        const error = createTemplateError(
          'Custom error message',
          TemplateErrorCode.TEMPLATE_PARSE_ERROR,
        )
        const message = getUserFriendlyMessage(error)
        expect(message).toBe('Custom error message')
      })

      it.concurrent('returns message for regular Error instances', () => {
        const error = new Error('Regular error message')
        const message = getUserFriendlyMessage(error)
        expect(message).toBe('Regular error message')
      })

      it.concurrent('returns fallback message for non-error values', () => {
        expect(getUserFriendlyMessage(null)).toBe('An unknown error occurred.')
        expect(getUserFriendlyMessage(undefined)).toBe('An unknown error occurred.')
        expect(getUserFriendlyMessage('string error')).toBe('An unknown error occurred.')
      })
    })
  })

  describe('cross-domain error handling', () => {
    it.concurrent('validates errors work correctly across domains', () => {
      const templateError = createTemplateError(
        'Template issue',
        TemplateErrorCode.TEMPLATE_INVALID,
      )
      const aiError = createAIError('AI issue', AIErrorCode.AI_REQUEST_FAILED)
      const cliError = createCLIError('CLI issue', CLIErrorCode.INVALID_INPUT)
      const projectError = createProjectError(
        'Project issue',
        ProjectErrorCode.PACKAGE_JSON_NOT_FOUND,
      )

      // All should be BaseError instances
      expect(isBaseError(templateError)).toBe(true)
      expect(isBaseError(aiError)).toBe(true)
      expect(isBaseError(cliError)).toBe(true)
      expect(isBaseError(projectError)).toBe(true)

      // Each should have its correct code
      expect(hasErrorCode(templateError, TemplateErrorCode.TEMPLATE_INVALID)).toBe(true)
      expect(hasErrorCode(aiError, AIErrorCode.AI_REQUEST_FAILED)).toBe(true)
      expect(hasErrorCode(cliError, CLIErrorCode.INVALID_INPUT)).toBe(true)
      expect(hasErrorCode(projectError, ProjectErrorCode.PACKAGE_JSON_NOT_FOUND)).toBe(true)

      // Cross-domain checks should return false
      expect(hasErrorCode(templateError, AIErrorCode.AI_REQUEST_FAILED)).toBe(false)
      expect(hasErrorCode(aiError, CLIErrorCode.INVALID_INPUT)).toBe(false)
      expect(hasErrorCode(cliError, ProjectErrorCode.PACKAGE_JSON_NOT_FOUND)).toBe(false)
      expect(hasErrorCode(projectError, TemplateErrorCode.TEMPLATE_INVALID)).toBe(false)
    })
  })
})
