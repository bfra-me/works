import type {CreateCommandOptions, FileOperation, Result, TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {rm} from 'node:fs/promises'
import process from 'node:process'
import {consola} from 'consola'
import {createChangesetGenerator} from './changeset-generator.js'
import {createDocumentationIntegrator} from './documentation-integrator.js'
import {createGitIntegrator} from './git-integrator.js'
import {createInstructionDisplayer} from './instruction-displayer.js'
import {TemplateProcessor} from './processor.js'
import {createWorkspaceIntegrator} from './workspace-integrator.js'

/**
 * Configuration for the package generation workflow.
 */
export interface WorkflowConfig {
  /** Enable validation after package generation */
  enableValidation: boolean
  /** Enable documentation site integration */
  enableDocumentation: boolean
  /** Enable workspace integration */
  enableWorkspaceIntegration: boolean
  /** Enable changeset generation */
  enableChangesetGeneration: boolean
  /** Enable git integration */
  enableGitIntegration: boolean
  /** Enable post-generation instructions */
  enableInstructions: boolean
  /** Enable rollback on errors */
  enableRollback: boolean
  /** Validation commands to run */
  validationCommands: string[]
  /** Output directory for generated packages */
  outputDir?: string
}

/**
 * Result of the package generation workflow.
 */
export interface WorkflowResult {
  /** Path to the generated package */
  projectPath: string
  /** Operations performed during generation */
  operations: FileOperation[]
  /** Validation results if enabled */
  validation?: {
    passed: boolean
    results: {command: string; success: boolean; output?: string}[]
  }
  /** Documentation integration results if enabled */
  documentation?: {
    mdxGenerated: boolean
    navigationUpdated: boolean
  }
  /** Workspace integration results if enabled */
  workspace?: {
    dependenciesInstalled: boolean
    pnpmWorkspaceUpdated: boolean
  }
  /** Changeset generation results if enabled */
  changeset?: {
    generated: boolean
    path?: string
  }
  /** Git integration results if enabled */
  git?: {
    initialized: boolean
    committed: boolean
  }
}

/**
 * Orchestrates the complete package generation workflow using the TemplateProcessor
 * and additional automation features.
 */
export class WorkflowManager {
  private readonly processor: TemplateProcessor
  private readonly config: WorkflowConfig

  constructor(config: Partial<WorkflowConfig> = {}) {
    this.config = {
      enableValidation: true,
      enableDocumentation: false, // Will be enabled when works template is used
      enableWorkspaceIntegration: false, // Will be enabled when works template is used
      enableChangesetGeneration: false, // Will be enabled when works template is used
      enableGitIntegration: true,
      enableInstructions: true,
      enableRollback: true,
      validationCommands: ['pnpm lint', 'pnpm type-check', 'pnpm test', 'pnpm build'],
      ...config,
    }

    this.processor = new TemplateProcessor()
  }

  /**
   * Execute the complete package generation workflow.
   *
   * @param templatePath - Path to the template directory
   * @param outputPath - Path where the package should be generated
   * @param context - Template context for variable substitution
   * @param options - Additional workflow options
   * @returns Result of the workflow execution
   */
  async execute(
    templatePath: string,
    outputPath: string,
    context: TemplateContext,
    options: CreateCommandOptions = {},
  ): Promise<Result<WorkflowResult>> {
    const startTime = Date.now()
    const rollbackOperations: (() => Promise<void>)[] = []

    try {
      if (options.verbose) {
        consola.info('Starting package generation workflow...', {
          template: templatePath,
          output: outputPath,
          config: this.config,
        })
      }

      // Step 1: Template Processing (Core functionality using TemplateProcessor)
      consola.start('Processing template...')
      const processResult = await this.processor.process(templatePath, outputPath, context)

      if (!processResult.success) {
        throw new Error(`Template processing failed: ${processResult.error.message}`)
      }

      // Add rollback for created files
      if (this.config.enableRollback) {
        rollbackOperations.push(async () => {
          if (existsSync(outputPath)) {
            await rm(outputPath, {recursive: true, force: true})
            consola.info('Rolled back: Removed generated package directory')
          }
        })
      }

      consola.success('Template processed successfully')

      const result: WorkflowResult = {
        projectPath: outputPath,
        operations: processResult.data.operations,
      }

      // Step 2: Validation Workflow (if enabled)
      if (this.config.enableValidation && !options.dryRun) {
        const validationResult = await this.runValidation(outputPath, options)
        result.validation = validationResult

        if (!validationResult.passed && this.config.enableRollback) {
          throw new Error('Validation failed. Generated package does not meet quality standards.')
        }
      }

      // Step 3: Documentation Site Integration (if enabled and works template)
      if (this.config.enableDocumentation && !options.dryRun) {
        const docResult = await this.integrateDocumentation(outputPath, context, options)
        result.documentation = docResult
      }

      // Step 4: Workspace Integration (if enabled and works template)
      if (this.config.enableWorkspaceIntegration && !options.dryRun) {
        const workspaceResult = await this.integrateWorkspace(outputPath, context, options)
        result.workspace = workspaceResult
      }

      // Step 5: Changeset Generation (if enabled and works template)
      if (this.config.enableChangesetGeneration && !options.dryRun) {
        const changesetResult = await this.generateChangeset(outputPath, context, options)
        result.changeset = changesetResult
      }

      // Step 6: Git Integration (if enabled)
      if (this.config.enableGitIntegration && !options.dryRun && options.git !== false) {
        const gitResult = await this.integrateGit(outputPath, context, options)
        result.git = gitResult
      }

      // Step 7: Post-Generation Instructions (if enabled)
      if (this.config.enableInstructions && !options.dryRun) {
        await this.displayInstructions(outputPath, context, result, options)
      }

      const duration = Date.now() - startTime
      if (options.verbose) {
        consola.success(`Workflow completed successfully in ${duration}ms`)
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      // Execute rollback operations if enabled
      if (this.config.enableRollback && rollbackOperations.length > 0) {
        consola.start('Rolling back changes...')
        for (const rollback of rollbackOperations.reverse()) {
          try {
            await rollback()
          } catch (rollbackError) {
            consola.warn('Rollback operation failed:', rollbackError)
          }
        }
        consola.success('Rollback completed')
      }

      return {
        success: false,
        error: error as Error,
      }
    }
  }

  /**
   * Run validation workflow on the generated package.
   * Uses proven lint, build, and test patterns.
   */
  private async runValidation(
    packagePath: string,
    options: CreateCommandOptions,
  ): Promise<{passed: boolean; results: {command: string; success: boolean; output?: string}[]}> {
    if (options.verbose) {
      consola.info('Running validation workflow...')
    }

    const results: {command: string; success: boolean; output?: string}[] = []
    let allPassed = true

    // Change to package directory for running commands
    const originalCwd = process.cwd()
    process.chdir(packagePath)

    try {
      for (const command of this.config.validationCommands) {
        consola.start(`Running: ${command}`)

        try {
          const {execSync} = await import('node:child_process')
          const output = execSync(command, {
            encoding: 'utf8',
            stdio: options.verbose ? 'inherit' : 'pipe',
          })

          results.push({
            command,
            success: true,
            output: typeof output === 'string' ? output : undefined,
          })

          consola.success(`✓ ${command}`)
        } catch (error) {
          allPassed = false
          const errorMessage = error instanceof Error ? error.message : String(error)

          results.push({
            command,
            success: false,
            output: errorMessage,
          })

          consola.error(`✗ ${command} failed:`, errorMessage)
        }
      }
    } finally {
      // Restore original working directory
      process.chdir(originalCwd)
    }

    if (options.verbose) {
      consola.info(
        `Validation completed: ${results.filter(r => r.success).length}/${results.length} passed`,
      )
    }

    return {
      passed: allPassed,
      results,
    }
  }

  /**
   * Integrate generated package with documentation site.
   * Implementation of TASK-042.
   */
  private async integrateDocumentation(
    packagePath: string,
    context: TemplateContext,
    options: CreateCommandOptions,
  ): Promise<{mdxGenerated: boolean; navigationUpdated: boolean}> {
    if (options.verbose) {
      consola.info('Starting documentation site integration...')
    }

    try {
      const documentationIntegrator = createDocumentationIntegrator()

      // Check if documentation integration is available
      if (!documentationIntegrator.isAvailable()) {
        if (options.verbose) {
          consola.warn('Documentation site not found, skipping documentation integration')
        }
        return {mdxGenerated: false, navigationUpdated: false}
      }

      // Perform documentation integration
      const result = await documentationIntegrator.integrate(packagePath, context, {
        verbose: options.verbose,
      })

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          consola.warn('Documentation integration warning:', warning)
        }
      }

      if (options.verbose) {
        consola.success('Documentation integration completed', {
          mdxGenerated: result.mdxGenerated,
          navigationUpdated: result.navigationUpdated,
        })
      }

      return {
        mdxGenerated: result.mdxGenerated,
        navigationUpdated: result.navigationUpdated,
      }
    } catch (error) {
      if (options.verbose) {
        consola.error('Documentation integration failed:', error)
      }
      return {mdxGenerated: false, navigationUpdated: false}
    }
  }

  /**
   * Integrate generated package with workspace.
   * Implementation of TASK-043.
   */
  private async integrateWorkspace(
    packagePath: string,
    context: TemplateContext,
    options: CreateCommandOptions,
  ): Promise<{dependenciesInstalled: boolean; pnpmWorkspaceUpdated: boolean}> {
    if (options.verbose) {
      consola.info('Starting workspace integration...')
    }

    try {
      const workspaceIntegrator = createWorkspaceIntegrator({
        packageManager: context.packageManager || 'pnpm',
        autoInstall: options.install !== false,
      })

      // Check if workspace integration is available
      if (!workspaceIntegrator.isAvailable()) {
        if (options.verbose) {
          consola.warn('Not in a workspace environment, skipping workspace integration')
        }
        return {dependenciesInstalled: false, pnpmWorkspaceUpdated: false}
      }

      // Perform workspace integration
      const result = await workspaceIntegrator.integrate(packagePath, context, {
        verbose: options.verbose,
        skipInstall: options.install === false,
      })

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          consola.warn('Workspace integration warning:', warning)
        }
      }

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          consola.error('Workspace integration error:', error)
        }
      }

      if (options.verbose) {
        consola.success('Workspace integration completed', {
          dependenciesInstalled: result.dependenciesInstalled,
          pnpmWorkspaceUpdated: result.pnpmWorkspaceUpdated,
          packageJsonUpdated: result.packageJsonUpdated,
        })
      }

      return {
        dependenciesInstalled: result.dependenciesInstalled,
        pnpmWorkspaceUpdated: result.pnpmWorkspaceUpdated,
      }
    } catch (error) {
      if (options.verbose) {
        consola.error('Workspace integration failed:', error)
      }
      return {dependenciesInstalled: false, pnpmWorkspaceUpdated: false}
    }
  }

  /**
   * Generate changeset for the new package.
   * Implementation of TASK-045.
   */
  private async generateChangeset(
    packagePath: string,
    context: TemplateContext,
    options: CreateCommandOptions,
  ): Promise<{generated: boolean; path?: string}> {
    if (options.verbose) {
      consola.info('Starting changeset generation...')
    }

    try {
      const changesetGenerator = createChangesetGenerator({
        defaultType: 'minor', // New packages are typically minor releases
      })

      // Check if changeset generation is available
      if (!changesetGenerator.isAvailable()) {
        if (options.verbose) {
          consola.warn('Changeset directory not found, skipping changeset generation')
        }
        return {generated: false}
      }

      // Generate changeset
      const result = await changesetGenerator.generate(packagePath, context, {
        verbose: options.verbose,
        description: `Add ${context.projectName} package\n\n${context.description}`,
      })

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          consola.warn('Changeset generation warning:', warning)
        }
      }

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          consola.error('Changeset generation error:', error)
        }
      }

      if (options.verbose && result.generated) {
        consola.success('Changeset generated successfully', {
          path: result.path,
        })
      }

      return {
        generated: result.generated,
        path: result.path,
      }
    } catch (error) {
      if (options.verbose) {
        consola.error('Changeset generation failed:', error)
      }
      return {generated: false}
    }
  }

  /**
  /**
   * Initialize git repository and create initial commit.
   * Implementation of TASK-046.
   */
  private async integrateGit(
    packagePath: string,
    context: TemplateContext,
    options: CreateCommandOptions,
  ): Promise<{initialized: boolean; committed: boolean}> {
    if (options.verbose) {
      consola.info('Starting git integration...')
    }

    try {
      const gitIntegrator = createGitIntegrator({
        initializeRepo: true,
        createInitialCommit: true,
        addGitignore: true,
        stageAllFiles: true,
      })

      // Check if git integration is available
      if (!(await gitIntegrator.isAvailable())) {
        if (options.verbose) {
          consola.warn('Git is not available, skipping git integration')
        }
        return {initialized: false, committed: false}
      }

      // Perform git integration
      const result = await gitIntegrator.integrate(packagePath, context, {
        verbose: options.verbose,
        skipGit: options.git === false,
      })

      if (result.warnings.length > 0) {
        for (const warning of result.warnings) {
          consola.warn('Git integration warning:', warning)
        }
      }

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          consola.error('Git integration error:', error)
        }
      }

      if (options.verbose) {
        consola.success('Git integration completed', {
          initialized: result.initialized,
          committed: result.committed,
          gitignoreAdded: result.gitignoreAdded,
        })
      }

      return {
        initialized: result.initialized,
        committed: result.committed,
      }
    } catch (error) {
      if (options.verbose) {
        consola.error('Git integration failed:', error)
      }
      return {initialized: false, committed: false}
    }
  }

  /**
   * Configure workflow for works package template.
   * Enables all automation features when generating monorepo packages.
   */
  configureForWorksTemplate(): void {
    this.config.enableDocumentation = true
    this.config.enableWorkspaceIntegration = true
    this.config.enableChangesetGeneration = true
    this.config.enableGitIntegration = true
  }

  /**
   * Display post-generation instructions to the user.
   * Uses proven user feedback patterns for guidance.
   */
  private async displayInstructions(
    packagePath: string,
    context: TemplateContext,
    workflowResult: WorkflowResult,
    options: CreateCommandOptions,
  ): Promise<void> {
    if (options.verbose) {
      consola.info('Displaying post-generation instructions...')
    }

    try {
      const displayer = createInstructionDisplayer({
        showUsage: true,
        showDevelopment: true,
        showWorkspace: Boolean(workflowResult.workspace),
        showGit: Boolean(workflowResult.git),
        showPackageSpecific: true,
      })

      await displayer.display(packagePath, context, workflowResult, {
        verbose: options.verbose,
      })
    } catch (error) {
      if (options.verbose) {
        consola.warn('Failed to display instructions:', error)
      }
      // Don't fail the workflow for instruction display issues
    }
  }

  /**
   * Get current workflow configuration.
   */
  getConfig(): Readonly<WorkflowConfig> {
    return {...this.config}
  }
}

/**
 * Create a workflow manager with default configuration.
 */
export function createWorkflowManager(config?: Partial<WorkflowConfig>): WorkflowManager {
  return new WorkflowManager(config)
}
