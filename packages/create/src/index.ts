import type {CreateCommandOptions, CreatePackageOptions, Result, TemplateContext} from './types.js'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'
import {projectSetup} from './prompts/project-setup.js'
import {templateFetcher} from './templates/fetcher.js'
import {templateProcessor} from './templates/processor.js'
import {templateResolver} from './templates/resolver.js'
import {ValidationUtils} from './utils/index.js'

/**
 * Creates a new package based on a specified template using the new architecture.
 *
 * @param options - Options for creating the package
 * @returns A Promise that resolves when the package has been created
 *
 * @example
 * ```typescript
 * // Create with specific template
 * await createPackage({
 *   name: 'my-app',
 *   template: 'react',
 *   outputDir: './my-app'
 * })
 *
 * // Create with interactive prompts
 * await createPackage({
 *   interactive: true
 * })
 *
 * // Create from GitHub repository
 * await createPackage({
 *   name: 'my-library',
 *   template: 'user/repo',
 *   outputDir: './my-library'
 * })
 * ```
 */
export async function createPackage(
  options: CreateCommandOptions,
): Promise<Result<{projectPath: string}>> {
  try {
    // Validation
    const validation = ValidationUtils.validateCreateOptions(options)
    if (!validation.valid) {
      const errorMessage = validation.errors?.join(', ') ?? 'Invalid options'
      throw new Error(errorMessage)
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        consola.warn(warning)
      }
    }

    // Interactive mode - Use sophisticated prompts for enhanced UX
    let finalOptions = {...options}
    if (options.interactive && !options.skipPrompts) {
      const setupResult = await projectSetup(options)

      // Extract the finalized options from the setup result
      finalOptions = {
        ...options,
        name: setupResult.projectName,
        template: setupResult.template.location,
        description: setupResult.customization.description,
        author: setupResult.customization.author,
        outputDir: setupResult.customization.outputDir,
        packageManager: setupResult.customization.packageManager,
        force: options.force || false, // Use original option or default to false
      }
    }

    // Set defaults
    const projectName = finalOptions.name ?? 'new-project'
    const template = finalOptions.template ?? 'default'
    let outputDir = finalOptions.outputDir ?? path.join(process.cwd(), projectName)
    const author = finalOptions.author ?? 'Anonymous'
    const description = finalOptions.description ?? 'A new project'
    const version = finalOptions.version ?? '1.0.0'

    // If dryRun is requested, use a temporary directory to avoid writing to the repo
    let tempOutputDir: string | undefined
    if (finalOptions.dryRun) {
      const {mkdtemp} = await import('node:fs/promises')
      const {tmpdir} = await import('node:os')
      tempOutputDir = await mkdtemp(path.join(tmpdir(), 'bfra-me-create-'))
      outputDir = tempOutputDir
    }

    if (finalOptions.verbose) {
      consola.info('Creating project with options:', {
        projectName,
        template,
        outputDir,
        author,
        description,
        version,
        dryRun: Boolean(finalOptions.dryRun),
      })
    }

    // Resolve template source
    const templateSource = templateResolver.resolve(template)
    const sourceValidation = await templateResolver.validate(templateSource)

    if (!sourceValidation.valid) {
      throw new Error(`Invalid template: ${sourceValidation.errors?.join(', ')}`)
    }

    if (finalOptions.verbose) {
      consola.info('Template source resolved:', templateSource)
    }

    // Fetch template
    const fetchResult = await templateFetcher.fetch(
      templateSource,
      path.join(outputDir, '.template'),
    )

    if (!fetchResult.success) {
      throw fetchResult.error
    }

    const {path: templatePath, metadata} = fetchResult.data

    if (finalOptions.verbose) {
      consola.info('Template fetched:', {templatePath, metadata})
    }

    // Build template context
    const context: TemplateContext = {
      projectName,
      description,
      author,
      version,
      packageManager: finalOptions.packageManager || 'npm',
      variables: {
        name: projectName,
        description,
        author,
        version,
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0],
      },
    }

    // Validate template context
    const contextValidation = templateProcessor.validateContext(
      context,
      metadata.variables?.map(v => v.name),
    )
    if (!contextValidation.valid) {
      consola.warn('Template context validation warnings:', contextValidation.missing)
    }

    // Process template
    const processResult = await templateProcessor.process(templatePath, outputDir, context)

    if (!processResult.success) {
      throw processResult.error
    }

    // Cleanup temporary template files
    try {
      await import('node:fs/promises').then(async fs =>
        fs.rm(path.join(outputDir, '.template'), {recursive: true, force: true}),
      )
    } catch {
      // Ignore cleanup errors
    }

    // If this was a dry run, remove the temporary output directory so nothing is left behind
    if (finalOptions.dryRun && tempOutputDir != null) {
      try {
        await import('node:fs/promises').then(async fs =>
          fs.rm(tempOutputDir, {recursive: true, force: true}),
        )
      } catch {
        // Ignore cleanup errors
      }
    }

    if (finalOptions.verbose) {
      consola.info(
        `Template processed: ${processResult.data.operations.length} operations completed`,
      )
    }

    return {
      success: true,
      data: {projectPath: outputDir},
    }
  } catch (error) {
    consola.error('Failed to create package:', error)
    return {
      success: false,
      error: error as Error,
    }
  }
}

// Export legacy interface for backward compatibility
export {createPackage as default}

// Re-export types
export type {CreateCommandOptions, CreatePackageOptions, TemplateContext}

// AI Components (Phase 5 - AI-Powered Features)
export {
  CliAIIntegration,
  type AICliOptions,
  type AIEnhancementResult,
  type ProjectAnalysisInput,
} from './ai/cli-integration.js'
export {CodeGenerator, type CodeGenerationResult} from './ai/code-generator.js'
export {DependencyRecommender} from './ai/dependency-recommender.js'
export {LLMClient} from './ai/llm-client.js'
export {ProjectAnalyzer} from './ai/project-analyzer.js'
