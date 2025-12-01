import {describe, expect, it} from 'vitest'

import {err, ok} from '../../src/result/factories'
import {isErr, isOk} from '../../src/result/guards'
import {
  flatMap,
  fromPromise,
  fromThrowable,
  map,
  mapErr,
  unwrap,
  unwrapOr,
} from '../../src/result/operators'

describe('@bfra.me/es/result - factory functions', () => {
  describe('ok()', () => {
    it.concurrent('should create a success Result with the given value', () => {
      const result = ok(42)

      expect(result.success).toBe(true)
      expect(result.data).toBe(42)
    })

    it.concurrent('should create Ok with string value', () => {
      const result = ok('hello')

      expect(result.success).toBe(true)
      expect(result.data).toBe('hello')
    })

    it.concurrent('should create Ok with object value', () => {
      const value = {name: 'test', count: 5}
      const result = ok(value)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({name: 'test', count: 5})
    })

    it.concurrent('should create Ok with array value', () => {
      const result = ok([1, 2, 3])

      expect(result.success).toBe(true)
      expect(result.data).toEqual([1, 2, 3])
    })

    it.concurrent('should create Ok with null value', () => {
      const result = ok(null)

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
    })

    it.concurrent('should create Ok with undefined value', () => {
      const result = ok(undefined)

      expect(result.success).toBe(true)
      expect(result.data).toBe(undefined)
    })
  })

  describe('err()', () => {
    it.concurrent('should create a failure Result with the given error', () => {
      const error = new Error('Something went wrong')
      const result = err(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })

    it.concurrent('should create Err with string error', () => {
      const result = err('validation failed')

      expect(result.success).toBe(false)
      expect(result.error).toBe('validation failed')
    })

    it.concurrent('should create Err with custom error object', () => {
      const customError = {code: 'E001', message: 'Custom error'}
      const result = err(customError)

      expect(result.success).toBe(false)
      expect(result.error).toEqual({code: 'E001', message: 'Custom error'})
    })

    it.concurrent('should create Err with number error code', () => {
      const result = err(404)

      expect(result.success).toBe(false)
      expect(result.error).toBe(404)
    })
  })
})

describe('@bfra.me/es/result - type guards', () => {
  describe('isOk()', () => {
    it.concurrent('should return true for Ok results', () => {
      const result = ok('value')

      expect(isOk(result)).toBe(true)
    })

    it.concurrent('should return false for Err results', () => {
      const result = err('error')

      expect(isOk(result)).toBe(false)
    })

    it.concurrent('should narrow type to Ok and allow accessing data', () => {
      const result = ok('hello')
      const isSuccess = isOk(result)

      expect(isSuccess).toBe(true)
      expect(isSuccess && result.data).toBe('hello')
    })

    it.concurrent('should work with complex object types', () => {
      interface User {
        id: number
        name: string
      }
      const user: User = {id: 1, name: 'John'}
      const result = ok(user)
      const isSuccess = isOk(result)

      expect(isSuccess).toBe(true)
      expect(isSuccess && result.data.name).toBe('John')
    })
  })

  describe('isErr()', () => {
    it.concurrent('should return true for Err results', () => {
      const result = err(new Error('failed'))

      expect(isErr(result)).toBe(true)
    })

    it.concurrent('should return false for Ok results', () => {
      const result = ok(42)

      expect(isErr(result)).toBe(false)
    })

    it.concurrent('should narrow type to Err and allow accessing error', () => {
      const result = err('not found')
      const isFailure = isErr(result)

      expect(isFailure).toBe(true)
      expect(isFailure && result.error).toBe('not found')
    })

    it.concurrent('should work with Error objects', () => {
      const error = new Error('Something went wrong')
      const result = err(error)
      const isFailure = isErr(result)

      expect(isFailure).toBe(true)
      expect(isFailure && result.error.message).toBe('Something went wrong')
    })
  })
})

describe('@bfra.me/es/result - operators', () => {
  describe('unwrap()', () => {
    it.concurrent('should return value for Ok result', () => {
      const result = ok(100)

      expect(unwrap(result)).toBe(100)
    })

    it.concurrent('should throw for Err result', () => {
      const result = err(new Error('error message'))

      expect(() => unwrap(result)).toThrow()
    })

    it.concurrent('should throw with default error message', () => {
      const result = err('test error')

      expect(() => unwrap(result)).toThrow('Attempted to unwrap an Err result: test error')
    })

    it.concurrent('should throw with custom error message', () => {
      const result = err('ignored')

      expect(() => unwrap(result, 'Custom message')).toThrow('Custom message')
    })

    it.concurrent('should return complex objects from Ok', () => {
      const value = {a: 1, b: 'two'}
      const result = ok(value)

      expect(unwrap(result)).toEqual({a: 1, b: 'two'})
    })
  })

  describe('unwrapOr()', () => {
    it.concurrent('should return value for Ok result', () => {
      const result = ok(42)

      expect(unwrapOr(result, 0)).toBe(42)
    })

    it.concurrent('should return default for Err result', () => {
      const result = err('error')

      expect(unwrapOr(result, 'default')).toBe('default')
    })

    it.concurrent('should return default value with different type', () => {
      const result = err('not found')

      expect(unwrapOr(result, -1)).toBe(-1)
    })

    it.concurrent('should work with null default', () => {
      const result = err(new Error('fail'))

      expect(unwrapOr(result, null as unknown as string)).toBe(null)
    })

    it.concurrent('should work with objects', () => {
      const defaultValue = {name: 'default'}
      const result = err('error')

      expect(unwrapOr(result, defaultValue)).toEqual({name: 'default'})
    })
  })

  describe('map()', () => {
    it.concurrent('should transform Ok value', () => {
      const result = ok(5)
      const mapped = map(result, x => x * 2)

      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe(10)
    })

    it.concurrent('should pass through Err unchanged', () => {
      const error = 'original error'
      const result = err(error)
      const mapped = map(result, (x: number) => x * 2)

      expect(isErr(mapped)).toBe(true)
      expect(isErr(mapped) && mapped.error).toBe('original error')
    })

    it.concurrent('should chain multiple map calls', () => {
      const result = ok(10)
      const mapped = map(
        map(result, x => x + 5),
        x => x * 2,
      )

      expect(unwrap(mapped)).toBe(30)
    })

    it.concurrent('should transform to different type', () => {
      const result = ok(42)
      const mapped = map(result, x => x.toString())

      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe('42')
    })

    it.concurrent('should work with object transformation', () => {
      const result = ok({firstName: 'John', lastName: 'Doe'})
      const mapped = map(result, user => `${user.firstName} ${user.lastName}`)

      expect(unwrap(mapped)).toBe('John Doe')
    })
  })

  describe('flatMap()', () => {
    it.concurrent('should chain Ok results correctly', () => {
      const result = ok(10)
      const flatMapped = flatMap(result, x => ok(x * 2))

      expect(isOk(flatMapped)).toBe(true)
      expect(unwrap(flatMapped)).toBe(20)
    })

    it.concurrent('should propagate Err from inner function', () => {
      const result = ok(10)
      const flatMapped = flatMap(result, () => err('inner error'))

      expect(isErr(flatMapped)).toBe(true)
      expect(isErr(flatMapped) && flatMapped.error).toBe('inner error')
    })

    it.concurrent('should pass through outer Err', () => {
      const result = err('outer error')
      const flatMapped = flatMap(result, (x: number) => ok(x * 2))

      expect(isErr(flatMapped)).toBe(true)
      expect(isErr(flatMapped) && flatMapped.error).toBe('outer error')
    })

    it.concurrent('should chain multiple flatMap calls', () => {
      const divide = (a: number, b: number) => (b === 0 ? err('Division by zero') : ok(a / b))

      const result = ok(100)
      const chained = flatMap(
        flatMap(result, x => divide(x, 2)),
        x => divide(x, 5),
      )

      expect(unwrap(chained)).toBe(10)
    })

    it.concurrent('should short-circuit on first error', () => {
      const divide = (a: number, b: number) => (b === 0 ? err('Division by zero') : ok(a / b))

      const result = ok(100)
      const chained = flatMap(
        flatMap(result, x => divide(x, 0)),
        x => divide(x, 5),
      )

      expect(isErr(chained)).toBe(true)
      expect(isErr(chained) && chained.error).toBe('Division by zero')
    })
  })

  describe('mapErr()', () => {
    it.concurrent('should transform Err error', () => {
      const result = err('error code 1')
      const mapped = mapErr(result, e => new Error(e))

      expect(isErr(mapped)).toBe(true)
      expect(isErr(mapped) && mapped.error).toBeInstanceOf(Error)
      expect(isErr(mapped) && mapped.error.message).toBe('error code 1')
    })

    it.concurrent('should pass through Ok unchanged', () => {
      const result = ok(42)
      const mapped = mapErr(result, (e: string) => new Error(e))

      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe(42)
    })

    it.concurrent('should transform error to different type', () => {
      interface DetailedError {
        code: number
        message: string
      }
      const result = err('not found')
      const mapped = mapErr(result, (e): DetailedError => ({code: 404, message: e}))

      expect(isErr(mapped)).toBe(true)
      expect(isErr(mapped) && mapped.error).toEqual({code: 404, message: 'not found'})
    })

    it.concurrent('should chain with map()', () => {
      const result = err('original')
      const mapped = mapErr(
        map(result, (x: number) => x * 2),
        e => `wrapped: ${e}`,
      )

      expect(isErr(mapped)).toBe(true)
      expect(isErr(mapped) && mapped.error).toBe('wrapped: original')
    })
  })
})

describe('@bfra.me/es/result - conversion functions', () => {
  describe('fromThrowable()', () => {
    it.concurrent('should return Ok for non-throwing function', () => {
      const result = fromThrowable(() => 42)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe(42)
    })

    it.concurrent('should catch Error and return Err', () => {
      const result = fromThrowable(() => {
        throw new Error('thrown error')
      })

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('thrown error')
    })

    it.concurrent('should convert non-Error throws to Error', () => {
      const result = fromThrowable(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'string error'
      })

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error).toBeInstanceOf(Error)
      expect(isErr(result) && result.error.message).toBe('string error')
    })

    it.concurrent('should handle number throws', () => {
      const result = fromThrowable(() => {
        // eslint-disable-next-line no-throw-literal
        throw 404
      })

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('404')
    })

    it.concurrent('should preserve Error subclasses', () => {
      class CustomError extends Error {
        code: number
        constructor(message: string, code: number) {
          super(message)
          this.name = 'CustomError'
          this.code = code
        }
      }

      const result = fromThrowable(() => {
        throw new CustomError('custom', 500)
      })

      expect(isErr(result)).toBe(true)
      const isCustomError = isErr(result) && result.error instanceof CustomError
      expect(isCustomError).toBe(true)
      expect(isCustomError && result.error.code).toBe(500)
    })

    it.concurrent('should work with complex return values', () => {
      const result = fromThrowable(() => ({
        users: [{id: 1, name: 'Test'}],
        total: 1,
      }))

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toEqual({
        users: [{id: 1, name: 'Test'}],
        total: 1,
      })
    })

    it.concurrent('should handle JSON.parse errors', () => {
      const result = fromThrowable(() => JSON.parse('invalid json') as unknown)

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error).toBeInstanceOf(SyntaxError)
    })
  })

  describe('fromPromise()', () => {
    it.concurrent('should return Ok for resolved promise', async () => {
      const result = await fromPromise(Promise.resolve('success'))

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe('success')
    })

    it.concurrent('should return Err for rejected promise with Error', async () => {
      const error = new Error('rejection')
      const result = await fromPromise(Promise.reject(error))

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error).toBe(error)
    })

    it.concurrent('should convert non-Error rejections to Error', async () => {
      // eslint-disable-next-line prefer-promise-reject-errors
      const result = await fromPromise(Promise.reject('string rejection'))

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error).toBeInstanceOf(Error)
      expect(isErr(result) && result.error.message).toBe('string rejection')
    })

    it.concurrent('should handle async operations', async () => {
      const asyncOperation = async (): Promise<number> => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return 42
      }

      const result = await fromPromise(asyncOperation())

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe(42)
    })

    it.concurrent('should handle async operation failures', async () => {
      const asyncOperation = async (): Promise<number> => {
        await new Promise(resolve => setTimeout(resolve, 1))
        throw new Error('async failure')
      }

      const result = await fromPromise(asyncOperation())

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('async failure')
    })

    it.concurrent('should work with Promise.all', async () => {
      const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]

      const result = await fromPromise(Promise.all(promises))

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toEqual([1, 2, 3])
    })

    it.concurrent('should capture first rejection in Promise.all', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject(new Error('second failed')),
        Promise.resolve(3),
      ]

      const result = await fromPromise(Promise.all(promises))

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toBe('second failed')
    })
  })
})

