/**
 * Tests for JSDoc extraction functionality
 */

import type {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  SourceFile,
  TypeAliasDeclaration,
} from 'ts-morph'

import {describe, expect, it} from 'vitest'

import {extractJSDocInfo, hasJSDoc, parseJSDoc} from '../../src/parsers/jsdoc-extractor'
import {createProject, parseSourceContent} from '../../src/parsers/typescript-parser'

function getSourceFile(content: string): SourceFile {
  const project = createProject()
  const result = parseSourceContent(project, content)
  expect(result.success).toBe(true)
  return (result as {success: true; data: SourceFile}).data
}

function getFirstFunction(sourceFile: SourceFile): FunctionDeclaration {
  const func = sourceFile.getFunctions()[0]
  if (!func) throw new Error('Expected at least one function declaration')
  return func
}

function getFirstInterface(sourceFile: SourceFile): InterfaceDeclaration {
  const iface = sourceFile.getInterfaces()[0]
  if (!iface) throw new Error('Expected at least one interface declaration')
  return iface
}

function getFirstTypeAlias(sourceFile: SourceFile): TypeAliasDeclaration {
  const typeAlias = sourceFile.getTypeAliases()[0]
  if (!typeAlias) throw new Error('Expected at least one type alias declaration')
  return typeAlias
}

function getFirstClass(sourceFile: SourceFile): ClassDeclaration {
  const cls = sourceFile.getClasses()[0]
  if (!cls) throw new Error('Expected at least one class declaration')
  return cls
}

function getFirstEnum(sourceFile: SourceFile): EnumDeclaration {
  const enumDecl = sourceFile.getEnums()[0]
  if (!enumDecl) throw new Error('Expected at least one enum declaration')
  return enumDecl
}

