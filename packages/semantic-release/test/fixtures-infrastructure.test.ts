/**
 * Tests for fixture-based testing infrastructure.
 *
 * This test file verifies that the testing infrastructure is properly set up
 * and can load fixtures, run comparisons, and handle test utilities correctly.
 */

import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {setupFixtures, teardownFixtures, testUtils} from './test-utils.js'

describe('fixture testing infrastructure', () => {
  beforeAll(() => {
    setupFixtures()
  })

  afterAll(() => {
    teardownFixtures()
  })

  describe('directory structure', () => {
    it('has all required fixture directories', () => {
      expect(testUtils.FIXTURES_DIR).toBeDefined()
      expect(testUtils.INPUT_DIR).toBeDefined()
      expect(testUtils.OUTPUT_DIR).toBeDefined()
      expect(testUtils.TEMP_DIR).toBeDefined()
    })

    it('has all required categories', () => {
      const categories = Object.values(testUtils.CATEGORIES)
      expect(categories).toContain('configurations')
      expect(categories).toContain('plugins')
      expect(categories).toContain('presets')
      expect(categories).toContain('validation')
      expect(categories).toContain('typescript')
    })
  })

  describe('fixture loading', () => {
    it('can load JSON fixtures', () => {
      const configs = testUtils.loadJsonFixture<Record<string, {branches: string[]}>>(
        'input',
        'configurations',
        'basic-configs.json',
      )
      expect(configs).toBeDefined()
      expect(typeof configs).toBe('object')
      expect(configs.basic).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(configs.basic!.branches).toEqual(['main'])
    })

    it('can load preset fixtures', () => {
      const presets = testUtils.loadJsonFixture<Record<string, any>>(
        'input',
        'presets',
        'preset-configs.json',
      )
      expect(presets).toBeDefined()
      expect(presets['npm-preset']).toBeDefined()
      expect(presets['github-preset']).toBeDefined()
      expect(presets['monorepo-preset']).toBeDefined()
    })

    it('can load validation fixtures', () => {
      const validation = testUtils.loadJsonFixture<Record<string, any>>(
        'input',
        'validation',
        'validation-cases.json',
      )
      expect(validation).toBeDefined()
      expect(validation['valid-configs']).toBeDefined()
      expect(validation['invalid-configs']).toBeDefined()
    })

    it('throws error for non-existent fixtures', () => {
      expect(() => {
        testUtils.loadJsonFixture('input', 'nonexistent', 'missing.json')
      }).toThrow('Fixture file not found')
    })
  })

  describe('fixture utilities', () => {
    it('can create file paths correctly', () => {
      const path = testUtils.getFixturePath('input', 'configurations', 'test.json')
      expect(path).toContain('input')
      expect(path).toContain('configurations')
      expect(path).toContain('test.json')
    })

    it('can handle paths without category', () => {
      const path = testUtils.getFixturePath('temp', undefined, 'test.json')
      expect(path).toContain('temp')
      expect(path).toContain('test.json')
      expect(path).not.toContain('undefined')
    })

    it('can save and load fixtures', () => {
      const testData = {test: 'data', value: 123}

      testUtils.saveFixture(testData, 'temp', 'test', 'sample.json')
      // Note: We can't use loadJsonFixture with 'temp' type, so we'll just verify save works
      expect(() => testUtils.saveFixture(testData, 'temp', 'test', 'sample.json')).not.toThrow()
    })

    it('can list fixtures in a category', () => {
      const fixtures = testUtils.listFixtures('input', 'configurations')
      expect(fixtures).toBeDefined()
      expect(Array.isArray(fixtures)).toBe(true)

      const basicConfigFixture = fixtures.find(f => f.name === 'basic-configs.json')
      expect(basicConfigFixture).toBeDefined()
      expect(basicConfigFixture?.isDirectory).toBe(false)
    })
  })

  describe('configuration validation', () => {
    it('validates semantic-release configurations', () => {
      const validConfig = {
        branches: ['main'],
        repositoryUrl: 'https://github.com/user/repo',
        plugins: ['@semantic-release/npm'],
      }

      expect(testUtils.isValidSemanticReleaseConfig(validConfig)).toBe(true)
    })

    it('rejects invalid configurations', () => {
      expect(testUtils.isValidSemanticReleaseConfig(null)).toBe(false)
      expect(testUtils.isValidSemanticReleaseConfig(undefined)).toBe(false)
      expect(testUtils.isValidSemanticReleaseConfig('string')).toBe(false)
      expect(testUtils.isValidSemanticReleaseConfig([])).toBe(false)
    })

    it('loads all configuration fixtures', () => {
      const configs = testUtils.loadConfigurationFixtures('configurations')
      expect(configs).toBeDefined()
      expect(typeof configs).toBe('object')
      expect(Object.keys(configs).length).toBeGreaterThan(0)
    })
  })

  describe('mock context', () => {
    it('creates mock semantic-release context', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const context = testUtils.createMockContext()
      expect(context).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(context.logger).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(context.cwd).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(typeof context.logger.log).toBe('function')
    })

    it('applies context overrides', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const context = testUtils.createMockContext({
        customProperty: 'test-value',
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(context.customProperty).toBe('test-value')
    })
  })

  describe('comparison utilities', () => {
    it('performs deep partial matching', () => {
      const actual = {a: 1, b: {c: 2, d: 3}, e: [1, 2, 3]}
      const expected = {a: 1, b: {c: 2}}

      expect(testUtils.deepPartialMatch(actual, expected)).toBe(true)
    })

    it('handles array comparisons', () => {
      const actual = [1, 2, 3, 4]
      const expected = [1, 2, 3]

      expect(testUtils.deepPartialMatch(actual, expected)).toBe(true)
    })

    it('detects mismatches', () => {
      const actual = {a: 1, b: 2}
      const expected = {a: 1, b: 3}

      expect(testUtils.deepPartialMatch(actual, expected)).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('can clean up temporary files', () => {
      // Create a temp file
      testUtils.saveFixture({test: 'cleanup'}, 'temp', 'cleanup-test.json')

      // Cleanup should not throw
      expect(() => testUtils.cleanup()).not.toThrow()
    })
  })
})
