import {describe, expect, it} from 'vitest'

import {isErr, isOk} from '../../src/result/guards'
import {isString} from '../../src/types/guards'
import {isWithinBoundary, validatePath} from '../../src/validation/path'
import {sanitizeInput} from '../../src/validation/sanitize'
import {combineValidators, createValidator, fromGuard} from '../../src/validation/validator'
import {isEmail, isSemver, isUrl, isUuid} from '../../src/validation/validators'

describe('validatePath', () => {
  it.concurrent('should accept valid paths', () => {
    const result = validatePath('src/index.ts')
    expect(isOk(result)).toBe(true)
    expect(isOk(result) && result.data).toBe('src/index.ts')
  })

  it.concurrent('should reject empty paths', () => {
    const result = validatePath('')
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('EMPTY_PATH')
  })

  it.concurrent('should reject paths with traversal sequences', () => {
    const result = validatePath('../secret/file.txt')
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('PATH_TRAVERSAL')
  })

  it.concurrent('should reject paths exceeding max length', () => {
    const longPath = 'a'.repeat(5000)
    const result = validatePath(longPath)
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('PATH_TOO_LONG')
  })

  it.concurrent('should respect custom max length', () => {
    const result = validatePath('abcdefghij', {maxLength: 5})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('PATH_TOO_LONG')
  })

  it.concurrent('should reject absolute paths when not allowed', () => {
    const result = validatePath('/etc/passwd', {allowAbsolute: false})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('ABSOLUTE_NOT_ALLOWED')
  })

  it.concurrent('should reject relative paths when not allowed', () => {
    const result = validatePath('relative/path', {allowRelative: false})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('RELATIVE_NOT_ALLOWED')
  })

  it.concurrent('should accept Windows absolute paths', () => {
    const result = validatePath(String.raw`C:\Users\file.txt`)
    expect(isOk(result)).toBe(true)
  })
})

describe('isWithinBoundary', () => {
  it.concurrent('should return true for paths within boundary', () => {
    expect(isWithinBoundary('/home/user/project/file.txt', '/home/user/project')).toBe(true)
  })

  it.concurrent('should return true for exact boundary match', () => {
    expect(isWithinBoundary('/home/user/project', '/home/user/project')).toBe(true)
  })

  it.concurrent('should return false for paths outside boundary', () => {
    expect(isWithinBoundary('/home/other/file.txt', '/home/user/project')).toBe(false)
  })

  it.concurrent('should handle trailing slashes', () => {
    expect(isWithinBoundary('/home/user/project/file.txt', '/home/user/project/')).toBe(true)
  })

  it.concurrent('should normalize Windows paths', () => {
    expect(
      isWithinBoundary(String.raw`C:\Users\project\file.txt`, String.raw`C:\Users\project`),
    ).toBe(true)
  })
})

describe('sanitizeInput', () => {
  it.concurrent('should escape HTML entities by default', () => {
    const result = sanitizeInput('<script>alert("xss")</script>')
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
  })

  it.concurrent('should remove null bytes by default', () => {
    const result = sanitizeInput('hello\0world')
    expect(result).toBe('helloworld')
  })

  it.concurrent('should trim whitespace by default', () => {
    const result = sanitizeInput('  hello  ')
    expect(result).toBe('hello')
  })

  it.concurrent('should respect escapeHtml option', () => {
    const result = sanitizeInput('<div>', {escapeHtml: false})
    expect(result).toBe('<div>')
  })

  it.concurrent('should respect removeNullBytes option', () => {
    const result = sanitizeInput('hello\0world', {removeNullBytes: false})
    expect(result).toBe('hello\0world')
  })

  it.concurrent('should respect trim option', () => {
    const result = sanitizeInput('  hello  ', {trim: false})
    expect(result).toBe('  hello  ')
  })

  it.concurrent('should escape ampersand', () => {
    const result = sanitizeInput('a & b')
    expect(result).toBe('a &amp; b')
  })

  it.concurrent('should escape single quotes', () => {
    const result = sanitizeInput("it's")
    expect(result).toBe('it&#x27;s')
  })
})

describe('createValidator', () => {
  interface TestUser {
    name: string
    age: number
  }

  it.concurrent('should validate valid objects', () => {
    const validateUser = createValidator<TestUser>({
      name: [v => (typeof v === 'string' && v.length > 0 ? undefined : 'Name is required')],
      age: [v => (typeof v === 'number' && v >= 0 ? undefined : 'Age must be non-negative')],
    })

    const result = validateUser({name: 'John', age: 30})
    expect(isOk(result)).toBe(true)
  })

  it.concurrent('should reject invalid objects', () => {
    const validateUser = createValidator<TestUser>({
      name: [v => (typeof v === 'string' && v.length > 0 ? undefined : 'Name is required')],
    })

    const result = validateUser({name: '', age: 30})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.message).toContain('Name is required')
  })

  it.concurrent('should reject non-objects', () => {
    const validateUser = createValidator<TestUser>({})
    const result = validateUser('not an object')
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('INVALID_TYPE')
  })

  it.concurrent('should reject null', () => {
    const validateUser = createValidator<TestUser>({})
    const result = validateUser(null)
    expect(isErr(result)).toBe(true)
  })

  it.concurrent('should stop on first error when configured', () => {
    const validateUser = createValidator<TestUser>(
      {
        name: [_ => 'Error 1'],
        age: [_ => 'Error 2'],
      },
      {stopOnFirst: true},
    )

    const result = validateUser({name: 'John', age: 30})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.message).toBe('Error 1')
    expect(isErr(result) && result.error.field).toBeDefined()
  })

  it.concurrent('should collect all errors by default', () => {
    const validateUser = createValidator<TestUser>({
      name: [_ => 'Name error'],
      age: [_ => 'Age error'],
    })

    const result = validateUser({name: 'John', age: 30})
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.message).toContain('Name error')
    expect(isErr(result) && result.error.message).toContain('Age error')
  })
})

