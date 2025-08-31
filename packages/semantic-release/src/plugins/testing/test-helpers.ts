/**
 * Test helper utilities for semantic-release plugin testing.
 *
 * This module provides utility functions that make writing tests for semantic-release
 * plugins easier, including assertion helpers, scenario builders, and common test patterns.
 */

import type {
  AnalyzeCommitsResult,
  Commit,
  GenerateNotesResult,
  NextRelease,
  PluginConfig,
  PublishResult,
  Release,
} from '../context.js'
import type {MockContextOptions} from './mock-context.js'
import type {TestResult} from './plugin-tester.js'
import {createMockCommit, createMockNextRelease, createMockRelease} from './mock-context.js'

/**
 * Predefined commit types for testing.
 */
export const TestCommitTypes = {
  FEAT: 'feat',
  FIX: 'fix',
  DOCS: 'docs',
  STYLE: 'style',
  REFACTOR: 'refactor',
  PERF: 'perf',
  TEST: 'test',
  CHORE: 'chore',
  BREAKING: 'feat!',
} as const

/**
 * Predefined release types for testing.
 */
export const TestReleaseTypes = {
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
  PREMAJOR: 'premajor',
  PREMINOR: 'preminor',
  PREPATCH: 'prepatch',
  PRERELEASE: 'prerelease',
} as const

/**
 * Builder for creating test commits with realistic data.
 */
export class CommitBuilder {
  private readonly commit: Partial<Commit> = {}

  /**
   * Sets the commit type (feat, fix, etc.).
   */
  type(type: string): this {
    this.commit.subject = `${type}: ${this.commit.subject?.split(': ')[1] ?? 'test commit'}`
    return this
  }

  /**
   * Sets the commit subject (will be prefixed with type if set).
   */
  subject(subject: string): this {
    const rawSubject = this.commit.subject
    // Extract the type only when rawSubject is a non-empty string that contains a type separator.
    const currentType =
      typeof rawSubject === 'string' && rawSubject.length > 0 && rawSubject.includes(': ')
        ? rawSubject.split(': ')[0]
        : undefined

    if (typeof currentType === 'string' && currentType.length > 0) {
      this.commit.subject = `${currentType}: ${subject}`
    } else {
      this.commit.subject = subject
    }

    return this
  }

  /**
   * Sets the commit body.
   */
  body(body: string): this {
    this.commit.body = body
    return this
  }

  /**
   * Sets the commit message (subject + body).
   */
  message(message: string): this {
    const lines = message.split('\n')
    this.commit.subject = lines[0]
    this.commit.body = lines.slice(1).join('\n')
    this.commit.message = message
    return this
  }

  /**
   * Sets the commit hash.
   */
  hash(hash: string): this {
    this.commit.hash = hash
    this.commit.commit = {
      long: hash,
      short: hash.slice(0, 7),
    }
    return this
  }

  /**
   * Sets the commit author.
   */
  author(name: string, email: string): this {
    this.commit.author = {
      name,
      email,
      date: this.commit.author?.date ?? new Date().toISOString(),
    }
    return this
  }

  /**
   * Sets the commit date.
   */
  date(date: string | Date): this {
    const isoDate = typeof date === 'string' ? date : date.toISOString()
    if (this.commit.author) {
      this.commit.author.date = isoDate
    }
    if (this.commit.committer) {
      this.commit.committer.date = isoDate
    }
    this.commit.committerDate = isoDate
    return this
  }

  /**
   * Marks the commit as breaking.
   */
  breaking(): this {
    const currentSubject = this.commit.subject ?? 'test commit'
    if (!currentSubject.includes('!')) {
      const [type, ...rest] = currentSubject.split(': ')
      this.commit.subject = `${type}!: ${rest.join(': ')}`
    }
    return this
  }

  /**
   * Builds the commit object.
   */
  build(): Commit {
    return createMockCommit(this.commit)
  }
}

/**
 * Builder for creating test releases with realistic data.
 */
export class ReleaseBuilder {
  private readonly release: Partial<Release> = {}

  /**
   * Sets the release version.
   */
  version(version: string): this {
    this.release.version = version
    this.release.gitTag = `v${version}`
    this.release.name = `v${version}`
    return this
  }

  /**
   * Sets the release notes.
   */
  notes(notes: string): this {
    this.release.notes = notes
    return this
  }

  /**
   * Sets the git head hash.
   */
  gitHead(hash: string): this {
    this.release.gitHead = hash
    return this
  }

  /**
   * Sets the release channels.
   */
  channels(channels: string[]): this {
    this.release.channels = channels
    return this
  }

