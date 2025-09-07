/**
 * Performance tests for large monorepo configurations.
 *
 * This test suite validates the performance characteristics of semantic-release
 * configuration processing, validation, and composition when dealing with
 * large-scale monorepo scenarios with many packages, complex configurations,
 * and extensive plugin compositions.
 *
 * Implementation of TASK-040: Create performance tests for large monorepo configurations
 */

import type {GlobalConfig} from '../src/types/core.js'

import {performance} from 'node:perf_hooks'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {mergeConfigs} from '../src/composition/index.js'
import {defineConfig} from '../src/config/define-config.js'
import {
  changelog,
  commitAnalyzer,
  git,
  github,
  npm,
  releaseNotesGenerator,
} from '../src/config/helpers.js'
import {githubPreset, monorepoPreset, npmPreset} from '../src/config/presets.js'
import {validateConfig} from '../src/validation/index.js'

/**
 * Performance measurement utilities
 */
class PerformanceMeasurer {
  private startTime = 0
  private measurements: Record<string, number> = {}

  start(): void {
    this.startTime = performance.now()
  }

  measure(label: string): number {
    const elapsed = performance.now() - this.startTime
    this.measurements[label] = elapsed
    return elapsed
  }

  getResults(): Record<string, number> {
    return {...this.measurements}
  }

  reset(): void {
    this.startTime = 0
    this.measurements = {}
  }
}

/**
 * Large monorepo configuration generators
 */
const MonorepoConfigGenerator = {
  /**
   * Generate a basic large monorepo configuration with many npm plugins
   */
  generateBasicLargeConfig(packageCount: number): GlobalConfig {
    const plugins = [
      commitAnalyzer({preset: 'conventionalcommits'}),
      releaseNotesGenerator({preset: 'conventionalcommits'}),
      changelog(),
    ]

    // Add npm plugins for multiple packages
    for (let i = 0; i < packageCount; i++) {
      plugins.push(
        npm({
          pkgRoot: `packages/package-${i}`,
          npmPublish: true,
          access: 'public',
        }),
      )
    }

    plugins.push(github(), git())

    return defineConfig({
      branches: ['main'],
      repositoryUrl: 'https://github.com/enterprise/monorepo',
      plugins,
    })
  },

  /**
   * Generate complex configuration with multiple branches and exec plugins
   */
  generateComplexConfig(complexity: number): GlobalConfig {
    const branches = ['main']
    const plugins = [
      commitAnalyzer({preset: 'conventionalcommits'}),
      releaseNotesGenerator({preset: 'conventionalcommits'}),
      changelog(),
    ]

    // Add complexity with additional branches
    for (let i = 0; i < complexity; i++) {
      branches.push(`feature-${i}/*`)

      // Add exec plugins for each complexity level
      plugins.push([
        '@semantic-release/exec',
        {
          publishCmd: `npm run deploy:level-${i}`,
        },
      ] as const)
    }

    plugins.push(npm(), github(), git())

    return defineConfig({
      branches,
      repositoryUrl: 'https://github.com/enterprise/complex',
      plugins,
    })
  },

  /**
   * Generate configuration using preset composition
   */
  generatePresetComposition(): GlobalConfig {
    const baseConfig = npmPreset({branches: ['main']})
    const githubConfig = githubPreset({branches: ['main']})
    const monorepoConfig = monorepoPreset({
      packageName: '@enterprise/core',
      branches: ['main'],
    })

    return mergeConfigs(baseConfig, githubConfig, monorepoConfig)
  },
} as const

