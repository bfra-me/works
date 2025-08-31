/**
 * Plugin testing utilities for testing semantic-release plugins.
 *
 * This module provides a high-level testing interface for semantic-release plugins,
 * making it easy to test plugin behavior across different lifecycle stages with
 * realistic mock contexts and assertions.
 */

import type {
  AnalyzeCommitsResult,
  GenerateNotesResult,
  PluginConfig,
  PublishResult,
} from '../context.js'
import type {
  AnalyzeCommitsHook,
  FailHook,
  GenerateNotesHook,
  PrepareHook,
  PublishHook,
  SuccessHook,
  VerifyConditionsHook,
  VerifyReleaseHook,
} from '../lifecycle.js'
import {
  createMockAnalyzeCommitsContext,
  createMockFailContext,
  createMockGenerateNotesContext,
  createMockPrepareContext,
  createMockPublishContext,
  createMockSuccessContext,
  createMockVerifyConditionsContext,
  createMockVerifyReleaseContext,
  type MockContextOptions,
} from './mock-context.js'

/**
 * Plugin definition for testing with typed lifecycle hooks.
 */
export interface TestablePlugin {
  verifyConditions?: VerifyConditionsHook
  analyzeCommits?: AnalyzeCommitsHook
  verifyRelease?: VerifyReleaseHook
  generateNotes?: GenerateNotesHook
  prepare?: PrepareHook
  publish?: PublishHook
  success?: SuccessHook
  fail?: FailHook
}

/**
 * Test execution result for a single lifecycle hook.
 */
export interface TestResult<T = unknown> {
  /**
   * Whether the test passed (no errors thrown).
   */
  success: boolean

  /**
   * The result returned by the hook (if any).
   */
  result?: T

  /**
   * Error thrown by the hook (if any).
   */
  error?: Error

  /**
   * Execution time in milliseconds.
   */
  duration: number

  /**
   * The context that was passed to the hook.
   */
  context: unknown

  /**
   * The plugin configuration that was used.
   */
  config: PluginConfig
}

/**
 * Plugin tester class for comprehensive plugin testing.
 */
export class PluginTester {
  private readonly plugin: TestablePlugin
  private readonly defaultConfig: PluginConfig
  private readonly defaultContextOptions: MockContextOptions

  /**
   * Creates a new plugin tester instance.
   */
  constructor(
    plugin: TestablePlugin,
    defaultConfig: PluginConfig = {},
    defaultContextOptions: MockContextOptions = {},
  ) {
    this.plugin = plugin
    this.defaultConfig = defaultConfig
    this.defaultContextOptions = defaultContextOptions
  }