describe('fromGuard', () => {
  it.concurrent('should create validator from type guard', () => {
    const validateString = fromGuard(isString, 'Value must be a string')

    const validResult = validateString('hello')
    expect(isOk(validResult)).toBe(true)
    expect(isOk(validResult) && validResult.data).toBe('hello')

    const invalidResult = validateString(123)
    expect(isErr(invalidResult)).toBe(true)
    expect(isErr(invalidResult) && invalidResult.error.message).toBe('Value must be a string')
  })
})

describe('combineValidators', () => {
  it.concurrent('should run validators in sequence', () => {
    const v1 = fromGuard(isString, 'Must be string')
    const v2 = fromGuard(
      (v): v is string => typeof v === 'string' && v.length > 0,
      'Must not be empty',
    )

    const combined = combineValidators(v1, v2)

    const validResult = combined('hello')
    expect(isOk(validResult)).toBe(true)

    const emptyResult = combined('')
    expect(isErr(emptyResult)).toBe(true)
  })

  it.concurrent('should stop on first failure', () => {
    const v1 = fromGuard(isString, 'Must be string')
    const v2 = fromGuard(
      (v): v is string => typeof v === 'string' && v.length > 0,
      'Must not be empty',
    )

    const combined = combineValidators(v1, v2)
    const result = combined(123)
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.message).toBe('Must be string')
  })

  it.concurrent('should return error when no validators provided', () => {
    const combined = combineValidators<string>()
    const result = combined('test')
    expect(isErr(result)).toBe(true)
    expect(isErr(result) && result.error.code).toBe('NO_VALIDATORS')
  })
})

describe('isEmail', () => {
  it.concurrent('should accept valid emails', () => {
    expect(isEmail('user@example.com')).toBe(true)
    expect(isEmail('user.name@example.co.uk')).toBe(true)
    expect(isEmail('user+tag@example.org')).toBe(true)
  })

  it.concurrent('should reject invalid emails', () => {
    expect(isEmail('invalid')).toBe(false)
    expect(isEmail('invalid@')).toBe(false)
    expect(isEmail('@example.com')).toBe(false)
    expect(isEmail('user@.com')).toBe(false)
  })
})

describe('isUrl', () => {
  it.concurrent('should accept valid URLs', () => {
    expect(isUrl('https://example.com')).toBe(true)
    expect(isUrl('http://localhost:3000')).toBe(true)
    expect(isUrl('ftp://files.example.com/path')).toBe(true)
  })

  it.concurrent('should reject invalid URLs', () => {
    expect(isUrl('not a url')).toBe(false)
    expect(isUrl('example.com')).toBe(false)
    expect(isUrl('')).toBe(false)
  })
})

describe('isUuid', () => {
  it.concurrent('should accept valid UUIDs', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true)
  })

  it.concurrent('should reject invalid UUIDs', () => {
    expect(isUuid('invalid')).toBe(false)
    expect(isUuid('123e4567-e89b-12d3-a456')).toBe(false)
    expect(isUuid('123e4567-e89b-12d3-a456-42661417400g')).toBe(false)
  })
})

describe('isSemver', () => {
  it.concurrent('should accept valid semver versions', () => {
    expect(isSemver('1.0.0')).toBe(true)
    expect(isSemver('0.0.1')).toBe(true)
    expect(isSemver('10.20.30')).toBe(true)
    expect(isSemver('1.0.0-alpha')).toBe(true)
    expect(isSemver('1.0.0-beta.1')).toBe(true)
    expect(isSemver('1.0.0+build')).toBe(true)
    expect(isSemver('1.0.0-alpha+build')).toBe(true)
  })

  it.concurrent('should reject invalid semver versions', () => {
    expect(isSemver('1')).toBe(false)
    expect(isSemver('1.0')).toBe(false)
    expect(isSemver('v1.0.0')).toBe(false)
    expect(isSemver('1.0.0.0')).toBe(false)
  })
})

describe('validation module exports', () => {
  it.concurrent('should export all expected functions', async () => {
    const validationModule = await import('../../src/validation/index')

    expect(validationModule.validatePath).toBeDefined()
    expect(validationModule.isWithinBoundary).toBeDefined()
    expect(validationModule.sanitizeInput).toBeDefined()
    expect(validationModule.createValidator).toBeDefined()
    expect(validationModule.fromGuard).toBeDefined()
    expect(validationModule.combineValidators).toBeDefined()
    expect(validationModule.isEmail).toBeDefined()
    expect(validationModule.isUrl).toBeDefined()
    expect(validationModule.isUuid).toBeDefined()
    expect(validationModule.isSemver).toBeDefined()
  })
})
