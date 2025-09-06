/**
 * Mock repository utilities for testing real-world semantic-release workflows.
 *
 * This module provides utilities for creating and managing mock git repositories
 * with realistic commit histories, branches, and tags to test complete semantic-release
 * workflows end-to-end.
 */

import {execSync} from 'node:child_process'
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

const CURRENT_FILENAME = fileURLToPath(import.meta.url)
const CURRENT_DIRNAME = path.dirname(CURRENT_FILENAME)

/**
 * Configuration for mock repository setup
 */
export interface MockRepoConfig {
  /** Repository name for identification */
  name: string
  /** Initial version for package.json */
  initialVersion?: string
  /** Whether to create initial release tags */
  createInitialTags?: boolean
  /** Git user configuration */
  gitUser?: {
    name: string
    email: string
  }
  /** Package.json configuration */
  packageConfig?: {
    name: string
    description?: string
    private?: boolean
    [key: string]: unknown
  }
  /** Additional files to create */
  files?: {path: string; content: string}[]
}

/**
 * Represents a commit to be created in the mock repository
 */
export interface MockCommit {
  /** Commit message */
  message: string
  /** Files to add/modify in this commit */
  files?: {path: string; content: string}[]
  /** Git author override */
  author?: {
    name: string
    email: string
  }
  /** Commit timestamp override */
  timestamp?: Date
}

/**
 * Represents a git tag to be created
 */
export interface MockTag {
  /** Tag name (e.g., 'v1.0.0') */
  name: string
  /** Commit hash to tag (if not provided, uses HEAD) */
  commit?: string
  /** Tag message */
  message?: string
  /** Whether this is an annotated tag */
  annotated?: boolean
}

/**
 * Result of repository operations
 */
export interface RepoOperationResult {
  success: boolean
  repoPath?: string
  error?: string
  warnings?: string[]
}

/**
 * Mock repository manager for semantic-release workflow testing
 */
export class MockRepository {
  private readonly config: MockRepoConfig
  private readonly basePath: string
  private repoPath?: string
  private initialized = false

  constructor(config: MockRepoConfig) {
    this.config = {
      initialVersion: '0.0.0',
      createInitialTags: true,
      gitUser: {
        name: 'Test User',
        email: 'test@example.com',
      },
      ...config,
    }
    this.basePath = path.join(CURRENT_DIRNAME, 'fixtures', 'temp', 'mock-repos')
  }

  /**
   * Initialize the mock repository with basic structure
   */
  async initialize(): Promise<RepoOperationResult> {
    try {
      // Create base directory if it doesn't exist
      if (!existsSync(this.basePath)) {
        mkdirSync(this.basePath, {recursive: true})
      }

      // Create repo-specific directory
      this.repoPath = path.join(this.basePath, this.config.name)

      // Clean up if repo already exists
      if (existsSync(this.repoPath)) {
        rmSync(this.repoPath, {recursive: true, force: true})
      }

      // Create repository directory
      try {
        mkdirSync(this.repoPath, {recursive: true})
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Failed to create repository directory:', {
          repoPath: this.repoPath,
          error: errorMessage,
        })
        return {
          success: false,
          error: errorMessage,
        }
      }

      // Verify directory was created
      if (!existsSync(this.repoPath)) {
        const errorMessage = `Repository directory was not created: ${this.repoPath}`
        console.error('Directory verification failed:', {
          repoPath: this.repoPath,
          error: errorMessage,
        })
        return {
          success: false,
          error: errorMessage,
        }
      }

      // Initialize git repository
      // Use git -C flag instead of process.chdir() to avoid race conditions
      // Initialize git with main as the default branch
      try {
        execSync(`git -C "${this.repoPath}" init --initial-branch=main`, {stdio: 'pipe'})
      } catch {
        // Fallback for older git versions that don't support --initial-branch
        execSync(`git -C "${this.repoPath}" init`, {stdio: 'pipe'})
      }

