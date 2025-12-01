import {describe, expect, it} from 'vitest'

import {BaseError} from '../../src/error/base'
import {createError, formatError, withErrorContext} from '../../src/error/factory'
import {
  NotFoundError,
  PermissionError,
  TimeoutError,
  ValidationError,
} from '../../src/error/specialized'

describe('@bfra.me/es/error - BaseError', () => {
  describe('construction', () => {
    it.concurrent('should create error with message only', () => {
      const error = new BaseError('Something went wrong')

      expect.soft(error.message).toBe('Something went wrong')
      expect.soft(error.name).toBe('BaseError')
      expect.soft(error.code).toBe('UNKNOWN_ERROR')
      expect.soft(error.context).toBeUndefined()
      expect(error.cause).toBeUndefined()
    })

    it.concurrent('should create error with custom code', () => {
      const error = new BaseError('File not found', {code: 'FILE_NOT_FOUND'})

      expect.soft(error.code).toBe('FILE_NOT_FOUND')
      expect(error.message).toBe('File not found')
    })

    it.concurrent('should create error with cause', () => {
      const cause = new Error('Original error')
      const error = new BaseError('Wrapped error', {cause})

      expect.soft(error.cause).toBe(cause)
      expect(error.message).toBe('Wrapped error')
    })

    it.concurrent('should create error with context', () => {
      const context = {userId: 123, operation: 'delete'}
      const error = new BaseError('Operation failed', {context})

      expect(error.context).toEqual({userId: 123, operation: 'delete'})
    })

    it.concurrent('should create error with all options', () => {
      const cause = new Error('Root cause')
      const context = {requestId: 'abc-123'}
      const error = new BaseError('Complete error', {
        code: 'CUSTOM_ERROR',
        cause,
        context,
      })

      expect.soft(error.message).toBe('Complete error')
      expect.soft(error.code).toBe('CUSTOM_ERROR')
      expect.soft(error.cause).toBe(cause)
      expect(error.context).toEqual({requestId: 'abc-123'})
    })
  })

  describe('inheritance', () => {
    it.concurrent('should be instanceof Error', () => {
      const error = new BaseError('Test error')

      expect.soft(error instanceof Error).toBe(true)
      expect(error instanceof BaseError).toBe(true)
    })
  })
})

describe('@bfra.me/es/error - createError()', () => {
  it.concurrent('should create BaseError with message only', () => {
    const error = createError('Simple error')

    expect.soft(error instanceof BaseError).toBe(true)
    expect.soft(error.message).toBe('Simple error')
    expect(error.code).toBe('UNKNOWN_ERROR')
  })

  it.concurrent('should create BaseError with all options', () => {
    const cause = new Error('Cause')
    const context = {key: 'value'}
    const error = createError('Configured error', {
      code: 'CONFIG_ERROR',
      cause,
      context,
    })

    expect.soft(error.message).toBe('Configured error')
    expect.soft(error.code).toBe('CONFIG_ERROR')
    expect.soft(error.cause).toBe(cause)
    expect(error.context).toEqual({key: 'value'})
  })
})

describe('@bfra.me/es/error - formatError()', () => {
  describe('baseError formatting', () => {
    it.concurrent('should format BaseError with code and message', () => {
      const error = new BaseError('Test message', {code: 'TEST_CODE'})

      expect(formatError(error)).toBe('[TEST_CODE] Test message')
    })

    it.concurrent('should include context in formatted output', () => {
      const error = new BaseError('Error with context', {
        code: 'CTX_ERROR',
        context: {userId: 42},
      })
      const formatted = formatError(error)

      expect.soft(formatted).toContain('[CTX_ERROR] Error with context')
      expect(formatted).toContain('Context: {"userId":42}')
    })

    it.concurrent('should include cause in formatted output', () => {
      const cause = new Error('Original error')
      const error = new BaseError('Wrapped error', {
        code: 'WRAP_ERROR',
        cause,
      })
      const formatted = formatError(error)

      expect.soft(formatted).toContain('[WRAP_ERROR] Wrapped error')
      expect(formatted).toContain('Cause: Original error')
    })

    it.concurrent('should format nested BaseError causes', () => {
      const innerError = new BaseError('Inner error', {code: 'INNER'})
      const outerError = new BaseError('Outer error', {
        code: 'OUTER',
        cause: innerError,
      })
      const formatted = formatError(outerError)

      expect.soft(formatted).toContain('[OUTER] Outer error')
      expect(formatted).toContain('Cause: [INNER] Inner error')
    })
  })

  describe('other value formatting', () => {
    it.concurrent('should format regular Error', () => {
      expect(formatError(new Error('Regular error message'))).toBe('Regular error message')
    })

    it.concurrent('should format string errors', () => {
      expect(formatError('Just a string')).toBe('Just a string')
    })

    it.concurrent('should format number errors', () => {
      expect(formatError(42)).toBe('42')
    })

    it.concurrent('should format null and undefined', () => {
      expect.soft(formatError(null)).toBe('null')
      expect(formatError(undefined)).toBe('undefined')
    })

    it.concurrent('should format complex objects', () => {
      expect(formatError({error: 'object'})).toBe('[object Object]')
    })
  })
})

