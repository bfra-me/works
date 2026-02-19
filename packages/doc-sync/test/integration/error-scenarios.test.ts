import fs from 'node:fs/promises'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {generateMDXDocument} from '../../src/generators'
import {createPackageScanner} from '../../src/orchestrator'
import {
  analyzePublicAPI,
  extractJSDocInfo,
  parsePackageComplete,
  parseReadmeFile,
} from '../../src/parsers'
import {createProject, parseSourceContent} from '../../src/parsers/typescript-parser'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')

describe('error-scenarios integration', () => {
  describe('missing file handling', () => {
    it.concurrent('should return FILE_NOT_FOUND for missing package.json', async () => {
      const result = await parsePackageComplete('/nonexistent/path')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error.code).toBe('FILE_NOT_FOUND')
      expect(result.error.message).toContain('package.json')
    })

    it.concurrent('should return FILE_NOT_FOUND for missing README', async () => {
      const result = await parseReadmeFile('/nonexistent/README.md')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error.code).toBe('FILE_NOT_FOUND')
    })

    it.concurrent('should return FILE_NOT_FOUND for missing source file', () => {
      const result = analyzePublicAPI('/nonexistent/src/index.ts')

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error.code).toBe('FILE_NOT_FOUND')
    })

    it.concurrent('should handle missing src directory gracefully', async () => {
      const scanner = createPackageScanner({
        rootDir: '/nonexistent/root',
        includePatterns: ['packages/*'],
      })

      const result = await scanner.scan()

      expect(result.packages).toHaveLength(0)
    })
  })

  describe('malformed file handling', () => {
    it.concurrent('should handle invalid JSON in package.json', async () => {
      const tempDir = path.join(__dirname, '../.temp-error-test')
      await fs.mkdir(tempDir, {recursive: true})

      try {
        await fs.writeFile(path.join(tempDir, 'package.json'), '{ invalid json }')

        const result = await parsePackageComplete(tempDir)

        expect(result.success).toBe(false)
        if (result.success) return

        expect(['MALFORMED_JSON', 'INVALID_SYNTAX']).toContain(result.error.code)
      } finally {
        await fs.rm(tempDir, {recursive: true, force: true})
      }
    })

    it.concurrent('should handle TypeScript syntax errors gracefully', () => {
      const project = createProject()
      const malformedCode = `
        export function broken(
          // Missing parameter closing paren and function body
      `

      const result = parseSourceContent(project, malformedCode)

      // Should either succeed with partial parsing or return an error
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should handle empty TypeScript files', () => {
      const project = createProject()
      const result = parseSourceContent(project, '')

      expect(result.success).toBe(true)
    })

    it.concurrent('should handle file with only comments', () => {
      const project = createProject()
      const commentOnly = `
        // This is a comment
        /* Multi-line
           comment */
      `

      const result = parseSourceContent(project, commentOnly)

      expect(result.success).toBe(true)
    })
  })

  describe('invalid JSDoc handling', () => {
    it.concurrent('should handle malformed @param tags', () => {
      const project = createProject()
      const content = `
        /**
         * @param - missing name
         * @param nameOnly
         * @param {type} name description
         */
        export function test() {}
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
      if (!result.success) return

      const func = result.data.getFunctions()[0]
      const jsdocResult = func ? extractJSDocInfo(func) : null
      // Should not crash, may return partial or empty info
      expect(jsdocResult === null || typeof jsdocResult === 'object').toBe(true)
    })

    it.concurrent('should handle incomplete JSDoc blocks', () => {
      const project = createProject()
      const content = `
        /**
        export function broken() {}
      `

      const result = parseSourceContent(project, content)
      // TypeScript parser may recover from this
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should handle JSDoc with special characters', () => {
      const project = createProject()
      const content = `
        /**
         * Description with <html> and "quotes" and \`backticks\`
         * @param value - Value with special chars: <>&"'
         * @returns Result with unicode: 日本語
         */
        export function specialChars(value: string): string {
          return value
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
      if (!result.success) return

      const func = result.data.getFunctions()[0]
      const jsdocResult = func ? extractJSDocInfo(func) : undefined
      expect(jsdocResult !== undefined || func === undefined).toBe(true)
    })

    it.concurrent('should handle JSDoc without description', () => {
      const project = createProject()
      const content = `
        /**
         * @param a First param
         * @param b Second param
         */
        export function noDescription(a: string, b: number) {}
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
      if (!result.success) return

      const func = result.data.getFunctions()[0]
      const jsdocResult = func ? extractJSDocInfo(func) : undefined
      const paramCount = jsdocResult?.params?.length ?? 0
      expect(func === undefined || paramCount === 2).toBe(true)
    })
  })

  describe('mdx generation error handling', () => {
    it.concurrent('should handle empty package info', () => {
      const emptyInfo = {
        name: '',
        version: '',
        packagePath: '',
        srcPath: '',
      }

      // Should not crash, may produce validation error
      const result = generateMDXDocument(emptyInfo, undefined, undefined)
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should handle extremely long content', () => {
      const longDescription = 'A'.repeat(100000)
      const packageInfo = {
        name: '@test/package',
        version: '1.0.0',
        description: longDescription,
        packagePath: '/test',
        srcPath: '/test/src',
      }

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      // Should succeed but may truncate or warn
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should handle API with circular type references', () => {
      const packageInfo = {
        name: '@test/circular',
        version: '1.0.0',
        packagePath: '/test',
        srcPath: '/test/src',
      }

      const circularAPI = {
        functions: [],
        types: [
          {
            name: 'NodeA',
            definition: 'type NodeA = { child: NodeB }',
            kind: 'type' as const,
            isDefault: false,
          },
          {
            name: 'NodeB',
            definition: 'type NodeB = { parent: NodeA }',
            kind: 'type' as const,
            isDefault: false,
          },
        ],
        reExports: [],
      }

      const result = generateMDXDocument(packageInfo, undefined, circularAPI)
      expect(result.success).toBe(true)
    })
  })

  describe('recovery scenarios', () => {
    it.concurrent('should generate partial docs when README fails', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')

      const packageResult = await parsePackageComplete(packagePath)
      expect(packageResult.success).toBe(true)
      if (!packageResult.success) return

      // Simulate README failure by not passing it
      const mdxResult = generateMDXDocument(packageResult.data, undefined, undefined)

      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      // Should still have package info
      expect(mdxResult.data.rendered).toContain('@fixtures/sample-lib')
    })

    it.concurrent('should generate partial docs when API analysis fails', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const readmePath = path.join(packagePath, 'README.md')

      const packageResult = await parsePackageComplete(packagePath)
      const readmeResult = await parseReadmeFile(readmePath)

      expect(packageResult.success).toBe(true)
      expect(readmeResult.success).toBe(true)
      if (!packageResult.success || !readmeResult.success) return

      // Simulate API failure by not passing it
      const mdxResult = generateMDXDocument(packageResult.data, readmeResult.data, undefined)

      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      // Should have README content but no API reference
      expect(mdxResult.data.rendered).toContain('Installation')
    })

    it.concurrent('should recover from individual function parsing errors', () => {
      const project = createProject()
      const content = `
        /**
         * Valid function
         */
        export function valid(): void {}

        // Malformed but parseable
        export function alsoValid(): void {}
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
      if (!result.success) return

      const functions = result.data.getFunctions()
      expect(functions.length).toBe(2)
    })
  })

  describe('edge case error scenarios', () => {
    it.concurrent('should handle package with no exports', () => {
      const project = createProject()
      const content = `
        const internal = 'private'
        function privateFunc() {}
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
      if (!result.success) return

      const functions = result.data.getFunctions()
      const exportedFunctions = functions.filter(f => f.isExported())
      expect(exportedFunctions.length).toBe(0)
    })

    it.concurrent('should handle deeply nested type definitions', () => {
      const project = createProject()
      const content = `
        export type DeepNested = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: string
                }
              }
            }
          }
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should handle generic type constraints', () => {
      const project = createProject()
      const content = `
        export function generic<T extends Record<string, unknown>>(arg: T): T {
          return arg
        }

        export type Mapped<T> = {
          [K in keyof T]: T[K] extends string ? number : T[K]
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should handle overloaded functions', () => {
      const project = createProject()
      const content = `
        /**
         * @param a First overload
         */
        export function overloaded(a: string): string
        /**
         * @param a Second overload
         * @param b Additional param
         */
        export function overloaded(a: number, b: number): number
        export function overloaded(a: string | number, b?: number): string | number {
          return typeof a === 'string' ? a : a + (b ?? 0)
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should handle async generators', () => {
      const project = createProject()
      const content = `
        /**
         * An async generator function
         */
        export async function* asyncGenerator(): AsyncGenerator<number> {
          yield 1
          yield 2
          yield 3
        }
      `

      const result = parseSourceContent(project, content)
      expect(result.success).toBe(true)
    })
  })
})
