import type {TemplateSource, ValidationResult} from '../types.js'
import {existsSync, readdirSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * Template source resolver for handling GitHub repositories, local directories, and URLs.
 */
export class TemplateResolver {
  private readonly builtinTemplatesDir: string

  constructor() {
    // Resolve the built-in templates directory relative to this module
    // Handle both development and production contexts
    const currentDir = path.dirname(fileURLToPath(import.meta.url))

    if (currentDir.includes('/src/templates')) {
      // Development context: src/templates/ -> go up to package root then to templates/
      this.builtinTemplatesDir = path.join(currentDir, '..', '..', 'templates')
    } else if (
      import.meta.url.includes('/dist/index.js') ||
      import.meta.url.includes('/dist/cli.js')
    ) {
      // Bundled context: dist/index.js or dist/cli.js -> templates are in dist/templates/
      this.builtinTemplatesDir = path.join(currentDir, 'templates')
    } else {
      // Standalone module context: dist/templates/ -> templates are co-located
      this.builtinTemplatesDir = currentDir
    }
  }

  /**
   * Resolve a template string to a structured TemplateSource.
   *
   * @param template - Template string (can be GitHub repo, local path, URL, or builtin name)
   * @returns Resolved template source
   *
   * @example
   * ```typescript
   * const resolver = new TemplateResolver()
   *
   * // GitHub repository
   * resolver.resolve('user/repo') // { type: 'github', location: 'user/repo' }
   * resolver.resolve('github:user/repo#main') // { type: 'github', location: 'user/repo', ref: 'main' }
   * resolver.resolve('user/repo/subdir') // { type: 'github', location: 'user/repo', subdir: 'subdir' }
   *
   * // Local directory
   * resolver.resolve('./my-template') // { type: 'local', location: './my-template' }
   * resolver.resolve('/absolute/path') // { type: 'local', location: '/absolute/path' }
   *
   * // URL
   * resolver.resolve('https://example.com/template.zip') // { type: 'url', location: 'https://...' }
   *
   * // Built-in
   * resolver.resolve('default') // { type: 'builtin', location: 'default' }
   * ```
   */
  resolve(template: string): TemplateSource {
    // Handle GitHub shorthand (user/repo format)
    if (this.isGitHubShorthand(template)) {
      return this.resolveGitHub(template)
    }

    // Handle explicit GitHub protocol
    if (template.startsWith('github:')) {
      return this.resolveGitHub(template.slice(7))
    }

    // Handle URLs
    if (this.isUrl(template)) {
      return {
        type: 'url',
        location: template,
      }
    }

    // Handle local paths
    if (this.isLocalPath(template)) {
      return {
        type: 'local',
        location: path.resolve(template),
      }
    }

    // Handle built-in templates
    return {
      type: 'builtin',
      location: template,
    }
  }

  /**
   * Validate a template source.
   *
   * @param source - Template source to validate
   * @returns Validation result
   */
  async validate(source: TemplateSource): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    switch (source.type) {
      case 'local':
        if (!existsSync(source.location)) {
          errors.push(`Local template directory does not exist: ${source.location}`)
        }
        break

      case 'github':
        if (!this.isValidGitHubRepo(source.location)) {
          errors.push(`Invalid GitHub repository format: ${source.location}`)
        }
        break

      case 'url':
        if (!this.isUrl(source.location)) {
          errors.push(`Invalid URL format: ${source.location}`)
        }
        break

      case 'builtin': {
        const builtinPath = path.join(this.builtinTemplatesDir, source.location)
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
   * Get the list of available built-in templates.
   *
   * @returns Array of built-in template names
   */
  getBuiltinTemplates(): string[] {
    try {
      if (!existsSync(this.builtinTemplatesDir)) {
        return []
      }

      return readdirSync(this.builtinTemplatesDir).filter((item: string) => {
        const itemPath = path.join(this.builtinTemplatesDir, item)
        return statSync(itemPath).isDirectory()
      })
    } catch {
      return []
    }
  }

  /**
   * Get the full path to a built-in template.
   *
   * @param templateName - Name of the built-in template
   * @returns Absolute path to the built-in template directory
   */
  getBuiltinTemplatePath(templateName: string): string {
    return path.join(this.builtinTemplatesDir, templateName)
  }

  /**
   * Normalize a template source for consistent handling.
   *
   * @param source - Template source to normalize
   * @returns Normalized template source
   */
  normalize(source: TemplateSource): TemplateSource {
    const normalized = {...source}

    // Normalize GitHub repositories
    if (source.type === 'github') {
      // Remove .git suffix if present
      normalized.location = source.location.replace(/\.git$/, '')

      // Ensure proper format
      if (!normalized.location.includes('/')) {
        throw new Error(`Invalid GitHub repository format: ${source.location}`)
      }
    }

    // Normalize local paths
    if (source.type === 'local') {
      normalized.location = path.resolve(source.location)
    }

    return normalized
  }

  /**
   * Check if a string is a GitHub repository shorthand (user/repo).
   */
  private isGitHubShorthand(template: string): boolean {
    // Basic pattern: contains slash but no protocol and no file extension
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
  private isUrl(template: string): boolean {
    try {
      const url = new URL(template)
      return Boolean(url)
    } catch {
      return false
    }
  }

  /**
   * Check if a string is a local path.
   */
  private isLocalPath(template: string): boolean {
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
  private isValidGitHubRepo(repo: string): boolean {
    // Basic validation: should be in format "owner/repo"
    const parts = repo.split('/')
    return (
      parts.length >= 2 &&
      parts[0] !== undefined &&
      parts[1] !== undefined &&
      parts[0].length > 0 &&
      parts[1].length > 0 &&
      // GitHub username/repo constraints
      /^[\w.-]+$/.test(parts[0]) &&
      /^[\w.-]+$/.test(parts[1])
    )
  }

  /**
   * Resolve GitHub repository template with ref and subdir support.
   */
  private resolveGitHub(template: string): TemplateSource {
    let location = template
    let ref: string | undefined
    let subdir: string | undefined

    // Handle ref (branch/tag) - format: repo#ref
    if (location.includes('#')) {
      const [repo, refPart] = location.split('#', 2)
      if (repo !== undefined) {
        location = repo
      }
      ref = refPart
    }

    // Handle subdirectory - format: repo/subdir (more than 2 path segments)
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
}

/**
 * Default template resolver instance.
 */
export const templateResolver = new TemplateResolver()
