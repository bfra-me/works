import type {Result} from '@bfra.me/es/result'
import type {FileOperation, TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {err, ok} from '@bfra.me/es/result'
import {consola} from 'consola'
import {Eta} from 'eta'
import {glob} from 'glob'
import {createTemplateError, TemplateErrorCode} from '../utils/errors.js'
import {createLogger} from '../utils/logger.js'

/**
 * Template processor configuration.
 */
export interface ProcessorConfig {
  /** File patterns to process for templating */
  templatePatterns: string[]
  /** File patterns to ignore during processing */
  ignorePatterns: string[]
  /** Template file extensions */
  templateExtensions: string[]
  /** Variables start delimiter */
  variableStart: string
  /** Variables end delimiter */
  variableEnd: string
  /** Enable file renaming based on context */
  enableFileRenaming: boolean
}

/**
 * Template processor using Eta for variable substitution and file processing.
 */
export class TemplateProcessor {
  private readonly eta: Eta
  private readonly config: ProcessorConfig

  constructor(config?: Partial<ProcessorConfig>) {
    this.config = {
      templatePatterns: ['**/*'],
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
      templateExtensions: ['.eta', '.template'],
      variableStart: '<%',
      variableEnd: '%>',
      enableFileRenaming: true,
      ...config,
    }

    // Initialize Eta template engine
    this.eta = new Eta({
      tags: [this.config.variableStart, this.config.variableEnd],
      autoEscape: false,
      rmWhitespace: false,
    })
  }

  /**
   * Process a template directory with the given context.
   *
   * @param templatePath - Path to the template directory
   * @param outputPath - Path where processed template should be written
   * @param context - Template context for variable substitution
   * @returns Result with processing operations performed
   *
   * @example
   * ```typescript
   * const processor = new TemplateProcessor()
   * const context = {
   *   projectName: 'my-app',
   *   description: 'My awesome application',
   *   author: 'John Doe',
   *   packageManager: 'pnpm' as const
   * }
   *
   * const result = await processor.process('./template', './output', context)
   * if (result.success) {
   *   console.log('Template processed successfully')
   *   console.log('Operations:', result.data.operations)
   * }
   * ```
   */
  async process(
    templatePath: string,
    outputPath: string,
    context: TemplateContext,
  ): Promise<Result<{operations: FileOperation[]}>> {
    try {
      if (!existsSync(templatePath)) {
        throw new Error(`Template directory does not exist: ${templatePath}`)
      }

      const operations: FileOperation[] = []

      // Find all files to process
      const files = await this.findTemplateFiles(templatePath)
      consola.info(`Processing ${files.length} template files`)

      // Ensure output directory exists
      await mkdir(outputPath, {recursive: true})

      // Process each file
      for (const file of files) {
        const relativePath = path.relative(templatePath, file)
        const operation = await this.processFile(
          file,
          templatePath,
          outputPath,
          relativePath,
          context,
        )
        operations.push(operation)
      }

      consola.success(`Template processed successfully: ${operations.length} operations`)

      return {
        success: true,
        data: {operations},
      }
    } catch (error) {
      consola.error('Failed to process template:', error)
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  /**
   * Process template content with variable substitution.
   *
   * @param content - Template content to process
   * @param context - Template context for variable substitution
   * @returns Processed content
   */
  async processContent(content: string, context: TemplateContext): Promise<string> {
    try {
      return this.eta.renderString(content, this.buildEtaContext(context))
    } catch (error) {
      consola.warn('Failed to process template content:', error)
      return content
    }
  }

  /**
   * Process a filename with variable substitution.
   *
   * @param filename - Filename to process
   * @param context - Template context for variable substitution
   * @returns Processed filename
   */
  async processFilename(filename: string, context: TemplateContext): Promise<string> {
    if (!this.config.enableFileRenaming) {
      return filename
    }

    try {
      return this.eta.renderString(filename, this.buildEtaContext(context))
    } catch (error) {
      consola.warn('Failed to process filename:', filename, error)
      return filename
    }
  }

  /**
   * Validate template context against template requirements.
   *
   * @param context - Template context to validate
   * @param requiredVariables - Required variables for the template
   * @returns Validation result
   */
  validateContext(
    context: TemplateContext,
    requiredVariables?: string[],
  ): {
    valid: boolean
    missing: string[]
  } {
    const missing: string[] = []

    if (!requiredVariables) {
      return {valid: true, missing}
    }

    for (const variable of requiredVariables) {
      if (!(variable in context) && !(variable in (context.variables ?? {}))) {
        missing.push(variable)
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    }
  }

  /**
   * Find all template files to process.
   */
  private async findTemplateFiles(templatePath: string): Promise<string[]> {
    const allFiles: string[] = []

    for (const pattern of this.config.templatePatterns) {
      const files = await glob(pattern, {
        cwd: templatePath,
        absolute: true,
        nodir: true,
        ignore: this.config.ignorePatterns,
      })
      allFiles.push(...files)
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort()
  }

  /**
   * Process a single file.
   */
  private async processFile(
    filePath: string,
    templatePath: string,
    outputPath: string,
    relativePath: string,
    context: TemplateContext,
  ): Promise<FileOperation> {
    const stats = await stat(filePath)

    if (!stats.isFile()) {
      throw new Error(`Expected file, got directory: ${filePath}`)
    }

    // Process filename for variable substitution
    let targetRelativePath = relativePath
    if (this.config.enableFileRenaming) {
      targetRelativePath = await this.processFilename(relativePath, context)
    }

    // Remove template extensions
    for (const ext of this.config.templateExtensions) {
      if (targetRelativePath.endsWith(ext)) {
        targetRelativePath = targetRelativePath.slice(0, -ext.length)
        break
      }
    }

    const targetPath = path.join(outputPath, targetRelativePath)

    // Ensure target directory exists
    await mkdir(path.dirname(targetPath), {recursive: true})

    // Read file content
    const content = await readFile(filePath, 'utf-8')

    // Process content based on file type
    let processedContent: string

    if (this.isTextFile(filePath) && this.shouldProcessContent(filePath)) {
      // Process text files with template substitution
      processedContent = await this.processContent(content, context)
    } else {
      // Binary files or files that shouldn't be processed
      processedContent = content
    }

    // Write processed file
    await writeFile(targetPath, processedContent, 'utf-8')

    return {
      type: 'create',
      source: path.relative(templatePath, filePath),
      target: targetRelativePath,
      content: processedContent,
    }
  }

  /**
   * Check if a file is a text file that should be processed.
   */
  private isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.txt',
      '.md',
      '.json',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.css',
      '.scss',
      '.sass',
      '.less',
      '.html',
      '.xml',
      '.yml',
      '.yaml',
      '.toml',
      '.ini',
      '.sh',
      '.bash',
      '.zsh',
      '.fish',
      '.py',
      '.rb',
      '.php',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.hpp',
      '.cs',
      '.go',
      '.rs',
      '.kt',
      '.swift',
      '.dart',
      '.vue',
      '.svelte',
      '.astro',
      '.eta',
      '.template',
      '.gitignore',
      '.npmignore',
      '.eslintrc',
      '.prettierrc',
    ]

    const ext = path.extname(filePath).toLowerCase()
    const basename = path.basename(filePath)

    // Check extension
    if (textExtensions.includes(ext)) {
      return true
    }

    // Check common config files without extensions
    const configFiles = [
      'dockerfile',
      'makefile',
      'rakefile',
      'gemfile',
      'procfile',
      '.env',
      '.env.example',
      '.env.local',
      '.env.production',
      '.env.development',
    ]

    return configFiles.some(name => basename.toLowerCase().includes(name))
  }

  /**
   * Check if file content should be processed for template substitution.
   */
  private shouldProcessContent(filePath: string): boolean {
    // Don't process binary files
    if (!this.isTextFile(filePath)) {
      return false
    }

    // Always process template files
    for (const ext of this.config.templateExtensions) {
      if (filePath.endsWith(ext)) {
        return true
      }
    }

    // Process common text files
    return true
  }

  /**
   * Build Eta template context with helper functions.
   */
  private buildEtaContext(context: TemplateContext): Record<string, unknown> {
    return {
      // Template context
      ...context,
      ...context.variables,

      // Helper functions
      helpers: {
        /**
         * Convert string to kebab-case
         */
        kebabCase: (str: string) =>
          str
            .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
            .replaceAll(/[\s_]+/g, '-')
            .toLowerCase(),

        /**
         * Convert string to camelCase
         */
        camelCase: (str: string) =>
          str
            .replaceAll(/^\w|[A-Z]|\b\w/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase(),
            )
            .replaceAll(/\s+/g, ''),

        /**
         * Convert string to PascalCase
         */
        pascalCase: (str: string) =>
          str.replaceAll(/^\w|[A-Z]|\b\w/g, word => word.toUpperCase()).replaceAll(/\s+/g, ''),

        /**
         * Convert string to snake_case
         */
        snakeCase: (str: string) =>
          str
            .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
            .replaceAll(/[\s-]+/g, '_')
            .toLowerCase(),

        /**
         * Convert string to SCREAMING_SNAKE_CASE
         */
        screamingSnakeCase: (str: string) =>
          str
            .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
            .replaceAll(/[\s-]+/g, '_')
            .toUpperCase(),

        /**
         * Get current year
         */
        currentYear: () => new Date().getFullYear(),

        /**
         * Get current date in ISO format
         */
        currentDate: () => new Date().toISOString().split('T')[0],

        /**
         * Conditional helper
         */
        if: (condition: unknown, truthy: unknown, falsy: unknown = '') =>
          condition !== null &&
          condition !== undefined &&
          condition !== false &&
          condition !== 0 &&
          condition !== ''
            ? truthy
            : falsy,

        /**
         * JSON stringify helper
         */
        json: (obj: unknown, indent = 2) => JSON.stringify(obj, null, indent),
      },
    }
  }
}

/**
 * Default template processor instance.
 * @deprecated Use createTemplateProcessor() factory function instead
 */
export const templateProcessor = new TemplateProcessor()

/**
 * Template processor interface for the functional factory
 */
export interface TemplateProcessorInterface {
  /** Process a template directory with the given context */
  process: (
    templatePath: string,
    outputPath: string,
    context: TemplateContext,
  ) => Promise<Result<{operations: FileOperation[]}>>
  /** Process template content with variable substitution */
  processContent: (content: string, context: TemplateContext) => Promise<string>
  /** Process a filename with variable substitution */
  processFilename: (filename: string, context: TemplateContext) => Promise<string>
  /** Validate template context against template requirements */
  validateContext: (
    context: TemplateContext,
    requiredVariables?: string[],
  ) => {valid: boolean; missing: string[]}
  /** Get current processor configuration */
  getConfig: () => Readonly<ProcessorConfig>
  /** Update processor configuration */
  updateConfig: (config: Partial<ProcessorConfig>) => void
}

/**
 * Creates a template processor with the given configuration.
 *
 * This functional factory provides pure processing functions for template
 * transformation. It encapsulates Eta template rendering with configurable
 * delimiters and helper functions.
 *
 * @param config - Processor configuration options
 * @returns A template processor instance
 *
 * @example
 * ```typescript
 * const processor = createTemplateProcessor({
 *   templateExtensions: ['.eta', '.template', '.tpl'],
 *   variableStart: '{{',
 *   variableEnd: '}}',
 * })
 *
 * const result = await processor.process(
 *   './template',
 *   './output',
 *   {projectName: 'my-app'}
 * )
 *
 * if (result.success) {
 *   console.log(`Processed ${result.data.operations.length} files`)
 * }
 * ```
 */

/**
 * Build Eta template context with helper functions.
 */
function buildEtaContext(context: TemplateContext): Record<string, unknown> {
  return {
    ...context,
    ...context.variables,
    helpers: {
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
      screamingSnakeCase: (str: string) =>
        str
          .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
          .replaceAll(/[\s-]+/g, '_')
          .toUpperCase(),
      currentYear: () => new Date().getFullYear(),
      currentDate: () => new Date().toISOString().split('T')[0],
      if: (condition: unknown, truthy: unknown, falsy: unknown = '') =>
        condition !== null &&
        condition !== undefined &&
        condition !== false &&
        condition !== 0 &&
        condition !== ''
          ? truthy
          : falsy,
      json: (obj: unknown, indent = 2) => JSON.stringify(obj, null, indent),
    },
  }
}

/**
 * Validate template context against template requirements.
 */
function validateProcessorContext(
  context: TemplateContext,
  requiredVariables?: string[],
): {valid: boolean; missing: string[]} {
  const missing: string[] = []

  if (requiredVariables == null) {
    return {valid: true, missing}
  }

  for (const variable of requiredVariables) {
    if (!(variable in context) && !(variable in (context.variables ?? {}))) {
      missing.push(variable)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

export function createTemplateProcessor(
  config?: Partial<ProcessorConfig>,
): TemplateProcessorInterface {
  const logger = createLogger({tag: 'processor'})

  let currentConfig: ProcessorConfig = {
    templatePatterns: ['**/*'],
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
    templateExtensions: ['.eta', '.template'],
    variableStart: '<%',
    variableEnd: '%>',
    enableFileRenaming: true,
    ...config,
  }

  const eta = new Eta({
    tags: [currentConfig.variableStart, currentConfig.variableEnd],
    autoEscape: false,
    rmWhitespace: false,
  })

  /**
   * Text file extensions for template processing
   */
  const textExtensions = [
    '.txt',
    '.md',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.html',
    '.xml',
    '.yml',
    '.yaml',
    '.toml',
    '.ini',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.py',
    '.rb',
    '.php',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.go',
    '.rs',
    '.kt',
    '.swift',
    '.dart',
    '.vue',
    '.svelte',
    '.astro',
    '.eta',
    '.template',
    '.gitignore',
    '.npmignore',
    '.eslintrc',
    '.prettierrc',
  ]

  /**
   * Config file names without extensions
   */
  const configFiles = [
    'dockerfile',
    'makefile',
    'rakefile',
    'gemfile',
    'procfile',
    '.env',
    '.env.example',
    '.env.local',
    '.env.production',
    '.env.development',
  ]

  /**
   * Check if a file is a text file that should be processed.
   */
  function isTextFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    const basename = path.basename(filePath)

    if (textExtensions.includes(ext)) {
      return true
    }

    return configFiles.some(name => basename.toLowerCase().includes(name))
  }

  /**
   * Check if file content should be processed for template substitution.
   */
  function shouldProcessContent(filePath: string): boolean {
    if (!isTextFile(filePath)) {
      return false
    }

    for (const ext of currentConfig.templateExtensions) {
      if (filePath.endsWith(ext)) {
        return true
      }
    }

    return true
  }

  /**
   * Find all template files to process.
   */
  async function findTemplateFiles(templatePath: string): Promise<string[]> {
    const allFiles: string[] = []

    for (const pattern of currentConfig.templatePatterns) {
      const files = await glob(pattern, {
        cwd: templatePath,
        absolute: true,
        nodir: true,
        ignore: currentConfig.ignorePatterns,
      })
      allFiles.push(...files)
    }

    return [...new Set(allFiles)].sort()
  }

  /**
   * Process a single file.
   */
  async function processFile(
    filePath: string,
    templatePath: string,
    outputPath: string,
    relativePath: string,
    context: TemplateContext,
  ): Promise<FileOperation> {
    const stats = await stat(filePath)

    if (!stats.isFile()) {
      throw new Error(`Expected file, got directory: ${filePath}`)
    }

    let targetRelativePath = relativePath
    if (currentConfig.enableFileRenaming) {
      targetRelativePath = await processFilename(relativePath, context)
    }

    for (const ext of currentConfig.templateExtensions) {
      if (targetRelativePath.endsWith(ext)) {
        targetRelativePath = targetRelativePath.slice(0, -ext.length)
        break
      }
    }

    const targetPath = path.join(outputPath, targetRelativePath)
    await mkdir(path.dirname(targetPath), {recursive: true})

    const content = await readFile(filePath, 'utf-8')
    let processedContent: string

    if (isTextFile(filePath) && shouldProcessContent(filePath)) {
      processedContent = await processContent(content, context)
    } else {
      processedContent = content
    }

    await writeFile(targetPath, processedContent, 'utf-8')

    return {
      type: 'create',
      source: path.relative(templatePath, filePath),
      target: targetRelativePath,
      content: processedContent,
    }
  }

  /**
   * Process a template directory with the given context.
   */
  async function process(
    templatePath: string,
    outputPath: string,
    context: TemplateContext,
  ): Promise<Result<{operations: FileOperation[]}>> {
    try {
      if (!existsSync(templatePath)) {
        return err(
          createTemplateError(
            `Template directory does not exist: ${templatePath}`,
            TemplateErrorCode.TEMPLATE_NOT_FOUND,
            {templatePath},
          ),
        )
      }

      const operations: FileOperation[] = []
      const files = await findTemplateFiles(templatePath)
      logger.info(`Processing ${files.length} template files`)

      await mkdir(outputPath, {recursive: true})

      for (const file of files) {
        const relativePath = path.relative(templatePath, file)
        const operation = await processFile(file, templatePath, outputPath, relativePath, context)
        operations.push(operation)
      }

      logger.success(`Template processed successfully: ${operations.length} operations`)

      return ok({operations})
    } catch (error) {
      logger.error('Failed to process template:', error)
      return err(
        createTemplateError(
          `Template processing failed: ${error instanceof Error ? error.message : String(error)}`,
          TemplateErrorCode.TEMPLATE_RENDER_ERROR,
          {templatePath, outputPath},
        ),
      )
    }
  }

  /**
   * Process template content with variable substitution.
   */
  async function processContent(content: string, context: TemplateContext): Promise<string> {
    try {
      return eta.renderString(content, buildEtaContext(context))
    } catch (error) {
      consola.warn('Failed to process template content:', error)
      return content
    }
  }

  /**
   * Process a filename with variable substitution.
   */
  async function processFilename(filename: string, context: TemplateContext): Promise<string> {
    if (!currentConfig.enableFileRenaming) {
      return filename
    }

    try {
      return eta.renderString(filename, buildEtaContext(context))
    } catch (error) {
      consola.warn('Failed to process filename:', filename, error)
      return filename
    }
  }

  /**
   * Get current processor configuration.
   */
  function getConfig(): Readonly<ProcessorConfig> {
    return {...currentConfig}
  }

  /**
   * Update processor configuration.
   */
  function updateConfig(newConfig: Partial<ProcessorConfig>): void {
    currentConfig = {...currentConfig, ...newConfig}
  }

  return {
    process,
    processContent,
    processFilename,
    validateContext: validateProcessorContext,
    getConfig,
    updateConfig,
  }
}

/**
 * Default functional template processor instance.
 */
export const functionalTemplateProcessor = createTemplateProcessor()