      // Configure git user
      const gitUser = this.config.gitUser ?? {name: 'Test User', email: 'test@example.com'}
      execSync(`git -C "${this.repoPath}" config user.name "${gitUser.name}"`, {stdio: 'pipe'})
      execSync(`git -C "${this.repoPath}" config user.email "${gitUser.email}"`, {stdio: 'pipe'})

      // Ensure we're using 'main' as the default branch name
      execSync(`git -C "${this.repoPath}" config init.defaultBranch main`, {stdio: 'pipe'})

      // Create initial package.json
      const packageConfig = {
        name: this.config.packageConfig?.name ?? `test-${this.config.name}`,
        version: this.config.initialVersion,
        description:
          this.config.packageConfig?.description ?? 'Test package for semantic-release workflow',
        private: this.config.packageConfig?.private ?? false,
        scripts: {
          build: 'echo "Building..."',
          test: 'echo "Testing..."',
        },
        ...this.config.packageConfig,
      }

      writeFileSync(
        path.join(this.repoPath, 'package.json'),
        JSON.stringify(packageConfig, null, 2),
      )

      // Create README.md
      writeFileSync(
        path.join(this.repoPath, 'README.md'),
        `# ${packageConfig.name}\n\n${packageConfig.description}\n`,
      )

      // Create additional files if specified
      if (this.config.files) {
        for (const file of this.config.files) {
          const filePath = path.join(this.repoPath, file.path)
          const fileDir = path.dirname(filePath)

          if (!existsSync(fileDir)) {
            mkdirSync(fileDir, {recursive: true})
          }

          writeFileSync(filePath, file.content)
        }
      }

      // Create initial commit
      execSync(`git -C "${this.repoPath}" add .`, {stdio: 'pipe'})
      execSync(`git -C "${this.repoPath}" commit -m "Initial commit"`, {stdio: 'pipe'})

      // Ensure we're on main branch after first commit
      try {
        const currentBranch = execSync(`git -C "${this.repoPath}" branch --show-current`, {
          stdio: 'pipe',
        })
          .toString()
          .trim()
        if (currentBranch !== 'main') {
          execSync(`git -C "${this.repoPath}" branch -m ${currentBranch} main`, {stdio: 'pipe'})
        }
      } catch {
        // If that fails, try to checkout main branch
        try {
          execSync(`git -C "${this.repoPath}" checkout -b main`, {stdio: 'pipe'})
        } catch {
          // If all else fails, continue with whatever branch we have
        }
      }

      // Create initial tag if requested
      if (this.config.createInitialTags && this.config.initialVersion !== '0.0.0') {
        execSync(`git -C "${this.repoPath}" tag v${this.config.initialVersion}`, {stdio: 'pipe'})
      }

      this.initialized = true

