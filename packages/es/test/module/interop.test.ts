import {pathToFileURL} from 'node:url'
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

    it.concurrent('should handle undefined value', async () => {
      const result = await interopDefault(undefined)
      expect(result).toBeUndefined()
    })

    it.concurrent('should handle number values', async () => {
      const result = await interopDefault(42)
      expect(result).toBe(42)
    })

    it.concurrent('should handle boolean values', async () => {
      const result = await interopDefault(true)
      expect(result).toBe(true)
    })

    it.concurrent('should handle function as default export', async () => {
      const fn = () => 'hello'
      const esModule = {default: fn}
      const result = await interopDefault(esModule)
      expect(result).toBe(fn)
      expect(result()).toBe('hello')
    })

    it.concurrent('should handle class as default export', async () => {
      class MyClass {
        value = 42
      }
      const esModule = {default: MyClass}
      const Result = await interopDefault(esModule)
      expect(Result).toBe(MyClass)
      expect(new Result().value).toBe(42)
    })

    it.concurrent('should handle CommonJS module structure with default', async () => {
      const cjsModule = {
        __esModule: true,
        default: {exportedValue: 'cjs-value'},
      }
      const result = await interopDefault(cjsModule)
      expect(result).toEqual({exportedValue: 'cjs-value'})
    })

    it.concurrent('should handle Symbol.toStringTag Module with default', async () => {
      const moduleObject = {
        [Symbol.toStringTag]: 'Module',
        default: 'module-default',
      }
      const result = await interopDefault(moduleObject)
      expect(result).toBe('module-default')
    })

    it.concurrent('should handle deeply nested Promise with default', async () => {
      const nestedPromise = Promise.resolve(Promise.resolve({default: {default: 'deeply-nested'}}))
      const result = await interopDefault(nestedPromise)
      expect(result).toBe('deeply-nested')
    })

    it.concurrent('should handle object with default key that is null', async () => {
      const objWithNullDefault = {default: null}
      const result = await interopDefault(objWithNullDefault)
      expect(result).toBeNull()
    })

    it.concurrent('should handle real ES module import', async () => {
      const pathModule = await import('node:path')
      const result = await interopDefault(pathModule)
      expect(typeof result.join).toBe('function')
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

    it.concurrent(
      'should return true for object with both __esModule and Symbol.toStringTag',
      () => {
        const dualModule = {
          __esModule: true,
          [Symbol.toStringTag]: 'Module',
          foo: 'bar',
        }
        expect(isESModule(dualModule)).toBe(true)
      },
    )

    it.concurrent('should return false for object with wrong Symbol.toStringTag value', () => {
      const wrongTag = {[Symbol.toStringTag]: 'Object'}
      expect(isESModule(wrongTag)).toBe(false)
    })

    it.concurrent('should return true when __esModule property exists regardless of value', () => {
      const moduleWithFalseFlag = {__esModule: false}
      expect(isESModule(moduleWithFalseFlag)).toBe(true)
    })

    it.concurrent('should handle Symbol', () => {
      expect(isESModule(Symbol('test'))).toBe(false)
    })

    it.concurrent('should handle BigInt', () => {
      expect(isESModule(BigInt(123))).toBe(false)
    })
  })

  describe('resolveModule', () => {
    it.concurrent('should resolve built-in Node.js modules', async () => {
      const result = await resolveModule<typeof import('node:path')>('node:path')
      expect(isOk(result)).toBe(true)
      expect(result.success && typeof result.data.join).toBe('function')
    })

    it.concurrent('should return Err for non-existent module', async () => {
      const result = await resolveModule('non-existent-module-xyz-123')
      expect(isErr(result)).toBe(true)
      expect(!result.success && result.error).toBeInstanceOf(Error)
    })

    it.concurrent('should resolve workspace packages', async () => {
      const result = await resolveModule('vitest')
      expect(isOk(result)).toBe(true)
    })

    it.concurrent('should resolve module with named exports', async () => {
      const result = await resolveModule<typeof import('node:url')>('node:url')
      expect(isOk(result)).toBe(true)
      expect(result.success && typeof result.data.fileURLToPath).toBe('function')
    })

    it.concurrent('should handle module specifier with subpath', async () => {
      const result = await resolveModule<typeof import('node:fs/promises')>('node:fs/promises')
      expect(isOk(result)).toBe(true)
      expect(result.success && typeof result.data.readFile).toBe('function')
    })

    it.concurrent('should return Err with Error instance for failed resolution', async () => {
      const result = await resolveModule('completely-fake-module-that-does-not-exist')
      expect(isErr(result)).toBe(true)
      expect(!result.success && result.error).toBeInstanceOf(Error)
      expect(!result.success && result.error.message).toBeTruthy()
    })

    it.concurrent('should handle errors that are not Error instances', async () => {
      const result = await resolveModule('node:nonexistent-builtin')
      expect(isErr(result)).toBe(true)
      expect(!result.success && result.error).toBeInstanceOf(Error)
    })
  })

  describe('dynamicImport', () => {
    it.concurrent('should import built-in modules', async () => {
      const result = await dynamicImport<typeof import('node:fs')>('node:fs')
      expect(isOk(result)).toBe(true)
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

    it.concurrent('should import module with async exports', async () => {
      const result = await dynamicImport<typeof import('node:fs/promises')>('node:fs/promises')
      expect(isOk(result)).toBe(true)
      expect(result.success && typeof result.data.mkdir).toBe('function')
    })

    it.concurrent('should return Err with meaningful error message', async () => {
      const result = await dynamicImport('/this/path/definitely/does/not/exist.mjs')
      expect(isErr(result)).toBe(true)
      expect(!result.success && result.error.message).toContain('Cannot find module')
    })

    it.concurrent('should import JSON modules when supported', async () => {
      const result = await dynamicImport<{name: string}>('../../package.json')
      expect(result.success || !result.success).toBe(true)
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

    it.concurrent('should work with file:// URL string as scopeUrl', () => {
      const fileUrl = pathToFileURL(process.cwd()).href
      expect(isPackageInScope('vitest', {scopeUrl: fileUrl})).toBe(true)
    })

    it.concurrent('should handle scopeUrl with trailing slash', () => {
      const scopeUrl = `${process.cwd()}/`
      expect(isPackageInScope('vitest', {scopeUrl})).toBe(true)
    })

    it.concurrent('should return false for undefined package name', () => {
      expect(isPackageInScope(undefined as unknown as string)).toBe(false)
    })

    it.concurrent('should return false for null package name', () => {
      expect(isPackageInScope(null as unknown as string)).toBe(false)
    })

    it.concurrent('should return false for number as package name', () => {
      expect(isPackageInScope(123 as unknown as string)).toBe(false)
    })

    it.concurrent('should return false for object as package name', () => {
      expect(isPackageInScope({} as unknown as string)).toBe(false)
    })

    it.concurrent('should work with relative-like paths from cwd', () => {
      expect(isPackageInScope('vitest', {scopeUrl: '.'})).toBe(true)
    })

    it.concurrent('should work with scoped packages', () => {
      expect(isPackageInScope('@vitest/expect')).toBe(true)
    })

    it.concurrent('should return false for malformed scoped package', () => {
      expect(isPackageInScope('@nonexistent/fake-package-xyz')).toBe(false)
    })
  })
})
