import {describe, expect, it} from 'vitest'
import {
  dynamicImport,
  interopDefault,
  isESModule,
  isPackageInScope,
  resolveModule,
} from '../../src/module'
import {isErr, isOk} from '../../src/result'

describe('@bfra.me/es/module', () => {
  describe('interopDefault', () => {
    it.concurrent('should return value as-is when no default export', async () => {
      const plainObject = {foo: 'bar'}
      const result = await interopDefault(plainObject)
      expect(result).toEqual({foo: 'bar'})
    })

    it.concurrent('should unwrap default export from ES module', async () => {
      const esModule = {default: {foo: 'bar'}}
      const result = await interopDefault(esModule)
      expect(result).toEqual({foo: 'bar'})
    })

    it.concurrent('should handle nested default exports', async () => {
      const nestedModule = {default: {default: 'inner'}}
      const result = await interopDefault(nestedModule)
      expect(result).toBe('inner')
    })

    it.concurrent('should handle Promise-wrapped modules', async () => {
      const promiseModule = Promise.resolve({default: 'resolved'})
      const result = await interopDefault(promiseModule)
      expect(result).toBe('resolved')
    })

    it.concurrent('should handle primitive values', async () => {
      const stringValue = 'primitive'
      const result = await interopDefault(stringValue)
      expect(result).toBe('primitive')
    })

    it.concurrent('should handle null value', async () => {
      const result = await interopDefault(null)
      expect(result).toBeNull()
    })

    it.concurrent('should handle array values', async () => {
      const arrayValue = [1, 2, 3]
      const result = await interopDefault(arrayValue)
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('isESModule', () => {
    it.concurrent('should return true for object with __esModule flag', () => {
      const esModule = {__esModule: true, foo: 'bar'}
      expect(isESModule(esModule)).toBe(true)
    })

    it.concurrent('should return true for Module object with Symbol.toStringTag', () => {
      const moduleObject = {[Symbol.toStringTag]: 'Module', foo: 'bar'}
      expect(isESModule(moduleObject)).toBe(true)
    })

    it.concurrent('should return false for plain object', () => {
      const plainObject = {foo: 'bar'}
      expect(isESModule(plainObject)).toBe(false)
    })

    it.concurrent('should return false for null', () => {
      expect(isESModule(null)).toBe(false)
    })

    it.concurrent('should return false for undefined', () => {
      expect(isESModule(undefined)).toBe(false)
    })

    it.concurrent('should return false for primitive values', () => {
      expect(isESModule('string')).toBe(false)
      expect(isESModule(123)).toBe(false)
      expect(isESModule(true)).toBe(false)
    })

    it.concurrent('should return false for array', () => {
      expect(isESModule([1, 2, 3])).toBe(false)
    })

    it.concurrent('should return false for function', () => {
      expect(isESModule(() => {})).toBe(false)
    })
  })

  describe('resolveModule', () => {
    it.concurrent('should resolve built-in Node.js modules', async () => {
      const result = await resolveModule<typeof import('node:path')>('node:path')
      expect(isOk(result)).toBe(true)
      expect(result.success).toBe(true)
      expect(result.success && typeof result.data.join).toBe('function')
    })

    it.concurrent('should return Err for non-existent module', async () => {
      const result = await resolveModule('non-existent-module-xyz-123')
      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(!result.success && result.error).toBeInstanceOf(Error)
    })

    it.concurrent('should resolve workspace packages', async () => {
      const result = await resolveModule('vitest')
      expect(isOk(result)).toBe(true)
    })
  })

  describe('dynamicImport', () => {
    it.concurrent('should import built-in modules', async () => {
      const result = await dynamicImport<typeof import('node:fs')>('node:fs')
      expect(isOk(result)).toBe(true)
      expect(result.success).toBe(true)
      expect(result.success && typeof result.data.readFileSync).toBe('function')
    })

    it.concurrent('should return Err for invalid module path', async () => {
      const result = await dynamicImport('/non/existent/path.js')
      expect(isErr(result)).toBe(true)
    })

    it.concurrent('should have same behavior as resolveModule', async () => {
      const resolveResult = await resolveModule('node:url')
      const dynamicResult = await dynamicImport('node:url')
      expect(isOk(resolveResult)).toBe(isOk(dynamicResult))
    })
  })

  describe('isPackageInScope', () => {
    it.concurrent('should return true for installed packages', () => {
      expect(isPackageInScope('vitest')).toBe(true)
    })

    it.concurrent('should return true for Node.js built-in modules', () => {
      expect(isPackageInScope('node:fs')).toBe(true)
      expect(isPackageInScope('node:path')).toBe(true)
    })

    it.concurrent('should return false for non-existent packages', () => {
      expect(isPackageInScope('non-existent-package-xyz-abc-123')).toBe(false)
    })

    it.concurrent('should return false for empty string', () => {
      expect(isPackageInScope('')).toBe(false)
    })

    it.concurrent('should return false for whitespace-only string', () => {
      expect(isPackageInScope('   ')).toBe(false)
    })

    it.concurrent('should work with scopeUrl option as string', () => {
      const scopeUrl = new URL('.', import.meta.url).href
      expect(isPackageInScope('vitest', {scopeUrl})).toBe(true)
    })

    it.concurrent('should work with scopeUrl option as URL object', () => {
      const scopeUrl = new URL('.', import.meta.url)
      expect(isPackageInScope('vitest', {scopeUrl})).toBe(true)
    })

    it.concurrent('should work with regular file path as scopeUrl', () => {
      expect(isPackageInScope('vitest', {scopeUrl: process.cwd()})).toBe(true)
    })

    it.concurrent('should return false for package not in specified scope', () => {
      expect(isPackageInScope('non-existent-xyz', {scopeUrl: '/tmp'})).toBe(false)
    })
  })
})