  /**
   * Tests the verifyConditions lifecycle hook.
   */
  async testVerifyConditions(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<void>> {
    if (!this.plugin.verifyConditions) {
      throw new Error('Plugin does not implement verifyConditions hook')
    }

    const context = createMockVerifyConditionsContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.verifyConditions(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the analyzeCommits lifecycle hook.
   */
  async testAnalyzeCommits(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<AnalyzeCommitsResult>> {
    if (!this.plugin.analyzeCommits) {
      throw new Error('Plugin does not implement analyzeCommits hook')
    }

    const context = createMockAnalyzeCommitsContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.analyzeCommits(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the verifyRelease lifecycle hook.
   */
  async testVerifyRelease(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<void>> {
    if (!this.plugin.verifyRelease) {
      throw new Error('Plugin does not implement verifyRelease hook')
    }

    const context = createMockVerifyReleaseContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.verifyRelease(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the generateNotes lifecycle hook.
   */
  async testGenerateNotes(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<GenerateNotesResult>> {
    if (!this.plugin.generateNotes) {
      throw new Error('Plugin does not implement generateNotes hook')
    }

    const context = createMockGenerateNotesContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.generateNotes(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the prepare lifecycle hook.
   */
  async testPrepare(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<void>> {
    if (!this.plugin.prepare) {
      throw new Error('Plugin does not implement prepare hook')
    }

    const context = createMockPrepareContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.prepare(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the publish lifecycle hook.
   */
  async testPublish(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<PublishResult | void>> {
    if (!this.plugin.publish) {
      throw new Error('Plugin does not implement publish hook')
    }

    const context = createMockPublishContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.publish(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the success lifecycle hook.
   */
  async testSuccess(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<void>> {
    if (!this.plugin.success) {
      throw new Error('Plugin does not implement success hook')
    }

    const context = createMockSuccessContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.success(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests the fail lifecycle hook.
   */
  async testFail(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<TestResult<void>> {
    if (!this.plugin.fail) {
      throw new Error('Plugin does not implement fail hook')
    }

    const context = createMockFailContext(contextOptions)
    const startTime = Date.now()

    try {
      const result = await this.plugin.fail(config, context)
      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        duration,
        context,
        config,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error as Error,
        duration,
        context,
        config,
      }
    }
  }

  /**
   * Tests all implemented lifecycle hooks in sequence.
   */
  async testAllHooks(
    config: PluginConfig = this.defaultConfig,
    contextOptions: MockContextOptions = this.defaultContextOptions,
  ): Promise<Record<string, TestResult<unknown>>> {
    const results: Record<string, TestResult<unknown>> = {}

    if (this.plugin.verifyConditions) {
      results.verifyConditions = await this.testVerifyConditions(config, contextOptions)
    }

    if (this.plugin.analyzeCommits) {
      results.analyzeCommits = await this.testAnalyzeCommits(config, contextOptions)
    }

    if (this.plugin.verifyRelease) {
      results.verifyRelease = await this.testVerifyRelease(config, contextOptions)
    }

    if (this.plugin.generateNotes) {
      results.generateNotes = await this.testGenerateNotes(config, contextOptions)
    }

    if (this.plugin.prepare) {
      results.prepare = await this.testPrepare(config, contextOptions)
    }

    if (this.plugin.publish) {
      results.publish = await this.testPublish(config, contextOptions)
    }

    if (this.plugin.success) {
      results.success = await this.testSuccess(config, contextOptions)
    }

    if (this.plugin.fail) {
      results.fail = await this.testFail(config, contextOptions)
    }

    return results
  }

  /**
   * Gets a list of implemented lifecycle hooks in the plugin.
   */
  getImplementedHooks(): string[] {
    const hooks: string[] = []

    if (this.plugin.verifyConditions) hooks.push('verifyConditions')
    if (this.plugin.analyzeCommits) hooks.push('analyzeCommits')
    if (this.plugin.verifyRelease) hooks.push('verifyRelease')
    if (this.plugin.generateNotes) hooks.push('generateNotes')
    if (this.plugin.prepare) hooks.push('prepare')
    if (this.plugin.publish) hooks.push('publish')
    if (this.plugin.success) hooks.push('success')
    if (this.plugin.fail) hooks.push('fail')

    return hooks
  }

  /**
   * Validates that the plugin implements at least one lifecycle hook.
   */
  validatePlugin(): boolean {
    return this.getImplementedHooks().length > 0
  }
}

/**
 * Creates a new plugin tester for the given plugin.
 *
 * @param plugin - The plugin to test
 * @param defaultConfig - Default configuration to use for tests
 * @param defaultContextOptions - Default context options for mock contexts
 * @returns A configured plugin tester instance
 *
 * @example
 * ```typescript
 * const tester = createPluginTester(myPlugin, { option: 'value' })
 *
 * // Test individual hooks
 * const result = await tester.testVerifyConditions()
 * expect(result.success).toBe(true)
 *
 * // Test all hooks
 * const allResults = await tester.testAllHooks()
 * expect(allResults.verifyConditions.success).toBe(true)
 * ```
 */
export function createPluginTester(
  plugin: TestablePlugin,
  defaultConfig: PluginConfig = {},
  defaultContextOptions: MockContextOptions = {},
): PluginTester {
  return new PluginTester(plugin, defaultConfig, defaultContextOptions)
}

/**
 * Utility function to test a single plugin hook with specific configuration and context.
 *
 * @param hook - The lifecycle hook function to test
 * @param hookName - Name of the hook for error messages
 * @param config - Plugin configuration
 * @param contextOptions - Mock context options
 * @returns Test result
 */
export async function testPluginHook<T>(
  hook: (config: PluginConfig, context: unknown) => Promise<T> | T,
  hookName: string,
  config: PluginConfig = {},
  contextOptions: MockContextOptions = {},
): Promise<TestResult<T>> {
  const contextFactories = {
    verifyConditions: createMockVerifyConditionsContext,
    analyzeCommits: createMockAnalyzeCommitsContext,
    verifyRelease: createMockVerifyReleaseContext,
    generateNotes: createMockGenerateNotesContext,
    prepare: createMockPrepareContext,
    publish: createMockPublishContext,
    success: createMockSuccessContext,
    fail: createMockFailContext,
  }

  type FactoryKey = keyof typeof contextFactories
  const factory = contextFactories[hookName as FactoryKey]

  if (!(hookName in contextFactories)) {
    throw new Error(`Unknown hook name: ${hookName}`)
  }

  const context = factory(contextOptions)
  const startTime = Date.now()

  try {
    const result = await hook(config, context)
    const duration = Date.now() - startTime

    return {
      success: true,
      result,
      duration,
      context,
      config,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    return {
      success: false,
      error: error as Error,
      duration,
      context,
      config,
    }
  }
}
