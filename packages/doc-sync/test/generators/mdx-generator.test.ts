/**
 * Tests for MDX document generation
 */

import type {MDXDocument, PackageAPI, PackageInfo, ReadmeContent, SyncError} from '../../src/types'
import {describe, expect, it} from 'vitest'

import {
  generateMDXDocument,
  sanitizeContent,
  sanitizeTextContent,
  validateMDXSyntax,
} from '../../src/generators/mdx-generator'

const createPackageInfo = (overrides: Partial<PackageInfo> = {}): PackageInfo => ({
  name: '@test/package',
  version: '1.0.0',
  description: 'A test package',
  packagePath: '/test/packages/package',
  srcPath: '/test/packages/package/src',
  ...overrides,
})

const createReadmeContent = (overrides: Partial<ReadmeContent> = {}): ReadmeContent => ({
  title: 'Test Package',
  preamble: 'This is the preamble.',
  sections: [],
  raw: '# Test Package\n\nThis is the preamble.',
  ...overrides,
})

const createPackageAPI = (overrides: Partial<PackageAPI> = {}): PackageAPI => ({
  functions: [],
  types: [],
  reExports: [],
  ...overrides,
})

describe('mdx-generator', () => {
  describe('generateMDXDocument', () => {
    it.concurrent('should generate a basic MDX document', () => {
      const packageInfo = createPackageInfo()
      const readme = createReadmeContent()

      const result = generateMDXDocument(packageInfo, readme, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.rendered).toContain('---')
      expect(doc.rendered).toContain('title:')
      expect(doc.rendered).toContain('@test/package')
    })

    it.concurrent('should include frontmatter', () => {
      const packageInfo = createPackageInfo({
        name: '@scope/my-lib',
        description: 'A useful library',
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.frontmatter.title).toBe('@scope/my-lib')
      expect(doc.frontmatter.description).toBe('A useful library')
    })

    it.concurrent('should include Starlight imports', () => {
      const packageInfo = createPackageInfo()

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('@astrojs/starlight/components')
      expect(doc.content).toContain('Badge')
      expect(doc.content).toContain('Card')
    })

    it.concurrent('should generate package header with name and version', () => {
      const packageInfo = createPackageInfo({
        name: '@test/my-package',
        version: '2.0.0',
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('# @test/my-package')
      expect(doc.content).toContain('v2.0.0')
    })

    it.concurrent('should include CLI badge for CLI tools', () => {
      const packageInfo = createPackageInfo({
        keywords: ['cli', 'tool'],
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('CLI Tool')
    })

    it.concurrent('should include Library badge for libraries', () => {
      const packageInfo = createPackageInfo({
        keywords: ['library'],
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('Library')
    })

    it.concurrent('should include Config badge for configs', () => {
      const packageInfo = createPackageInfo({
        keywords: ['config'],
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('Config')
    })

    it.concurrent('should include description when present', () => {
      const packageInfo = createPackageInfo({
        description: 'This is a detailed description of the package.',
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('This is a detailed description')
    })

    it.concurrent('should include API reference when provided', () => {
      const packageInfo = createPackageInfo()
      const api = createPackageAPI({
        functions: [
          {
            name: 'doSomething',
            signature: 'function doSomething(): void',
            parameters: [],
            isAsync: false,
            isGenerator: false,
            returnType: 'void',
            isDefault: false,
          },
        ],
      })

      const result = generateMDXDocument(packageInfo, undefined, api)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('API Reference')
      expect(doc.content).toContain('doSomething')
    })

    it.concurrent('should skip API section when no API content', () => {
      const packageInfo = createPackageInfo()
      const api = createPackageAPI()

      const result = generateMDXDocument(packageInfo, undefined, api)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).not.toContain('API Reference')
    })

    it.concurrent('should respect includeAPI option', () => {
      const packageInfo = createPackageInfo()
      const api = createPackageAPI({
        functions: [
          {
            name: 'testFn',
            signature: 'function testFn(): void',
            parameters: [],
            isAsync: false,
            isGenerator: false,
            returnType: 'void',
            isDefault: false,
          },
        ],
      })

      const result = generateMDXDocument(packageInfo, undefined, api, {
        includeAPI: false,
      })

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).not.toContain('API Reference')
    })

    it.concurrent('should apply frontmatter overrides', () => {
      const packageInfo = createPackageInfo()

      const result = generateMDXDocument(packageInfo, undefined, undefined, {
        frontmatterOverrides: {
          title: 'Custom Title',
          sidebar: {order: 1},
        },
      })

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.frontmatter.title).toBe('Custom Title')
      expect(doc.frontmatter.sidebar?.order).toBe(1)
    })

    it.concurrent('should include sentinel markers around auto content', () => {
      const packageInfo = createPackageInfo()
      const api = createPackageAPI({
        functions: [
          {
            name: 'autoFn',
            signature: 'function autoFn(): void',
            parameters: [],
            isAsync: false,
            isGenerator: false,
            returnType: 'void',
            isDefault: false,
          },
        ],
      })

      const result = generateMDXDocument(packageInfo, undefined, api)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      // Actual sentinel markers use JSX comment syntax
      expect(doc.content).toContain('AUTO-GENERATED-START')
      expect(doc.content).toContain('AUTO-GENERATED-END')
    })

    it.concurrent('should generate valid MDX output', () => {
      const packageInfo = createPackageInfo()
      const readme = createReadmeContent()

      const result = generateMDXDocument(packageInfo, readme, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data

      const validation = validateMDXSyntax(doc.rendered)
      expect(validation.success).toBe(true)
    })
  })

  describe('sanitizeContent', () => {
    it.concurrent('should escape HTML entities', () => {
      const result = sanitizeContent('<script>alert("xss")</script>')

      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
    })

    it.concurrent('should handle ampersands', () => {
      const result = sanitizeContent('Tom & Jerry')

      expect(result).toContain('&amp;')
    })

    it.concurrent('should preserve safe content', () => {
      const result = sanitizeContent('Hello world!')

      expect(result).toBe('Hello world!')
    })

    it.concurrent('should handle empty string', () => {
      const result = sanitizeContent('')

      expect(result).toBe('')
    })
  })

  describe('sanitizeTextContent', () => {
    it.concurrent('should preserve Starlight JSX components', () => {
      const content = '<Badge text="test" />'
      const result = sanitizeTextContent(content)

      expect(result).toContain('Badge')
    })

    it.concurrent('should sanitize text around JSX components', () => {
      const content = '<div>unsafe</div> <Badge text="safe" />'
      const result = sanitizeTextContent(content)

      expect(result).toContain('Badge')
    })

    it.concurrent('should handle nested components', () => {
      const content = '<Card><p>content</p></Card>'
      const result = sanitizeTextContent(content)

      expect(result).toContain('Card')
    })
  })

  describe('validateMDXSyntax', () => {
    it.concurrent('should pass valid MDX', () => {
      const mdx = `---
title: Test
---

# Hello

<Badge text="test" />
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })

    it.concurrent('should fail for missing frontmatter', () => {
      const mdx = `# Hello

<Badge text="test" />
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('frontmatter')
    })

    it.concurrent('should fail for unclosed frontmatter', () => {
      const mdx = `---
title: Test

# Hello
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('not properly closed')
    })

    it.concurrent('should fail for empty frontmatter', () => {
      const mdx = `---
---

# Hello
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('empty')
    })

    it.concurrent('should fail for missing title', () => {
      const mdx = `---
description: Test
---

# Hello
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('title')
    })

    it.concurrent('should detect unclosed JSX tags', () => {
      const mdx = `---
title: Test
---

<Card>
  <CardGrid>
    Content
  </CardGrid>
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(false)
      const error = (result as {success: false; error: SyncError}).error
      expect(error.message).toContain('Unclosed')
    })

    it.concurrent('should pass for self-closing tags', () => {
      const mdx = `---
title: Test
---

<Badge text="test" />
<Icon name="star" />
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })

    it.concurrent('should pass for properly closed nested tags', () => {
      const mdx = `---
title: Test
---

<Card>
  <CardGrid>
    <Badge text="test" />
  </CardGrid>
</Card>
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })

    it.concurrent('should not treat TypeScript generics in inline code as JSX tags', () => {
      const mdx = `---
title: Test
---

# Type Safety

Use the \`Result<T, E>\` type for error handling.

All operations return \`Result<T, E>\` discriminated unions.
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })

    it.concurrent('should not treat generics in fenced code blocks as JSX tags', () => {
      const mdx = `---
title: Test
---

# Example

\`\`\`typescript
function process<T, E>(result: Result<T, E>): T {
  return result.value
}
\`\`\`
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })

    it.concurrent('should handle mixed inline code and JSX components', () => {
      const mdx = `---
title: Test
---

# Documentation

Use \`Result<T, E>\` with the following component:

<Badge text="TypeScript" variant="tip" />

The \`Option<T>\` type is also available.
`
      const result = validateMDXSyntax(mdx)

      expect(result.success).toBe(true)
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle package with minimal required fields', () => {
      const packageInfo = createPackageInfo({
        name: 'minimal-package',
        version: '0.0.1',
        description: undefined,
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.rendered).toContain('minimal-package')
    })

    it.concurrent('should handle special characters in package name', () => {
      const packageInfo = createPackageInfo({
        name: '@scope/package-name.js',
      })

      const result = generateMDXDocument(packageInfo, undefined, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.frontmatter.title).toBe('@scope/package-name.js')
    })

    it.concurrent('should handle complex README content', () => {
      const packageInfo = createPackageInfo()
      const readme = createReadmeContent({
        sections: [
          {
            heading: 'Installation',
            level: 2,
            content: 'npm install @test/package',
            children: [],
          },
          {
            heading: 'Usage',
            level: 2,
            content: 'import { thing } from "@test/package"',
            children: [
              {
                heading: 'Advanced Usage',
                level: 3,
                content: 'More complex examples here.',
                children: [],
              },
            ],
          },
        ],
      })

      const result = generateMDXDocument(packageInfo, readme, undefined)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('Installation')
      expect(doc.content).toContain('Usage')
    })

    it.concurrent('should handle API with types only', () => {
      const packageInfo = createPackageInfo()
      const api = createPackageAPI({
        types: [
          {
            name: 'Config',
            kind: 'interface',
            definition: 'interface Config { value: string }',
            isDefault: false,
          },
        ],
      })

      const result = generateMDXDocument(packageInfo, undefined, api)

      expect(result.success).toBe(true)
      const doc = (result as {success: true; data: MDXDocument}).data
      expect(doc.content).toContain('API Reference')
      expect(doc.content).toContain('Config')
    })
  })
})
