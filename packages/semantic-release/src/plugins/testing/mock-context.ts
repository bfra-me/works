/**
 * Mock context objects for testing semantic-release plugins.
 *
 * This module provides factory functions to create mock context objects
 * that simulate the runtime environment semantic-release provides to plugins.
 * These mocks enable comprehensive testing of plugin behavior in isolation.
 */

import type {
  AnalyzeCommitsContext,
  BaseContext,
  Branch,
  CiEnvironment,
  Commit,
  FailContext,
  GenerateNotesContext,
  Logger,
  NextRelease,
  PrepareContext,
  PublishContext,
  PublishResult,
  Release,
  SuccessContext,
  VerifyConditionsContext,
  VerifyReleaseContext,
} from '../context.js'
import process from 'node:process'

/**
 * Configuration options for creating mock context objects.
 */
export interface MockContextOptions {
  /**
   * Environment variables to include in the context.
   */
  env?: Record<string, string | undefined>

  /**
   * Current working directory.
   */
  cwd?: string

  /**
   * Mock commits for analyze commits context.
   */
  commits?: Partial<Commit>[]

  /**
   * Mock releases for generate notes and publish contexts.
   */
  releases?: Partial<Release>[]

  /**
   * Next release information.
   */
  nextRelease?: Partial<NextRelease>

  /**
   * Last release information.
   */
  lastRelease?: Partial<Release>

  /**
   * Branch configuration.
   */
  branch?: Partial<Branch>

  /**
   * All branches configuration.
   */
  branches?: Partial<Branch>[]

  /**
   * Options passed to semantic-release.
   */
  options?: Record<string, unknown>

  /**
   * CI environment information.
   */
  envCi?: Partial<CiEnvironment>

  /**
   * Mock logger implementation.
   */
  logger?: Partial<Logger>

  /**
   * Error information for fail context.
   */
  errors?: Error[]
}

/**
 * Mock function type for testing utilities that need mocked functions.
 */
export interface MockFunction<T extends (...args: unknown[]) => unknown = () => void> {
  (...args: Parameters<T>): ReturnType<T>
  calls: Parameters<T>[]
  results: ReturnType<T>[]
}

/**
 * Creates a simple mock function for testing without external dependencies.
 */
export function createMockFunction<T extends (...args: unknown[]) => unknown>(
  implementation?: T,
): MockFunction<T> {
  const calls: Parameters<T>[] = []
  const results: ReturnType<T>[] = []

  const mockFn = ((...args: Parameters<T>): ReturnType<T> => {
    calls.push(args)
    try {
      const result = implementation ? implementation(...args) : (undefined as ReturnType<T>)
      results.push(result as ReturnType<T>)
      return result as ReturnType<T>
    } catch (error) {
      results.push(error as ReturnType<T>)
      throw error
    }
  }) as MockFunction<T>

  mockFn.calls = calls
  mockFn.results = results

  return mockFn
}

/**
 * Creates a mock logger with configurable behavior.
 */
export function createMockLogger(overrides: Partial<Logger> = {}): Logger {
  return {
    log: createMockFunction(),
    warn: createMockFunction(),
    success: createMockFunction(),
    error: createMockFunction(),
    debug: createMockFunction(),
    ...overrides,
  }
}

/**
 * Creates mock environment variables with defaults.
 */
export function createMockEnv(
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    CI: 'true',
    GITHUB_ACTIONS: 'true',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_SHA: 'abc123def456789',
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_TOKEN: 'mock_token',
    NPM_TOKEN: 'mock_npm_token',
    ...overrides,
  }
}

/**
 * Creates mock CI environment information with defaults.
 */
export function createMockEnvCi(overrides: Partial<CiEnvironment> = {}): CiEnvironment {
  return {
    isCi: true,
    branch: 'main',
    commit: 'abc123def456789',
    tag: undefined,
    pr: undefined,
    isPr: false,
    prBranch: undefined,
    slug: 'owner/repo',
    root: '/test/repo',
    service: 'github',
    ...overrides,
  }
}

/**
 * Creates a mock commit object with realistic defaults.
 */
