import type {Result} from '@bfra.me/es/result'
import type {BrandedTemplateSource, TemplateSource, ValidationResult} from '../types.js'
import {existsSync, readdirSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {err, ok} from '@bfra.me/es/result'
import {createTemplateError, TemplateErrorCode} from '../utils/errors.js'
import {createTemplateSource} from '../utils/type-guards.js'
import {validateTemplateId} from '../utils/validation-factory.js'

/**
 * Resolver configuration options
 */
export interface ResolverConfig {
  /** Custom builtin templates directory */
  builtinTemplatesDir?: string
  /** Enable strict validation mode */
  strictMode?: boolean
}

/**
 * Template resolver interface for the functional factory
 */
export interface TemplateResolverInterface {
  /** Resolve a template string to a structured TemplateSource */
  resolve: (template: string) => TemplateSource
  /** Resolve a template with Result-based error handling */
  resolveWithResult: (template: string) => Result<TemplateSource, Error>
  /** Validate a template source */
  validate: (source: TemplateSource) => Promise<ValidationResult>
  /** Validate a template source with Result-based error handling */
  validateWithResult: (source: TemplateSource) => Promise<Result<void, Error>>
  /** Get the list of available built-in templates */
  getBuiltinTemplates: () => string[]
  /** Get the full path to a built-in template */
  getBuiltinTemplatePath: (templateName: string) => string
  /** Normalize a template source for consistent handling */
  normalize: (source: TemplateSource) => TemplateSource
  /** Create a branded template source */
  createBrandedSource: (template: string) => BrandedTemplateSource
}

/**
 * Creates a template resolver with the given configuration.
 *
 * This functional factory replaces the class-based TemplateResolver while
 * maintaining the same API. Uses Phase 1 validation utilities for consistent
 * error handling and branded types for type safety.
 *
 * @param config - Resolver configuration options
 * @returns A template resolver instance
 *
 * @example
 * ```typescript
 * const resolver = createTemplateResolver()
 *
 * // Basic resolution
 * const source = resolver.resolve('user/repo')
 * // { type: 'github', location: 'user/repo' }
 *
 * // With Result-based error handling
 * const result = resolver.resolveWithResult('user/repo')
 * if (result.success) {
 *   console.log('Resolved:', result.data)
 * }
 *
 * // Validation
 * const validation = await resolver.validate(source)
 * if (!validation.valid) {
 *   console.error('Errors:', validation.errors)
 * }
 * ```
 */

/**
 * Check if a string is a GitHub repository shorthand (user/repo).
 */
function isGitHubShorthand(template: string): boolean {
  return (
    template.includes('/') &&
    !template.includes('://') &&
    !template.startsWith('./') &&
    !template.startsWith('../') &&
    !template.startsWith('/') &&
    !template.includes('.')
  )
}

/**
 * Check if a string is a valid URL.
 */
function isResolverUrl(template: string): boolean {
  return URL.canParse(template)
}

/**
 * Check if a string is a local path.
 */
function isLocalPath(template: string): boolean {
  return (
    template.startsWith('./') ||
    template.startsWith('../') ||
    template.startsWith('/') ||
    path.isAbsolute(template)
  )
}

/**
 * Check if a string is a valid GitHub repository format.
 */
function isValidGitHubRepo(repo: string): boolean {
  const parts = repo.split('/')
  return (
    parts.length >= 2 &&
    parts[0] !== undefined &&
    parts[1] !== undefined &&
    parts[0].length > 0 &&
    parts[1].length > 0 &&
    /^[\w.-]+$/.test(parts[0]) &&
    /^[\w.-]+$/.test(parts[1])
  )
}

/**
 * Resolve GitHub repository template with ref and subdir support.
 */
function resolveGitHub(template: string): TemplateSource {
  let location = template
  let ref: string | undefined
  let subdir: string | undefined

  if (location.includes('#')) {
    const [repo, refPart] = location.split('#', 2)
    if (repo !== undefined) {
      location = repo
    }
    ref = refPart
  }

  const parts = location.split('/')
  if (parts.length > 2) {
    location = `${parts[0]}/${parts[1]}`
    subdir = parts.slice(2).join('/')
  }

  return {
    type: 'github',
    location,
    ref,
    subdir,
  }
}

/**
 * Normalize a template source for consistent handling.
 */
function normalizeSource(source: TemplateSource): TemplateSource {
  const normalized = {...source}

  if (source.type === 'github') {
    normalized.location = source.location.replace(/\.git$/, '')
    if (!normalized.location.includes('/')) {
      throw new Error(`Invalid GitHub repository format: ${source.location}`)
    }
  }

  if (source.type === 'local') {
    normalized.location = path.resolve(source.location)
  }

  return normalized
}

/**
 * Create a branded template source.
 */
function createBrandedSourceHelper(template: string): BrandedTemplateSource {
  return createTemplateSource(template)
}

/**
 * Resolve a template string to a structured TemplateSource.
 */
function resolveTemplate(template: string): TemplateSource {
  if (isGitHubShorthand(template)) {
    return resolveGitHub(template)
  }

  if (template.startsWith('github:')) {
    return resolveGitHub(template.slice(7))
  }

  if (isResolverUrl(template)) {
    return {
      type: 'url',
      location: template,
    }
  }

  if (isLocalPath(template)) {
    const resolvedPath = path.resolve(template)
    const normalizedInput = path.normalize(template)

    // Check for path traversal attempts in the original input
    if (normalizedInput.includes('..')) {
      throw new Error(`Path traversal detected in template path: ${path.basename(template)}`)
    }

    return {
      type: 'local',
      location: resolvedPath,
    }
  }

  return {
    type: 'builtin',
    location: template,
  }
}

export function createTemplateResolver(config: ResolverConfig = {}): TemplateResolverInterface {
  const builtinTemplatesDir = config.builtinTemplatesDir ?? resolveBuiltinTemplatesDir()
  const strictMode = config.strictMode ?? false

  /**
   * Resolve a template with Result-based error handling.
   */
  function resolveWithResult(template: string): Result<TemplateSource, Error> {
    if (strictMode) {
      const validation = validateTemplateId(template)
      if (!validation.success) {
        return err(validation.error)
      }
    }

    try {
      const source = resolveTemplate(template)
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

  /**
   * Validate a template source.
   */
  async function validate(source: TemplateSource): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    switch (source.type) {
      case 'local':
        if (!existsSync(source.location)) {
          errors.push(`Local template directory does not exist: ${source.location}`)
        }
        break

      case 'github':
        if (!isValidGitHubRepo(source.location)) {
          errors.push(`Invalid GitHub repository format: ${source.location}`)
        }
        break

      case 'url':
        if (!isResolverUrl(source.location)) {
          errors.push(`Invalid URL format: ${source.location}`)
        }
        break

      case 'builtin': {
        const builtinPath = path.join(builtinTemplatesDir, source.location)
        if (!existsSync(builtinPath)) {
          errors.push(`Built-in template does not exist: ${source.location}`)
        }
        break
      }

      default:
        errors.push(`Unknown template source type: ${String((source as {type?: string}).type)}`)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validate a template source with Result-based error handling.
   */
  async function validateWithResult(source: TemplateSource): Promise<Result<void, Error>> {
    const result = await validate(source)

    if (!result.valid) {
      const errorMessage = result.errors?.join(', ') ?? 'Unknown validation error'
      return err(
        createTemplateError(
          `Template validation failed: ${errorMessage}`,
          TemplateErrorCode.TEMPLATE_INVALID,
          {source, errors: result.errors},
        ),
      )
    }

    return ok(undefined)
  }

  /**
   * Get the list of available built-in templates.
   */
  function getBuiltinTemplates(): string[] {
    try {
      if (!existsSync(builtinTemplatesDir)) {
        return []
      }

      return readdirSync(builtinTemplatesDir).filter((item: string) => {
        const itemPath = path.join(builtinTemplatesDir, item)
        return statSync(itemPath).isDirectory()
      })
    } catch {
      return []
    }
  }

  /**
   * Get the full path to a built-in template.
   */
  function getBuiltinTemplatePath(templateName: string): string {
    return path.join(builtinTemplatesDir, templateName)
  }

  return {
    resolve: resolveTemplate,
    resolveWithResult,
    validate,
    validateWithResult,
    getBuiltinTemplates,
    getBuiltinTemplatePath,
    normalize: normalizeSource,
    createBrandedSource: createBrandedSourceHelper,
  }
}

/**
 * Resolve the builtin templates directory based on the runtime context.
 */
function resolveBuiltinTemplatesDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))

  if (currentDir.includes('/src/templates')) {
    return path.join(currentDir, '..', '..', 'templates')
  } else if (currentDir.includes('/dist/templates')) {
    return currentDir
  } else if (
    import.meta.url.includes('/dist/index.js') ||
    import.meta.url.includes('/dist/cli.js')
  ) {
    return path.join(currentDir, 'templates')
  } else {
    return currentDir
  }
}

/**
 * Template source resolver for handling GitHub repositories, local directories, and URLs.
 * @deprecated Use createTemplateResolver() factory function instead
 */
export class TemplateResolver {
  private readonly resolver: TemplateResolverInterface

  constructor() {
    this.resolver = createTemplateResolver()
  }

  resolve(template: string): TemplateSource {
    return this.resolver.resolve(template)
  }

  async validate(source: TemplateSource): Promise<ValidationResult> {
    return this.resolver.validate(source)
  }

  getBuiltinTemplates(): string[] {
    return this.resolver.getBuiltinTemplates()
  }

  getBuiltinTemplatePath(templateName: string): string {
    return this.resolver.getBuiltinTemplatePath(templateName)
  }

  normalize(source: TemplateSource): TemplateSource {
    return this.resolver.normalize(source)
  }
}

/**
 * Default template resolver instance.
 * Uses the class-based resolver for backward compatibility.
 */
export const templateResolver = new TemplateResolver()

/**
 * Default functional template resolver instance.
 */
export const functionalTemplateResolver = createTemplateResolver()
