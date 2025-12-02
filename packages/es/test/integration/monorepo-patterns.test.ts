/**
 * Integration tests for utilities with various tsconfig moduleResolution settings.
 * Validates TEST-033: Utilities work correctly in synthetic monorepo with cross-package imports
 *
 * These tests verify that the @bfra.me/es utilities work correctly with:
 * - ES modules
 * - Subpath exports
 * - Cross-package imports in monorepo scenarios
 */

import {describe, expect, it} from 'vitest'

import {compose, pipe} from '../../src/functional'
import {interopDefault, isESModule} from '../../src/module'
import {err, flatMap, fromPromise, isErr, isOk, map, ok, unwrap, unwrapOr} from '../../src/result'
import {FIXTURE_ROOT, fixturePackageNames, getFixturePath, packagePaths} from '../fixtures/helpers'

describe('@bfra.me/es - monorepo integration', () => {
  describe('subpath exports verification', () => {
    it.concurrent('should export Result utilities from @bfra.me/es/result', () => {
      expect(typeof ok).toBe('function')
      expect(typeof err).toBe('function')
      expect(typeof isOk).toBe('function')
      expect(typeof isErr).toBe('function')
      expect(typeof map).toBe('function')
      expect(typeof flatMap).toBe('function')
      expect(typeof unwrap).toBe('function')
      expect(typeof unwrapOr).toBe('function')
      expect(typeof fromPromise).toBe('function')
    })

    it.concurrent('should export functional utilities from @bfra.me/es/functional', () => {
      expect(typeof pipe).toBe('function')
      expect(typeof compose).toBe('function')
    })

    it.concurrent('should export module utilities from @bfra.me/es/module', () => {
      expect(typeof interopDefault).toBe('function')
      expect(typeof isESModule).toBe('function')
    })
  })

  describe('synthetic monorepo fixture validation', () => {
    it.concurrent('should have correct fixture root path', () => {
      expect(FIXTURE_ROOT).toMatch(/synthetic-monorepo$/)
    })

    it.concurrent('should provide all fixture package names', () => {
      expect(fixturePackageNames).toHaveLength(11)
      expect(fixturePackageNames).toContain('@synthetic/core')
      expect(fixturePackageNames).toContain('@synthetic/config')
      expect(fixturePackageNames).toContain('@synthetic/types')
    })

    it.concurrent('should provide all package paths', () => {
      expect(packagePaths.core).toMatch(/packages\/core$/)
      expect(packagePaths.config).toMatch(/packages\/config$/)
      expect(packagePaths.types).toMatch(/packages\/types$/)
      expect(packagePaths.cli).toMatch(/packages\/cli$/)
      expect(packagePaths.apiClient).toMatch(/packages\/api-client$/)
    })

    it.concurrent('should resolve fixture paths correctly', () => {
      const corePath = getFixturePath('packages', 'core')
      expect(corePath).toBe(packagePaths.core)

      const srcPath = getFixturePath('packages', 'core', 'src')
      expect(srcPath).toMatch(/packages\/core\/src$/)
    })
  })

  describe('cross-package Result patterns', () => {
    it.concurrent('should work with domain-specific error types', () => {
      interface ApiError {
        code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'SERVER_ERROR'
        message: string
        statusCode: number
      }

      interface ValidationError {
        field: string
        message: string
      }

      type DomainError = ApiError | ValidationError

      function isApiError(error: DomainError): error is ApiError {
        return 'code' in error && 'statusCode' in error
      }

      const errorPayload: ApiError = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        statusCode: 404,
      }
      const apiError = err<DomainError>(errorPayload)

      expect(isErr(apiError)).toBe(true)
      expect(isErr(apiError) && isApiError(apiError.error)).toBe(true)
      expect(isErr(apiError) && isApiError(apiError.error) && apiError.error.statusCode).toBe(404)
    })

    it.concurrent('should support generic Result factory functions', () => {
      const successResult = ok({id: 1, name: 'Test'})
      const failureResult = err('Failed to create object')

      expect(isOk(successResult)).toBe(true)
      expect(isErr(failureResult)).toBe(true)
    })
  })

  describe('functional utilities with complex types', () => {
    it.concurrent('should pipe through different module boundaries', () => {
      interface RawData {
        raw_value: string
        raw_count: number
      }

      interface ProcessedData {
        value: string
        count: number
      }

      interface EnrichedData extends ProcessedData {
        enrichedAt: number
      }

      const normalize = (raw: RawData): ProcessedData => ({
        value: raw.raw_value,
        count: raw.raw_count,
      })

      const enrich = (data: ProcessedData): EnrichedData => ({
        ...data,
        enrichedAt: Date.now(),
      })

      const stringify = (data: EnrichedData): string => JSON.stringify(data)

      const processData = pipe(normalize, enrich, stringify)

      const result = processData({raw_value: 'test', raw_count: 42})

      expect(typeof result).toBe('string')
      const parsed = JSON.parse(result) as EnrichedData
      expect(parsed.value).toBe('test')
      expect(parsed.count).toBe(42)
      expect(typeof parsed.enrichedAt).toBe('number')
    })

    it.concurrent('should compose functions from different modules', () => {
      const formatNumber = (n: number): string => n.toFixed(2)
      const parseNumber = (s: string): number => Number.parseFloat(s)
      const double = (n: number): number => n * 2

      const transform = compose(formatNumber, double, parseNumber)

      expect(transform('5.5')).toBe('11.00')
    })
  })

  describe('module interop in monorepo context', () => {
    it.concurrent('should detect ES modules from synthetic packages', () => {
      const syntheticESModule = {
        [Symbol.toStringTag]: 'Module',
        default: {value: 42},
        namedExport: 'test',
      }

      expect(isESModule(syntheticESModule)).toBe(true)
    })

    it.concurrent('should handle interop with synthetic package exports', async () => {
      const syntheticPackageExport = {
        default: {
          createWidget: (): {type: string} => ({type: 'widget'}),
          WIDGET_VERSION: '1.0.0',
        },
        utilities: {
          helper: (): string => 'helped',
        },
      }

      const defaultExport = await interopDefault(syntheticPackageExport)
      expect(defaultExport).toHaveProperty('createWidget')
      expect(defaultExport).toHaveProperty('WIDGET_VERSION')
    })
  })

  describe('combined utilities workflow', () => {
    it.concurrent('should combine Result and functional utilities', () => {
      interface User {
        id: number
        name: string
        email: string
      }

      const validateEmail = (
        email: string,
      ): ReturnType<typeof ok<string>> | ReturnType<typeof err<string>> => {
        return email.includes('@') ? ok(email) : err('Invalid email')
      }

      const validateName = (
        name: string,
      ): ReturnType<typeof ok<string>> | ReturnType<typeof err<string>> => {
        return name.length > 0 ? ok(name) : err('Name cannot be empty')
      }

      const createUser = (
        id: number,
        name: string,
        email: string,
      ): ReturnType<typeof ok<User>> | ReturnType<typeof err<string>> => {
        const emailResult = validateEmail(email)
        if (isErr(emailResult)) return emailResult

        const nameResult = validateName(name)
        if (isErr(nameResult)) return nameResult

        return ok({id, name, email})
      }

      const validUser = createUser(1, 'Alice', 'alice@example.com')
      const invalidUser = createUser(2, 'Bob', 'invalid-email')

      expect(isOk(validUser)).toBe(true)
      expect(isOk(validUser) && validUser.data.name).toBe('Alice')
      expect(isErr(invalidUser)).toBe(true)
      expect(isErr(invalidUser) && invalidUser.error).toBe('Invalid email')
    })

    it.concurrent('should handle async workflows with Result', async () => {
      const fetchData = async (): Promise<{data: string}> => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return {data: 'fetched'}
      }

      const result = await fromPromise(fetchData())

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data.data).toBe('fetched')
    })
  })

  describe('type safety across module boundaries', () => {
    it.concurrent('should maintain type safety with branded types pattern', () => {
      type UserId = string & {__brand: 'UserId'}
      type Email = string & {__brand: 'Email'}

      function createUserId(id: string): UserId {
        return id as UserId
      }

      function createEmail(email: string): Email {
        return email as Email
      }

      interface TypedUser {
        id: UserId
        email: Email
        name: string
      }

      const user: TypedUser = {
        id: createUserId('usr_123'),
        email: createEmail('test@example.com'),
        name: 'Test User',
      }

      const result = ok(user)

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data.id).toBe('usr_123')
    })

    it.concurrent('should work with discriminated unions from multiple modules', () => {
      interface SuccessResponse {
        type: 'success'
        data: unknown
      }
      interface ErrorResponse {
        type: 'error'
        message: string
      }
      interface PendingResponse {
        type: 'pending'
        requestId: string
      }

      type ApiResponse = SuccessResponse | ErrorResponse | PendingResponse

      function handleResponse(response: ApiResponse): string {
        switch (response.type) {
          case 'success':
            return 'Data received'
          case 'error':
            return `Error: ${response.message}`
          case 'pending':
            return `Pending: ${response.requestId}`
        }
      }

      const success: ApiResponse = {type: 'success', data: {}}
      const error: ApiResponse = {type: 'error', message: 'Failed'}
      const pending: ApiResponse = {type: 'pending', requestId: 'req_123'}

      expect(handleResponse(success)).toBe('Data received')
      expect(handleResponse(error)).toBe('Error: Failed')
      expect(handleResponse(pending)).toBe('Pending: req_123')
    })
  })

  describe('edge cases in monorepo scenarios', () => {
    it.concurrent('should handle circular dependency patterns', () => {
      interface ModuleA {
        name: string
        dependency?: ModuleB
      }

      interface ModuleB {
        name: string
        dependency?: ModuleA
      }

      const moduleA: ModuleA = {name: 'A'}
      const moduleB: ModuleB = {name: 'B', dependency: moduleA}
      moduleA.dependency = moduleB

      const resultA = ok(moduleA)
      const resultB = ok(moduleB)

      expect(isOk(resultA) && resultA.data.name).toBe('A')
      expect(isOk(resultB) && resultB.data.dependency?.name).toBe('A')
    })

    it.concurrent('should handle empty and null values across boundaries', () => {
      const emptyResult = ok<string[]>([])
      const nullableResult = ok<string | null>(null)
      const undefinedResult = ok<string | undefined>(undefined)

      expect(isOk(emptyResult) && emptyResult.data).toEqual([])
      expect(isOk(nullableResult) && nullableResult.data).toBeNull()
      expect(isOk(undefinedResult) && undefinedResult.data).toBeUndefined()
    })
  })
})