function captureError<T extends Error>(fn: () => unknown): T | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error as T
  }
}

describe('@bfra.me/es/error - withErrorContext()', () => {
  describe('successful execution', () => {
    it.concurrent('should return function result on success', () => {
      const result = withErrorContext(() => 'success', {operation: 'test'})

      expect(result).toBe('success')
    })
  })

  describe('error wrapping', () => {
    it.concurrent('should add context to thrown BaseError', () => {
      const fn = (): never => {
        throw new BaseError('Original', {code: 'ORIG', context: {existing: true}})
      }

      const caughtError = captureError<BaseError>(() => withErrorContext(fn, {added: 'context'}))

      expect.soft(caughtError).toBeInstanceOf(BaseError)
      expect.soft(caughtError?.message).toBe('Original')
      expect.soft(caughtError?.code).toBe('ORIG')
      expect(caughtError?.context).toEqual({existing: true, added: 'context'})
    })

    it.concurrent('should wrap regular Error with context', () => {
      const fn = (): never => {
        throw new Error('Regular error')
      }

      const caughtError = captureError<BaseError>(() => withErrorContext(fn, {operation: 'wrap'}))

      expect.soft(caughtError).toBeInstanceOf(BaseError)
      expect.soft(caughtError?.message).toBe('Regular error')
      expect.soft(caughtError?.context).toEqual({operation: 'wrap'})
      expect(caughtError?.cause).toBeInstanceOf(Error)
    })

    it.concurrent('should wrap non-error values with context', () => {
      const throwString = (): never => {
        // eslint-disable-next-line no-throw-literal
        throw 'string error'
      }

      const caughtError = captureError<BaseError>(() =>
        withErrorContext(throwString, {info: 'context'}),
      )

      expect.soft(caughtError).toBeInstanceOf(BaseError)
      expect.soft(caughtError?.message).toBe('string error')
      expect(caughtError?.context).toEqual({info: 'context'})
    })

    it.concurrent('should preserve cause from BaseError', () => {
      const cause = new Error('Root cause')
      const fn = (): never => {
        throw new BaseError('With cause', {cause})
      }

      const caughtError = captureError<BaseError>(() => withErrorContext(fn, {extra: 'info'}))

      expect.soft(caughtError).toBeInstanceOf(BaseError)
      expect(caughtError?.cause).toBe(cause)
    })
  })
})

