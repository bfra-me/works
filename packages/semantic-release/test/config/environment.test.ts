/**
 * @file Tests for comprehensive environment-based configuration
 */

/* eslint-disable no-template-curly-in-string */

import {describe, expect, it, vi} from 'vitest'
import {
  applyEnvironmentTransformations,
  detectEnvironment,
  environmentPresets,
  getEnvironmentTransformations,
  type Environment,
  type EnvironmentContext,
} from '../../src/config/environment.js'

describe('environment configuration', () => {
  describe('detectEnvironment', () => {
    it('returns explicit environment when provided', () => {
      const result = detectEnvironment('development')
      expect(result.environment).toBe('development')
      expect(result.autoDetected).toBe(false)
      expect(result.source).toBe('explicit')
    })

    it('detects development from NODE_ENV', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const result = detectEnvironment()
      expect(result.environment).toBe('development')
      expect(result.autoDetected).toBe(true)
      expect(result.source).toBe('NODE_ENV')
      vi.unstubAllEnvs()
    })

    it('detects test environment from test indicators', () => {
      vi.stubEnv('VITEST', 'true')
      const result = detectEnvironment()
      expect(result.environment).toBe('test')
      expect(result.autoDetected).toBe(true)
      expect(result.source).toBe('TEST_INDICATORS')
      vi.unstubAllEnvs()
    })

    it('detects staging from CI branch name', () => {
      vi.stubEnv('CI', 'true')
      vi.stubEnv('GITHUB_ACTIONS', 'true')
      vi.stubEnv('GITHUB_REF_NAME', 'staging')
      const result = detectEnvironment()
      expect(result.environment).toBe('staging')
      expect(result.autoDetected).toBe(true)
      expect(result.source).toBe('CI_BRANCH')
      vi.unstubAllEnvs()
    })

    it('defaults to production when no indicators found', () => {
      vi.unstubAllEnvs()
      const result = detectEnvironment()
      expect(result.environment).toBe('production')
      expect(result.autoDetected).toBe(true)
      expect(result.source).toBe('DEFAULT')
    })

    it('includes CI detection metadata', () => {
      vi.stubEnv('CI', 'true')
      vi.stubEnv('GITHUB_ACTIONS', 'true')
      const result = detectEnvironment()
      expect(result.isCI).toBe(true)
      expect(result.metadata.ciVendor).toBe('github-actions')
      vi.unstubAllEnvs()
    })
  })

  describe('getEnvironmentTransformations', () => {
    const mockContext: EnvironmentContext = {
      environment: 'production',
      autoDetected: true,
      source: 'DEFAULT',
      isCI: true,
      metadata: {},
    }

    it('provides correct development transformations', () => {
      const transformations = getEnvironmentTransformations('development', mockContext)
      expect(transformations).toEqual({
        dryRun: true,
        debug: true,
        branches: ['main', 'master', 'develop', 'development'],
        ci: true, // Uses context.isCI
        tagFormat: 'v${version}-dev',
      })
    })

    it('provides correct test transformations', () => {
      const transformations = getEnvironmentTransformations('test', mockContext)
      expect(transformations).toEqual({
        dryRun: true,
        ci: true,
        debug: true,
        branches: ['main', 'master'],
        tagFormat: 'v${version}-test',
      })
    })

    it('provides correct staging transformations', () => {
      const transformations = getEnvironmentTransformations('staging', mockContext)
      expect(transformations).toEqual({
        dryRun: false,
        ci: true,
        debug: true,
        branches: ['staging', 'stage', 'main'],
        tagFormat: 'v${version}-staging',
      })
    })

    it('provides correct production transformations', () => {
      const transformations = getEnvironmentTransformations('production', mockContext)
      expect(transformations).toEqual({
        dryRun: false,
        debug: false,
        ci: true, // Uses context.isCI
        branches: ['main', 'master'],
        tagFormat: 'v${version}',
      })
    })

    it('respects CI context in development', () => {
      const nonCiContext = {...mockContext, isCI: false}
      const transformations = getEnvironmentTransformations('development', nonCiContext)
      expect(transformations.ci).toBe(false)
    })
  })

  describe('applyEnvironmentTransformations', () => {
    const baseConfig = {
      branches: undefined,
      plugins: ['@semantic-release/commit-analyzer'],
    }

    const mockContext: EnvironmentContext = {
      environment: 'development',
      autoDetected: true,
      source: 'NODE_ENV',
      isCI: false,
      metadata: {},
    }

    it('applies transformations when config properties are undefined', () => {
      const result = applyEnvironmentTransformations(baseConfig, 'development', mockContext)
      expect(result.dryRun).toBe(true)
      expect(result.debug).toBe(true)
      expect(result.branches).toEqual(['main', 'master', 'develop', 'development'])
      expect(result.ci).toBe(false)
      expect(result.tagFormat).toBe('v${version}-dev')
    })

    it('preserves existing config values over environment defaults', () => {
      const configWithExplicitValues = {
        ...baseConfig,
        dryRun: false, // Explicit false should override environment default true
        branches: ['custom-branch'],
        tagFormat: 'custom-${version}',
      }

      const result = applyEnvironmentTransformations(
        configWithExplicitValues,
        'development',
        mockContext,
      )

      expect(result.dryRun).toBe(false) // Preserved explicit value
      expect(result.branches).toEqual(['custom-branch']) // Preserved explicit value
      expect(result.tagFormat).toBe('custom-${version}') // Preserved explicit value
      expect(result.debug).toBe(true) // Applied from environment (wasn't set)
    })

    it('handles all environment types correctly', () => {
      const environments: Environment[] = ['development', 'test', 'staging', 'production']

      for (const env of environments) {
        const result = applyEnvironmentTransformations(baseConfig, env, mockContext)
        expect(result).toBeDefined()
        expect(result.plugins).toEqual(baseConfig.plugins) // Always preserves plugins
      }
    })
  })

  describe('environmentPresets', () => {
    it('provides development preset with safe defaults', () => {
      expect(environmentPresets.development).toEqual({
        branches: ['main', 'master', 'develop', 'development'],
        dryRun: true,
        debug: true,
        ci: false,
        tagFormat: 'v${version}-dev',
      })
    })

    it('provides test preset optimized for testing', () => {
      expect(environmentPresets.test).toEqual({
        branches: ['main', 'master'],
        dryRun: true,
        debug: true,
        ci: true,
        tagFormat: 'v${version}-test',
      })
    })

    it('provides staging preset for pre-production', () => {
      expect(environmentPresets.staging).toEqual({
        branches: ['staging', 'stage', 'main'],
        dryRun: false,
        debug: true,
        ci: true,
        tagFormat: 'v${version}-staging',
      })
    })

    it('provides production preset for production releases', () => {
      expect(environmentPresets.production).toEqual({
        branches: ['main', 'master'],
        dryRun: false,
        debug: false,
        ci: true,
        tagFormat: 'v${version}',
      })
    })
  })

  describe('ci detection', () => {
    it('detects GitHub Actions', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'true')
      const result = detectEnvironment()
      expect(result.isCI).toBe(true)
      expect(result.metadata.ciVendor).toBe('github-actions')
      vi.unstubAllEnvs()
    })

    it('detects GitLab CI', () => {
      vi.stubEnv('GITLAB_CI', 'true')
      const result = detectEnvironment()
      expect(result.isCI).toBe(true)
      expect(result.metadata.ciVendor).toBe('gitlab-ci')
      vi.unstubAllEnvs()
    })

    it('detects CircleCI', () => {
      vi.stubEnv('CIRCLECI', 'true')
      const result = detectEnvironment()
      expect(result.isCI).toBe(true)
      expect(result.metadata.ciVendor).toBe('circleci')
      vi.unstubAllEnvs()
    })

    it('handles no CI environment', () => {
      vi.unstubAllEnvs()
      const result = detectEnvironment()
      expect(result.isCI).toBe(false)
      expect(result.metadata.ciVendor).toBeUndefined()
    })
  })

  describe('branch detection', () => {
    it('detects GitHub branch name', () => {
      vi.stubEnv('GITHUB_REF_NAME', 'feature/test')
      const result = detectEnvironment()
      expect(result.metadata.branchName).toBe('feature/test')
      vi.unstubAllEnvs()
    })

    it('detects GitLab branch name', () => {
      vi.stubEnv('CI_COMMIT_REF_NAME', 'develop')
      const result = detectEnvironment()
      expect(result.metadata.branchName).toBe('develop')
      vi.unstubAllEnvs()
    })

    it('handles no branch detection', () => {
      vi.unstubAllEnvs()
      const result = detectEnvironment()
      expect(result.metadata.branchName).toBeUndefined()
    })
  })

  describe('integration scenarios', () => {
    it('handles complete development workflow', () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('CI', 'false')

      const context = detectEnvironment()
      const config = {plugins: ['@semantic-release/commit-analyzer']}
      const result = applyEnvironmentTransformations(config, context.environment, context)

      expect(result).toEqual({
        plugins: ['@semantic-release/commit-analyzer'],
        dryRun: true,
        debug: true,
        branches: ['main', 'master', 'develop', 'development'],
        ci: false,
        tagFormat: 'v${version}-dev',
      })

      vi.unstubAllEnvs()
    })

    it('handles complete CI production workflow', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('CI', 'true')
      vi.stubEnv('GITHUB_ACTIONS', 'true')
      vi.stubEnv('GITHUB_REF_NAME', 'main')

      const context = detectEnvironment()
      const config = {
        plugins: ['@semantic-release/commit-analyzer', '@semantic-release/github'],
      }
      const result = applyEnvironmentTransformations(config, context.environment, context)

      expect(result).toEqual({
        plugins: ['@semantic-release/commit-analyzer', '@semantic-release/github'],
        dryRun: false,
        debug: false,
        branches: ['main', 'master'],
        ci: true,
        tagFormat: 'v${version}',
      })

      vi.unstubAllEnvs()
    })
  })
})
