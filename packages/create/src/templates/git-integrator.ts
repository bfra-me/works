import type {TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

/**
 * Configuration for git integration.
 */
export interface GitConfig {
  /** Whether to initialize git repository */
  initializeRepo: boolean
  /** Whether to create initial commit */
  createInitialCommit: boolean
  /** Default commit message for initial commit */
  initialCommitMessage: string
  /** Whether to add .gitignore file */
  addGitignore: boolean
  /** Whether to stage all files for initial commit */
  stageAllFiles: boolean
  /** Git user configuration */
  user?: {
    name?: string
    email?: string
  }
}

/**
 * Result of git integration.
 */
export interface GitResult {
  /** Whether git repository was initialized */
  initialized: boolean
  /** Whether initial commit was created */
  committed: boolean
  /** Whether .gitignore was added */
  gitignoreAdded: boolean
  /** Any warnings during integration */
  warnings: string[]
  /** Any errors during integration */
  errors: string[]
}

/**
 * Manages git integration for generated packages following proven patterns.
 * Handles git initialization, .gitignore creation, and initial commits.
 */
export class GitIntegrator {
  private readonly config: GitConfig

  constructor(config: Partial<GitConfig> = {}) {
    // Default configuration based on proven git patterns
    this.config = {
      initializeRepo: true,
      createInitialCommit: true,
      initialCommitMessage: 'Initial commit',
      addGitignore: true,
      stageAllFiles: true,
      user: undefined, // Use global git config
      ...config,
    }
  }

  /**
   * Integrate git with a generated package.
   *
   * @param packagePath - Path to the generated package
   * @param context - Template context used for generation
   * @param options - Integration options
   * @param options.verbose - Enable verbose logging
   * @param options.skipGit - Skip git integration entirely
   * @returns Result of git integration
   */
  async integrate(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean; skipGit?: boolean} = {},
  ): Promise<GitResult> {
    const warnings: string[] = []
    const errors: string[] = []
    let initialized = false
    let committed = false
    let gitignoreAdded = false

    try {
      if (options.skipGit) {
        if (options.verbose) {
          consola.info('Skipping git integration as requested')
        }
        return {initialized, committed, gitignoreAdded, warnings, errors}
      }

      if (options.verbose) {
        consola.info('Starting git integration...', {
          package: packagePath,
          config: this.config,
        })
      }

      // Check if git is available
      if (!(await this.isGitAvailable())) {
        warnings.push('Git is not available, skipping git integration')
        return {initialized, committed, gitignoreAdded, warnings, errors}
      }

      // Check if already in a git repository
      if (await this.isInGitRepository(packagePath)) {
        if (options.verbose) {
          consola.info('Package is already in a git repository, skipping initialization')
        }
        return {initialized: false, committed: false, gitignoreAdded: false, warnings, errors}
      }

      // Step 1: Initialize git repository
      if (this.config.initializeRepo) {
        const initResult = await this.initializeRepository(packagePath, options)
        if (initResult.success) {
          initialized = true
        } else {
          errors.push(`Git initialization failed: ${initResult.error}`)
        }
      }

      // Step 2: Add .gitignore file
      if (this.config.addGitignore && initialized) {
        const gitignoreResult = await this.addGitignore(packagePath, context, options)
        if (gitignoreResult.success) {
          gitignoreAdded = true
        } else {
          warnings.push(`Failed to add .gitignore: ${gitignoreResult.error}`)
        }
      }

      // Step 3: Create initial commit
      if (this.config.createInitialCommit && initialized) {
        const commitResult = await this.createInitialCommit(packagePath, context, options)
        if (commitResult.success) {
          committed = true
        } else {
          warnings.push(`Failed to create initial commit: ${commitResult.error}`)
        }
      }

      if (options.verbose) {
        consola.success('Git integration completed', {
          initialized,
          committed,
          gitignoreAdded,
          warnings: warnings.length,
          errors: errors.length,
        })
      }

      return {
        initialized,
        committed,
        gitignoreAdded,
        warnings,
        errors,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(`Git integration failed: ${errorMessage}`)

      return {
        initialized: false,
        committed: false,
        gitignoreAdded: false,
        warnings,
        errors,
      }
    }
  }

  /**
   * Check if git is available in the system.
   */
  private async isGitAvailable(): Promise<boolean> {
    try {
      const {execSync} = await import('node:child_process')
      execSync('git --version', {stdio: 'pipe'})
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if the package is already in a git repository.
   */
  private async isInGitRepository(packagePath: string): Promise<boolean> {
    try {
      const {execSync} = await import('node:child_process')

      // Change to package directory for checking
      const originalCwd = process.cwd()
      process.chdir(packagePath)

      try {
        execSync('git rev-parse --git-dir', {stdio: 'pipe'})
        return true
      } finally {
        // Restore original working directory
        process.chdir(originalCwd)
      }
    } catch {
      return false
    }
  }

  /**
   * Initialize git repository in the package directory.
   */
  private async initializeRepository(
    packagePath: string,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; error?: string}> {
    try {
      const {execSync} = await import('node:child_process')

      // Change to package directory for initialization
      const originalCwd = process.cwd()
      process.chdir(packagePath)

      try {
        if (options.verbose) {
          consola.start('Initializing git repository...')
        }

        execSync('git init', {
          stdio: options.verbose ? 'inherit' : 'pipe',
        })

        // Configure user if provided
        if (this.config.user?.name != null && this.config.user.name.trim() !== '') {
          execSync(`git config user.name "${this.config.user.name}"`, {
            stdio: 'pipe',
          })
        }

        if (this.config.user?.email != null && this.config.user.email.trim() !== '') {
          execSync(`git config user.email "${this.config.user.email}"`, {
            stdio: 'pipe',
          })
        }

        if (options.verbose) {
          consola.success('Git repository initialized')
        }

        return {success: true}
      } finally {
        // Restore original working directory
        process.chdir(originalCwd)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Add .gitignore file to the package.
   */
  private async addGitignore(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; error?: string}> {
    try {
      const gitignorePath = path.join(packagePath, '.gitignore')

      // Check if .gitignore already exists
      if (existsSync(gitignorePath)) {
        if (options.verbose) {
          consola.info('.gitignore already exists, skipping')
        }
        return {success: true}
      }

      // Generate .gitignore content
      const gitignoreContent = this.generateGitignoreContent(context)

      // Write .gitignore file
      await writeFile(gitignorePath, gitignoreContent, 'utf8')

      if (options.verbose) {
        consola.success('Added .gitignore file')
      }

      return {success: true}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Create initial commit with all files.
   */
  private async createInitialCommit(
    packagePath: string,
    context: TemplateContext,
    options: {verbose?: boolean},
  ): Promise<{success: boolean; error?: string}> {
    try {
      const {execSync} = await import('node:child_process')

      // Change to package directory for committing
      const originalCwd = process.cwd()
      process.chdir(packagePath)

      try {
        if (options.verbose) {
          consola.start('Creating initial commit...')
        }

        // Stage all files
        if (this.config.stageAllFiles) {
          execSync('git add .', {
            stdio: options.verbose ? 'inherit' : 'pipe',
          })
        }

        // Create commit with custom message
        const commitMessage = this.generateCommitMessage(context)
        execSync(`git commit -m "${commitMessage}"`, {
          stdio: options.verbose ? 'inherit' : 'pipe',
        })

        if (options.verbose) {
          consola.success('Initial commit created')
        }

        return {success: true}
      } finally {
        // Restore original working directory
        process.chdir(originalCwd)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {success: false, error: errorMessage}
    }
  }

  /**
   * Generate .gitignore content based on project type.
   */
  private generateGitignoreContent(context: TemplateContext): string {
    const packageManager = context.packageManager || 'npm'

    return `# Dependencies
node_modules/
jspm_packages/

# Package manager files
${packageManager === 'npm' ? 'package-lock.json' : ''}
${packageManager === 'yarn' ? 'yarn.lock' : ''}
${packageManager === 'pnpm' ? 'pnpm-lock.yaml' : ''}
${packageManager === 'bun' ? 'bun.lockb' : ''}

# Build outputs
lib/
dist/
build/
out/
coverage/
*.tsbuildinfo

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`
  }

  /**
   * Generate initial commit message.
   */
  private generateCommitMessage(context: TemplateContext): string {
    const packageName = context.projectName
    const description = context.description

    if (description != null && description.trim() !== '') {
      return `feat: add ${packageName} package

${description}

Initial implementation with:
- TypeScript support
- ESLint and Prettier configuration
- Test setup
- Build configuration
- Documentation`
    }

    return `feat: add ${packageName} package

Initial implementation with TypeScript, testing, and build configuration.`
  }

  /**
   * Check if git integration is available.
   */
  async isAvailable(): Promise<boolean> {
    return this.isGitAvailable()
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<GitConfig> {
    return {...this.config}
  }

  /**
   * Get git status for a directory.
   */
  async getStatus(packagePath: string): Promise<{
    isRepo: boolean
    hasCommits: boolean
    isDirty: boolean
    currentBranch?: string
  }> {
    try {
      const {execSync} = await import('node:child_process')

      const originalCwd = process.cwd()
      process.chdir(packagePath)

      try {
        // Check if it's a git repository
        const isRepo = await this.isInGitRepository(packagePath)
        if (!isRepo) {
          return {isRepo: false, hasCommits: false, isDirty: false}
        }

        // Check if there are any commits
        let hasCommits = false
        try {
          execSync('git rev-parse HEAD', {stdio: 'pipe'})
          hasCommits = true
        } catch {
          // No commits yet
        }

        // Check if working directory is dirty
        let isDirty = false
        try {
          const status = execSync('git status --porcelain', {encoding: 'utf8', stdio: 'pipe'})
          isDirty = status.trim().length > 0
        } catch {
          // Can't determine status
        }

        // Get current branch
        let currentBranch: string | undefined
        try {
          currentBranch = execSync('git branch --show-current', {
            encoding: 'utf8',
            stdio: 'pipe',
          }).trim()
        } catch {
          // Can't determine branch
        }

        return {
          isRepo: true,
          hasCommits,
          isDirty,
          currentBranch,
        }
      } finally {
        process.chdir(originalCwd)
      }
    } catch {
      return {isRepo: false, hasCommits: false, isDirty: false}
    }
  }
}

/**
 * Create a git integrator with default configuration.
 */
export function createGitIntegrator(config?: Partial<GitConfig>): GitIntegrator {
  return new GitIntegrator(config)
}