describe('@bfra.me/es/error - specialized errors', () => {
  describe('validationError', () => {
    it.concurrent('should create with message only', () => {
      const error = new ValidationError('Invalid input')

      expect.soft(error.message).toBe('Invalid input')
      expect.soft(error.name).toBe('ValidationError')
      expect.soft(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBeUndefined()
    })

    it.concurrent('should create with field name', () => {
      const error = new ValidationError('Email is invalid', {field: 'email'})

      expect.soft(error.field).toBe('email')
      expect(error.message).toBe('Email is invalid')
    })

    it.concurrent('should support cause and context', () => {
      const cause = new Error('Parse error')
      const error = new ValidationError('Failed to parse', {
        cause,
        context: {input: 'bad data'},
        field: 'jsonField',
      })

      expect.soft(error.cause).toBe(cause)
      expect.soft(error.context).toEqual({input: 'bad data'})
      expect(error.field).toBe('jsonField')
    })

    it.concurrent('should be instanceof BaseError and Error', () => {
      const error = new ValidationError('Test')

      expect.soft(error instanceof Error).toBe(true)
      expect.soft(error instanceof BaseError).toBe(true)
      expect(error instanceof ValidationError).toBe(true)
    })
  })

  describe('notFoundError', () => {
    it.concurrent('should create with message only', () => {
      const error = new NotFoundError('Resource not found')

      expect.soft(error.message).toBe('Resource not found')
      expect.soft(error.name).toBe('NotFoundError')
      expect.soft(error.code).toBe('NOT_FOUND')
      expect(error.resource).toBeUndefined()
    })

    it.concurrent('should create with resource name', () => {
      const error = new NotFoundError('User not found', {resource: 'user'})

      expect(error.resource).toBe('user')
    })

    it.concurrent('should support cause and context', () => {
      const error = new NotFoundError('Document missing', {
        resource: 'document',
        context: {id: 'doc-123'},
      })

      expect.soft(error.resource).toBe('document')
      expect(error.context).toEqual({id: 'doc-123'})
    })

    it.concurrent('should be instanceof BaseError', () => {
      const error = new NotFoundError('Test')

      expect.soft(error instanceof BaseError).toBe(true)
      expect(error instanceof NotFoundError).toBe(true)
    })
  })

  describe('permissionError', () => {
    it.concurrent('should create with message only', () => {
      const error = new PermissionError('Access denied')

      expect.soft(error.message).toBe('Access denied')
      expect.soft(error.name).toBe('PermissionError')
      expect.soft(error.code).toBe('PERMISSION_DENIED')
      expect(error.requiredPermission).toBeUndefined()
    })

    it.concurrent('should create with required permission', () => {
      const error = new PermissionError('Cannot delete', {requiredPermission: 'admin:delete'})

      expect(error.requiredPermission).toBe('admin:delete')
    })

    it.concurrent('should support cause and context', () => {
      const error = new PermissionError('Insufficient privileges', {
        requiredPermission: 'write',
        context: {userId: 42, resource: 'file'},
      })

      expect.soft(error.requiredPermission).toBe('write')
      expect(error.context).toEqual({userId: 42, resource: 'file'})
    })

    it.concurrent('should be instanceof BaseError', () => {
      const error = new PermissionError('Test')

      expect.soft(error instanceof BaseError).toBe(true)
      expect(error instanceof PermissionError).toBe(true)
    })
  })

  describe('timeoutError', () => {
    it.concurrent('should create with timeout duration', () => {
      const error = new TimeoutError(5000)

      expect.soft(error.message).toBe('Operation timed out after 5000ms')
      expect.soft(error.name).toBe('TimeoutError')
      expect.soft(error.code).toBe('TIMEOUT')
      expect(error.timeoutMs).toBe(5000)
    })

    it.concurrent('should create with custom message', () => {
      const error = new TimeoutError(3000, {message: 'Request timed out'})

      expect.soft(error.message).toBe('Request timed out')
      expect(error.timeoutMs).toBe(3000)
    })

    it.concurrent('should support cause and context', () => {
      const cause = new Error('Network issue')
      const error = new TimeoutError(1000, {
        cause,
        context: {endpoint: '/api/data'},
      })

      expect.soft(error.cause).toBe(cause)
      expect.soft(error.context).toEqual({endpoint: '/api/data'})
      expect(error.timeoutMs).toBe(1000)
    })

    it.concurrent('should be instanceof BaseError', () => {
      const error = new TimeoutError(1000)

      expect.soft(error instanceof BaseError).toBe(true)
      expect(error instanceof TimeoutError).toBe(true)
    })
  })
})

describe('@bfra.me/es/error - inheritance and compatibility', () => {
  it.concurrent('should work with try-catch blocks', () => {
    const caught = captureError<ValidationError>(() => {
      throw new ValidationError('Test validation', {field: 'test'})
    })

    expect.soft(caught instanceof ValidationError).toBe(true)
    expect.soft(caught instanceof BaseError).toBe(true)
    expect(caught instanceof Error).toBe(true)
  })

  it.concurrent('should support error cause chaining', () => {
    const level1 = new Error('Database connection failed')
    const level2 = new NotFoundError('User query failed', {cause: level1, resource: 'user'})
    const level3 = new ValidationError('Login failed', {cause: level2, field: 'credentials'})

    expect.soft(level3.cause).toBe(level2)
    expect((level3.cause as BaseError).cause).toBe(level1)
  })

  it.concurrent('should format specialized errors correctly', () => {
    const error = new ValidationError('Invalid email', {
      field: 'email',
      context: {value: 'not-an-email'},
    })
    const formatted = formatError(error)

    expect.soft(formatted).toContain('[VALIDATION_ERROR]')
    expect.soft(formatted).toContain('Invalid email')
    expect(formatted).toContain('Context:')
  })
})
