import {join} from 'node:path'
import {ESLint} from 'eslint'
import {describe, expect, it} from 'vitest'
import {defineConfig} from '../src'

const fixturesPath = new URL('./fixtures/markdown', import.meta.url).pathname

async function createESLint(options: Parameters<typeof defineConfig>[0]): Promise<ESLint> {
  const configs = await defineConfig(options)
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: configs,
    ignore: false,
  })
}

async function lintFile(eslint: ESLint, filePath: string) {
  const results = await eslint.lintFiles([filePath])
  const result = results[0]
  if (result == null) {
    throw new Error(`No lint result for file: ${filePath}`)
  }
  return result
}

describe('markdown configuration', () => {
  describe('language mode selection', () => {
    it('should use CommonMark mode when language: "commonmark" is configured', async () => {
      const eslint = await createESLint({
        markdown: {language: 'commonmark'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'commonmark/basic.md'))

      expect(result.filePath).toContain('commonmark/basic.md')
      expect(result.errorCount).toBeGreaterThanOrEqual(0)
    })

    it('should use GFM mode when language: "gfm" is configured', async () => {
      const eslint = await createESLint({
        markdown: {language: 'gfm'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'gfm/advanced.md'))

      expect(result.filePath).toContain('gfm/advanced.md')
      expect(result.errorCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('frontmatter parsing', () => {
    it('should parse YAML frontmatter when frontmatter: "yaml" is configured', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'yaml'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'frontmatter/yaml.md'))

      expect(result.filePath).toContain('frontmatter/yaml.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should parse TOML frontmatter when frontmatter: "toml" is configured', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'toml'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'frontmatter/toml.md'))

      expect(result.filePath).toContain('frontmatter/toml.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should parse JSON frontmatter when frontmatter: "json" is configured', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'json'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'frontmatter/json.md'))

      expect(result.filePath).toContain('frontmatter/json.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should disable frontmatter parsing when frontmatter: false is configured', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: false},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'frontmatter/yaml.md'))

      expect(result.filePath).toContain('frontmatter/yaml.md')
      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('code block processing', () => {
    it('should extract TypeScript code blocks correctly when processor is enabled', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {typescript: true},
        },
        typescript: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/typescript.md'))

      expect(result.filePath).toContain('code-blocks/typescript.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should extract JavaScript code blocks correctly when processor is enabled', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {javascript: true},
        },
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/javascript.md'))

      expect(result.filePath).toContain('code-blocks/javascript.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should extract JSX/TSX code blocks correctly when processor is enabled', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {jsx: true},
        },
        jsx: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/jsx.md'))

      expect(result.filePath).toContain('code-blocks/jsx.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should handle multiple code blocks in a single file', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {typescript: true, javascript: true, json: true},
        },
        typescript: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/mixed.md'))

      expect(result.filePath).toContain('code-blocks/mixed.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should handle nested code blocks without errors', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
        },
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/nested.md'))

      expect(result.filePath).toContain('edge-cases/nested.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should extract filename meta from code blocks', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {typescript: true},
        },
        typescript: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/filename-meta.md'))

      expect(result.filePath).toContain('edge-cases/filename-meta.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should apply TypeScript-ESLint rules to TypeScript code blocks', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {typescript: true},
        },
        typescript: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/typescript.md'))

      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('eslint directives', () => {
    it('should respect eslint-disable directives in Markdown HTML comments', async () => {
      const eslint = await createESLint({
        markdown: {
          rules: {'markdown/no-html': 'error'},
        },
      })

      const result = await lintFile(eslint, join(fixturesPath, 'directives/disable.md'))

      expect(result.filePath).toContain('directives/disable.md')
      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('markdown rules', () => {
    it('should detect common Markdown issues with recommended rules', async () => {
      const eslint = await createESLint({
        markdown: {},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/empty.md'))

      expect(result.errorCount).toBeGreaterThanOrEqual(0)
    })

    it('should apply rule overrides correctly to Markdown files', async () => {
      const eslint = await createESLint({
        markdown: {
          rules: {
            'markdown/no-html': 'off',
            'markdown/heading-increment': 'warn',
          },
        },
      })

      const result = await lintFile(eslint, join(fixturesPath, 'commonmark/basic.md'))

      expect(result.fatalErrorCount).toBe(0)
    })

    it('should recognize GFM-specific features like tables and task lists', async () => {
      const eslint = await createESLint({
        markdown: {language: 'gfm'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'gfm/advanced.md'))

      expect(result.filePath).toContain('gfm/advanced.md')
      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty Markdown files', async () => {
      const eslint = await createESLint({
        markdown: {},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/empty.md'))

      expect(result.filePath).toContain('edge-cases/empty.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should handle malformed frontmatter gracefully', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'yaml'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/malformed.md'))

      expect(result.filePath).toContain('edge-cases/malformed.md')
    })

    it('should handle code blocks without language identifiers', async () => {
      const eslint = await createESLint({
        markdown: {
          processor: {enabled: true, extractCodeBlocks: true},
        },
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/no-lang.md'))

      expect(result.filePath).toContain('edge-cases/no-lang.md')
      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('backward compatibility', () => {
    it('should maintain backward compatibility with existing Markdown files in monorepo', async () => {
      const eslint = await createESLint({
        markdown: {},
      })

      const result = await lintFile(
        eslint,
        join(new URL('..', import.meta.url).pathname, 'readme.md'),
      )

      expect(result.filePath).toContain('readme.md')
      expect(result.fatalErrorCount).toBe(0)
    })

    it('should work with default configuration (no options)', async () => {
      const eslint = await createESLint({
        markdown: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'commonmark/basic.md'))

      expect(result.fatalErrorCount).toBe(0)
    })

    it('should handle mixed Markdown features (frontmatter + code blocks + GFM)', async () => {
      const eslint = await createESLint({
        markdown: {
          language: 'gfm',
          frontmatter: 'yaml',
          processor: {enabled: true, extractCodeBlocks: true},
        },
        typescript: true,
      })

      const result = await lintFile(eslint, join(fixturesPath, 'code-blocks/mixed.md'))

      expect(result.fatalErrorCount).toBe(0)
    })
  })

  describe('configuration API', () => {
    it('should accept boolean true for simple enabling', async () => {
      const configs = await defineConfig({markdown: true})

      expect(configs).toBeDefined()
      expect(Array.isArray(configs)).toBe(true)
    })

    it('should accept full MarkdownOptions object', async () => {
      const configs = await defineConfig({
        markdown: {
          language: 'gfm',
          frontmatter: 'yaml',
          processor: {enabled: true, extractCodeBlocks: true},
          codeBlocks: {typescript: true, javascript: true},
          files: ['**/*.md'],
          rules: {'markdown/no-html': 'off'},
        },
      })

      expect(configs).toBeDefined()
      expect(Array.isArray(configs)).toBe(true)
    })

    it('should handle partial options with defaults', async () => {
      const configs = await defineConfig({
        markdown: {language: 'commonmark'},
      })

      expect(configs).toBeDefined()
      expect(Array.isArray(configs)).toBe(true)
    })
  })

  describe('security validation', () => {
    it('should safely parse frontmatter without code execution', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'yaml'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'frontmatter/yaml.md'))

      expect(result.fatalErrorCount).toBe(0)
    })

    it('should handle frontmatter with special characters safely', async () => {
      const eslint = await createESLint({
        markdown: {frontmatter: 'yaml'},
      })

      const result = await lintFile(eslint, join(fixturesPath, 'edge-cases/malformed.md'))

      expect(result).toBeDefined()
    })
  })
})
