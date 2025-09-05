/**
 * Comprehensive tests for configuration validation with edge cases and error scenarios.
 *
 * This test suite covers:
 * - Runtime validation of semantic-release configurations
 * - Plugin-specific configuration validation
 * - Edge cases and error scenarios
 * - Custom error handling and messaging
 * - Type safety validation
 */

import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {
  validateCompleteConfig,
  validateConfig,
  validatePluginConfig,
  ValidationError,
} from '../src/validation/validator.js'
import {setupFixtures, teardownFixtures, testUtils} from './test-utils.js'

interface ValidationTestCase {
  name: string
  config: unknown
  expected: boolean
  error?: string
}

interface ValidationFixtures {
  'valid-configs': ValidationTestCase[]
  'invalid-configs': ValidationTestCase[]
  'edge-cases': ValidationTestCase[]
  'plugin-validation': ValidationTestCase[]
}

describe('configuration validation', () => {
  let validationCases: ValidationFixtures

  beforeAll(() => {
    setupFixtures()
    validationCases = testUtils.loadJsonFixture<ValidationFixtures>(
      'input',
      'validation',
      'validation-cases.json',
    )
  })

  afterAll(() => {
    teardownFixtures()
  })

  describe('valid configuration validation', () => {
    it('should validate all valid configuration fixtures', () => {
      const validConfigs = validationCases['valid-configs']

      for (const testCase of validConfigs) {
        const result = validateConfig(testCase.config)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBeDefined()
          expect(result.data.branches).toBeDefined()
        }
      }
    })

    it('should validate basic configuration', () => {
      const config = {
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo',
        plugins: [
          '@semantic-release/commit-analyzer',
          '@semantic-release/release-notes-generator',
          '@semantic-release/npm',
        ],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.branches).toEqual(['main'])
        expect(result.data.repositoryUrl).toBe('https://github.com/user/repo')
        expect(result.data.plugins).toHaveLength(3)
      }
    })

    it('should validate minimal configuration', () => {
      const config = {
        branches: ['main'],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.branches).toEqual(['main'])
      }
    })

    it('should validate configuration with preset', () => {
      const config = {
        extends: '@bfra.me/semantic-release',
        branches: ['main', 'next'],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.extends).toBe('@bfra.me/semantic-release')
        expect(result.data.branches).toEqual(['main', 'next'])
      }
    })

    it('should validate complex branch configurations', () => {
      const config = {
        branches: [
          'main',
          'next',
          {name: 'beta', prerelease: true},
          {name: 'alpha', prerelease: 'alpha'},
        ],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.branches).toHaveLength(4)
        if (result.data.branches && Array.isArray(result.data.branches)) {
          expect(result.data.branches[2]).toEqual({name: 'beta', prerelease: true})
          expect(result.data.branches[3]).toEqual({name: 'alpha', prerelease: 'alpha'})
        }
      }
    })

    it('should validate configuration with all optional fields', () => {
      const tagFormatValue = 'v' + '$' + '{version}'
      const config = {
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo.git',
        tagFormat: tagFormatValue,
        plugins: ['@semantic-release/npm'],
        dryRun: false,
        ci: true,
        debug: false,
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.repositoryUrl).toBe('https://github.com/user/repo.git')
        expect(result.data.tagFormat).toBe(tagFormatValue)
        expect(result.data.dryRun).toBe(false)
        expect(result.data.ci).toBe(true)
        expect(result.data.debug).toBe(false)
      }
    })
  })

  describe('invalid configuration validation', () => {
    it('should reject all invalid configuration fixtures', () => {
      const invalidConfigs = validationCases['invalid-configs']

      for (const testCase of invalidConfigs) {
        const result = validateConfig(testCase.config)

        // Only expect rejection if the fixture specifically marks it as invalid
        if (testCase.expected === false) {
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error).toBeInstanceOf(ValidationError)
            expect(result.error.message).toBeTruthy()
          }
        }
      }
    })

    it('should accept empty configuration (semantic-release has defaults)', () => {
      const result = validateConfig({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({})
      }
    })

    it('should reject invalid branches type', () => {
      const config = {
        branches: 'main', // Should be array
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/branches.*array/)]),
        )
      }
    })

    it('should reject invalid repository URL', () => {
      const config = {
        branches: ['main'],
        repositoryUrl: 'not-a-url',
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/repositoryUrl.*url/)]),
        )
      }
    })

    it('should reject invalid tag format type', () => {
      const config = {
        branches: ['main'],
        tagFormat: 123, // Should be string
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/tagFormat.*string/)]),
        )
      }
    })

    it('should reject invalid plugins type', () => {
      const config = {
        branches: ['main'],
        plugins: 'not-an-array', // Should be array
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/plugins.*array/)]),
        )
      }
    })

    it('should reject invalid boolean fields', () => {
      const config = {
        branches: ['main'],
        dryRun: 'yes', // Should be boolean
        ci: 1, // Should be boolean
        debug: 'true', // Should be boolean
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        const errors = result.error.getFormattedErrors()
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/dryRun.*boolean/),
            expect.stringMatching(/ci.*boolean/),
            expect.stringMatching(/debug.*boolean/),
          ]),
        )
      }
    })

    it('should reject empty string in branches array', () => {
      const config = {
        branches: ['main', '', 'develop'], // Empty string is invalid
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/branches\.1.*String must contain at least 1 character/),
          ]),
        )
      }
    })

    it('should reject invalid branch object structure', () => {
      const config = {
        branches: [
          'main',
          {invalidProperty: true}, // Missing required 'name' property
        ],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/branches\.1.*Invalid input/)]),
        )
      }
    })
  })

  describe('edge case validation', () => {
    it('should reject all edge case fixtures', () => {
      const edgeCases = validationCases['edge-cases']

      for (const testCase of edgeCases) {
        let config = testCase.config

        // Handle special case indicators
        if (config === 'UNDEFINED') {
          config = undefined
        }

        const result = validateConfig(config)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(ValidationError)
        }
      }
    })

    it('should reject null configuration', () => {
      const result = validateConfig(null)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('Invalid semantic-release configuration')
      }
    })

    it('should reject undefined configuration', () => {
      const result = validateConfig(undefined)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('Invalid semantic-release configuration')
      }
    })

    it('should reject string configuration', () => {
      const result = validateConfig('invalid')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/object/)]),
        )
      }
    })

    it('should reject array configuration', () => {
      const result = validateConfig([])

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/object/)]),
        )
      }
    })

    it('should reject number configuration', () => {
      const result = validateConfig(42)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.getFormattedErrors()).toEqual(
          expect.arrayContaining([expect.stringMatching(/object/)]),
        )
      }
    })

    it('should handle extremely large configuration objects', () => {
      const config = {
        branches: Array.from({length: 1000}, (_, i) => `branch-${i}`),
        plugins: Array.from({length: 100}, (_, i) => `plugin-${i}`),
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.branches).toHaveLength(1000)
        expect(result.data.plugins).toHaveLength(100)
      }
    })

    it('should handle deeply nested branch configurations', () => {
      const config = {
        branches: [
          {
            name: 'main',
            range: '1.x',
            channel: 'latest',
            prerelease: false,
          },
          {
            name: 'beta',
            prerelease: 'beta',
            range: '2.x',
          },
        ],
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success && result.data.branches && Array.isArray(result.data.branches)) {
        expect(result.data.branches).toHaveLength(2)
        expect(result.data.branches[0]).toMatchObject({
          name: 'main',
          range: '1.x',
          channel: 'latest',
          prerelease: false,
        })
      }
    })
  })

  describe('plugin configuration validation', () => {
    it('should validate all plugin validation fixtures', () => {
      const pluginValidation = validationCases['plugin-validation']

      for (const testCase of pluginValidation) {
        const result = validateConfig(testCase.config)

        if (testCase.expected) {
          expect(result.success).toBe(true)
        } else {
          expect(result.success).toBe(false)
        }
      }
    })

    it('should validate plugin as string', () => {
      const result = validatePluginConfig('@semantic-release/npm', {})

      expect(result.success).toBe(true)
    })

    it('should validate commit-analyzer plugin configuration', () => {
      const config = {
        preset: 'angular',
        releaseRules: [
          {type: 'docs', scope: 'README', release: 'patch'},
          {type: 'refactor', release: 'patch'},
          {scope: 'no-release', release: false},
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      }

      const result = validatePluginConfig('@semantic-release/commit-analyzer', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate release-notes-generator plugin configuration', () => {
      const config = {
        preset: 'angular',
        writerOpts: {
          commitsSort: ['subject', 'scope'],
        },
      }

      const result = validatePluginConfig('@semantic-release/release-notes-generator', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate npm plugin configuration', () => {
      const config = {
        npmPublish: true,
        tarballDir: 'dist',
        pkgRoot: 'lib',
      }

      const result = validatePluginConfig('@semantic-release/npm', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate github plugin configuration', () => {
      const config = {
        assets: [
          'lib/**/*.js',
          {path: 'dist/*.tgz', label: 'Package'},
          {path: 'coverage/clover.xml', label: 'Coverage'},
        ],
        labels: ['semantic-release'],
        assignees: ['maintainer'],
      }

      const result = validatePluginConfig('@semantic-release/github', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate changelog plugin configuration', () => {
      const config = {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n\nAll notable changes will be documented here.',
      }

      const result = validatePluginConfig('@semantic-release/changelog', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate git plugin configuration', () => {
      const commitMessage =
        'chore(release): ' +
        '$' +
        '{nextRelease.version} [skip ci]\n\n' +
        '$' +
        '{nextRelease.notes}'
      const config = {
        assets: ['CHANGELOG.md', 'package.json'],
        message: commitMessage,
      }

      const result = validatePluginConfig('@semantic-release/git', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should handle unknown plugin gracefully', () => {
      const config = {
        customOption: 'value',
      }

      const result = validatePluginConfig('@unknown/plugin', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid plugin configuration for known plugins', () => {
      const config = {
        npmPublish: 'yes', // Should be boolean
        tarballDir: 123, // Should be string
      }

      const result = validatePluginConfig('@semantic-release/npm', config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('@semantic-release/npm')
      }
    })
  })

  describe('complete configuration validation', () => {
    it('should validate complete configuration with plugins', () => {
      const config = {
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer',
          [
            '@semantic-release/npm',
            {
              npmPublish: true,
              tarballDir: 'dist',
            },
          ],
          [
            '@semantic-release/github',
            {
              assets: ['dist/*.tgz'],
            },
          ],
        ],
      }

      const result = validateCompleteConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.branches).toEqual(['main'])
        expect(result.data.plugins).toHaveLength(3)
      }
    })

    it('should collect all validation errors for invalid complete configuration', () => {
      const config = {
        branches: 'main', // Invalid: should be array
        plugins: [
          [
            '@semantic-release/npm',
            {
              npmPublish: 'yes', // Invalid: should be boolean
              tarballDir: 123, // Invalid: should be string
            },
          ],
        ],
      }

      const result = validateCompleteConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1) // Only global config error when global validation fails
        expect(result.errors[0]).toBeInstanceOf(ValidationError)
        const firstError = result.errors[0]
        if (firstError) {
          expect(firstError.getFormattedErrors()).toEqual(
            expect.arrayContaining([expect.stringMatching(/branches.*Expected array/)]),
          )
        }
      }
    })

    it('should handle mixed valid and invalid plugins', () => {
      const config = {
        branches: ['main'],
        plugins: [
          '@semantic-release/commit-analyzer', // Valid
          [
            '@semantic-release/npm',
            {
              npmPublish: 'yes', // Invalid
            },
          ],
          '@semantic-release/github', // Valid
        ],
      }

      const result = validateCompleteConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        if (result.errors[0]) {
          expect(result.errors[0].message).toContain('Plugin at index 1')
          expect(result.errors[0].path).toBe('plugins.1')
        }
      }
    })
  })

  describe('validation error functionality', () => {
    it('should provide formatted error messages', () => {
      const config = {
        branches: 'main',
        repositoryUrl: 'invalid',
        tagFormat: 123,
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = result.error.getFormattedErrors()
        expect(formatted).toBeInstanceOf(Array)
        expect(formatted.length).toBeGreaterThan(0)
        expect(formatted[0]).toMatch(/\w+: .+/)
      }
    })

    it('should include path information in ValidationError', () => {
      const config = {
        branches: 'main',
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.path).toBe('global')
        expect(result.error.zodError).toBeDefined()
      }
    })

    it('should preserve original Zod error information', () => {
      const config = {
        branches: 'main',
        plugins: 'invalid',
      }

      const result = validateConfig(config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.zodError.issues).toBeDefined()
        expect(result.error.zodError.issues.length).toBeGreaterThan(0)
        expect(result.error.zodError.issues[0]).toHaveProperty('path')
        expect(result.error.zodError.issues[0]).toHaveProperty('message')
      }
    })
  })

  describe('schema integration', () => {
    it('should accept configuration without branches field (semantic-release provides defaults)', () => {
      const config = {
        // Missing 'branches' field - this is OK, semantic-release has defaults
        repositoryUrl: 'https://github.com/user/repo',
      }

      const result = validateConfig(config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.repositoryUrl).toBe('https://github.com/user/repo')
      }
    })

    it('should validate URL format (must be valid URL)', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'git@github.com:user/repo.git', // SSH format not accepted by URL validation
      ]

      for (const url of invalidUrls) {
        const config = {
          branches: ['main'],
          repositoryUrl: url,
        }

        const result = validateConfig(config)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.getFormattedErrors()).toEqual(
            expect.arrayContaining([expect.stringMatching(/repositoryUrl/)]),
          )
        }
      }
    })

    it('should accept valid URL formats', () => {
      const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/user/repo.git',
        'ftp://example.com/repo.git', // Any valid URL format is accepted
        'http://example.com/repo',
      ]

      for (const url of validUrls) {
        const config = {
          branches: ['main'],
          repositoryUrl: url,
        }

        const result = validateConfig(config)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.repositoryUrl).toBe(url)
        }
      }
    })
  })
})
