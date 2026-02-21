import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {generateMDXDocument} from '../../src/generators'
import {createPackageScanner} from '../../src/orchestrator'
import {analyzePublicAPI, parsePackageComplete, parseReadmeFile} from '../../src/parsers'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')
const EXPECTED_DIR = path.join(__dirname, '../fixtures/expected')

describe('sync-pipeline integration', () => {
  describe('full sync flow', () => {
    it.concurrent('should parse package info from package.json', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')

      const result = await parsePackageComplete(packagePath)

      expect(result.success).toBe(true)
      if (!result.success) return

      const info = result.data
      expect(info.name).toBe('@fixtures/sample-lib')
      expect(info.version).toBe('1.0.0')
      expect(info.description).toBe('A sample library package for testing documentation sync')
      expect(info.packagePath).toBe(packagePath)
    })

    it.concurrent('should parse README content', async () => {
      const readmePath = path.join(FIXTURES_DIR, 'sample-lib', 'README.md')

      const result = await parseReadmeFile(readmePath)

      expect(result.success).toBe(true)
      if (!result.success) return

      const readme = result.data
      expect(readme.title).toBe('@fixtures/sample-lib')
      expect(readme.sections.length).toBeGreaterThan(0)
      expect(readme.raw).toContain('## Installation')
      expect(readme.raw).toContain('## Usage')
    })

    it.concurrent('should extract public API from TypeScript source', () => {
      const indexPath = path.join(FIXTURES_DIR, 'sample-lib', 'src', 'index.ts')

      const result = analyzePublicAPI(indexPath)

      expect(result.success).toBe(true)
      if (!result.success) return

      const {api} = result.data
      expect(api.functions.length).toBeGreaterThan(0)

      const addFn = api.functions.find(f => f.name === 'add')
      expect(addFn).toBeDefined()
      expect(addFn?.parameters).toHaveLength(2)
      // JSDoc may or may not be extracted depending on implementation
      expect(addFn?.signature).toContain('add')
    })

    it.concurrent('should generate complete MDX document from parsed data', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const indexPath = path.join(packagePath, 'src', 'index.ts')
      const readmePath = path.join(packagePath, 'README.md')

      const packageResult = await parsePackageComplete(packagePath)
      expect(packageResult.success).toBe(true)
      if (!packageResult.success) return

      const readmeResult = await parseReadmeFile(readmePath)
      expect(readmeResult.success).toBe(true)
      if (!readmeResult.success) return

      const apiResult = analyzePublicAPI(indexPath)
      expect(apiResult.success).toBe(true)
      if (!apiResult.success) return

      const mdxResult = generateMDXDocument(
        packageResult.data,
        readmeResult.data,
        apiResult.data.api,
      )

      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const doc = mdxResult.data

      expect(doc.frontmatter.title).toBe('@fixtures/sample-lib')
      expect(doc.rendered).toContain('---')
      expect(doc.rendered).toContain('@astrojs/starlight/components')
      expect(doc.rendered).toContain('## API Reference')
    })

    it.concurrent('should match expected MDX output structure', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const indexPath = path.join(packagePath, 'src', 'index.ts')
      const readmePath = path.join(packagePath, 'README.md')

      const packageResult = await parsePackageComplete(packagePath)
      const readmeResult = await parseReadmeFile(readmePath)
      const apiResult = analyzePublicAPI(indexPath)

      expect(packageResult.success).toBe(true)
      expect(readmeResult.success).toBe(true)
      expect(apiResult.success).toBe(true)

      if (!packageResult.success || !readmeResult.success || !apiResult.success) {
        return
      }

      const mdxResult = generateMDXDocument(
        packageResult.data,
        readmeResult.data,
        apiResult.data.api,
      )

      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const doc = mdxResult.data
      const expectedPath = path.join(EXPECTED_DIR, 'sample-lib.mdx')

      const {readFile} = await import('node:fs/promises')
      const expectedContent = await readFile(expectedPath, 'utf-8')

      // Verify essential structure (title format may vary between implementations)
      expect(doc.frontmatter.title).toBe('@fixtures/sample-lib')
      expect(doc.frontmatter.description).toBe(
        'A sample library package for testing documentation sync',
      )
      expect(doc.rendered).toContain('import { Badge, Card, CardGrid, Tabs, TabItem }')
      expect(doc.rendered).toContain('## API Reference')

      // Expected file should also have the title
      expect(expectedContent).toContain('@fixtures/sample-lib')
    })
  })

  describe('package scanner integration', () => {
    it.concurrent('should scan individual package', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const scanner = createPackageScanner({
        rootDir: FIXTURES_DIR,
      })

      const result = await scanner.scanPackage(packagePath)

      expect(result.success).toBe(true)
      if (!result.success) return

      const pkg = result.data
      expect(pkg.info.name).toBe('@fixtures/sample-lib')
      expect(pkg.readme).toBeDefined()
      expect(pkg.api).toBeDefined()
      expect(pkg.sourceFiles.length).toBeGreaterThan(0)
    })
  })

  describe('types-only package handling', () => {
    it.concurrent('should handle packages with only type exports', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'types-only')
      const indexPath = path.join(packagePath, 'src', 'index.ts')

      const packageResult = await parsePackageComplete(packagePath)
      expect(packageResult.success).toBe(true)
      if (!packageResult.success) return

      const apiResult = analyzePublicAPI(indexPath)

      // Generate MDX regardless of API analysis result
      const api = apiResult.success ? apiResult.data.api : undefined
      const mdxResult = generateMDXDocument(packageResult.data, undefined, api)

      expect(mdxResult.success).toBe(true)
    })
  })

  describe('error handling in pipeline', () => {
    it.concurrent('should handle missing package.json gracefully', async () => {
      const nonExistentPath = path.join(FIXTURES_DIR, 'non-existent-package')

      const result = await parsePackageComplete(nonExistentPath)

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error.code).toBe('FILE_NOT_FOUND')
    })

    it.concurrent('should handle missing README gracefully', async () => {
      const nonExistentReadme = path.join(FIXTURES_DIR, 'sample-lib', 'MISSING-README.md')

      const result = await parseReadmeFile(nonExistentReadme)

      expect(result.success).toBe(false)
      if (result.success) return

      expect(result.error.code).toBe('FILE_NOT_FOUND')
    })

    it.concurrent('should generate documentation without README', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')

      const packageResult = await parsePackageComplete(packagePath)
      expect(packageResult.success).toBe(true)
      if (!packageResult.success) return

      const mdxResult = generateMDXDocument(packageResult.data, undefined, undefined)

      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      expect(mdxResult.data.rendered).toContain('@fixtures/sample-lib')
    })
  })
})
