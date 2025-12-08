import type {
  CreateCommandOptions,
  CreateError,
  CreatePackageOptions,
  TemplateContext,
} from './types.js'
import path from 'node:path'
import process from 'node:process'
import {err, ok, type Result} from '@bfra.me/es/result'
import {consola} from 'consola'
import {ProjectAnalyzer} from './ai/project-analyzer.js'
import {projectSetup} from './prompts/project-setup.js'
import {templateFetcher} from './templates/fetcher.js'
import {templateProcessor} from './templates/processor.js'
import {templateResolver} from './templates/resolver.js'
import {getAICapabilities} from './utils/ai-capabilities.js'
import {templateInvalidError, validationFailedError} from './utils/errors.js'
import {ValidationUtils} from './utils/index.js'

/**
 * Creates a new package based on a specified template using the new architecture.
 *
 * @param options - Options for creating the package
 * @returns A Promise that resolves to a Result containing the project path or an error
 *
 * @example
 * ```typescript
 * import { isOk, unwrap } from '@bfra.me/es/result'
 *
 * // Create with specific template
 * const result = await createPackage({
 *   name: 'my-app',
 *   template: 'react',
 *   outputDir: './my-app'
 * })
 *
 * if (isOk(result)) {
 *   console.log(`Project created at: ${result.value.projectPath}`)
 * } else {
 *   console.error(`Error: ${result.error.message}`)
 * }
 *
 * // Create with interactive prompts
 * const result = await createPackage({
 *   interactive: true
 * })
 *
 * // Create from GitHub repository
 * const result = await createPackage({
 *   name: 'my-library',
 *   template: 'user/repo',
 *   outputDir: './my-library'
 * })
 * ```
 */
export async function createPackage(
  options: CreateCommandOptions,
): Promise<Result<{projectPath: string}, CreateError>> {
  const aiEnabled = options.ai === true || options.describe != null
  const aiCapabilities = getAICapabilities()

  if (options.verbose && aiEnabled) {
    consola.info('AI features:', {
      enabled: aiEnabled,
      openai: aiCapabilities.openai ? 'available' : 'not available',
      anthropic: aiCapabilities.anthropic ? 'available' : 'not available',
      fallback: aiCapabilities.enabled ? 'AI analysis enabled' : 'will use non-AI mode',
    })
  }

  const validation = ValidationUtils.validateCreateOptions(options)
  if (!validation.valid) {
    return err(
      validationFailedError(validation.errors?.join(', ') ?? 'Invalid options', validation.errors),
    )
  }

  if (validation.warnings != null && validation.warnings.length > 0) {
    for (const warning of validation.warnings) {
      consola.warn(warning)
    }
  }

  let finalOptions = {...options}
  if (options.interactive && !options.skipPrompts) {
    const setupResult = await projectSetup(options)

    finalOptions = {
      ...options,
      name: setupResult.projectName,
      template: setupResult.template.location,
      description: setupResult.customization.description,
      author: setupResult.customization.author,
      outputDir: setupResult.customization.outputDir,
      packageManager: setupResult.customization.packageManager,
      force: options.force ?? false,
    }
  }

  const projectName = finalOptions.name ?? 'new-project'
  let template = finalOptions.template ?? 'default'
  let outputDir =
    finalOptions.outputDir != null && finalOptions.outputDir.trim().length > 0
      ? path.join(finalOptions.outputDir, projectName)
      : path.join(process.cwd(), projectName)
  const author = finalOptions.author ?? 'Anonymous'
  const description = finalOptions.description ?? 'A new project'
  const version = finalOptions.version ?? '1.0.0'

  if (aiEnabled && aiCapabilities.enabled && options.describe != null) {
    try {
      const projectAnalyzer = new ProjectAnalyzer({
        enabled: true,
        provider: aiCapabilities.openai ? 'openai' : 'anthropic',
      })

      if (finalOptions.verbose) {
        consola.info('Analyzing project requirements with AI...')
      }

      const aiAnalysis = await projectAnalyzer.analyzeProject({
        description: options.describe,
        name: projectName,
        preferences: {
          packageManager: finalOptions.packageManager,
        },
      })

      if (aiAnalysis.templates.length > 0 && finalOptions.template == null) {
        const recommendedTemplate = aiAnalysis.templates[0]
        if (recommendedTemplate != null) {
          template = recommendedTemplate.source.location

          if (finalOptions.verbose) {
            consola.info('AI template recommendation:', {
              recommended: template,
              confidence: recommendedTemplate.confidence,
              reason: recommendedTemplate.reason,
            })
          }
        }
      }

      if (finalOptions.verbose && aiAnalysis.dependencies.length > 0) {
        consola.info(
          'AI dependency suggestions:',
          aiAnalysis.dependencies.map(dep => dep.name).slice(0, 5),
        )
      }
    } catch (aiError) {
      if (finalOptions.verbose) {
        consola.warn('AI analysis failed, continuing with standard mode:', aiError)
      }
    }
  }

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

  const templateSource = templateResolver.resolve(template)
  const sourceValidation = await templateResolver.validate(templateSource)

  if (!sourceValidation.valid) {
    return err(
      templateInvalidError(
        `Invalid template: ${sourceValidation.errors?.join(', ')}`,
        sourceValidation.errors?.join(', ') ?? 'validation failed',
      ),
    )
  }

  if (finalOptions.verbose) {
    consola.info('Template source resolved:', templateSource)
  }

  const fetchResult = await templateFetcher.fetch(templateSource, path.join(outputDir, '.template'))

  if (!fetchResult.success) {
    return err({
      code: 'TEMPLATE_FETCH_FAILED',
      message: fetchResult.error?.message ?? 'Failed to fetch template',
      source: templateSource.location,
      cause: fetchResult.error,
    })
  }

  const {path: templatePath, metadata} = fetchResult.data

  if (finalOptions.verbose) {
    consola.info('Template fetched:', {templatePath, metadata})
  }

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
      kebabCase: (str: string) =>
        str
          .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
          .replaceAll(/[\s_]+/g, '-')
          .toLowerCase(),
      camelCase: (str: string) =>
        str
          .replaceAll(/^\w|[A-Z]|\b\w/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase(),
          )
          .replaceAll(/\s+/g, ''),
      pascalCase: (str: string) =>
        str.replaceAll(/^\w|[A-Z]|\b\w/g, word => word.toUpperCase()).replaceAll(/\s+/g, ''),
      snakeCase: (str: string) =>
        str
          .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
          .replaceAll(/[\s-]+/g, '_')
          .toLowerCase(),
    },
  }

  const contextValidation = templateProcessor.validateContext(
    context,
    metadata.variables?.map((v: {name: string}) => v.name),
  )
  if (!contextValidation.valid) {
    consola.warn('Template context validation warnings:', contextValidation.missing)
  }

  if (finalOptions.force === true) {
    try {
      const {existsSync, readdirSync} = await import('node:fs')
      const {rm} = await import('node:fs/promises')

      if (existsSync(outputDir)) {
        const entries = readdirSync(outputDir)
        for (const entry of entries) {
          const entryPath = path.join(outputDir, entry)
          if (entry !== '.template') {
            await rm(entryPath, {recursive: true, force: true})
          }
        }
      }
    } catch (error) {
      consola.warn('Failed to clear existing directory:', error)
    }
  }

  const processResult = await templateProcessor.process(templatePath, outputDir, context)

  if (!processResult.success) {
    return err({
      code: 'TEMPLATE_RENDER_ERROR',
      message: processResult.error?.message ?? 'Failed to process template',
      file: templatePath,
      cause: processResult.error,
    })
  }

  try {
    await import('node:fs/promises').then(async fs =>
      fs.rm(path.join(outputDir, '.template'), {recursive: true, force: true}),
    )
  } catch {
    // Ignore cleanup errors - non-critical
  }

  if (finalOptions.dryRun && tempOutputDir != null) {
    try {
      await import('node:fs/promises').then(async fs =>
        fs.rm(tempOutputDir, {recursive: true, force: true}),
      )
    } catch {
      // Ignore cleanup errors - non-critical
    }
  }

  if (finalOptions.verbose) {
    consola.info(`Template processed: ${processResult.data.operations.length} operations completed`)
  }

  return ok({projectPath: outputDir})
}

