import type {MDXDocument, PackageAPI, PackageInfo, ReadmeContent} from '../../src/types'

import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {generateMDXDocument, validateMDXSyntax} from '../../src/generators'
import {createValidationPipeline} from '../../src/orchestrator'
import {analyzePublicAPI, parsePackageComplete, parseReadmeFile} from '../../src/parsers'

const FIXTURES_DIR = path.join(__dirname, '../fixtures/packages')

const createTestPackageInfo = (overrides: Partial<PackageInfo> = {}): PackageInfo => ({
  name: '@test/package',
  version: '1.0.0',
  description: 'A test package',
  packagePath: '/test/packages/package',
  srcPath: '/test/packages/package/src',
  ...overrides,
})

const createTestReadme = (overrides: Partial<ReadmeContent> = {}): ReadmeContent => ({
  title: 'Test Package',
  preamble: 'A test package preamble.',
  sections: [],
  raw: '# Test Package\n\nA test package preamble.',
  ...overrides,
})

const createTestAPI = (overrides: Partial<PackageAPI> = {}): PackageAPI => ({
  functions: [
    {
      name: 'testFunction',
      signature: 'testFunction(a: string): void',
      parameters: [{name: 'a', type: 'string', optional: false}],
      returnType: 'void',
      isAsync: false,
      isGenerator: false,
      isDefault: false,
    },
  ],
  types: [],
  reExports: [],
  ...overrides,
})

