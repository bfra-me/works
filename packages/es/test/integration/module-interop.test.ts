/**
 * Integration tests for module interop with various export patterns.
 * Validates TEST-032: Module interop works with various TypeScript moduleResolution settings
 */

import type {Awaitable} from '../../src/module/interop'

import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {describe, expect, it} from 'vitest'

import {dynamicImport, interopDefault, isESModule, resolveModule} from '../../src/module/interop'
import {isErr, isOk} from '../../src/result/guards'

const currentDirname = dirname(fileURLToPath(import.meta.url))

describe('@bfra.me/es/module - interop integration', () => {
  describe('interopDefault', () => {
    it.concurrent('should handle ES module with default export', async () => {
      const esModule = {
        default: {value: 42},
        namedExport: 'hello',
      }

      const result = await interopDefault(esModule)
      expect(result).toEqual({value: 42})
    })

    it.concurrent('should handle ES module without default export', async () => {
      const esModule = {
        namedExport1: 'hello',
        namedExport2: 42,
      }

      const result = await interopDefault(esModule)
      expect(result).toEqual({namedExport1: 'hello', namedExport2: 42})
    })

    it.concurrent('should handle nested default exports', async () => {
      const nestedModule = {
        default: {
          default: {
            value: 'deeply nested',
          },
        },
      }

      const result = await interopDefault(nestedModule)
      expect(result).toEqual({value: 'deeply nested'})
    })

    it.concurrent('should handle CommonJS-style module', async () => {
      const cjsModule = {
        __esModule: true,
        default: {cjsValue: 'from cjs'},
      }

      const result = await interopDefault(cjsModule)
      expect(result).toEqual({cjsValue: 'from cjs'})
    })

    it.concurrent('should handle Promise-wrapped modules', async () => {
      const promiseModule = Promise.resolve({
        default: {asyncValue: 'from promise'},
      })

      const result = await interopDefault(promiseModule)
      expect(result).toEqual({asyncValue: 'from promise'})
    })

    it.concurrent('should handle primitive values', async () => {
      expect(await interopDefault('string')).toBe('string')
      expect(await interopDefault(42)).toBe(42)
      expect(await interopDefault(true)).toBe(true)
      expect(await interopDefault(null)).toBe(null)
    })

    it.concurrent('should handle array values', async () => {
      const arrayModule = [1, 2, 3]
      const result = await interopDefault(arrayModule)
      expect(result).toEqual([1, 2, 3])
    })

    it.concurrent('should handle function exports', async () => {
      const fn = (): number => 42
      const moduleWithFn = {default: fn}

      const result = await interopDefault(moduleWithFn)
      expect(typeof result).toBe('function')
      expect((result as () => number)()).toBe(42)
    })
  })

  describe('isESModule', () => {
    it.concurrent('should detect __esModule flag', () => {
      const cjsStyleModule = {__esModule: true, default: {}}
      expect(isESModule(cjsStyleModule)).toBe(true)
    })

    it.concurrent('should detect Module toStringTag', () => {
      const esStyleModule = {[Symbol.toStringTag]: 'Module'}
      expect(isESModule(esStyleModule)).toBe(true)
    })

    it.concurrent('should return false for plain objects', () => {
      expect(isESModule({})).toBe(false)
      expect(isESModule({foo: 'bar'})).toBe(false)
    })

    it.concurrent('should return false for primitives', () => {
      expect(isESModule(null)).toBe(false)
      expect(isESModule(undefined)).toBe(false)
      expect(isESModule(42)).toBe(false)
      expect(isESModule('string')).toBe(false)
    })

    it.concurrent('should return false for arrays', () => {
      expect(isESModule([])).toBe(false)
      expect(isESModule([1, 2, 3])).toBe(false)
    })

    it.concurrent('should return false for functions', () => {
      expect(isESModule(() => {})).toBe(false)
      expect(
        isESModule(() => {
          return undefined
        }),
      ).toBe(false)
    })
  })

  describe('resolveModule', () => {
    it.concurrent('should resolve built-in node modules', async () => {
      const result = await resolveModule<typeof import('node:path')>('node:path')

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && typeof result.data.join).toBe('function')
    })

    it.concurrent('should return Err for non-existent modules', async () => {
      const result = await resolveModule('non-existent-module-xyz-123')

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toMatch(/cannot find|not found/i)
    })

    it.concurrent('should resolve JSON modules', async () => {
      const result = await resolveModule<{name: string}>(
        join(currentDirname, '../fixtures/synthetic-monorepo/package.json'),
      )

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data.name).toBe('synthetic-monorepo-root')
    })
  })

  describe('dynamicImport', () => {
    it.concurrent('should dynamically import node built-ins', async () => {
      const result = await dynamicImport<typeof import('node:fs')>('node:fs')

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && typeof result.data.readFileSync).toBe('function')
    })

    it.concurrent('should return Err for invalid paths', async () => {
      const result = await dynamicImport('/definitely/not/a/real/path.js')

      expect(isErr(result)).toBe(true)
    })
  })

  describe('module export patterns', () => {
    it.concurrent('should handle named exports only', async () => {
      const namedExportsModule = {
        functionA: (): string => 'a',
        functionB: (): string => 'b',
        CONSTANT: 42,
      }

      const result = await interopDefault(namedExportsModule)
      expect(result).toHaveProperty('functionA')
      expect(result).toHaveProperty('functionB')
      expect(result).toHaveProperty('CONSTANT')
    })

    it.concurrent('should handle mixed default and named exports', async () => {
      const mixedModule = {
        default: {mainExport: true},
        helperFunction: (): void => {},
        HELPER_CONSTANT: 'helper',
      }

      const result = await interopDefault(mixedModule)
      expect(result).toEqual({mainExport: true})
    })

    it.concurrent('should handle re-exported modules pattern', async () => {
      const reExportedModule = {
        default: {
          original: 'value',
        },
        originalExport: 'preserved',
      }

      const result = await interopDefault(reExportedModule)
      expect(result).toEqual({original: 'value'})
    })

    it.concurrent('should handle barrel exports pattern', async () => {
      const barrelModule = {
        fromModuleA: 'a',
        fromModuleB: 'b',
        fromModuleC: 'c',
        default: {barrel: true},
      }

      const result = await interopDefault(barrelModule)
      expect(result).toEqual({barrel: true})
    })

    it.concurrent('should handle class exports', async () => {
      class MyClass {
        value = 42
        getValue(): number {
          return this.value
        }
      }

      const classModule = {default: MyClass}
      const result = await interopDefault(classModule)

      expect(result).toBe(MyClass)
      // The result is the class constructor itself
      const ClassConstructor = result
      const instance = new ClassConstructor()
      expect(instance.getValue()).toBe(42)
    })

    it.concurrent('should handle async factory exports', async () => {
      const asyncFactory = async (): Promise<{data: string}> => ({data: 'async'})

      const factoryModule = {default: asyncFactory}
      const result = await interopDefault(factoryModule)

      expect(typeof result).toBe('function')
      const factoryResult = await (result as () => Promise<{data: string}>)()
      expect(factoryResult).toEqual({data: 'async'})
    })
  })

  describe('awaitable type handling', () => {
    it.concurrent('should handle sync Awaitable', async () => {
      const syncValue: Awaitable<number> = 42
      const result = await interopDefault({default: syncValue})
      expect(result).toBe(42)
    })

    it.concurrent('should handle async Awaitable', async () => {
      const asyncValue: Awaitable<number> = Promise.resolve(42)
      const result = await interopDefault({default: asyncValue})
      expect(result).toBe(42)
    })

    it.concurrent('should handle nested Awaitable', async () => {
      const nestedAsync: Awaitable<Awaitable<string>> = Promise.resolve(
        Promise.resolve('deeply async'),
      )

      const result = await interopDefault({default: nestedAsync})
      expect(result).toBe('deeply async')
    })
  })

  describe('error handling', () => {
    it.concurrent('should handle import errors gracefully', async () => {
      const result = await dynamicImport<unknown>('completely-invalid-specifier-###')

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error).toBeInstanceOf(Error)
    })

    it.concurrent('should preserve error messages', async () => {
      const result = await resolveModule<unknown>('no-such-package-exists-12345')

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message.length).toBeGreaterThan(0)
    })
  })

  describe('integration with Result type', () => {
    it.concurrent('should chain module resolution with Result operations', async () => {
      const pathResult = await resolveModule<typeof import('node:path')>('node:path')

      expect(isOk(pathResult)).toBe(true)

      const joined = isOk(pathResult) ? pathResult.data.join('/a', 'b', 'c') : ''
      expect(joined).toContain('a')
      expect(joined).toContain('b')
      expect(joined).toContain('c')
    })

    it.concurrent('should work with multiple sequential resolutions', async () => {
      const pathResult = await resolveModule<typeof import('node:path')>('node:path')
      const osResult = await resolveModule<typeof import('node:os')>('node:os')
      const cryptoResult = await resolveModule<typeof import('node:crypto')>('node:crypto')

      expect(isOk(pathResult)).toBe(true)
      expect(isOk(osResult)).toBe(true)
      expect(isOk(cryptoResult)).toBe(true)
    })
  })
})
