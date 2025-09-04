import type {GlobalConfig} from '../src/types/core.js'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {fileURLToPath} from 'node:url'

// Get the directory of the current module
const CURRENT_FILENAME = fileURLToPath(import.meta.url)
const CURRENT_DIRNAME = path.dirname(CURRENT_FILENAME)

/**
 * Test utilities for fixture-based testing of semantic-release configurations
 */
export const testUtils = {
  FIXTURES_DIR: path.join(CURRENT_DIRNAME, 'fixtures'),
  INPUT_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'input'),
  OUTPUT_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'output'),
  TEMP_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'temp'),

  /**
   * Predefined fixture categories for organized testing
   */
  CATEGORIES: {
    CONFIGURATIONS: 'configurations',
    PLUGINS: 'plugins',
    PRESETS: 'presets',
    VALIDATION: 'validation',
    TYPESCRIPT: 'typescript',
  } as const,

  /**
   * Get the absolute path to a fixture file
   */
  getFixturePath(
    type: 'input' | 'output' | 'temp',
    category?: string,
    ...pathSegments: string[]
  ): string {
    const baseDir =
      type === 'input'
        ? testUtils.INPUT_DIR
        : type === 'output'
          ? testUtils.OUTPUT_DIR
          : testUtils.TEMP_DIR

    if (typeof category === 'string' && category.length > 0) {
      return path.join(baseDir, category, ...pathSegments)
    }
    return path.join(baseDir, ...pathSegments)
  },

  /**
   * Load a JSON fixture file
   */
  loadJsonFixture<T = unknown>(
    type: 'input' | 'output',
    category?: string,
    ...pathSegments: string[]
  ): T {
    const filePath = testUtils.getFixturePath(type, category, ...pathSegments)
    if (!existsSync(filePath)) {
      throw new Error(`Fixture file not found: ${filePath}`)
    }
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  },

  /**
   * Load a text fixture file
   */
  loadTextFixture(type: 'input' | 'output', category?: string, ...pathSegments: string[]): string {
    const filePath = testUtils.getFixturePath(type, category, ...pathSegments)
    if (!existsSync(filePath)) {
      throw new Error(`Fixture file not found: ${filePath}`)
    }
    return readFileSync(filePath, 'utf-8')
  },

  /**
   * Save test output to a fixture file for verification
   */
  saveFixture(
    content: string | object,
    type: 'output' | 'temp',
    category?: string,
    ...pathSegments: string[]
  ): void {
    const filePath = testUtils.getFixturePath(type, category, ...pathSegments)

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, {recursive: true})
    }

    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    writeFileSync(filePath, data, 'utf-8')
  },

  /**
   * Compare actual output with expected fixture
   */
  compareWithFixture<T>(
    actual: T,
    category: string,
    fixtureName: string,
    options: {
      saveActual?: boolean
      strict?: boolean
    } = {},
  ): {matches: boolean; expected: T; actual: T} {
    const {saveActual = false, strict = true} = options

    try {
      const expected = testUtils.loadJsonFixture<T>('output', category, fixtureName)

      if (saveActual) {
        testUtils.saveFixture(actual as string | object, 'temp', category, `actual-${fixtureName}`)
      }

      const matches = strict
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : testUtils.deepPartialMatch(actual, expected)

      return {matches, expected, actual}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to compare with fixture ${fixtureName}: ${errorMessage}`)
    }
  },

  /**
   * Deep partial matching for flexible fixture comparison
   */
  deepPartialMatch(actual: unknown, expected: unknown): boolean {
    if (expected === actual) return true
    if (typeof expected !== typeof actual) return false
    if (expected === null || actual === null) return expected === actual

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) return false
      return expected.every((item, index) => testUtils.deepPartialMatch(actual[index], item))
    }

    if (typeof expected === 'object') {
      if (typeof actual !== 'object' || actual === null) return false

      return Object.entries(expected as Record<string, unknown>).every(([key, value]) =>
        testUtils.deepPartialMatch((actual as Record<string, unknown>)[key], value),
      )
    }

    return false
  },

  /**
   * Clean up temporary files and directories
   */
  cleanup(): void {
    if (existsSync(testUtils.TEMP_DIR)) {
      rmSync(testUtils.TEMP_DIR, {recursive: true, force: true})
    }
  },

  /**
   * Ensure fixture directories exist
   */
  ensureFixtureDirectories(): void {
    const directories = [
      testUtils.FIXTURES_DIR,
      testUtils.INPUT_DIR,
      testUtils.OUTPUT_DIR,
      testUtils.TEMP_DIR,
    ]

    for (const dir of directories) {
      if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
      }
    }

    // Create category subdirectories
    for (const category of Object.values(testUtils.CATEGORIES)) {
      for (const type of ['input', 'output'] as const) {
        const categoryDir = testUtils.getFixturePath(type, category)
        if (!existsSync(categoryDir)) {
          mkdirSync(categoryDir, {recursive: true})
        }
      }
    }
  },

  /**
   * List all fixtures in a category
   */
  listFixtures(
    type: 'input' | 'output',
    category: string,
  ): {name: string; path: string; isDirectory: boolean}[] {
    const categoryDir = testUtils.getFixturePath(type, category)

    if (!existsSync(categoryDir)) {
      return []
    }

    return readdirSync(categoryDir).map(name => ({
      name,
      path: path.join(categoryDir, name),
      isDirectory: statSync(path.join(categoryDir, name)).isDirectory(),
    }))
  },

  /**
   * Load all configuration fixtures from a category
   */
  loadConfigurationFixtures(category: string): Record<string, GlobalConfig> {
    const fixtures = testUtils.listFixtures('input', category)
    const configurations: Record<string, GlobalConfig> = {}

    for (const fixture of fixtures) {
      if (fixture.name.endsWith('.json')) {
        const name = fixture.name.replace('.json', '')
        configurations[name] = testUtils.loadJsonFixture<GlobalConfig>(
          'input',
          category,
          fixture.name,
        )
      }
    }

    return configurations
  },

  /**
   * Create a mock semantic-release context for testing
   */
  createMockContext(overrides: Partial<any> = {}): any {
    return {
      logger: {
        log: () => {},
        error: () => {},
        success: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
      },
      cwd: process.cwd(),
      env: {},
      options: {},
      lastRelease: {},
      nextRelease: {},
      commits: [],
      releases: [],
      ...overrides,
    }
  },

  /**
   * Validate that a configuration matches semantic-release schema
   */
  isValidSemanticReleaseConfig(config: unknown): config is GlobalConfig {
    if (
      config === null ||
      config === undefined ||
      typeof config !== 'object' ||
      Array.isArray(config)
    )
      return false

    // Basic validation - this should be expanded with proper Zod validation
    const configObj = config as Record<string, unknown>

    // Optional properties that are commonly used
    const validOptionalKeys = [
      'branches',
      'repositoryUrl',
      'tagFormat',
      'plugins',
      'extends',
      'dryRun',
      'ci',
      'debug',
      'preset',
    ]

    // Check that all keys are valid
    return Object.keys(configObj).every(key => validOptionalKeys.includes(key))
  },
}

/**
 * Setup function to run before tests
 */
export function setupFixtures(): void {
  testUtils.ensureFixtureDirectories()
}

/**
 * Teardown function to run after tests
 */
export function teardownFixtures(): void {
  testUtils.cleanup()
}

export type {GlobalConfig}