describe('@bfra.me/es/result - real-world scenarios', () => {
  it.concurrent('should handle parsing configuration', () => {
    interface Config {
      port: number
      host: string
    }

    const parseConfig = (json: string) => {
      return fromThrowable(() => {
        const parsed: unknown = JSON.parse(json)
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('port' in parsed) ||
          !('host' in parsed) ||
          typeof parsed.port !== 'number' ||
          typeof parsed.host !== 'string'
        ) {
          throw new TypeError('Invalid config structure')
        }
        return parsed as Config
      })
    }

    const validResult = parseConfig('{"port": 3000, "host": "localhost"}')
    expect(isOk(validResult)).toBe(true)
    expect(unwrap(validResult)).toEqual({port: 3000, host: 'localhost'})

    const invalidResult = parseConfig('not json')
    expect(isErr(invalidResult)).toBe(true)
  })

  it.concurrent('should compose validation pipeline', () => {
    const validateNonEmpty = (s: string) => (s.length > 0 ? ok(s) : err('String cannot be empty'))

    const validateMaxLength = (max: number) => (s: string) =>
      s.length <= max ? ok(s) : err(`String exceeds max length of ${max}`)

    const validateFormat = (s: string) =>
      /^[a-z]+$/.test(s) ? ok(s) : err('String must contain only lowercase letters')

    const validate = (input: string) =>
      flatMap(flatMap(validateNonEmpty(input), validateMaxLength(10)), validateFormat)

    expect(isOk(validate('hello'))).toBe(true)
    expect(isErr(validate(''))).toBe(true)
    expect(isErr(validate('this is way too long'))).toBe(true)
    expect(isErr(validate('UPPERCASE'))).toBe(true)
  })

  it.concurrent('should handle API response parsing', async () => {
    interface ApiResponse {
      data: {id: number; name: string}[]
    }

    const mockFetch = async (success: boolean): Promise<ApiResponse> => {
      await new Promise(resolve => setTimeout(resolve, 1))
      if (!success) {
        throw new Error('Network error')
      }
      return {data: [{id: 1, name: 'Item'}]}
    }

    const successResult = await fromPromise(mockFetch(true))
    expect(isOk(successResult)).toBe(true)
    const successData = unwrap(successResult)
    expect(successData.data[0]?.name).toBe('Item')

    const failResult = await fromPromise(mockFetch(false))
    expect(isErr(failResult)).toBe(true)
  })

  it.concurrent('should chain async operations', async () => {
    const fetchUser = async (id: number) => {
      return id > 0 ? ok({id, name: `User ${id}`}) : err(new Error('Invalid user ID'))
    }

    const fetchPosts = async (userId: number) => {
      return ok([{title: `Post by user ${userId}`}])
    }

    const result = await fetchUser(1)
    expect(isOk(result)).toBe(true)

    // Type narrowing allows safe access after checking
    const userResult = unwrap(result)
    const postsResult = await fetchPosts(userResult.id)
    expect(isOk(postsResult)).toBe(true)

    const posts = unwrap(postsResult)
    expect(posts[0]?.title).toBe('Post by user 1')

    const invalidResult = await fetchUser(-1)
    expect(isErr(invalidResult)).toBe(true)
  })

  it.concurrent('should provide type-safe error handling in functions', () => {
    const parse = (input: string) => {
      const num = Number.parseInt(input, 10)
      return Number.isNaN(num) ? err(`Cannot parse "${input}" as number`) : ok(num)
    }

    const validate = (value: number) => {
      return value >= 0 ? ok(value) : err('Must be non-negative')
    }

    const process = (input: string) => {
      const parseResult = parse(input)
      if (isErr(parseResult)) return parseResult

      return validate(parseResult.data)
    }

    const successResult = process('42')
    expect(isOk(successResult)).toBe(true)
    expect(unwrap(successResult)).toBe(42)

    const parseErrorResult = process('abc')
    expect(isErr(parseErrorResult)).toBe(true)
    expect(isErr(parseErrorResult) && parseErrorResult.error).toContain('Cannot parse')

    const validationErrorResult = process('-5')
    expect(isErr(validationErrorResult)).toBe(true)
    expect(isErr(validationErrorResult) && validationErrorResult.error).toBe('Must be non-negative')
  })
})
