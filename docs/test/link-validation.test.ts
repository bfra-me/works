import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import fg from 'fast-glob'
import {describe, expect, it} from 'vitest'

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(DIR_NAME, '../src/content/docs')

interface LinkValidationError {
  file: string
  link: string
  type: 'slug' | 'relative' | 'anchor'
  reason: string
}

async function getAllContentFiles(): Promise<string[]> {
  const patterns = ['**/*.md', '**/*.mdx']
  const files = await fg(patterns, {
    cwd: CONTENT_DIR,
    absolute: true,
  })
  return files
}

function getSlugFromPath(filePath: string): string {
  const relative = path.relative(CONTENT_DIR, filePath)
  const withoutExt = relative.replace(/\.(?:md|mdx)$/, '')
  const slug = withoutExt === 'index' ? '' : withoutExt.replace(/\/index$/, '')
  return slug
}

function extractInternalLinks(content: string): {slugLinks: string[]; relativeLinks: string[]} {
  const slugLinks: string[] = []
  const relativeLinks: string[] = []

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match = markdownLinkRegex.exec(content)
  while (match !== null) {
    const url = match[2]
    if (url !== null && url !== undefined) {
      if (url.startsWith('./') || url.startsWith('../')) {
        relativeLinks.push(url)
      } else if (
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        !url.startsWith('#')
      ) {
        slugLinks.push(url)
      }
    }
    match = markdownLinkRegex.exec(content)
  }

  const slugAttributeRegex = /slug:\s*['"]([^'"]+)['"]/g
  match = slugAttributeRegex.exec(content)
  while (match !== null) {
    const slug = match[1]
    if (slug !== null && slug !== undefined) {
      slugLinks.push(slug)
    }
    match = slugAttributeRegex.exec(content)
  }

  return {slugLinks, relativeLinks}
}

async function validateSlugExists(slug: string, allSlugs: Set<string>): Promise<boolean> {
  const normalizedSlug = slug.replaceAll(/^\/+|\/+$/g, '')
  return allSlugs.has(normalizedSlug)
}

async function validateRelativePath(
  currentFile: string,
  relativePath: string,
): Promise<{exists: boolean; reason?: string}> {
  const cleanPath = relativePath.split('#')[0] ?? relativePath
  const currentDir = path.dirname(currentFile)
  const targetPath = path.resolve(currentDir, cleanPath)

  try {
    const stats = await fs.stat(targetPath)
    if (stats.isFile()) {
      return {exists: true}
    }
    return {exists: false, reason: 'Path is not a file'}
  } catch {
    return {exists: false, reason: 'File does not exist'}
  }
}

describe('link validation', () => {
  describe('internal link discovery', () => {
    it('should extract slug references from markdown links', () => {
      const content = `
[Link to page](getting-started/introduction)
[Another link](packages/create)
`
      const {slugLinks} = extractInternalLinks(content)
      expect(slugLinks).toContain('getting-started/introduction')
      expect(slugLinks).toContain('packages/create')
    })

    it('should extract slug references from sidebar configuration syntax', () => {
      const content = `slug: 'packages/create'`
      const {slugLinks} = extractInternalLinks(content)
      expect(slugLinks).toContain('packages/create')
    })

    it('should extract relative path links', () => {
      const content = `
[Relative link](./introduction.mdx)
[Parent link](../index.mdx)
`
      const {relativeLinks} = extractInternalLinks(content)
      expect(relativeLinks).toContain('./introduction.mdx')
      expect(relativeLinks).toContain('../index.mdx')
    })

    it('should ignore external links', () => {
      const content = `
[External](https://example.com)
[GitHub](https://github.com/bfra-me/works)
`
      const {slugLinks, relativeLinks} = extractInternalLinks(content)
      expect(slugLinks).toHaveLength(0)
      expect(relativeLinks).toHaveLength(0)
    })

    it('should ignore anchor links', () => {
      const content = `[Anchor](#section)`
      const {slugLinks, relativeLinks} = extractInternalLinks(content)
      expect(slugLinks).toHaveLength(0)
      expect(relativeLinks).toHaveLength(0)
    })
  })

  describe('slug validation', () => {
    it('should build slug map from all content files', async () => {
      const files = await getAllContentFiles()
      const slugs = new Set<string>()

      for (const file of files) {
        const slug = getSlugFromPath(file)
        slugs.add(slug)
      }

      expect(slugs.size).toBe(16)
      expect(slugs.has('getting-started/introduction')).toBe(true)
      expect(slugs.has('packages/create')).toBe(true)
    })

    it('should validate all slug references in content files', async () => {
      const files = await getAllContentFiles()
      const slugs = new Set<string>()

      for (const file of files) {
        const slug = getSlugFromPath(file)
        slugs.add(slug)
      }

      const errors: LinkValidationError[] = []

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const bodyContent = content.replace(/^---[\s\S]*?---/, '')
        const {slugLinks} = extractInternalLinks(bodyContent)

        for (const link of slugLinks) {
          const cleanLink = link.replaceAll(/^\/+|\/+$/g, '')
          const exists = await validateSlugExists(cleanLink, slugs)

          if (!exists) {
            errors.push({
              file: path.relative(CONTENT_DIR, file),
              link: cleanLink,
              type: 'slug',
              reason: 'Slug does not exist in content collection',
            })
          }
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(({file, link, reason}) => `${file}: "${link}" - ${reason}`)
          .join('\n')
        throw new Error(`Internal link validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })
  })

  describe('relative path validation', () => {
    it('should validate relative file paths exist', async () => {
      const files = await getAllContentFiles()
      const errors: LinkValidationError[] = []

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const {relativeLinks} = extractInternalLinks(content)

        for (const link of relativeLinks) {
          const {exists, reason} = await validateRelativePath(file, link)

          if (!exists) {
            errors.push({
              file: path.relative(CONTENT_DIR, file),
              link,
              type: 'relative',
              reason: reason ?? 'Unknown error',
            })
          }
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(({file, link, reason}) => `${file}: "${link}" - ${reason}`)
          .join('\n')
        throw new Error(`Relative path validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })
  })

  describe('sidebar configuration', () => {
    it('should verify sidebar slugs match existing content', async () => {
      const configPath = path.join(DIR_NAME, '../astro.config.mjs')
      const configContent = await fs.readFile(configPath, 'utf-8')

      const files = await getAllContentFiles()
      const slugs = new Set<string>()

      for (const file of files) {
        const slug = getSlugFromPath(file)
        slugs.add(slug)
      }

      const {slugLinks} = extractInternalLinks(configContent)
      const errors: LinkValidationError[] = []

      for (const link of slugLinks) {
        const cleanLink = link.replaceAll(/^\/+|\/+$/g, '')
        const exists = slugs.has(cleanLink)

        if (!exists) {
          errors.push({
            file: 'astro.config.mjs',
            link: cleanLink,
            type: 'slug',
            reason: 'Sidebar references non-existent content',
          })
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors
          .map(({file, link, reason}) => `${file}: "${link}" - ${reason}`)
          .join('\n')
        throw new Error(`Sidebar configuration validation failed:\n\n${errorMessage}`)
      }

      expect(errors).toHaveLength(0)
    })
  })
})
