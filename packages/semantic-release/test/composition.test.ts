/**
 * Tests for configuration composition utilities.
 *
 * These tests verify that the mergeConfigs, extendConfig, and overrideConfig
 * functions work correctly with various configuration scenarios.
 */

import type {GlobalConfig} from '../src/types/core.js'

import {describe, expect, it} from 'vitest'
import {
  extendConfig,
  mergeConfigs,
  mergeConfigsWithOptions,
  overrideConfig,
} from '../src/composition/index.js'

describe('composition utilities', () => {
  describe('mergeConfigs', () => {
    it('should merge simple properties with last wins strategy', () => {
      const config1: GlobalConfig = {
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo1',
        dryRun: false,
      }

      const config2: GlobalConfig = {
        repositoryUrl: 'https://github.com/user/repo2',
        dryRun: true,
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo2', // Last wins
        dryRun: true, // Last wins
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      })
    })

    it('should merge extends configurations', () => {
      const config1: GlobalConfig = {
        extends: '@bfra.me/semantic-release',
        branches: ['main'],
      }

      const config2: GlobalConfig = {
        extends: 'semantic-release-monorepo',
        dryRun: true,
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        extends: ['@bfra.me/semantic-release', 'semantic-release-monorepo'],
        branches: ['main'],
        dryRun: true,
      })
    })

    it('should merge branches by default', () => {
      const config1: GlobalConfig = {
        branches: ['main'],
      }

      const config2: GlobalConfig = {
        branches: ['develop'],
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        branches: ['main', 'develop'],
      })
    })

    it('should merge plugins by default', () => {
      const config1: GlobalConfig = {
        plugins: [
          '@semantic-release/commit-analyzer',
          ['@semantic-release/npm', {npmPublish: true}],
        ],
      }

      const config2: GlobalConfig = {
        plugins: [
          '@semantic-release/release-notes-generator',
          ['@semantic-release/npm', {npmPublish: false}], // Should merge with existing
        ],
      }

      const result = mergeConfigs(config1, config2)

      expect(result.plugins).toEqual([
        '@semantic-release/commit-analyzer',
        ['@semantic-release/npm', {npmPublish: false}], // Merged configuration
        '@semantic-release/release-notes-generator',
      ])
    })

    it('should handle multiple configurations', () => {
      const config1: GlobalConfig = {
        branches: ['main'],
        dryRun: false,
      }

      const config2: GlobalConfig = {
        branches: ['develop'],
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      }

      const config3: GlobalConfig = {
        dryRun: true,
        repositoryUrl: 'https://github.com/user/repo',
      }

      const result = mergeConfigs(config1, config2, config3)

      expect(result).toEqual({
        branches: ['main', 'develop'],
        dryRun: true, // Last wins
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
        repositoryUrl: 'https://github.com/user/repo',
      })
    })
  })

  describe('mergeConfigsWithOptions', () => {
    it('should replace branches when strategy is replace', () => {
      const config1: GlobalConfig = {
        branches: ['main'],
      }

      const config2: GlobalConfig = {
        branches: ['develop'],
      }

      const result = mergeConfigsWithOptions([config1, config2], {
        branchStrategy: 'replace',
      })

      expect(result).toEqual({
        branches: ['develop'], // Replaced
      })
    })

    it('should replace plugins when strategy is replace', () => {
      const config1: GlobalConfig = {
        plugins: ['@semantic-release/commit-analyzer'],
      }

      const config2: GlobalConfig = {
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = mergeConfigsWithOptions([config1, config2], {
        pluginStrategy: 'replace',
      })

      expect(result).toEqual({
        plugins: ['@semantic-release/release-notes-generator'], // Replaced
      })
    })

    it('should append plugins when strategy is append', () => {
      const config1: GlobalConfig = {
        plugins: ['@semantic-release/commit-analyzer'],
      }

      const config2: GlobalConfig = {
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = mergeConfigsWithOptions([config1, config2], {
        pluginStrategy: 'append',
      })

      expect(result).toEqual({
        plugins: ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator'],
      })
    })

    it('should prepend plugins when strategy is prepend', () => {
      const config1: GlobalConfig = {
        plugins: ['@semantic-release/commit-analyzer'],
      }

      const config2: GlobalConfig = {
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = mergeConfigsWithOptions([config1, config2], {
        pluginStrategy: 'prepend',
      })

      expect(result).toEqual({
        plugins: ['@semantic-release/release-notes-generator', '@semantic-release/commit-analyzer'],
      })
    })
  })

  describe('extendConfig', () => {
    it('should extend base configuration with additional options', () => {
      const base: GlobalConfig = {
        branches: ['main'],
        plugins: ['@semantic-release/commit-analyzer'],
      }

      const extension: GlobalConfig = {
        dryRun: true,
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = extendConfig(base, extension)

      expect(result).toEqual({
        branches: ['main'],
        dryRun: true,
        plugins: ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator'],
      })
    })

    it('should pass options to merge function', () => {
      const base: GlobalConfig = {
        plugins: ['@semantic-release/commit-analyzer'],
      }

      const extension: GlobalConfig = {
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = extendConfig(base, extension, {
        pluginStrategy: 'replace',
      })

      expect(result).toEqual({
        plugins: ['@semantic-release/release-notes-generator'], // Replaced
      })
    })
  })

  describe('overrideConfig', () => {
    it('should override base configuration with replace strategies', () => {
      const base: GlobalConfig = {
        branches: ['main'],
        plugins: ['@semantic-release/commit-analyzer'],
        dryRun: false,
      }

      const override: GlobalConfig = {
        branches: ['develop'],
        plugins: ['@semantic-release/release-notes-generator'],
      }

      const result = overrideConfig(base, override)

      expect(result).toEqual({
        branches: ['develop'], // Replaced
        plugins: ['@semantic-release/release-notes-generator'], // Replaced
        dryRun: false, // Preserved
      })
    })

    it('should preserve simple properties', () => {
      const base: GlobalConfig = {
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo',
        dryRun: false,
      }

      const override: GlobalConfig = {
        dryRun: true,
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      }

      const result = overrideConfig(base, override)

      expect(result).toEqual({
        branches: ['main'], // Preserved
        repositoryUrl: 'https://github.com/user/repo', // Preserved
        dryRun: true, // Overridden
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}', // Added
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty configurations', () => {
      const config1: GlobalConfig = {}
      const config2: GlobalConfig = {}

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({})
    })

    it('should handle single branch returning single value', () => {
      const config: GlobalConfig = {
        branches: ['main'],
      }

      const result = mergeConfigs(config, {})

      expect(result).toEqual({
        branches: ['main'], // Array preserved
      })
    })

    it('should handle branch objects', () => {
      const config1: GlobalConfig = {
        branches: [{name: 'main', channel: 'latest'}],
      }

      const config2: GlobalConfig = {
        branches: [{name: 'develop', channel: 'beta'}],
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        branches: [
          {name: 'main', channel: 'latest'},
          {name: 'develop', channel: 'beta'},
        ],
      })
    })

    it('should handle mixed branch types', () => {
      const config1: GlobalConfig = {
        branches: ['main'],
      }

      const config2: GlobalConfig = {
        branches: [{name: 'develop', channel: 'beta'}],
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        branches: ['main', {name: 'develop', channel: 'beta'}],
      })
    })

    it('should handle plugin string to tuple conversion', () => {
      const config1: GlobalConfig = {
        plugins: ['@semantic-release/npm'],
      }

      const config2: GlobalConfig = {
        plugins: ['@semantic-release/npm'], // Same plugin as string
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        plugins: ['@semantic-release/npm'], // No duplication
      })
    })

    it('should merge plugin configurations correctly', () => {
      const config1: GlobalConfig = {
        plugins: [['@semantic-release/npm', {npmPublish: true, tarballDir: 'dist'}]],
      }

      const config2: GlobalConfig = {
        plugins: [['@semantic-release/npm', {npmPublish: false}]],
      }

      const result = mergeConfigs(config1, config2)

      expect(result).toEqual({
        plugins: [
          [
            '@semantic-release/npm',
            {npmPublish: false, tarballDir: 'dist'}, // Merged configuration
          ],
        ],
      })
    })
  })
})
