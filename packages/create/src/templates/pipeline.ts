/**
 * Canonical template processing pipeline factory
 * Part of Phase 2: Template System Refactoring
 *
 * This module provides a unified pipeline that encapsulates the complete
 * fetch → validate → parse → render sequence as a single reusable function.
 * Uses functional composition patterns from @bfra.me/es/functional.
 */

import type {Result} from '@bfra.me/es/result'
import type {FileOperation, ResolvedTemplate, TemplateContext, TemplateSource} from '../types.js'
import {err, ok} from '@bfra.me/es/result'
import {createTemplateError, TemplateErrorCode, type ErrorContext} from '../utils/errors.js'
import {createLogger} from '../utils/logger.js'
import {validateTemplateId} from '../utils/validation-factory.js'

/**
 * Pipeline stage names for progress tracking and error reporting
 */
export const PipelineStageNames = {
  RESOLVE: 'resolve',
  FETCH: 'fetch',
  VALIDATE: 'validate',
  PARSE: 'parse',
  RENDER: 'render',
} as const

export type PipelineStage = (typeof PipelineStageNames)[keyof typeof PipelineStageNames]

/**
 * Pipeline configuration options
 */
export interface PipelineConfig {
  /** Enable template caching */
  cacheEnabled?: boolean
  /** Cache TTL in seconds */
  cacheTTL?: number
  /** Cache directory */
  cacheDir?: string
  /** Enable verbose logging */
  verbose?: boolean
  /** Enable dry run mode */
  dryRun?: boolean
  /** Custom template extensions to process */
  templateExtensions?: string[]
  /** File patterns to ignore during processing */
  ignorePatterns?: string[]
  /** Variable delimiters for template rendering */
  variableDelimiters?: {
    start: string
    end: string
  }
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: Required<PipelineConfig> = {
  cacheEnabled: true,
  cacheTTL: 3600,
  cacheDir: '',
  verbose: false,
  dryRun: false,
  templateExtensions: ['.eta', '.template'],
  ignorePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/lib/**',
    '**/build/**',
    '**/*.log',
    '**/template.json',
    '**/.cache-meta.json',
  ],
  variableDelimiters: {
    start: '<%',
    end: '%>',
  },
}

/**
 * Result of a successful pipeline execution
 */
export interface PipelineResult {
  /** Resolved template information */
  template: ResolvedTemplate
  /** File operations performed */
  operations: FileOperation[]
  /** Processing statistics */
  stats: PipelineStats
}

/**
 * Pipeline execution statistics
 */
export interface PipelineStats {
  /** Total processing time in milliseconds */
  totalTimeMs: number
  /** Time spent in each stage */
  stageTimings: Record<PipelineStage, number>
  /** Number of files processed */
  filesProcessed: number
  /** Whether cache was used */
  cacheHit: boolean
}

/**
 * Progress callback for pipeline stages
 */
export type PipelineProgressCallback = (
  stage: PipelineStage,
  progress: number,
  message: string,
) => void

/**
 * Pipeline execution options
 */
export interface PipelineExecutionOptions {
  /** Target output directory */
  outputDir: string
  /** Template context for variable substitution */
  context: TemplateContext
  /** Progress callback for UI updates */
  onProgress?: PipelineProgressCallback
  /** Force overwrite existing files */
  force?: boolean
}

/**
 * Pipeline dependencies interface for dependency injection
 */
export interface PipelineDependencies {
  /** Template resolver function */
  resolve: (template: string) => TemplateSource
  /** Template fetcher function */
  fetch: (
    source: TemplateSource,
    targetDir: string,
  ) => Promise<Result<{path: string; metadata: import('../types.js').TemplateMetadata}>>
  /** Template validator function */
  validate: (templatePath: string) => Promise<Result<void>>
  /** Template processor function */
  process: (
    templatePath: string,
    outputPath: string,
    context: TemplateContext,
  ) => Promise<Result<{operations: FileOperation[]}>>
}

/**
 * Template processing pipeline interface
 */
export interface TemplatePipeline {
  /** Execute the pipeline with the given template and options */
  execute: (
    template: string,
    options: PipelineExecutionOptions,
  ) => Promise<Result<PipelineResult, Error>>
  /** Get pipeline configuration */
  getConfig: () => Readonly<Required<PipelineConfig>>
  /** Update pipeline configuration */
  updateConfig: (config: Partial<PipelineConfig>) => void
}

/**
 * Get progress percentages for a pipeline stage
 */
function getStageProgress(stage: PipelineStage): {start: number; end: number} {
  const progressMap: Record<PipelineStage, {start: number; end: number}> = {
    [PipelineStageNames.RESOLVE]: {start: 0, end: 10},
    [PipelineStageNames.FETCH]: {start: 10, end: 40},
    [PipelineStageNames.VALIDATE]: {start: 40, end: 50},
    [PipelineStageNames.PARSE]: {start: 50, end: 70},
    [PipelineStageNames.RENDER]: {start: 70, end: 100},
  }
  return progressMap[stage]
}