      return {
        success: true,
        repoPath: this.repoPath,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      // Log error for debugging intermittent failures in CI
      console.error('MockRepository initialization failed:', {
        repoName: this.config.name,
        basePath: this.basePath,
        repoPath: this.repoPath,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Add commits to the repository
   */
  async addCommits(commits: MockCommit[]): Promise<RepoOperationResult> {
    if (!this.initialized || this.repoPath === undefined) {
      return {
        success: false,
        error: 'Repository not initialized',
      }
    }

    try {
      for (const commit of commits) {
        // Add/modify files for this commit
        if (commit.files) {
          for (const file of commit.files) {
            const filePath = path.join(this.repoPath, file.path)
            const fileDir = path.dirname(filePath)

            if (!existsSync(fileDir)) {
              mkdirSync(fileDir, {recursive: true})
            }

            writeFileSync(filePath, file.content)
          }
        }

        // Stage all changes
        execSync(`git -C "${this.repoPath}" add .`, {stdio: 'pipe'})

        // Create commit with author if specified
        let commitCommand = `git -C "${this.repoPath}" commit -m "${commit.message}"`
        if (commit.author) {
          commitCommand += ` --author="${commit.author.name} <${commit.author.email}>"`
        }

        execSync(commitCommand, {stdio: 'pipe'})
      }

      return {
        success: true,
        repoPath: this.repoPath,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Create git tags in the repository
   */
  async createTags(tags: MockTag[]): Promise<RepoOperationResult> {
    if (!this.initialized || this.repoPath === undefined) {
      return {
        success: false,
        error: 'Repository not initialized',
      }
    }

    try {
      for (const tag of tags) {
        let tagCommand = `git -C "${this.repoPath}" tag`

        if (tag.annotated === true && tag.message !== undefined && tag.message.trim() !== '') {
          tagCommand += ` -a ${tag.name} -m "${tag.message}"`
        } else {
          tagCommand += ` ${tag.name}`
        }

        if (tag.commit !== undefined && tag.commit.trim() !== '') {
          tagCommand += ` ${tag.commit}`
        }

        execSync(tagCommand, {stdio: 'pipe'})
      }

      return {success: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Create and switch to a new branch
   */
  async createBranch(branchName: string, fromBranch?: string): Promise<RepoOperationResult> {
    if (!this.initialized || this.repoPath === undefined) {
      return {
        success: false,
        error: 'Repository not initialized',
      }
    }

    try {
      if (fromBranch !== undefined && fromBranch.trim() !== '') {
        execSync(`git -C "${this.repoPath}" checkout -b ${branchName} ${fromBranch}`, {
          stdio: 'pipe',
        })
      } else {
        execSync(`git -C "${this.repoPath}" checkout -b ${branchName}`, {stdio: 'pipe'})
      }

      return {success: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Switch to an existing branch
   */
  async switchBranch(branchName: string): Promise<RepoOperationResult> {
    if (!this.initialized || this.repoPath === undefined) {
      return {
        success: false,
        error: 'Repository not initialized',
      }
    }

    try {
      execSync(`git -C "${this.repoPath}" checkout ${branchName}`, {stdio: 'pipe'})
      return {success: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Get current repository information
   */
  async getInfo(): Promise<{
    currentBranch: string
    latestCommit: string
    tags: string[]
    commits: {hash: string; message: string; author: string}[]
  }> {
    if (!this.initialized || this.repoPath === undefined) {
      throw new Error('Repository not initialized')
    }

    try {
      const currentBranch = execSync(`git -C "${this.repoPath}" branch --show-current`, {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()

      const latestCommit = execSync(`git -C "${this.repoPath}" rev-parse HEAD`, {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()

      const tagsOutput = execSync(`git -C "${this.repoPath}" tag`, {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()
      const tags = tagsOutput ? tagsOutput.split('\n') : []

      const commitsOutput = execSync(
        `git -C "${this.repoPath}" log --oneline --format="%H|%s|%an"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        },
      ).trim()
      const commits = commitsOutput
        ? commitsOutput.split('\n').map(line => {
            const parts = line.split('|')
            const [hash, message, author] = parts
            if (hash === undefined || message === undefined || author === undefined) {
              throw new Error(`Invalid commit format: ${line}`)
            }
            return {hash, message, author}
          })
        : []

      return {
        currentBranch,
        latestCommit,
        tags,
        commits,
      }
    } catch (error) {
      throw new Error(
        `Failed to get repository info: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Get the repository path
   */
  getPath(): string | undefined {
    return this.repoPath
  }

  /**
   * Clean up the repository
   */
  async cleanup(): Promise<void> {
    if (this.repoPath !== undefined && existsSync(this.repoPath)) {
      rmSync(this.repoPath, {recursive: true, force: true})
    }
    this.initialized = false
    this.repoPath = undefined
  }

  /**
   * Execute a git command in the repository
   */
  async execGit(command: string): Promise<{stdout: string; stderr: string}> {
    if (!this.initialized || this.repoPath === undefined) {
      throw new Error('Repository not initialized')
    }

    const originalCwd = process.cwd()
    process.chdir(this.repoPath)

    try {
      const stdout = execSync(`git ${command}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      return {stdout, stderr: ''}
    } catch (error: unknown) {
      const execError = error as {stdout?: string; stderr?: string; message: string}
      return {
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? execError.message,
      }
    } finally {
      process.chdir(originalCwd)
    }
  }
}

/**
 * Predefined repository scenarios for common testing patterns
 */
export const RepositoryScenarios = {
  /**
   * Fresh repository with no releases
   */
  fresh: (): MockRepoConfig => ({
    name: `fresh-repo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialVersion: '0.0.0',
    createInitialTags: false,
    packageConfig: {
      name: '@test/fresh-package',
      description: 'Fresh package with no releases',
    },
  }),

  /**
   * Repository with existing releases
   */
  withReleases: (): MockRepoConfig => ({
    name: `released-repo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialVersion: '1.2.3',
    createInitialTags: true,
    packageConfig: {
      name: '@test/released-package',
      description: 'Package with existing releases',
    },
  }),

  /**
   * Monorepo package configuration
   */
  monorepo: (packageName: string): MockRepoConfig => ({
    name: `monorepo-${packageName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialVersion: '1.0.0',
    createInitialTags: true,
    packageConfig: {
      name: `@monorepo/${packageName}`,
      description: `Monorepo package ${packageName}`,
    },
    files: [
      {
        path: 'packages/core/package.json',
        content: JSON.stringify(
          {
            name: `@monorepo/${packageName}`,
            version: '1.0.0',
            description: `Monorepo package ${packageName}`,
          },
          null,
          2,
        ),
      },
      {
        path: 'packages/core/src/index.ts',
        content: `export const name = '${packageName}'\n`,
      },
    ],
  }),

  /**
   * Private package (no npm publishing)
   */
  private: (): MockRepoConfig => ({
    name: `private-repo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    initialVersion: '1.0.0',
    createInitialTags: true,
    packageConfig: {
      name: '@test/private-package',
      description: 'Private package with GitHub releases only',
      private: true,
    },
  }),
}

/**
 * Predefined commit scenarios for testing different release types
 */
export const CommitScenarios = {
  /**
   * Patch release commits (bug fixes)
   */
  patchRelease: (): MockCommit[] => [
    {
      message: 'fix: resolve critical security vulnerability',
      files: [
        {
          path: 'src/security.ts',
          content: '// Security fix implemented\nexport const secureFunction = () => "secure"\n',
        },
      ],
    },
    {
      message: 'fix: correct typo in documentation',
      files: [
        {
          path: 'README.md',
          content: '# Test Package\n\nFixed documentation typo.\n',
        },
      ],
    },
  ],

  /**
   * Minor release commits (new features)
   */
  minorRelease: (): MockCommit[] => [
    {
      message: 'feat: add new utility function',
      files: [
        {
          path: 'src/utils.ts',
          content: 'export const newUtility = () => "new feature"\n',
        },
      ],
    },
    {
      message: 'feat: improve error handling',
      files: [
        {
          path: 'src/errors.ts',
          content: 'export class CustomError extends Error {}\n',
        },
      ],
    },
  ],

  /**
   * Major release commits (breaking changes)
   */
  majorRelease: (): MockCommit[] => [
    {
      message:
        'feat!: redesign public API\n\nBREAKING CHANGE: The main API has been completely redesigned.',
      files: [
        {
          path: 'src/api.ts',
          content: '// New API design\nexport const newApi = () => "breaking change"\n',
        },
      ],
    },
  ],

  /**
   * Mixed commits for realistic scenarios
   */
  mixed: (): MockCommit[] => [
    {
      message: 'chore: update dependencies',
      files: [
        {
          path: 'package.json',
          content: JSON.stringify(
            {
              name: '@test/package',
              version: '1.0.0',
              dependencies: {updated: '^2.0.0'},
            },
            null,
            2,
          ),
        },
      ],
    },
    {
      message: 'docs: improve API documentation',
      files: [
        {
          path: 'docs/api.md',
          content: '# API Documentation\n\nImproved documentation.\n',
        },
      ],
    },
    {
      message: 'feat: add configuration options',
      files: [
        {
          path: 'src/config.ts',
          content: 'export interface Config { option: string }\n',
        },
      ],
    },
    {
      message: 'fix: handle edge case in parser',
      files: [
        {
          path: 'src/parser.ts',
          content: '// Fixed edge case\nexport const parse = () => "fixed"\n',
        },
      ],
    },
  ],
}
