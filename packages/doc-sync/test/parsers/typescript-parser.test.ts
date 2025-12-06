/**
 * Tests for TypeScript parser functionality
 */

import type {SourceFile} from 'ts-morph'

import type {PackageAPI} from '../../src/types'

import {describe, expect, it} from 'vitest'

import {
  analyzeTypeScriptContent,
  createProject,
  extractExportedFunctions,
  extractExportedTypes,
  extractPackageAPI,
  extractReExports,
  parseSourceContent,
} from '../../src/parsers/typescript-parser'

/** Extracts SourceFile from a successful parse result */
function getSourceFile(result: ReturnType<typeof parseSourceContent>): SourceFile {
  if (!result.success) {
    throw new Error('Expected successful parse result')
  }
  return result.data
}

/** Extracts PackageAPI from a successful analysis result */
function getAPI(result: ReturnType<typeof analyzeTypeScriptContent>): PackageAPI {
  if (!result.success) {
    throw new Error('Expected successful analysis result')
  }
  return result.data
}

describe('typescript-parser', () => {
  describe('createProject', () => {
    it.concurrent('should create a ts-morph Project instance', () => {
      const project = createProject()

      expect(project).toBeDefined()
      expect(typeof project.addSourceFileAtPath).toBe('function')
    })

    it.concurrent('should accept custom compiler options', () => {
      const project = createProject({
        compilerOptions: {strict: true},
      })

      expect(project).toBeDefined()
    })
  })

  describe('parseSourceContent', () => {
    it.concurrent('should parse valid TypeScript content', () => {
      const project = createProject()
      const content = `export function add(a: number, b: number): number { return a + b }`

      const result = parseSourceContent(project, content)

      expect(result.success).toBe(true)
      const sourceFile = getSourceFile(result)
      expect(sourceFile.getFilePath()).toContain('virtual.ts')
    })

    it.concurrent('should handle custom virtual path', () => {
      const project = createProject()
      const content = `export const x = 1`

      const result = parseSourceContent(project, content, 'custom.ts')

      expect(result.success).toBe(true)
      const sourceFile = getSourceFile(result)
      expect(sourceFile.getFilePath()).toContain('custom.ts')
    })

    it.concurrent('should handle empty content', () => {
      const project = createProject()
      const result = parseSourceContent(project, '')

      expect(result.success).toBe(true)
    })
  })

  describe('extractExportedFunctions', () => {
    // Sequential tests: ts-morph type resolution is slow and doesn't benefit from concurrency
    it('should extract simple exported functions', () => {
      const project = createProject()
      const content = `
        export function add(a: number, b: number): number {
          return a + b
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))

      expect(functions.length).toBe(1)
      expect(functions[0]?.name).toBe('add')
      expect(functions[0]?.isAsync).toBe(false)
      expect(functions[0]?.isDefault).toBe(false)
    })

    it('should extract async functions', () => {
      const project = createProject()
      const content = `
        export async function fetchData(): Promise<string> {
          return 'data'
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))

      expect(functions.length).toBe(1)
      expect(functions[0]?.name).toBe('fetchData')
      expect(functions[0]?.isAsync).toBe(true)
    })

    it('should extract function parameters', () => {
      const project = createProject()
      const content = `
        export function greet(name: string, age?: number): string {
          return name
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))
      const params = functions[0]?.parameters

      expect(params?.length).toBe(2)
      expect(params?.[0]?.name).toBe('name')
      expect(params?.[0]?.type).toBe('string')
      expect(params?.[0]?.optional).toBe(false)
      expect(params?.[1]?.name).toBe('age')
      expect(params?.[1]?.optional).toBe(true)
    })

    it('should extract default parameter values', () => {
      const project = createProject()
      const content = `
        export function greet(name: string = 'World'): string {
          return name
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))
      const params = functions[0]?.parameters

      expect(params?.[0]?.defaultValue).toBe("'World'")
    })

    it('should ignore non-exported functions', () => {
      const project = createProject()
      const content = `
        function internalFn(): void {}
        export function publicFn(): void {}
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))

      expect(functions.length).toBe(1)
      expect(functions[0]?.name).toBe('publicFn')
    })

    it('should extract multiple functions', () => {
      const project = createProject()
      const content = `
        export function add(a: number, b: number): number { return a + b }
        export function subtract(a: number, b: number): number { return a - b }
        export function multiply(a: number, b: number): number { return a * b }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const functions = extractExportedFunctions(getSourceFile(result))

      expect(functions.length).toBe(3)
      expect(functions.map(f => f.name)).toEqual(['add', 'subtract', 'multiply'])
    })
  })

  describe('extractExportedTypes', () => {
    // Sequential tests: ts-morph type resolution is slow and doesn't benefit from concurrency
    it('should extract interfaces', () => {
      const project = createProject()
      const content = `
        export interface User {
          id: string
          name: string
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(1)
      expect(types[0]?.name).toBe('User')
      expect(types[0]?.kind).toBe('interface')
    })

    it('should extract type aliases', () => {
      const project = createProject()
      const content = `
        export type ID = string | number
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(1)
      expect(types[0]?.name).toBe('ID')
      expect(types[0]?.kind).toBe('type')
    })

    it('should extract enums', () => {
      const project = createProject()
      const content = `
        export enum Status {
          Active = 'active',
          Inactive = 'inactive'
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(1)
      expect(types[0]?.name).toBe('Status')
      expect(types[0]?.kind).toBe('enum')
    })

    it('should extract classes', () => {
      const project = createProject()
      const content = `
        export class Calculator {
          private value: number = 0
          add(n: number): this { this.value += n; return this }
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(1)
      expect(types[0]?.name).toBe('Calculator')
      expect(types[0]?.kind).toBe('class')
    })

    it('should extract generic type parameters', () => {
      const project = createProject()
      const content = `
        export interface Container<T> {
          value: T
        }
        export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(2)
      expect(types[0]?.typeParameters).toEqual(['T'])
      expect(types[1]?.typeParameters).toEqual(['T', 'E'])
    })

    it('should ignore non-exported types', () => {
      const project = createProject()
      const content = `
        interface InternalType { x: number }
        export interface PublicType { y: string }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const types = extractExportedTypes(getSourceFile(result))

      expect(types.length).toBe(1)
      expect(types[0]?.name).toBe('PublicType')
    })
  })

  describe('extractReExports', () => {
    it.concurrent('should extract named re-exports', () => {
      const project = createProject()
      const content = `
        export { add, subtract } from './math'
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const reExports = extractReExports(getSourceFile(result))

      expect(reExports.length).toBe(1)
      expect(reExports[0]?.from).toBe('./math')
      expect(reExports[0]?.exports).toEqual(['add', 'subtract'])
    })

    it.concurrent('should extract namespace re-exports', () => {
      const project = createProject()
      const content = `
        export * from './utils'
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const reExports = extractReExports(getSourceFile(result))

      expect(reExports.length).toBe(1)
      expect(reExports[0]?.from).toBe('./utils')
      expect(reExports[0]?.exports).toBe('*')
    })

    it.concurrent('should extract aliased re-exports', () => {
      const project = createProject()
      const content = `
        export { default as helper } from './helper'
        export { add as sum } from './math'
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const reExports = extractReExports(getSourceFile(result))

      expect(reExports.length).toBe(2)
      expect(reExports[0]?.exports).toContain('default as helper')
      expect(reExports[1]?.exports).toContain('add as sum')
    })

    it.concurrent('should extract namespace alias', () => {
      const project = createProject()
      const content = `
        export * as utils from './utils'
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const reExports = extractReExports(getSourceFile(result))

      expect(reExports.length).toBe(1)
      expect(reExports[0]?.exports).toBe('*')
      expect(reExports[0]?.alias).toBe('utils')
    })
  })

  describe('extractPackageAPI', () => {
    it.concurrent('should extract complete API surface', () => {
      const project = createProject()
      const content = `
        /**
         * Adds two numbers
         * @param a - First number
         * @param b - Second number
         */
        export function add(a: number, b: number): number {
          return a + b
        }

        export interface Config {
          name: string
        }

        export type ID = string

        export { helper } from './helper'
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)

      const api = extractPackageAPI(getSourceFile(result))

      expect(api.functions.length).toBe(1)
      expect(api.types.length).toBe(2)
      expect(api.reExports.length).toBe(1)
    })
  })

  describe('analyzeTypeScriptContent', () => {
    it.concurrent('should analyze TypeScript content and return API', () => {
      const content = `
        export function greet(name: string): string {
          return 'Hello, ' + name
        }

        export interface Options {
          verbose: boolean
        }
      `

      const result = analyzeTypeScriptContent(content)

      expect(result.success).toBe(true)
      const api = getAPI(result)
      expect(api.functions.length).toBe(1)
      expect(api.types.length).toBe(1)
    })

    it.concurrent('should handle content with syntax errors gracefully', () => {
      const content = `export function broken(`

      const result = analyzeTypeScriptContent(content)

      expect(result.success).toBe(true)
      const api = getAPI(result)
      expect(api.functions.length).toBe(0)
    })

    it.concurrent('should handle empty content', () => {
      const result = analyzeTypeScriptContent('')

      expect(result.success).toBe(true)
      const api = getAPI(result)
      expect(api.functions.length).toBe(0)
      expect(api.types.length).toBe(0)
      expect(api.reExports.length).toBe(0)
    })
  })
})
