import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {extractCodeBlocks} from '@bfra.me/doc-sync/utils'
import fg from 'fast-glob'
import matter from 'gray-matter'
import {describe, expect, it} from 'vitest'

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(DIR_NAME, '../src/content/docs')

interface FrontmatterData {
  title?: string
  description?: string
  template?: string
  [key: string]: unknown
}

interface ValidationResult {
  success: boolean
  errors: string[]
}

async function getAllContentFiles(): Promise<string[]> {
  const patterns = ['**/*.md', '**/*.mdx']
  const files = await fg(patterns, {
    cwd: CONTENT_DIR,
    absolute: true,
  })
  return files
}

function validateFrontmatter(data: FrontmatterData): ValidationResult {
  const errors: string[] = []

  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push(`Missing or empty 'title' field`)
  }

  if (typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push(`Missing or empty 'description' field`)
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

function validateMDXComponentImports(content: string): ValidationResult {
  const errors: string[] = []

  const knownStarlightComponents = [
    'Badge',
    'Card',
    'CardGrid',
    'Tabs',
    'TabItem',
    'Aside',
    'Code',
    'FileTree',
    'Steps',
    'LinkButton',
    'Icon',
  ]

  for (const component of knownStarlightComponents) {
    const componentUsageRegex = new RegExp(String.raw`<${component}[\s>]`, 'g')
    const usages = content.match(componentUsageRegex)

    if (usages !== null && usages.length > 0) {
      const importRegex = new RegExp(
        String.raw`import\s+{[^}]*\b${component}\b[^}]*}\s+from\s+['"]@astrojs/starlight/components['"]`,
      )
      if (!importRegex.test(content)) {
        errors.push(
          `Component <${component}> is used but not imported from '@astrojs/starlight/components'`,
        )
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

function parseCodeBlockLanguage(codeBlock: string): {language: string; code: string} | null {
  const match = /^```(\w+)?\n([\s\S]*?)\n?```$/.exec(codeBlock)
  if (match === null) {
    return null
  }
  return {
    language: match[1] ?? '',
    code: match[2] ?? '',
  }
}

function validateTypeScriptSyntax(code: string): ValidationResult {
  const errors: string[] = []

  const unclosedBraces = (code.match(/\u007B/g) ?? []).length - (code.match(/\u007D/g) ?? []).length
  if (unclosedBraces !== 0) {
    errors.push(`Unbalanced braces (${unclosedBraces > 0 ? 'unclosed' : 'extra closing'})`)
  }

  const unclosedParens = (code.match(/\(/g) ?? []).length - (code.match(/\)/g) ?? []).length
  if (unclosedParens !== 0) {
    errors.push(`Unbalanced parentheses (${unclosedParens > 0 ? 'unclosed' : 'extra closing'})`)
  }

  const unclosedBrackets = (code.match(/\[/g) ?? []).length - (code.match(/\]/g) ?? []).length
  if (unclosedBrackets !== 0) {
    errors.push(`Unbalanced brackets (${unclosedBrackets > 0 ? 'unclosed' : 'extra closing'})`)
  }

  const singleQuotes = (code.match(/(?<!\\)'/g) ?? []).length
  if (singleQuotes % 2 !== 0) {
    errors.push('Unbalanced single quotes')
  }

  const doubleQuotes = (code.match(/(?<!\\)"/g) ?? []).length
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unbalanced double quotes')
  }

  const templateLiterals = (code.match(/(?<!\\)`/g) ?? []).length
  if (templateLiterals % 2 !== 0) {
    errors.push('Unbalanced template literals')
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

describe('content validation', () => {
  describe('file discovery', () => {
    it('should find all content files', async () => {
      const files = await getAllContentFiles()
      expect(files.length).toBeGreaterThan(0)
      expect(files.length).toBe(17)
    })

    it('should only include .md and .mdx files', async () => {
      const files = await getAllContentFiles()
      for (const file of files) {
        expect(file).toMatch(/\.(md|mdx)$/)
      }
    })
  })

  describe('frontmatter validation', () => {
    it('should validate all content files have required frontmatter', async () => {
      const files = await getAllContentFiles()
      const errors: {file: string; errors: string[]}[] = []

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const {data} = matter(content)
        const result = validateFrontmatter(data as FrontmatterData)

        if (!result.success) {
          errors.push({
            file: path.relative(CONTENT_DIR, file),
            errors: result.errors,
          })
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(
            ({file, errors: fileErrors}) =>
              `${file}:\n${fileErrors.map(e => `  - ${e}`).join('\n')}`,
          )
          .join('\n\n')
        throw new Error(`Frontmatter validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })

    it('should have title field as non-empty string', async () => {
      const files = await getAllContentFiles()

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const {data} = matter(content)

        expect(data, `File: ${path.relative(CONTENT_DIR, file)}`).toHaveProperty('title')
        expect(typeof data.title, `File: ${path.relative(CONTENT_DIR, file)}`).toBe('string')
        expect(
          (data.title as string).trim().length,
          `File: ${path.relative(CONTENT_DIR, file)}`,
        ).toBeGreaterThan(0)
      }
    })

    it('should have description field as non-empty string', async () => {
      const files = await getAllContentFiles()

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const {data} = matter(content)

        expect(data, `File: ${path.relative(CONTENT_DIR, file)}`).toHaveProperty('description')
        expect(typeof data.description, `File: ${path.relative(CONTENT_DIR, file)}`).toBe('string')
        expect(
          (data.description as string).trim().length,
          `File: ${path.relative(CONTENT_DIR, file)}`,
        ).toBeGreaterThan(0)
      }
    })
  })

  describe('component validation', () => {
    it('should verify component imports match usage', async () => {
      const files = await getAllContentFiles()
      const errors: {file: string; errors: string[]}[] = []

      for (const file of files) {
        if (!file.endsWith('.mdx')) continue

        const content = await fs.readFile(file, 'utf-8')
        const result = validateMDXComponentImports(content)

        if (!result.success) {
          errors.push({
            file: path.relative(CONTENT_DIR, file),
            errors: result.errors,
          })
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(
            ({file, errors: fileErrors}) =>
              `${file}:\n${fileErrors.map(e => `  - ${e}`).join('\n')}`,
          )
          .join('\n\n')
        throw new Error(`MDX component validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })

    it('should detect commonly used Starlight components', async () => {
      const files = await getAllContentFiles()
      const componentUsage = new Map<string, number>()

      for (const file of files) {
        if (!file.endsWith('.mdx')) continue

        const content = await fs.readFile(file, 'utf-8')
        const components = ['Badge', 'Card', 'CardGrid', 'Tabs', 'TabItem']

        for (const component of components) {
          const regex = new RegExp(String.raw`<${component}[\s>]`, 'g')
          const matches = content.match(regex)
          if (matches !== null) {
            componentUsage.set(component, (componentUsage.get(component) ?? 0) + matches.length)
          }
        }
      }

      expect(componentUsage.size).toBeGreaterThan(0)
    })
  })

  describe('code block validation', () => {
    it('should extract code blocks from content', async () => {
      const files = await getAllContentFiles()
      let totalCodeBlocks = 0

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const blocks = extractCodeBlocks(content)
        totalCodeBlocks += blocks.length
      }

      expect(totalCodeBlocks).toBeGreaterThan(0)
    })

    it('should validate TypeScript/JavaScript code blocks syntax', async () => {
      const files = await getAllContentFiles()
      const errors: {file: string; language: string; errors: string[]}[] = []

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const blocks = extractCodeBlocks(content)

        for (const codeBlock of blocks) {
          const parsed = parseCodeBlockLanguage(codeBlock)
          if (parsed === null) continue

          const {language, code} = parsed
          if (
            language === 'typescript' ||
            language === 'javascript' ||
            language === 'ts' ||
            language === 'js'
          ) {
            const result = validateTypeScriptSyntax(code)

            if (!result.success) {
              errors.push({
                file: path.relative(CONTENT_DIR, file),
                language,
                errors: result.errors,
              })
            }
          }
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(
            ({file, language, errors: blockErrors}) =>
              `${file} (${language}):\n${blockErrors.map(e => `  - ${e}`).join('\n')}`,
          )
          .join('\n\n')
        throw new Error(`Code block validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })

    it('should identify shell/bash code blocks', async () => {
      const files = await getAllContentFiles()
      let shellBlocks = 0

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const blocks = extractCodeBlocks(content)

        for (const codeBlock of blocks) {
          const parsed = parseCodeBlockLanguage(codeBlock)
          if (parsed === null) continue

          const {language} = parsed
          if (language === 'bash' || language === 'sh' || language === 'shell') {
            shellBlocks++
          }
        }
      }

      expect(shellBlocks).toBeGreaterThan(0)
    })
  })

  describe('content structure', () => {
    it('should have valid MDX structure without frontmatter errors', async () => {
      const files = await getAllContentFiles()

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')

        expect(() => matter(content), `File: ${path.relative(CONTENT_DIR, file)}`).not.toThrow()

        const {data, content: body} = matter(content)
        expect(data, `File: ${path.relative(CONTENT_DIR, file)}`).toBeDefined()
        expect(body, `File: ${path.relative(CONTENT_DIR, file)}`).toBeDefined()
        expect(body.trim().length, `File: ${path.relative(CONTENT_DIR, file)}`).toBeGreaterThan(0)
      }
    })

    it('should not have empty content after frontmatter', async () => {
      const files = await getAllContentFiles()

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const {content: body} = matter(content)

        expect(body.trim().length, `File: ${path.relative(CONTENT_DIR, file)}`).toBeGreaterThan(0)
      }
    })
  })
})