export {createPackage as default}

export type {CreateCommandOptions, CreatePackageOptions, TemplateContext}

// AI Components (Phase 5 - AI-Powered Features)
// Note: Class-based AI components are maintained for backward compatibility
// Consider using createLLMClient() factory for new implementations
export {AIAssistant} from './ai/assistant.js'
export {
  CliAIIntegration,
  type AICliOptions,
  type AIEnhancementResult,
  type ProjectAnalysisInput,
} from './ai/cli-integration.js'
export {CodeAnalyzer} from './ai/code-analyzer.js'
export {CodeGenerator, type CodeGenerationResult} from './ai/code-generator.js'
export {ConfigurationOptimizer} from './ai/configuration-optimizer.js'

export {DependencyRecommender} from './ai/dependency-recommender.js'

// Functional Factories (Phase 2-4 - Recommended API)
export {createLLMClient} from './ai/llm-client-factory.js'

export {LLMClient} from './ai/llm-client.js'

export {ProjectAnalyzer} from './ai/project-analyzer.js'
export {templateFetcher, TemplateFetcher} from './templates/fetcher.js'
export {createTemplateProcessingPipeline} from './templates/pipeline.js'
export {templateProcessor} from './templates/processor.js'
export {createTemplateResolver, templateResolver} from './templates/resolver.js'
// Error handling utilities
export {
  AIErrorCode,
  CLIErrorCode,
  createAIError,
  createCLIError,
  createTemplateError,
  isBaseError,
  ProjectErrorCode,
  TemplateErrorCode,
} from './utils/errors.js'
// Type guards and branded type creators
export {
  createPackageName,
  createProjectPath,
  createTemplateSource,
  isPackageManager,
  isPackageName,
  isProjectPath,
} from './utils/type-guards.js'
// Validation utilities
export {
  validatePackageManager,
  validateProjectName,
  validateProjectPath,
  validateTemplateId,
} from './utils/validation-factory.js'
