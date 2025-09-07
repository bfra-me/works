/**
 * Plugin testing utilities with mock semantic-release context.
 *
 * This module provides comprehensive testing utilities for semantic-release plugin development,
 * including mock context objects, testing helpers, and plugin validation utilities.
 * These utilities make it easy to test semantic-release plugins in isolation
 * without requiring a full semantic-release environment.
 *
 * **Key Features:**
 * - Mock context objects for all plugin lifecycle stages
 * - Plugin testing framework with automated lifecycle validation
 * - Test helpers for common plugin testing scenarios
 * - TypeScript-first design with full type safety
 * - Integration with popular testing frameworks (Vitest, Jest)
 *
 * @example
 * ```typescript
 * import { PluginTester, createMockContext } from '@bfra.me/semantic-release/plugins/testing'
 *
 * // Test a custom plugin
 * const tester = new PluginTester(myPlugin)
 *
 * const context = createMockContext({
 *   commits: [{ message: 'feat: new feature' }],
 *   nextRelease: { version: '1.1.0', type: 'minor' }
 * })
 *
 * await tester.testLifecycle('analyzeCommits', {}, context)
 * ```
 *
 * @example
 * ```typescript
 * import { testPlugin } from '@bfra.me/semantic-release/plugins/testing'
 *
 * // Quick plugin validation
 * const result = await testPlugin(myPlugin, {
 *   lifecycle: 'generateNotes',
 *   config: { preset: 'angular' },
 *   mockData: {
 *     commits: [{ message: 'feat: add feature' }]
 *   }
 * })
 * ```
 */

export * from './mock-context.js'
export * from './plugin-tester.js'
export * from './test-helpers.js'