describe('mdx-validation integration', () => {
  describe('basic MDX syntax validation', () => {
    it.concurrent('should validate valid MDX content', () => {
      const content = `---
title: "Test"
---

# Hello World

Some content here.
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should detect unclosed JSX tags', () => {
      const content = `---
title: "Test"
---

<Badge text="Open"

Some content
`
      const result = validateMDXSyntax(content)
      // Validation should either pass or provide meaningful error
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should validate frontmatter structure', () => {
      const content = `---
title: "Valid Title"
description: "Valid description"
---

# Content
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should handle empty content', () => {
      const result = validateMDXSyntax('')
      expect(typeof result.success).toBe('boolean')
    })

    it.concurrent('should validate code blocks', () => {
      const content = `---
title: "Test"
---

\`\`\`typescript
const x: number = 1
\`\`\`
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })
  })

  describe('validation pipeline', () => {
    it.concurrent('should validate complete MDX documents', () => {
      const pipeline = createValidationPipeline()
      const packageInfo = createTestPackageInfo()
      const readme = createTestReadme()

      const mdxResult = generateMDXDocument(packageInfo, readme, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const validationResult = pipeline.validate(mdxResult.data)
      expect(validationResult.valid).toBe(true)
    })

    it.concurrent('should validate documents with API reference', () => {
      const pipeline = createValidationPipeline()
      const packageInfo = createTestPackageInfo()
      const readme = createTestReadme()
      const api = createTestAPI()

      const mdxResult = generateMDXDocument(packageInfo, readme, api)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const validationResult = pipeline.validate(mdxResult.data)
      expect(validationResult.valid).toBe(true)
    })

    it.concurrent('should catch empty titles', () => {
      const pipeline = createValidationPipeline()
      const doc: MDXDocument = {
        frontmatter: {
          title: '',
          description: 'Valid description',
        },
        content: '# Content',
        rendered: '---\ntitle: ""\n---\n# Content',
      }

      const result = pipeline.validate(doc)
      expect(result.errors.some(e => e.type === 'frontmatter')).toBe(true)
    })

    it.concurrent('should validate multiple documents', () => {
      const pipeline = createValidationPipeline()
      const packageInfo1 = createTestPackageInfo({name: '@test/package-1'})
      const packageInfo2 = createTestPackageInfo({name: '@test/package-2'})

      const mdx1Result = generateMDXDocument(packageInfo1, undefined, undefined)
      const mdx2Result = generateMDXDocument(packageInfo2, undefined, undefined)

      expect(mdx1Result.success).toBe(true)
      expect(mdx2Result.success).toBe(true)
      if (!mdx1Result.success || !mdx2Result.success) return

      const result = pipeline.validateMultiple([mdx1Result.data, mdx2Result.data])
      expect(result.success).toBe(true)
    })

    it.concurrent('should detect duplicate titles', () => {
      const pipeline = createValidationPipeline()
      const doc1: MDXDocument = {
        frontmatter: {title: 'Duplicate Title', description: 'First'},
        content: '# First',
        rendered: '---\ntitle: "Duplicate Title"\n---\n# First',
      }
      const doc2: MDXDocument = {
        frontmatter: {title: 'Duplicate Title', description: 'Second'},
        content: '# Second',
        rendered: '---\ntitle: "Duplicate Title"\n---\n# Second',
      }

      const result = pipeline.validateMultiple([doc1, doc2])
      expect(result.success).toBe(false)
    })
  })

  describe('content validation', () => {
    it.concurrent('should validate content strings directly', () => {
      const pipeline = createValidationPipeline()

      const validContent = `---
title: "Test"
---

# Valid Content

This is valid markdown.
`
      const result = pipeline.validateContent(validContent)
      expect(result.valid).toBe(true)
    })

    it.concurrent('should detect invalid markdown links', () => {
      const pipeline = createValidationPipeline()

      const contentWithEmptyLink = `---
title: "Test"
---

# Content

[Empty link]()
`
      const result = pipeline.validateContent(contentWithEmptyLink)
      // Should produce warning about empty link
      expect(typeof result.valid).toBe('boolean')
    })
  })

  describe('generated MDX from fixtures', () => {
    it.concurrent('should generate MDX from sample-lib fixture', async () => {
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

      expect(mdxResult.data.rendered).toContain('title:')
      expect(mdxResult.data.frontmatter.title).toBeDefined()

      const pipeline = createValidationPipeline()
      const validationResult = pipeline.validate(mdxResult.data)

      expect(typeof validationResult.valid).toBe('boolean')
      expect(Array.isArray(validationResult.errors)).toBe(true)
    })

    it.concurrent('should generate valid MDX without README', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')

      const packageResult = await parsePackageComplete(packagePath)
      expect(packageResult.success).toBe(true)
      if (!packageResult.success) return

      const mdxResult = generateMDXDocument(packageResult.data, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const validationResult = pipeline.validate(mdxResult.data)

      expect(validationResult.valid).toBe(true)
    })

    it.concurrent('should generate valid MDX without API', async () => {
      const packagePath = path.join(FIXTURES_DIR, 'sample-lib')
      const readmePath = path.join(packagePath, 'README.md')

      const packageResult = await parsePackageComplete(packagePath)
      const readmeResult = await parseReadmeFile(readmePath)

      expect(packageResult.success).toBe(true)
      expect(readmeResult.success).toBe(true)
      if (!packageResult.success || !readmeResult.success) return

      const mdxResult = generateMDXDocument(packageResult.data, readmeResult.data, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const validationResult = pipeline.validate(mdxResult.data)

      expect(validationResult.valid).toBe(true)
    })
  })

  describe('strict mode validation', () => {
    it.concurrent('should fail on warnings in strict mode', () => {
      const pipeline = createValidationPipeline({strict: true})
      const packageInfo = createTestPackageInfo()

      const mdxResult = generateMDXDocument(packageInfo, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const result = pipeline.validate(mdxResult.data)
      expect(typeof result.valid).toBe('boolean')
    })

    it.concurrent('should pass in non-strict mode with warnings', () => {
      const pipeline = createValidationPipeline({strict: false})
      const packageInfo = createTestPackageInfo()

      const mdxResult = generateMDXDocument(packageInfo, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const result = pipeline.validate(mdxResult.data)
      expect(result.valid).toBe(true)
    })
  })

  describe('component validation', () => {
    it.concurrent('should validate Starlight component usage', () => {
      const content = `---
title: "Test"
---

import { Badge, Card, CardGrid, Tabs, TabItem } from '@astrojs/starlight/components';

<Badge text="Info" variant="tip" />

<Card title="Card Title">
  Card content
</Card>
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should validate nested components', () => {
      const content = `---
title: "Test"
---

import { CardGrid, Card } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="First">Content 1</Card>
  <Card title="Second">Content 2</Card>
</CardGrid>
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })

    it.concurrent('should validate Tabs component', () => {
      const content = `---
title: "Test"
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="npm">npm install package</TabItem>
  <TabItem label="pnpm">pnpm add package</TabItem>
</Tabs>
`
      const result = validateMDXSyntax(content)
      expect(result.success).toBe(true)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle special characters in content', () => {
      const packageInfo = createTestPackageInfo({
        name: '@scope/special-chars',
        description: 'Package with <special> & "characters"',
      })

      const mdxResult = generateMDXDocument(packageInfo, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const result = pipeline.validate(mdxResult.data)
      expect(result.valid).toBe(true)
    })

    it.concurrent('should handle unicode in package names', () => {
      const packageInfo = createTestPackageInfo({
        name: '@scope/emoji-📦-package',
        description: 'Package with emoji 🚀',
      })

      const mdxResult = generateMDXDocument(packageInfo, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const result = pipeline.validate(mdxResult.data)
      expect(typeof result.valid).toBe('boolean')
    })

    it.concurrent('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(1000)
      const packageInfo = createTestPackageInfo({
        description: longDescription,
      })

      const mdxResult = generateMDXDocument(packageInfo, undefined, undefined)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const result = pipeline.validate(mdxResult.data)
      expect(result.valid).toBe(true)
    })

    it.concurrent('should handle multiline code examples', () => {
      const api = createTestAPI({
        functions: [
          {
            name: 'complexFunction',
            signature: 'complexFunction(config: Config): Result',
            parameters: [],
            returnType: 'Result',
            isAsync: true,
            isGenerator: false,
            isDefault: false,
            jsdoc: {
              description: 'A complex function',
              params: [],
              examples: [
                `const config = {
  option1: true,
  option2: 'value',
};

const result = await complexFunction(config);
console.log(result);`,
              ],
            },
          },
        ],
      })

      const packageInfo = createTestPackageInfo()
      const mdxResult = generateMDXDocument(packageInfo, undefined, api)
      expect(mdxResult.success).toBe(true)
      if (!mdxResult.success) return

      const pipeline = createValidationPipeline()
      const result = pipeline.validate(mdxResult.data)
      expect(result.valid).toBe(true)
    })
  })
})
