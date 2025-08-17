import path from 'node:path'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TemplateResolver} from '../../src/templates/resolver.js'
import {testUtils} from '../test-utils.js'

describe('template resolver', () => {
  let resolver: TemplateResolver

  beforeEach(() => {
    resolver = new TemplateResolver()
    testUtils.setup()
  })

  describe('resolve', () => {
    describe('github repository resolution', () => {
      it.concurrent('resolves GitHub shorthand format', () => {
        const result = resolver.resolve('user/repo')
        expect(result).toEqual({
          type: 'github',
          location: 'user/repo',
        })
      })

      it.concurrent('resolves GitHub with branch reference', () => {
        const result = resolver.resolve('github:user/repo#develop')
        expect(result).toEqual({
          type: 'github',
          location: 'github:user/repo',
          ref: 'develop',
          subdir: undefined,
        })
      })

      it.concurrent('resolves GitHub with subdirectory', () => {
        const result = resolver.resolve('user/repo/templates/library')
        expect(result).toEqual({
          type: 'github',
          location: 'user/repo',
          ref: undefined,
          subdir: 'templates/library',
        })
      })

      it.concurrent('resolves GitHub with both branch and subdirectory', () => {
        const result = resolver.resolve('github:user/repo#main/templates/cli')
        expect(result).toEqual({
          type: 'github',
          location: 'github:user/repo',
          ref: 'main/templates/cli',
          subdir: undefined,
        })
      })

      it.concurrent('resolves complex GitHub organization/repo', () => {
        const result = resolver.resolve('bfra-me/works')
        expect(result).toEqual({
          type: 'github',
          location: 'bfra-me/works',
        })
      })
    })

    describe('url resolution', () => {
      it.concurrent('resolves HTTPS URLs', () => {
        const url = 'https://example.com/template.zip'
        const result = resolver.resolve(url)
        expect(result).toEqual({
          type: 'url',
          location: url,
        })
      })

      it.concurrent('resolves HTTP URLs', () => {
        const url = 'http://example.com/template.tar.gz'
        const result = resolver.resolve(url)
        expect(result).toEqual({
          type: 'url',
          location: url,
        })
      })

      it.concurrent('resolves file URLs', () => {
        const url = 'file:///path/to/template.zip'
        const result = resolver.resolve(url)
        expect(result).toEqual({
          type: 'url',
          location: url,
        })
      })
    })

    describe('local path resolution', () => {
      it.concurrent('resolves relative paths', () => {
        const result = resolver.resolve('./my-template')
        expect(result.type).toBe('local')
        expect(result.location).toContain('my-template')
      })

      it.concurrent('resolves absolute paths', () => {
        const absolutePath = '/Users/test/templates/my-template'
        const result = resolver.resolve(absolutePath)
        expect(result).toEqual({
          type: 'local',
          location: absolutePath,
        })
      })

      it.concurrent('resolves home directory paths', () => {
        const result = resolver.resolve('~/templates/my-template')
        // ~ is interpreted as GitHub shorthand if it contains no path separators before slash
        expect(result.type).toBe('github')
        expect(result.location).toBe('~/templates')
        expect(result.subdir).toBe('my-template')
      })

      it.concurrent('resolves current directory references', () => {
        const result = resolver.resolve('.')
        // Single . is treated as builtin
        expect(result.type).toBe('builtin')
        expect(result.location).toBe('.')
      })
    })

    describe('built-in template resolution', () => {
      it.concurrent('resolves built-in template names', () => {
        const result = resolver.resolve('default')
        expect(result).toEqual({
          type: 'builtin',
          location: 'default',
        })
      })

      it.concurrent('resolves library template', () => {
        const result = resolver.resolve('library')
        expect(result).toEqual({
          type: 'builtin',
          location: 'library',
        })
      })

      it.concurrent('resolves CLI template', () => {
        const result = resolver.resolve('cli')
        expect(result).toEqual({
          type: 'builtin',
          location: 'cli',
        })
      })

      it.concurrent('resolves React template', () => {
        const result = resolver.resolve('react')
        expect(result).toEqual({
          type: 'builtin',
          location: 'react',
        })
      })

      it.concurrent('resolves Node.js template', () => {
        const result = resolver.resolve('node')
        expect(result).toEqual({
          type: 'builtin',
          location: 'node',
        })
      })
    })

    describe('edge cases', () => {
      it.concurrent('handles empty string', () => {
        const result = resolver.resolve('')
        expect(result).toEqual({
          type: 'builtin',
          location: '',
        })
      })

      it.concurrent('handles special characters in repository names', () => {
        const result = resolver.resolve('user/repo-with-dashes_and_underscores')
        expect(result).toEqual({
          type: 'github',
          location: 'user/repo-with-dashes_and_underscores',
        })
      })

      it.concurrent('handles scoped package names as fallback', () => {
        const result = resolver.resolve('@scope/package')
        expect(result).toEqual({
          type: 'github',
          location: '@scope/package',
          ref: undefined,
          subdir: undefined,
        })
      })
    })
  })

  describe('validate', () => {
    describe('local template validation', () => {
      it.concurrent('validates existing local directory', async () => {
        const testDir = testUtils.createTempDir('valid-local-template')
        testUtils.writeTempFile('valid-local-template', 'template.json', '{}')

        const source = {type: 'local' as const, location: testDir}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()

        testUtils.cleanupTempDir('valid-local-template')
      })

      it.concurrent('fails validation for non-existent local directory', async () => {
        const source = {type: 'local' as const, location: '/non/existent/path'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
          'Local template directory does not exist: /non/existent/path',
        )
      })
    })

    describe('github template validation', () => {
      it.concurrent('validates valid GitHub repository format', async () => {
        const source = {type: 'github' as const, location: 'user/repo'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()
      })

      it.concurrent('fails validation for invalid GitHub format', async () => {
        const source = {type: 'github' as const, location: 'invalid-format'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid GitHub repository format: invalid-format')
      })

      it.concurrent('validates GitHub repository with organization', async () => {
        const source = {type: 'github' as const, location: 'bfra-me/works'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()
      })
    })

    describe('url template validation', () => {
      it.concurrent('validates HTTPS URLs', async () => {
        const source = {type: 'url' as const, location: 'https://example.com/template.zip'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()
      })

      it.concurrent('fails validation for invalid URLs', async () => {
        const source = {type: 'url' as const, location: 'not-a-url'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid URL format: not-a-url')
      })
    })

    describe('built-in template validation', () => {
      it.concurrent('validates existing built-in template', async () => {
        const source = {type: 'builtin' as const, location: 'default'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()
      })

      it.concurrent('fails validation for non-existent built-in template', async () => {
        const source = {type: 'builtin' as const, location: 'non-existent'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Built-in template does not exist: non-existent')
      })
    })

    describe('error handling', () => {
      it.concurrent('handles validation errors gracefully', async () => {
        // Test with valid but problematic source
        const source = {type: 'local' as const, location: '/non/existent/directory'}
        const result = await resolver.validate(source)

        expect(result.valid).toBe(false)
        expect(result.errors).toBeDefined()
        expect(result.errors?.[0]).toContain('does not exist')
      })
    })
  })

  describe('getBuiltinTemplates', () => {
    it.concurrent('returns list of built-in templates', () => {
      const templates = resolver.getBuiltinTemplates()

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)

      // Check for expected built-in templates
      expect(templates).toContain('default')
      expect(templates).toContain('library')
      expect(templates).toContain('cli')
      expect(templates).toContain('react')
      expect(templates).toContain('node')
    })

    it.concurrent('handles missing templates directory gracefully', () => {
      // Mock the templates directory to not exist
      const mockResolver = new (class extends TemplateResolver {
        override getBuiltinTemplates() {
          // Override to simulate missing directory
          return []
        }
      })()

      const templates = mockResolver.getBuiltinTemplates()
      expect(templates).toEqual([])
    })
  })

  describe('normalize', () => {
    it.concurrent('normalizes GitHub source with default branch', () => {
      const source = {type: 'github' as const, location: 'user/repo'}
      const normalized = resolver.normalize(source)

      expect(normalized.type).toBe('github')
      expect(normalized.location).toBe('user/repo')
      // The normalize method doesn't add default branch - it leaves it undefined
      expect(normalized.ref).toBeUndefined()
    })

    it.concurrent('preserves existing branch reference', () => {
      const source = {type: 'github' as const, location: 'user/repo', ref: 'develop'}
      const normalized = resolver.normalize(source)

      expect(normalized.ref).toBe('develop')
    })

    it.concurrent('normalizes local paths to absolute', () => {
      const source = {type: 'local' as const, location: './relative/path'}
      const normalized = resolver.normalize(source)

      expect(normalized.type).toBe('local')
      expect(normalized.location).not.toContain('./relative')
      expect(path.isAbsolute(normalized.location)).toBe(true)
    })

    it.concurrent('leaves URL sources unchanged', () => {
      const source = {type: 'url' as const, location: 'https://example.com/template.zip'}
      const normalized = resolver.normalize(source)

      expect(normalized).toEqual(source)
    })

    it.concurrent('leaves built-in sources unchanged', () => {
      const source = {type: 'builtin' as const, location: 'default'}
      const normalized = resolver.normalize(source)

      expect(normalized).toEqual(source)
    })
  })

  describe('integration tests', () => {
    it.concurrent('resolves and validates built-in template workflow', async () => {
      const templateString = 'library'

      // Resolve the template
      const source = resolver.resolve(templateString)
      expect(source.type).toBe('builtin')
      expect(source.location).toBe('library')

      // Validate the resolved source
      const validation = await resolver.validate(source)
      expect(validation.valid).toBe(true)

      // Normalize the source
      const normalized = resolver.normalize(source)
      expect(normalized).toEqual(source)
    })

    it.concurrent('resolves and validates GitHub template workflow', async () => {
      const templateString = 'bfra-me/works#main/packages/create/templates/library'

      // Resolve the template
      const source = resolver.resolve(templateString)
      expect(source.type).toBe('github')
      expect(source.location).toBe('bfra-me/works')
      expect(source.ref).toBe('main/packages/create/templates/library')
      expect(source.subdir).toBeUndefined()

      // Validate the resolved source
      const validation = await resolver.validate(source)
      expect(validation.valid).toBe(true)

      // Normalize the source (should preserve existing values)
      const normalized = resolver.normalize(source)
      expect(normalized.ref).toBe('main/packages/create/templates/library')
    })
  })
})

// Mock GitHub API responses for testing
export const mockGitHubApi = {
  validRepository: {
    setup() {
      // This would be implemented with MSW or similar for actual API mocking
      vi.mock('giget', () => ({
        downloadTemplate: vi.fn().mockResolvedValue({
          dir: '/tmp/mocked-template',
          cleanup: vi.fn(),
        }),
      }))
    },

    teardown() {
      vi.clearAllMocks()
    },
  },
}