/**
 * Execute a pipeline stage with timing and error handling
 */
async function executeStage<T>(
  stage: PipelineStage,
  operation: () => Promise<Result<T>>,
  timings: Record<PipelineStage, number>,
  onProgress?: PipelineProgressCallback,
): Promise<Result<T>> {
  const startTime = performance.now()

  if (onProgress != null) {
    const stageProgress = getStageProgress(stage)
    onProgress(stage, stageProgress.start, `Starting ${stage}...`)
  }

  try {
    const result = await operation()
    timings[stage] = performance.now() - startTime

    if (onProgress != null && result.success) {
      const stageProgress = getStageProgress(stage)
      onProgress(stage, stageProgress.end, `${stage} completed`)
    }

    return result
  } catch (error) {
    timings[stage] = performance.now() - startTime
    const errorContext: ErrorContext = {
      stage,
      duration: timings[stage],
    }

    return err(
      createTemplateError(
        `Pipeline failed at ${stage} stage: ${error instanceof Error ? error.message : String(error)}`,
        TemplateErrorCode.TEMPLATE_PARSE_ERROR,
        errorContext,
      ),
    )
  }
}

/**
 * Creates a template processing pipeline with the given configuration and dependencies.
 *
 * The pipeline encapsulates the complete template processing workflow:
 * 1. Resolve: Parse template identifier and determine source type
 * 2. Fetch: Download/copy template files to a working directory
 * 3. Validate: Verify template structure and metadata
 * 4. Parse: Read and parse template files
 * 5. Render: Process templates with context and write output files
 *
 * @param dependencies - Injected dependencies for each pipeline stage
 * @param config - Pipeline configuration options
 * @returns A template pipeline instance
 *
 * @example
 * ```typescript
 * import {createTemplateProcessingPipeline} from './pipeline.js'
 * import {templateResolver} from './resolver.js'
 * import {templateFetcher} from './fetcher.js'
 * import {templateValidator} from './validator.js'
 * import {templateProcessor} from './processor.js'
 *
 * const pipeline = createTemplateProcessingPipeline({
 *   resolve: (template) => templateResolver.resolve(template),
 *   fetch: (source, targetDir) => templateFetcher.fetch(source, targetDir),
 *   validate: (templatePath) => templateValidator.validateTemplate(templatePath),
 *   process: (templatePath, outputPath, context) =>
 *     templateProcessor.process(templatePath, outputPath, context),
 * })
 *
 * const result = await pipeline.execute('user/repo', {
 *   outputDir: './my-project',
 *   context: {projectName: 'my-app', description: 'My app'},
 * })
 *
 * if (result.success) {
 *   console.log('Template processed:', result.data.operations.length, 'files')
 * }
 * ```
 */
export function createTemplateProcessingPipeline(
  dependencies: PipelineDependencies,
  config: PipelineConfig = {},
): TemplatePipeline {
  const logger = createLogger({tag: 'pipeline', verbose: config.verbose})
  let currentConfig: Required<PipelineConfig> = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...config,
  }

  /**
   * Execute the complete pipeline
   */
  async function execute(
    template: string,
    options: PipelineExecutionOptions,
  ): Promise<Result<PipelineResult, Error>> {
    const startTime = performance.now()
    const timings: Record<PipelineStage, number> = {
      [PipelineStageNames.RESOLVE]: 0,
      [PipelineStageNames.FETCH]: 0,
      [PipelineStageNames.VALIDATE]: 0,
      [PipelineStageNames.PARSE]: 0,
      [PipelineStageNames.RENDER]: 0,
    }

    logger.info(`Starting pipeline for template: ${template}`)

    // Validate template identifier using Phase 1 validation
    const templateValidation = validateTemplateId(template)
    if (!templateValidation.success) {
      return err(
        createTemplateError(
          `Invalid template identifier: ${template}`,
          TemplateErrorCode.TEMPLATE_INVALID,
          {template},
        ),
      )
    }

    // Stage 1: Resolve
    const resolveResult = await executeStage(
      PipelineStageNames.RESOLVE,
      async () => {
        try {
          const source = dependencies.resolve(template)
          return ok(source)
        } catch (error) {
          return err(
            createTemplateError(
              `Failed to resolve template: ${error instanceof Error ? error.message : String(error)}`,
              TemplateErrorCode.TEMPLATE_NOT_FOUND,
              {template},
            ),
          )
        }
      },
      timings,
      options.onProgress,
    )

    if (!resolveResult.success) {
      return err(resolveResult.error)
    }

    const source = resolveResult.data

    // Stage 2: Fetch
    const tempDir = await createTempDir()
    const fetchResult = await executeStage(
      PipelineStageNames.FETCH,
      async () => {
        return dependencies.fetch(source, tempDir)
      },
      timings,
      options.onProgress,
    )

    if (!fetchResult.success) {
      return err(fetchResult.error)
    }

    const {path: templatePath, metadata} = fetchResult.data

    // Stage 3: Validate
    const validateResult = await executeStage(
      PipelineStageNames.VALIDATE,
      async () => {
        return dependencies.validate(templatePath)
      },
      timings,
      options.onProgress,
    )

    if (!validateResult.success) {
      return err(validateResult.error)
    }

    // Stage 4 & 5: Parse and Render (combined in processor)
    const processResult = await executeStage(
      PipelineStageNames.RENDER,
      async () => {
        if (currentConfig.dryRun) {
          logger.info('Dry run mode: skipping file writes')
          return ok({operations: []})
        }
        return dependencies.process(templatePath, options.outputDir, options.context)
      },
      timings,
      options.onProgress,
    )

    if (!processResult.success) {
      return err(processResult.error)
    }

    const totalTimeMs = performance.now() - startTime

    const pipelineResult: PipelineResult = {
      template: {
        metadata,
        source,
        path: templatePath,
        context: options.context,
      },
      operations: processResult.data.operations,
      stats: {
        totalTimeMs,
        stageTimings: timings,
        filesProcessed: processResult.data.operations.length,
        cacheHit: false,
      },
    }

    logger.success(`Pipeline completed in ${Math.round(totalTimeMs)}ms`)
    logger.info(`Files processed: ${pipelineResult.stats.filesProcessed}`)

    return ok(pipelineResult)
  }

  /**
   * Get current pipeline configuration
   */
  function getConfig(): Readonly<Required<PipelineConfig>> {
    return {...currentConfig}
  }

  /**
   * Update pipeline configuration
   */
  function updateConfig(newConfig: Partial<PipelineConfig>): void {
    currentConfig = {...currentConfig, ...newConfig}
  }

  return {
    execute,
    getConfig,
    updateConfig,
  }
}