describe('performance tests for large monorepo configurations', () => {
  let measurer: PerformanceMeasurer

  beforeEach(() => {
    measurer = new PerformanceMeasurer()
  })

  afterEach(() => {
    measurer.reset()
  })

  describe('configuration parsing performance', () => {
    it('should parse large monorepo configurations efficiently', () => {
      const packageCounts = [10, 25, 50, 100]
      const results: Record<string, number> = {}

      for (const count of packageCounts) {
        measurer.start()
        const config = MonorepoConfigGenerator.generateBasicLargeConfig(count)
        const elapsed = measurer.measure(`parse-${count}-packages`)

        // Verify configuration is valid
        expect(config.plugins).toBeDefined()
        expect(config.branches).toEqual(['main'])
        expect(Array.isArray(config.plugins)).toBe(true)

        // Performance expectations
        expect(elapsed).toBeLessThan(1000) // Should complete in under 1 second
        results[`${count}-packages`] = elapsed
      }

      // Verify scaling characteristics
      const hundredTime = results['100-packages']
      const tenTime = results['10-packages']
      if (hundredTime !== undefined && tenTime !== undefined) {
        expect(hundredTime).toBeLessThan(tenTime * 20) // Should scale reasonably
      }
    })

    it('should handle complex defineConfig calls efficiently', () => {
      const complexityLevels = [1, 3, 5, 10]
      const results: Record<string, number> = {}

      for (const level of complexityLevels) {
        measurer.start()
        const config = MonorepoConfigGenerator.generateComplexConfig(level)
        const elapsed = measurer.measure(`complex-config-level-${level}`)

        expect(config.branches).toHaveLength(level + 1) // main + feature branches
        expect(config.plugins).toBeDefined()
        expect(elapsed).toBeLessThan(500) // Should be very fast
        results[`level-${level}`] = elapsed
      }

      // All complexity levels should complete quickly
      Object.values(results).forEach(time => {
        expect(time).toBeLessThan(500)
      })
    })
  })

  describe('configuration validation performance', () => {
    it('should validate large configurations efficiently', () => {
      const packageCounts = [10, 25, 50, 100]
      const results: Record<string, number> = {}

      for (const count of packageCounts) {
        const config = MonorepoConfigGenerator.generateBasicLargeConfig(count)

        measurer.start()
        const validation = validateConfig(config)
        const elapsed = measurer.measure(`validate-${count}-packages`)

        expect(validation.success).toBe(true)
        expect(elapsed).toBeLessThan(2000) // Should validate in under 2 seconds
        results[`${count}-packages`] = elapsed
      }

      // Validation should scale reasonably
      const hundredTime = results['100-packages']
      const tenTime = results['10-packages']
      if (hundredTime !== undefined && tenTime !== undefined) {
        expect(hundredTime).toBeLessThan(tenTime * 15)
      }
    })

    it('should handle validation errors efficiently for invalid configurations', () => {
      // Create intentionally invalid configurations of various sizes
      const invalidConfigs = [
        {branches: 123}, // Invalid branches type (should be array)
        {repositoryUrl: 'not-a-url'}, // Invalid URL format
        {plugins: 'invalid'}, // Invalid plugins type (should be array)
        {
          branches: ['main'],
          plugins: [123], // Invalid plugin type
        },
        {
          branches: ['main'],
          plugins: [['@semantic-release/npm', 'invalid-config']], // Invalid plugin config (should be object)
        },
      ]

      for (const [index, config] of invalidConfigs.entries()) {
        measurer.start()
        const validation = validateConfig(config)
        const elapsed = measurer.measure(`invalid-config-${index}`)

        expect(validation.success).toBe(false)
        expect(elapsed).toBeLessThan(1000) // Error validation should be fast
      }
    })
  })

  describe('preset composition performance', () => {
    it('should compose multiple presets efficiently', () => {
      const iterations = [1, 5, 10, 20]
      const results: Record<string, number> = {}

      for (const count of iterations) {
        measurer.start()

        // Perform preset composition multiple times
        for (let i = 0; i < count; i++) {
          MonorepoConfigGenerator.generatePresetComposition()
        }

        const elapsed = measurer.measure(`compose-${count}-iterations`)

        expect(elapsed).toBeLessThan(1000) // Should compose quickly
        results[`${count}-iterations`] = elapsed
      }

      // Composition should scale well
      const twentyTime = results['20-iterations']
      const oneTime = results['1-iterations']
      if (twentyTime !== undefined && oneTime !== undefined) {
        expect(twentyTime).toBeLessThan(oneTime * 30)
      }
    })

    it('should handle deep configuration merging efficiently', () => {
      const baseConfig = npmPreset({branches: ['main']})

      // Test merging with increasing number of overrides
      for (let i = 1; i <= 10; i++) {
        const overrides = Array.from({length: i}, (_, index) =>
          defineConfig({
            branches: [`override-${index}`],
            plugins: [
              [
                '@semantic-release/exec',
                {
                  publishCmd: `npm run override-${index}`,
                },
              ] as const,
            ],
          }),
        )

        measurer.start()
        let result = baseConfig
        for (const override of overrides) {
          result = mergeConfigs(result, override)
        }
        const elapsed = measurer.measure(`merge-${i}-layers`)

        expect(result.branches).toBeDefined()
        expect(result.plugins).toBeDefined()
        expect(elapsed).toBeLessThan(500) // Deep merging should be fast
      }
    })
  })

  describe('memory usage and scalability', () => {
    it('should handle very large configurations without memory issues', () => {
      // Test with progressively larger configurations
      const sizes = [50, 100, 200]

      for (const size of sizes) {
        measurer.start()

        const config = MonorepoConfigGenerator.generateBasicLargeConfig(size)
        const validation = validateConfig(config)

        const elapsed = measurer.measure(`large-config-${size}`)

        expect(validation.success).toBe(true)
        expect(config.plugins?.length).toBeGreaterThan(size)
        expect(elapsed).toBeLessThan(5000) // Even very large configs should complete reasonably

        // Basic memory usage check - configuration should not be excessively large
        const configString = JSON.stringify(config)
        expect(configString.length).toBeLessThan(size * 5000) // Reasonable size per package
      }
    })

    it('should maintain consistent performance across multiple operations', () => {
      const config = MonorepoConfigGenerator.generateBasicLargeConfig(50)
      const operationTimes: number[] = []

      // Perform the same operation multiple times to check for basic functionality
      for (let i = 0; i < 10; i++) {
        measurer.start()
        const validation = validateConfig(config)
        const elapsed = measurer.measure(`operation-${i}`)

        expect(validation.success).toBe(true)
        operationTimes.push(elapsed)
      }

      // All operations should complete in reasonable time
      for (const time of operationTimes) {
        expect(time).toBeLessThan(1000) // Each operation should be under 1 second
      }

      // Should have consistent successful results
      expect(operationTimes).toHaveLength(10)
    })
  })

  describe('enterprise-scale scenarios', () => {
    it('should handle enterprise monorepo with hundreds of packages', () => {
      measurer.start()

      const enterpriseConfig = MonorepoConfigGenerator.generateBasicLargeConfig(200)
      const elapsed = measurer.measure('enterprise-scale')

      expect(enterpriseConfig.plugins?.length).toBeGreaterThan(200)
      expect(elapsed).toBeLessThan(3000) // Should handle enterprise scale efficiently

      // Validate the configuration
      const validation = validateConfig(enterpriseConfig)
      expect(validation.success).toBe(true)
    })

    it('should handle complex multi-branch scenarios', () => {
      measurer.start()

      const complexConfig = MonorepoConfigGenerator.generateComplexConfig(20)
      const elapsed = measurer.measure('multi-branch-complex')

      expect(
        Array.isArray(complexConfig.branches) ? complexConfig.branches.length : 1,
      ).toBeGreaterThan(20)
      expect(elapsed).toBeLessThan(1000) // Complex scenarios should still be fast

      const validation = validateConfig(complexConfig)
      expect(validation.success).toBe(true)
    })

    it('should benchmark configuration processing pipeline', () => {
      const testSizes = [10, 50, 100]
      const pipelineResults: Record<
        string,
        {
          parsing: number
          validation: number
          total: number
        }
      > = {}

      for (const size of testSizes) {
        // Measure parsing
        measurer.start()
        const config = MonorepoConfigGenerator.generateBasicLargeConfig(size)
        const parsingTime = measurer.measure(`parsing-${size}`)

        // Measure validation
        measurer.start()
        const validation = validateConfig(config)
        const validationTime = measurer.measure(`validation-${size}`)

        expect(validation.success).toBe(true)

        pipelineResults[`${size}-packages`] = {
          parsing: parsingTime,
          validation: validationTime,
          total: parsingTime + validationTime,
        }

        // Total pipeline should be efficient
        expect(parsingTime + validationTime).toBeLessThan(3000)
      }

      // Verify all operations completed successfully
      expect(Object.keys(pipelineResults)).toHaveLength(3)
      for (const result of Object.values(pipelineResults)) {
        expect(result.parsing).toBeGreaterThan(0)
        expect(result.validation).toBeGreaterThan(0)
        expect(result.total).toBeGreaterThan(0)
      }
    })
  })
})