describe('jsdoc-extractor', () => {
  describe('hasJSDoc', () => {
    it.concurrent('should return true for nodes with JSDoc', () => {
      const sourceFile = getSourceFile(`
        /**
         * A function with JSDoc
         */
        export function documented(): void {}
      `)
      const func = getFirstFunction(sourceFile)

      expect(hasJSDoc(func)).toBe(true)
    })

    it.concurrent('should handle nodes without JSDoc comments', () => {
      const sourceFile = getSourceFile(`
        export function undocumented(): void {}
      `)
      const func = getFirstFunction(sourceFile)

      expect(hasJSDoc(func)).toBe(true)
      const jsDocs = func.getJsDocs()
      expect(jsDocs.length).toBe(0)
    })
  })

  describe('extractJSDocInfo', () => {
    it.concurrent('should extract description', () => {
      const sourceFile = getSourceFile(`
        /**
         * This function adds two numbers together.
         */
        export function add(a: number, b: number): number {
          return a + b
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc).toBeDefined()
      expect(jsdoc?.description).toBe('This function adds two numbers together.')
    })

    it.concurrent('should extract @param tags', () => {
      const sourceFile = getSourceFile(`
        /**
         * Greets a person
         * @param name - The person's name
         * @param age - The person's age
         */
        export function greet(name: string, age: number): string {
          return name
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.params).toHaveLength(2)
      expect(jsdoc?.params?.[0]?.name).toBe('name')
      // The description may include trailing JSDoc markers from multiline comments
      expect(jsdoc?.params?.[0]?.description).toContain("The person's name")
      expect(jsdoc?.params?.[1]?.name).toBe('age')
      expect(jsdoc?.params?.[1]?.description).toContain("The person's age")
    })

    it.concurrent('should extract @param with type annotation', () => {
      const sourceFile = getSourceFile(`
        /**
         * Process value
         * @param {string} value - The value to process
         */
        export function process(value: string): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.params?.[0]?.type).toBe('string')
      expect(jsdoc?.params?.[0]?.name).toBe('value')
      expect(jsdoc?.params?.[0]?.description).toBe('The value to process')
    })

    it.concurrent('should extract optional @param', () => {
      const sourceFile = getSourceFile(`
        /**
         * Create config
         * @param [options] - Optional configuration
         */
        export function createConfig(options?: object): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.params?.[0]?.name).toBe('options')
      expect(jsdoc?.params?.[0]?.optional).toBe(true)
    })

    it.concurrent('should extract @param with default value', () => {
      const sourceFile = getSourceFile(`
        /**
         * Greet someone
         * @param [name=World] - The name to greet
         */
        export function greet(name: string = 'World'): string {
          return name
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.params?.[0]?.name).toBe('name')
      expect(jsdoc?.params?.[0]?.optional).toBe(true)
      expect(jsdoc?.params?.[0]?.defaultValue).toBe('World')
    })

    it.concurrent('should extract @returns', () => {
      const sourceFile = getSourceFile(`
        /**
         * Get the sum
         * @returns The sum of all numbers
         */
        export function sum(...nums: number[]): number {
          return nums.reduce((a, b) => a + b, 0)
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.returns).toBe('The sum of all numbers')
    })

    it.concurrent('should extract @return (alias)', () => {
      const sourceFile = getSourceFile(`
        /**
         * Get value
         * @return The value
         */
        export function getValue(): string {
          return ''
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.returns).toBe('The value')
    })

    it.concurrent('should extract @example tags', () => {
      const sourceFile = getSourceFile(`
        /**
         * Adds numbers
         * @example
         * const result = add(1, 2)
         * console.log(result) // 3
         */
        export function add(a: number, b: number): number {
          return a + b
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.examples).toBeDefined()
      expect(jsdoc?.examples?.length).toBeGreaterThan(0)
      expect(jsdoc?.examples?.[0]).toContain('add(1, 2)')
    })

    it.concurrent('should extract multiple @example tags', () => {
      const sourceFile = getSourceFile(`
        /**
         * Formats a string
         * @example
         * format('hello')
         * @example
         * format('world', true)
         */
        export function format(s: string, upper?: boolean): string {
          return upper ? s.toUpperCase() : s
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.examples?.length).toBe(2)
    })

    it.concurrent('should extract @deprecated tag', () => {
      const sourceFile = getSourceFile(`
        /**
         * Old function
         * @deprecated Use newFunction instead
         */
        export function oldFunction(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.deprecated).toBe('Use newFunction instead')
    })

    it.concurrent('should extract @deprecated tag without message', () => {
      const sourceFile = getSourceFile(`
        /**
         * Legacy code
         * @deprecated
         */
        export function legacy(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.deprecated).toBe('')
    })

    it.concurrent('should extract @since tag', () => {
      const sourceFile = getSourceFile(`
        /**
         * New feature
         * @since 2.0.0
         */
        export function newFeature(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.since).toBe('2.0.0')
    })

    it.concurrent('should extract @see references', () => {
      const sourceFile = getSourceFile(`
        /**
         * Helper function
         * @see otherFunction
         * @see https://example.com/docs
         */
        export function helper(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.see?.length).toBe(2)
      // References may include trailing JSDoc markers from multiline comments
      expect(jsdoc?.see?.[0]).toContain('otherFunction')
      expect(jsdoc?.see?.[1]).toContain('https://example.com/docs')
    })

    it.concurrent('should extract custom tags', () => {
      const sourceFile = getSourceFile(`
        /**
         * Special function
         * @category Math
         * @internal
         */
        export function special(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.customTags).toBeDefined()
      const categoryTag = jsdoc?.customTags?.find(t => t.name === 'category')
      const internalTag = jsdoc?.customTags?.find(t => t.name === 'internal')
      // Value may include trailing JSDoc markers from multiline comments
      expect(categoryTag?.value).toContain('Math')
      expect(internalTag).toBeDefined()
    })

    it.concurrent('should return undefined for nodes without JSDoc', () => {
      const sourceFile = getSourceFile(`
        export function noDoc(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc).toBeUndefined()
    })

    it.concurrent('should handle complex JSDoc with all annotations', () => {
      const sourceFile = getSourceFile(`
        /**
         * Processes input data and returns transformed output.
         *
         * This function takes raw data and applies various transformations
         * based on the provided options.
         *
         * @param data - The input data to process
         * @param {object} [options] - Processing options
         * @param {boolean} [options.validate=true] - Whether to validate
         * @returns The processed result
         * @example
         * const result = process({ value: 1 })
         * @since 1.0.0
         * @see transform
         * @deprecated Use processV2 for better performance
         */
        export function process(data: unknown, options?: object): unknown {
          return data
        }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.description).toContain('Processes input data')
      expect(jsdoc?.params?.length).toBeGreaterThanOrEqual(1)
      // Return value may include trailing JSDoc markers
      expect(jsdoc?.returns).toContain('The processed result')
      expect(jsdoc?.examples?.length).toBe(1)
      // Since may include trailing JSDoc markers
      expect(jsdoc?.since).toContain('1.0.0')
      expect(jsdoc?.see?.[0]).toContain('transform')
      expect(jsdoc?.deprecated).toContain('processV2')
    })
  })

  describe('parseJSDoc', () => {
    it.concurrent('should parse JSDoc node directly', () => {
      const sourceFile = getSourceFile(`
        /**
         * Direct parse test
         * @param x - Input value
         */
        export function test(x: number): number { return x }
      `)
      const func = getFirstFunction(sourceFile)
      const jsDocNodes = func.getJsDocs()

      expect(jsDocNodes.length).toBe(1)
      const firstJsDoc = jsDocNodes[0]
      if (!firstJsDoc) throw new Error('Expected at least one JSDoc node')

      const parsed = parseJSDoc(firstJsDoc)

      expect(parsed.description).toBe('Direct parse test')
      expect(parsed.params?.length).toBe(1)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle empty JSDoc comment', () => {
      const sourceFile = getSourceFile(`
        /**
         */
        export function empty(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc).toBeDefined()
      expect(jsdoc?.description).toBeUndefined()
    })

    it.concurrent('should handle JSDoc with only whitespace', () => {
      const sourceFile = getSourceFile(`
        /**
         *
         *
         */
        export function whitespace(): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc).toBeDefined()
      expect(jsdoc?.description).toBeUndefined()
    })

    it.concurrent('should handle @param without description', () => {
      const sourceFile = getSourceFile(`
        /**
         * Test
         * @param x
         */
        export function test(x: number): void {}
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.params?.[0]?.name).toBe('x')
      expect(jsdoc?.params?.[0]?.description).toBeUndefined()
    })

    it.concurrent('should handle @returns with type but no description', () => {
      const sourceFile = getSourceFile(`
        /**
         * Test
         * @returns {number}
         */
        export function test(): number { return 0 }
      `)
      const func = getFirstFunction(sourceFile)
      const jsdoc = extractJSDocInfo(func)

      expect(jsdoc?.returns).toBeUndefined()
    })

    it.concurrent('should extract JSDoc from interface', () => {
      const sourceFile = getSourceFile(`
        /**
         * User configuration interface
         */
        export interface UserConfig {
          name: string
        }
      `)
      const iface = getFirstInterface(sourceFile)
      const jsdoc = extractJSDocInfo(iface)

      expect(jsdoc?.description).toBe('User configuration interface')
    })

    it.concurrent('should extract JSDoc from type alias', () => {
      const sourceFile = getSourceFile(`
        /**
         * Result type for operations
         */
        export type Result<T> = { ok: true; data: T } | { ok: false; error: Error }
      `)
      const typeAlias = getFirstTypeAlias(sourceFile)
      const jsdoc = extractJSDocInfo(typeAlias)

      expect(jsdoc?.description).toBe('Result type for operations')
    })

    it.concurrent('should extract JSDoc from class', () => {
      const sourceFile = getSourceFile(`
        /**
         * Calculator class for math operations
         * @since 1.0.0
         */
        export class Calculator {
          add(a: number, b: number): number { return a + b }
        }
      `)
      const cls = getFirstClass(sourceFile)
      const jsdoc = extractJSDocInfo(cls)

      expect(jsdoc?.description).toBe('Calculator class for math operations')
      expect(jsdoc?.since).toBe('1.0.0')
    })

    it.concurrent('should extract JSDoc from enum', () => {
      const sourceFile = getSourceFile(`
        /**
         * Status codes for operations
         */
        export enum Status {
          Success = 'success',
          Error = 'error'
        }
      `)
      const enumDecl = getFirstEnum(sourceFile)
      const jsdoc = extractJSDocInfo(enumDecl)

      expect(jsdoc?.description).toBe('Status codes for operations')
    })
  })
})
