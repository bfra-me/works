import {describe, expect, it} from 'vitest'
import {defineConfig} from '../../src/config.js'
import {ValidationError} from '../../src/validation/validator.js'

describe('defineConfig validation', () => {
  describe('successful validation', () => {
    it('should validate a valid configuration', () => {
      const config = defineConfig({
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer',
          '@semantic-release/release-notes-generator',
          '@semantic-release/npm',
          '@semantic-release/github',
        ],
      })

      expect(config).toMatchObject({
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer',
          '@semantic-release/release-notes-generator',
          '@semantic-release/npm',
          '@semantic-release/github',
        ],
      })
    })

    it('should validate configuration with plugin tuples', () => {
      const config = defineConfig({
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer',
          ['@semantic-release/npm', {npmPublish: false}],
          '@semantic-release/github',
        ],
      })

      expect(config.plugins).toHaveLength(3)
      expect(config.plugins?.[1]).toEqual(['@semantic-release/npm', {npmPublish: false}])
    })

    it('should apply environment-specific transformations for development', () => {
      const config = defineConfig(
        {
          branches: ['main'],
          plugins: ['@semantic-release/commit-analyzer'],
        },
        {
          environment: 'development',
        },
      )

      // Type assertion needed because defineConfig preserves input type
      expect('dryRun' in config && config.dryRun).toBe(true)
    })

    it('should apply environment-specific transformations for test', () => {
      const config = defineConfig(
        {
          branches: ['main'],
          plugins: ['@semantic-release/commit-analyzer'],
        },
        {
          environment: 'test',
        },
      )

      // Type assertions needed because defineConfig preserves input type
      expect('ci' in config && config.ci).toBe(true)
      expect('dryRun' in config && config.dryRun).toBe(true)
    })

    it('should not override existing values for environment transformations', () => {
      const config = defineConfig(
        {
          branches: ['main'],
          plugins: ['@semantic-release/commit-analyzer'],
          dryRun: false,
        },
        {
          environment: 'development',
        },
      )

      expect(config.dryRun).toBe(false) // Should preserve existing value
    })
  })

  describe('validation errors', () => {
    it('should throw ValidationError for invalid branches type', () => {
      expect(() => {
        defineConfig({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          branches: 'main' as any, // Invalid: should be array
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError with helpful suggestions for invalid branches', () => {
      expect(() => {
        defineConfig({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          branches: 'main' as any,
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(/branches.*should be an array.*Try: branches: \["main"\]/)
    })

    it('should throw ValidationError for invalid repositoryUrl', () => {
      expect(() => {
        defineConfig({
          branches: ['main'],
          repositoryUrl: 'not-a-url',
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(ValidationError)
    })

    it('should provide helpful suggestions for invalid URL', () => {
      expect(() => {
        defineConfig({
          branches: ['main'],
          repositoryUrl: 'invalid-url',
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(/repositoryUrl.*must be a valid URL.*https:\/\/github\.com\/owner\/repo\.git/)
    })

    it('should handle empty string validation', () => {
      expect(() => {
        defineConfig({
          branches: [''], // Invalid: empty string
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(ValidationError)
    })

    it('should provide documentation link in error suggestions', () => {
      expect(() => {
        defineConfig({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          branches: 'main' as any,
          plugins: ['@semantic-release/commit-analyzer'],
        })
      }).toThrow(/📖 For more help: https:\/\/semantic-release\.gitbook\.io/)
    })

    it('should allow disabling validation', () => {
      // This should not throw even with invalid config
      const config = defineConfig(
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          branches: 'main' as any,
          plugins: ['@semantic-release/commit-analyzer'],
        },
        {
          validate: false,
        },
      )

      expect(config.branches).toBe('main')
    })

    it('should validate plugin configurations', () => {
      expect(() => {
        defineConfig({
          branches: ['main'],
          plugins: [
            ['@semantic-release/npm', 'invalid-config' as any], // Invalid: config should be object
          ],
        })
      }).toThrow(ValidationError)
    })
  })

  describe('complex configurations', () => {
    it('should validate complex branch specifications', () => {
      const config = defineConfig({
        branches: [
          'main',
          {name: 'beta', prerelease: true},
          {name: 'alpha', prerelease: 'alpha', channel: 'alpha'},
        ],
        plugins: ['@semantic-release/commit-analyzer'],
      })

      expect(config.branches).toHaveLength(3)
      expect(config.branches?.[1]).toMatchObject({name: 'beta', prerelease: true})
    })

    it('should validate configuration with all options', () => {
      const config = defineConfig({
        branches: ['main', 'develop'],
        repositoryUrl: 'https://github.com/test/repo.git',
        // Template strings are valid in semantic-release tagFormat
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
        plugins: [
          '@semantic-release/commit-analyzer',
          ['@semantic-release/release-notes-generator', {preset: 'angular'}],
          '@semantic-release/npm',
          '@semantic-release/github',
        ],
        ci: false,
        dryRun: true,
        debug: true,
      })

      expect(config).toMatchObject({
        branches: ['main', 'develop'],
        repositoryUrl: 'https://github.com/test/repo.git',
        // Template strings are valid in semantic-release tagFormat
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
        ci: false,
        dryRun: true,
        debug: true,
      })
      expect(config.plugins).toHaveLength(4)
    })
  })
})