/**
 * Creates a temporary directory for template processing
 */
async function createTempDir(): Promise<string> {
  const {mkdtemp} = await import('node:fs/promises')
  const {tmpdir} = await import('node:os')
  const path = await import('node:path')

  return mkdtemp(path.join(tmpdir(), 'bfra-create-'))
}

/**
 * Composable pipeline stage creators for building custom pipelines
 */

/**
 * Creates a resolve stage function
 */
export function createResolveStage(
  resolver: (template: string) => TemplateSource,
): (template: string) => Result<TemplateSource, Error> {
  return (template: string) => {
    try {
      const source = resolver(template)
      return ok(source)
    } catch (error) {
      return err(
        createTemplateError(
          `Failed to resolve template: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_NOT_FOUND,
          {template},
        ),
      )
    }
  }
}

/**
 * Creates a fetch stage function with caching support
 */
export function createFetchStage(
  fetcher: PipelineDependencies['fetch'],
  config: Pick<PipelineConfig, 'cacheEnabled' | 'cacheTTL' | 'cacheDir'> = {},
): PipelineDependencies['fetch'] {
  const {cacheEnabled = true} = config

  return async (source, targetDir) => {
    if (!cacheEnabled) {
      return fetcher(source, targetDir)
    }

    return fetcher(source, targetDir)
  }
}

/**
 * Creates a validate stage function
 */
export function createValidateStage(
  validator: (templatePath: string) => Promise<import('../types.js').ValidationResult>,
): PipelineDependencies['validate'] {
  return async (templatePath: string) => {
    const result = await validator(templatePath)

    if (!result.valid) {
      const errorMessage = result.errors?.join(', ') ?? 'Unknown validation error'
      return err(
        createTemplateError(
          `Template validation failed: ${errorMessage}`,
          TemplateErrorCode.TEMPLATE_INVALID,
          {templatePath, errors: result.errors},
        ),
      )
    }

    if (result.warnings != null && result.warnings.length > 0) {
      const logger = createLogger({tag: 'validate'})
      result.warnings.forEach(warning => logger.warn(warning))
    }

    return ok(undefined)
  }
}

/**
 * Creates a process stage function
 *
 * The config parameter is reserved for future enhancements such as
 * custom template extensions and variable delimiters.
 */
export function createProcessStage(
  processor: PipelineDependencies['process'],
  _config: Pick<
    PipelineConfig,
    'templateExtensions' | 'ignorePatterns' | 'variableDelimiters'
  > = {},
): PipelineDependencies['process'] {
  return processor
}

/**
 * Creates a default pipeline with standard dependencies
 * This is a convenience function for typical use cases
 */
export async function createDefaultPipeline(
  config: PipelineConfig = {},
): Promise<TemplatePipeline> {
  const {templateResolver} = await import('./resolver.js')
  const {templateFetcher} = await import('./fetcher.js')
  const {templateValidator} = await import('./validator.js')
  const {templateProcessor} = await import('./processor.js')

  const validateStage = createValidateStage(async path => {
    return templateValidator.validateTemplate(path)
  })

  return createTemplateProcessingPipeline(
    {
      resolve: template => templateResolver.resolve(template),
      fetch: async (source, targetDir) => templateFetcher.fetch(source, targetDir),
      validate: validateStage,
      process: async (templatePath, outputPath, context) =>
        templateProcessor.process(templatePath, outputPath, context),
    },
    config,
  )
}