export function createMockCommit(overrides: Partial<Commit> = {}): Commit {
  const defaultCommit: Commit = {
    commit: {
      long: 'a1b2c3d4e5f6789012345678901234567890abcd',
      short: 'a1b2c3d',
    },
    tree: {
      long: 'e5f6789012345678901234567890abcda1b2c3d4',
      short: 'e5f6789',
    },
    author: {
      name: 'Test Author',
      email: 'test@example.com',
      date: '2024-01-01T12:00:00Z',
    },
    committer: {
      name: 'Test Committer',
      email: 'test@example.com',
      date: '2024-01-01T12:00:00Z',
    },
    subject: 'feat: add new feature',
    body: 'This is a test commit body',
    hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    message: 'feat: add new feature\n\nThis is a test commit body',
    gitTags: '',
    committerDate: '2024-01-01T12:00:00Z',
    ...overrides,
  }

  return defaultCommit
}

/**
 * Creates a mock release object with realistic defaults.
 */
export function createMockRelease(overrides: Partial<Release> = {}): Release {
  return {
    version: '1.1.0',
    gitHead: 'a1b2c3d4e5f6789012345678901234567890abcd',
    gitTag: 'v1.1.0',
    channels: [],
    name: 'v1.1.0',
    notes: '## Features\n\n* Add new feature',
    ...overrides,
  }
}

/**
 * Creates a mock next release object with realistic defaults.
 */
export function createMockNextRelease(overrides: Partial<NextRelease> = {}): NextRelease {
  return {
    version: '1.1.0',
    gitHead: 'a1b2c3d4e5f6789012345678901234567890abcd',
    gitTag: 'v1.1.0',
    channels: [],
    name: 'v1.1.0',
    notes: '## Features\n\n* Add new feature',
    type: 'minor',
    channel: 'main',
    ...overrides,
  }
}

/**
 * Creates a mock publish result with realistic defaults.
 */
export function createMockPublishResult(overrides: Partial<PublishResult> = {}): PublishResult {
  return {
    name: 'v1.1.0',
    url: 'https://github.com/owner/repo/releases/tag/v1.1.0',
    ...overrides,
  }
}

/**
 * Creates a mock branch object with realistic defaults.
 */
export function createMockBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    name: 'main',
    type: 'release',
    channel: 'main',
    range: '>=1.0.0',
    accept: ['major', 'minor', 'patch'],
    tags: {},
    main: true,
    ...overrides,
  }
}

/**
 * Creates a base mock context with common properties.
 */
export function createMockBaseContext(options: MockContextOptions = {}): BaseContext {
  const env = createMockEnv(options.env)
  const envCi = createMockEnvCi(options.envCi)
  const logger = createMockLogger(options.logger)
  const branch = createMockBranch(options.branch)
  const branches = options.branches?.map(b => createMockBranch(b)) ?? [branch]

  return {
    cwd: options.cwd ?? '/test/repo',
    env,
    envCi,
    stdout: process.stdout,
    stderr: process.stderr,
    logger,
    options: {
      branches: ['main'],
      repositoryUrl: 'https://github.com/owner/repo.git',
      tagFormat: 'v$' + '{version}',
      plugins: [],
      preset: 'angular',
      dryRun: false,
      ci: true,
      ...options.options,
    },
    branch,
    branches,
  }
}

/**
 * Creates a mock context for the verifyConditions lifecycle.
 */
export function createMockVerifyConditionsContext(
  options: MockContextOptions = {},
): VerifyConditionsContext {
  return createMockBaseContext(options)
}

/**
 * Creates a mock context for the analyzeCommits lifecycle.
 */
export function createMockAnalyzeCommitsContext(
  options: MockContextOptions = {},
): AnalyzeCommitsContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const releases = options.releases?.map(release => createMockRelease(release)) ?? []
  const lastRelease = options.lastRelease
    ? createMockRelease(options.lastRelease)
    : (releases[0] ?? createMockRelease())

  return {
    ...baseContext,
    commits,
    releases,
    lastRelease,
  }
}

/**
 * Creates a mock context for the verifyRelease lifecycle.
 */
export function createMockVerifyReleaseContext(
  options: MockContextOptions = {},
): VerifyReleaseContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const releases = options.releases?.map(release => createMockRelease(release)) ?? []

  return {
    ...baseContext,
    commits,
    nextRelease: createMockNextRelease(options.nextRelease),
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : createMockRelease(),
  }
}

/**
 * Creates a mock context for the generateNotes lifecycle.
 */