  /**
   * Builds the release object.
   */
  build(): Release {
    return createMockRelease(this.release)
  }
}

/**
 * Builder for creating test next releases with realistic data.
 */
export class NextReleaseBuilder extends ReleaseBuilder {
  private readonly nextRelease: Partial<NextRelease> = {}

  /**
   * Sets the release type.
   */
  type(type: string): this {
    this.nextRelease.type = type
    return this
  }

  /**
   * Sets the release channel.
   */
  channel(channel: string): this {
    this.nextRelease.channel = channel
    return this
  }

  /**
   * Builds the next release object.
   */
  override build(): NextRelease {
    const baseRelease = super.build()
    return createMockNextRelease({
      ...baseRelease,
      ...this.nextRelease,
    })
  }
}

/**
 * Scenario builder for creating common test scenarios.
 */
export class ScenarioBuilder {
  private readonly contextOptions: MockContextOptions = {}

  /**
   * Sets up a scenario with feature commits.
   */
  withFeatureCommits(count = 1): this {
    const commits = Array.from({length: count}, (_, i) =>
      new CommitBuilder()
        .type(TestCommitTypes.FEAT)
        .subject(`add feature ${i + 1}`)
        .build(),
    )
    this.contextOptions.commits = commits
    return this
  }

  /**
   * Sets up a scenario with bugfix commits.
   */
  withBugfixCommits(count = 1): this {
    const commits = Array.from({length: count}, (_, i) =>
      new CommitBuilder()
        .type(TestCommitTypes.FIX)
        .subject(`fix bug ${i + 1}`)
        .build(),
    )
    this.contextOptions.commits = commits
    return this
  }

  /**
   * Sets up a scenario with breaking change commits.
   */
  withBreakingCommits(count = 1): this {
    const commits = Array.from({length: count}, (_, i) =>
      new CommitBuilder()
        .type(TestCommitTypes.BREAKING)
        .subject(`breaking change ${i + 1}`)
        .breaking()
        .build(),
    )
    this.contextOptions.commits = commits
    return this
  }

  /**
   * Sets up a scenario with mixed commit types.
   */
  withMixedCommits(): this {
    const commits = [
      new CommitBuilder().type(TestCommitTypes.FEAT).subject('add new feature').build(),
      new CommitBuilder().type(TestCommitTypes.FIX).subject('fix critical bug').build(),
      new CommitBuilder().type(TestCommitTypes.DOCS).subject('update documentation').build(),
    ]
    this.contextOptions.commits = commits
    return this
  }

  /**
   * Sets up a last release.
   */
  withLastRelease(version = '1.0.0'): this {
    this.contextOptions.lastRelease = new ReleaseBuilder().version(version).build()
    return this
  }

  /**
   * Sets up a next release.
   */
  withNextRelease(version = '1.1.0', type = TestReleaseTypes.MINOR): this {
    this.contextOptions.nextRelease = new NextReleaseBuilder()
      .version(version)
      .type(type)
      .channel('main')
      .build()
    return this
  }

  /**
   * Sets up releases from previous workflow steps.
   */
  withPreviousReleases(versions: string[]): this {
    this.contextOptions.releases = versions.map(version =>
      new ReleaseBuilder().version(version).build(),
    )
    return this
  }

  /**
   * Sets up custom environment variables.
   */
  withEnvironment(env: Record<string, string>): this {
    this.contextOptions.env = env
    return this
  }

  /**
   * Sets up custom options.
   */
  withOptions(options: Record<string, unknown>): this {
    this.contextOptions.options = options
    return this
  }

  /**
   * Builds the context options.
   */
  build(): MockContextOptions {
    return this.contextOptions
  }
}

/**
 * Asserts that a test result was successful.
 */
export function expectSuccess<T>(
  result: TestResult<T>,
): asserts result is TestResult<T> & {success: true} {
  if (!result.success) {
    throw new Error(`Expected test to succeed, but it failed: ${result.error?.message}`)
  }
}

/**
 * Asserts that a test result failed.
 */
export function expectFailure<T>(
  result: TestResult<T>,
): asserts result is TestResult<T> & {success: false} {
  if (result.success) {
    throw new Error('Expected test to fail, but it succeeded')
  }
}

/**
 * Asserts that a test result failed with a specific error message.
 */
export function expectFailureWithMessage<T>(result: TestResult<T>, message: string): void {
  expectFailure(result)
  if (!result.error?.message.includes(message)) {
    throw new Error(
      `Expected error message to contain "${message}", but got: ${result.error?.message}`,
    )
  }
}

/**
 * Asserts that an analyze commits result matches expected release type.
 */
