/**
 * Security tests for safe-patterns utilities - ReDoS prevention
 */

import {describe, expect, it} from 'vitest'

import {createHeadingPattern, extractCodeBlocks, hasComponent} from '../../src/utils/safe-patterns'

describe('security: ReDoS Prevention', () => {
  describe('createHeadingPattern', () => {
    it('should not hang on malicious heading input', () => {
      const malicious = `## ${'#'.repeat(100000)}`
      const pattern = createHeadingPattern(2)

      const start = Date.now()
      malicious.match(pattern) // Execute the match to test performance
      const duration = Date.now() - start

      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100)
      // Pattern uses [^\r\n]+ which matches the long line
      // The key security win is that it completes quickly (no ReDoS)
    })

    it('should correctly match valid headings', () => {
      const content = '## Hello World\n## Another Heading'
      const pattern = createHeadingPattern(2)
      const matches = [...content.matchAll(pattern)]

      expect(matches).toHaveLength(2)
      expect(matches[0]?.[1]).toBe('Hello World')
      expect(matches[1]?.[1]).toBe('Another Heading')
    })

    it('should handle very long valid headings efficiently', () => {
      const longHeading = `## ${'A'.repeat(10000)}\n`
      const pattern = createHeadingPattern(2)

      const start = Date.now()
      const matches = longHeading.match(pattern)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      expect(matches).toBeTruthy()
    })

    it('should create correct patterns for different levels', () => {
      expect(createHeadingPattern(1).source).toContain('# ')
      expect(createHeadingPattern(2).source).toContain('## ')
      expect(createHeadingPattern(3).source).toContain('### ')
      expect(createHeadingPattern(6).source).toContain('###### ')
    })

    it('should throw error for invalid levels', () => {
      expect(() => createHeadingPattern(0)).toThrow()
      expect(() => createHeadingPattern(7)).toThrow()
      expect(() => createHeadingPattern(-1)).toThrow()
    })
  })

  describe('hasComponent', () => {
    it('should correctly detect components without backtracking', () => {
      const content = '<Badge text="test" />'

      const start = Date.now()
      const result = hasComponent(content, 'Badge')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10)
      expect(result).toBe(true)
    })

    it('should not hang on malicious JSX-like input', () => {
      // Many spaces without closing angle bracket
      const malicious = `<Badge ${' '.repeat(100000)}`

      const start = Date.now()
      hasComponent(malicious, 'Badge') // Execute to test performance
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('should distinguish between Card and CardGrid', () => {
      const content = '<Card title="test" />'

      expect(hasComponent(content, 'Card')).toBe(true)
      expect(hasComponent(content, 'CardGrid')).toBe(false)
    })

    it('should detect self-closing components', () => {
      expect(hasComponent('<Badge />', 'Badge')).toBe(true)
      expect(hasComponent('<Badge/>', 'Badge')).toBe(true)
    })

    it('should detect components with attributes', () => {
      expect(hasComponent('<Badge text="test" variant="tip" />', 'Badge')).toBe(true)
    })

    it('should detect non-self-closing components', () => {
      expect(hasComponent('<Card>content</Card>', 'Card')).toBe(true)
    })

    it('should not detect non-existent components', () => {
      expect(hasComponent('<Badge />', 'Card')).toBe(false)
    })

    it('should escape special regex characters in component names', () => {
      // Hypothetical component with special chars
      expect(() => hasComponent('<Test.Component />', 'Test.Component')).not.toThrow()
    })
  })

  describe('extractCodeBlocks', () => {
    it('should not hang on malicious code block input', () => {
      const malicious = `\`\`\`${'x'.repeat(100000)}`

      const start = Date.now()
      const blocks = extractCodeBlocks(malicious)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      // Unclosed block - should handle gracefully
      expect(Array.isArray(blocks)).toBe(true)
    })

    it('should extract valid code blocks', () => {
      const content = `
# Title

\`\`\`typescript
const x = 1
\`\`\`

Some text

\`\`\`javascript
const y = 2
\`\`\`
`
      const blocks = extractCodeBlocks(content)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toContain('typescript')
      expect(blocks[0]).toContain('const x = 1')
      expect(blocks[1]).toContain('javascript')
      expect(blocks[1]).toContain('const y = 2')
    })

    it('should handle code blocks without language', () => {
      const content = '```\ncode here\n```'
      const blocks = extractCodeBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toContain('code here')
    })

    it('should handle empty content', () => {
      const blocks = extractCodeBlocks('')
      expect(blocks).toHaveLength(0)
    })

    it('should handle malformed markdown gracefully', () => {
      const malformed = '```typescript\ncode\n// no closing'
      const blocks = extractCodeBlocks(malformed)

      // Should not throw, return what it can parse
      expect(Array.isArray(blocks)).toBe(true)
    })

    it('should handle nested backticks', () => {
      const content = '```\ncode with ` backtick\n```'
      const blocks = extractCodeBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toContain('backtick')
    })

    it('should handle many code blocks efficiently', () => {
      const manyBlocks = Array.from({length: 100}, (_, i) => `\`\`\`\ncode ${i}\n\`\`\``).join(
        '\n\n',
      )

      const start = Date.now()
      const blocks = extractCodeBlocks(manyBlocks)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      expect(blocks.length).toBeGreaterThan(0)
    })
  })

  describe('performance Benchmarks', () => {
    it('should handle large documents efficiently', () => {
      const largeDoc = `
# Title
${'## Heading\n\nParagraph text.\n\n'.repeat(1000)}
\`\`\`typescript
${'const line = "code"\n'.repeat(100)}
\`\`\`
<Badge text="test" />
<Card>Content</Card>
`

      const start = Date.now()

      // Test all safe pattern functions
      createHeadingPattern(2)
      hasComponent(largeDoc, 'Badge')
      hasComponent(largeDoc, 'Card')
      extractCodeBlocks(largeDoc)

      const duration = Date.now() - start

      // All operations should complete quickly
      expect(duration).toBeLessThan(200)
    })
  })
})