export function createMockGenerateNotesContext(
  options: MockContextOptions = {},
): GenerateNotesContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const releases = options.releases?.map(release => createMockRelease(release)) ?? []

  return {
    ...baseContext,
    commits,
    nextRelease: createMockNextRelease(options.nextRelease),
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : createMockRelease(),
  }
}

/**
 * Creates a mock context for the prepare lifecycle.
 */
export function createMockPrepareContext(options: MockContextOptions = {}): PrepareContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const releases = options.releases?.map(release => createMockRelease(release)) ?? []
  const nextRelease = createMockNextRelease({
    notes: '## Features\n\n* Add new feature',
    ...options.nextRelease,
  })

  return {
    ...baseContext,
    commits,
    nextRelease: nextRelease as NextRelease & {notes: string},
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : createMockRelease(),
  }
}

/**
 * Creates a mock context for the publish lifecycle.
 */
export function createMockPublishContext(options: MockContextOptions = {}): PublishContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const releases = options.releases?.map(release => createMockRelease(release)) ?? []
  const nextRelease = createMockNextRelease({
    notes: '## Features\n\n* Add new feature',
    ...options.nextRelease,
  })

  return {
    ...baseContext,
    commits,
    nextRelease: nextRelease as NextRelease & {notes: string},
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : createMockRelease(),
  }
}

/**
 * Creates a mock context for the success lifecycle.
 */
export function createMockSuccessContext(options: MockContextOptions = {}): SuccessContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit)) ?? [createMockCommit()]
  const publishResults = [createMockPublishResult()]
  const releases = publishResults.map(result => ({
    ...createMockRelease(),
    name: result.name,
    url: result.url,
  }))

  return {
    ...baseContext,
    commits,
    nextRelease: createMockNextRelease(options.nextRelease),
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : createMockRelease(),
  }
}

/**
 * Creates a mock context for the fail lifecycle.
 */
export function createMockFailContext(options: MockContextOptions = {}): FailContext {
  const baseContext = createMockBaseContext(options)
  const commits = options.commits?.map(commit => createMockCommit(commit))
  const releases = options.releases?.map(release => createMockRelease(release))

  return {
    ...baseContext,
    commits,
    nextRelease: options.nextRelease ? createMockNextRelease(options.nextRelease) : undefined,
    releases,
    lastRelease: options.lastRelease ? createMockRelease(options.lastRelease) : undefined,
    errors: options.errors ?? [new Error('Test error')],
  }
}

/**
 * Factory function to create mock contexts for any lifecycle stage.
 */
export function createMockContext<T extends keyof ContextFactoryMap>(
  lifecycle: T,
  options: MockContextOptions = {},
): ReturnType<ContextFactoryMap[T]> {
  const factories: ContextFactoryMap = {
    verifyConditions: createMockVerifyConditionsContext,
    analyzeCommits: createMockAnalyzeCommitsContext,
    verifyRelease: createMockVerifyReleaseContext,
    generateNotes: createMockGenerateNotesContext,
    prepare: createMockPrepareContext,
    publish: createMockPublishContext,
    success: createMockSuccessContext,
    fail: createMockFailContext,
  }

  return factories[lifecycle](options) as ReturnType<ContextFactoryMap[T]>
}

/**
 * Map of lifecycle names to their corresponding context factory functions.
 */
interface ContextFactoryMap {
  verifyConditions: typeof createMockVerifyConditionsContext
  analyzeCommits: typeof createMockAnalyzeCommitsContext
  verifyRelease: typeof createMockVerifyReleaseContext
  generateNotes: typeof createMockGenerateNotesContext
  prepare: typeof createMockPrepareContext
  publish: typeof createMockPublishContext
  success: typeof createMockSuccessContext
  fail: typeof createMockFailContext
}

/**
 * Utility to create multiple mock contexts for testing plugin behavior across lifecycles.
 */
export function createMockContextBundle(options: MockContextOptions = {}) {
  return {
    verifyConditions: createMockVerifyConditionsContext(options),
    analyzeCommits: createMockAnalyzeCommitsContext(options),
    verifyRelease: createMockVerifyReleaseContext(options),
    generateNotes: createMockGenerateNotesContext(options),
    prepare: createMockPrepareContext(options),
    publish: createMockPublishContext(options),
    success: createMockSuccessContext(options),
    fail: createMockFailContext(options),
  }
}