export function expectReleaseType(
  result: TestResult<AnalyzeCommitsResult>,
  expectedType: string,
): void {
  expectSuccess(result)
  if (result.result !== expectedType) {
    throw new Error(`Expected release type "${expectedType}", but got: ${result.result}`)
  }
}

/**
 * Asserts that generated notes contain specific content.
 */
export function expectNotesContain(result: TestResult<GenerateNotesResult>, content: string): void {
  expectSuccess(result)
  if (typeof result.result !== 'string' || !result.result.includes(content)) {
    throw new Error(`Expected notes to contain "${content}", but got: ${result.result}`)
  }
}

/**
 * Asserts that a publish result has expected properties.
 */
export function expectPublishResult(
  result: TestResult<PublishResult | void>,
  expectedName?: string,
  expectedUrl?: string,
): void {
  expectSuccess(result)
  if (!result.result) {
    throw new Error('Expected publish result, but got undefined')
  }

  const publishResult = result.result
  if (expectedName !== undefined && publishResult.name !== expectedName) {
    throw new Error(`Expected publish name "${expectedName}", but got: ${publishResult.name}`)
  }
  if (expectedUrl !== undefined && publishResult.url !== expectedUrl) {
    throw new Error(`Expected publish URL "${expectedUrl}", but got: ${publishResult.url}`)
  }
}

/**
 * Asserts that test execution time is within expected bounds.
 */
export function expectDuration<T>(result: TestResult<T>, maxMs: number): void {
  if (result.duration > maxMs) {
    throw new Error(`Expected test to complete within ${maxMs}ms, but took ${result.duration}ms`)
  }
}

/**
 * Creates a commit builder for fluent commit creation.
 *
 * @example
 * ```typescript
 * const commit = createCommit()
 *   .type('feat')
 *   .subject('add awesome feature')
 *   .body('This feature is really awesome')
 *   .author('Test Author', 'test@example.com')
 *   .build()
 * ```
 */
export function createCommit(): CommitBuilder {
  return new CommitBuilder()
}

/**
 * Creates a release builder for fluent release creation.
 *
 * @example
 * ```typescript
 * const release = createRelease()
 *   .version('1.2.3')
 *   .notes('## Features\n\n* Add new feature')
 *   .build()
 * ```
 */
export function createRelease(): ReleaseBuilder {
  return new ReleaseBuilder()
}

/**
 * Creates a next release builder for fluent next release creation.
 *
 * @example
 * ```typescript
 * const nextRelease = createNextRelease()
 *   .version('1.2.3')
 *   .type('minor')
 *   .channel('main')
 *   .build()
 * ```
 */
export function createNextRelease(): NextReleaseBuilder {
  return new NextReleaseBuilder()
}

/**
 * Creates a scenario builder for setting up test scenarios.
 *
 * @example
 * ```typescript
 * const scenario = createScenario()
 *   .withFeatureCommits(2)
 *   .withLastRelease('1.0.0')
 *   .withNextRelease('1.1.0', 'minor')
 *   .build()
 * ```
 */
export function createScenario(): ScenarioBuilder {
  return new ScenarioBuilder()
}

/**
 * Utility to create multiple commits of the same type.
 */
export function createCommits(type: string, count: number, subjectPrefix = 'test'): Commit[] {
  return Array.from({length: count}, (_, i) =>
    new CommitBuilder()
      .type(type)
      .subject(`${subjectPrefix} ${i + 1}`)
      .build(),
  )
}

/**
 * Utility to create a basic plugin configuration for testing.
 */
export function createTestConfig(overrides: PluginConfig = {}): PluginConfig {
  return {
    debug: false,
    ...overrides,
  }
}

/**
 * Utility to assert that a plugin implements specific hooks.
 */
export function assertImplementsHooks(
  plugin: Record<string, unknown>,
  requiredHooks: string[],
): void {
  const missingHooks = requiredHooks.filter(hook => typeof plugin[hook] !== 'function')
  if (missingHooks.length > 0) {
    throw new Error(`Plugin is missing required hooks: ${missingHooks.join(', ')}`)
  }
}

/**
 * Utility to create a minimal viable plugin for testing.
 */
export function createTestPlugin(hooks: Partial<Record<string, (...args: unknown[]) => unknown>>) {
  return {
    verifyConditions: hooks.verifyConditions,
    analyzeCommits: hooks.analyzeCommits,
    verifyRelease: hooks.verifyRelease,
    generateNotes: hooks.generateNotes,
    prepare: hooks.prepare,
    publish: hooks.publish,
    success: hooks.success,
    fail: hooks.fail,
  }
}
