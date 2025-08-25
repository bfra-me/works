import type {TemplateContext} from '../types.js'
import {existsSync} from 'node:fs'
import {readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'

/**
 * Configuration for changeset generation.
 */
export interface ChangesetConfig {
  /** Path to the changeset directory */
  changesetDir: string
  /** Default changeset type for new packages */
  defaultType: 'major' | 'minor' | 'patch'
  /** Whether to generate changesets automatically */
  autoGenerate: boolean
  /** Custom changeset message template */
  messageTemplate?: string
}

/**
 * Result of changeset generation.
 */
export interface ChangesetResult {
  /** Whether a changeset was generated */
  generated: boolean
  /** Path to the generated changeset file */
  path?: string
  /** Content of the generated changeset */
  content?: string
  /** Any warnings during generation */
  warnings: string[]
  /** Any errors during generation */
  errors: string[]
}

/**
 * Manages changeset generation for new packages following established patterns.
 * Generates semantic changesets for package releases.
 */
export class ChangesetGenerator {
  private readonly config: ChangesetConfig

  constructor(config: Partial<ChangesetConfig> = {}) {
    // Default configuration based on the bfra.me/works changeset patterns
    this.config = {
      changesetDir: path.join(process.cwd(), '.changeset'),
      defaultType: 'minor', // New packages are typically minor releases
      autoGenerate: true,
      messageTemplate: undefined, // Will use default template
      ...config,
    }
  }

  /**
   * Generate a changeset for a new package.
   *
   * @param packagePath - Path to the generated package
   * @param context - Template context used for generation
   * @param options - Generation options
   * @param options.verbose - Enable verbose logging
   * @param options.type - Override the changeset type
   * @param options.description - Custom description for the changeset
   * @returns Result of changeset generation
   */
  async generate(
    packagePath: string,
    context: TemplateContext,
    options: {
      verbose?: boolean
      type?: 'major' | 'minor' | 'patch'
      description?: string
    } = {},
  ): Promise<ChangesetResult> {
    const warnings: string[] = []
    const errors: string[] = []

    try {
      if (options.verbose) {
        consola.info('Starting changeset generation...', {
          package: packagePath,
          changesetDir: this.config.changesetDir,
        })
      }

      // Check if changeset directory exists
      if (!existsSync(this.config.changesetDir)) {
        warnings.push(`Changeset directory not found: ${this.config.changesetDir}`)
        return {generated: false, warnings, errors}
      }

      // Read package information
      const packageInfo = await this.readPackageInfo(packagePath)
      if (!packageInfo) {
        errors.push('Could not read package information')
        return {generated: false, warnings, errors}
      }

      // Generate changeset content
      const changesetType = options.type || this.config.defaultType
      const changesetContent = this.generateChangesetContent(
        packageInfo,
        context,
        changesetType,
        options.description,
      )

      // Generate unique changeset filename
      const changesetFilename = await this.generateUniqueFilename(packageInfo.name)
      const changesetPath = path.join(this.config.changesetDir, changesetFilename)

      // Write changeset file
      await writeFile(changesetPath, changesetContent, 'utf8')

      if (options.verbose) {
        consola.success('Changeset generated successfully', {
          path: changesetPath,
          type: changesetType,
          package: packageInfo.name,
        })
      }

      return {
        generated: true,
        path: changesetPath,
        content: changesetContent,
        warnings,
        errors,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(`Changeset generation failed: ${errorMessage}`)

      return {
        generated: false,
        warnings,
        errors,
      }
    }
  }

  /**
   * Read package information from the generated package.
   */
  private async readPackageInfo(packagePath: string): Promise<{
    name: string
    version: string
    description: string
  } | null> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json')

      if (!existsSync(packageJsonPath)) {
        return null
      }

      const {readFile} = await import('node:fs/promises')
      const packageJsonContent = await readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageJsonContent) as {
        name?: string
        version?: string
        description?: string
      }

      if (packageJson.name == null || packageJson.name.trim() === '') {
        return null
      }

      return {
        name: packageJson.name,
        version: packageJson.version ?? '1.0.0',
        description: packageJson.description ?? 'A new package',
      }
    } catch {
      return null
    }
  }

  /**
   * Generate changeset content following established patterns.
   */
  private generateChangesetContent(
    packageInfo: {name: string; version: string; description: string},
    context: TemplateContext,
    type: 'major' | 'minor' | 'patch',
    customDescription?: string,
  ): string {
    // Use custom template if provided, otherwise use default
    const description = customDescription ?? this.getDefaultDescription(packageInfo, context)

    return `---
"${packageInfo.name}": ${type}
---

${description}
`
  }

  /**
   * Get default changeset description for a new package.
   */
  private getDefaultDescription(
    packageInfo: {name: string; version: string; description: string},
    context: TemplateContext,
  ): string {
    const packageName = packageInfo.name.startsWith('@bfra.me/')
      ? packageInfo.name.slice('@bfra.me/'.length)
      : packageInfo.name

    return `Add ${packageName} package

${packageInfo.description}

This new package provides:
- Core functionality for ${context.projectName}
- TypeScript support with strict type checking
- Comprehensive test coverage
- ESLint and Prettier integration
- Full documentation with examples

Features:
- Modern ES modules with proper exports
- Workspace integration for monorepo development
- Automated testing and validation
- Consistent code style and formatting`
  }

  /**
   * Generate a unique changeset filename.
   */
  private async generateUniqueFilename(packageName: string): Promise<string> {
    // Create a timestamp-based filename
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replaceAll(/[:-]/g, '')
      .replaceAll('T', '-')

    // Extract package name part (remove scope if present)
    const nameSlug = packageName.startsWith('@')
      ? (packageName.split('/')[1] ?? 'package')
      : packageName

    // Sanitize the name for filename
    const sanitizedName = nameSlug.replaceAll(/[^a-z0-9-]/gi, '-').toLowerCase()

    let filename = `${timestamp}-add-${sanitizedName}.md`
    let counter = 1

    // Ensure filename is unique
    while (existsSync(path.join(this.config.changesetDir, filename))) {
      filename = `${timestamp}-add-${sanitizedName}-${counter}.md`
      counter++
    }

    return filename
  }

  /**
   * Check if changeset generation is available.
   */
  isAvailable(): boolean {
    return existsSync(this.config.changesetDir)
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<ChangesetConfig> {
    return {...this.config}
  }

  /**
   * List existing changesets.
   */
  async listChangesets(): Promise<string[]> {
    try {
      if (!existsSync(this.config.changesetDir)) {
        return []
      }

      const files = await readdir(this.config.changesetDir)
      return files.filter(file => file.endsWith('.md') && file !== 'README.md')
    } catch {
      return []
    }
  }

  /**
   * Validate changeset structure.
   */
  validateChangeset(content: string): {valid: boolean; errors: string[]} {
    const errors: string[] = []

    // Check for frontmatter
    if (!content.startsWith('---\n')) {
      errors.push('Changeset must start with YAML frontmatter')
    }

    // Check for package specification
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (frontmatterMatch == null) {
      errors.push('Changeset must have valid YAML frontmatter')
    } else {
      const frontmatter = frontmatterMatch[1]
      if (frontmatter != null && frontmatter.trim() !== '' && !frontmatter.includes(':')) {
        errors.push('Changeset must specify package and version bump')
      }
    }

    // Check for description
    const descriptionMatch = content.match(/^---\n[\s\S]*?\n---\n\n(.+)/s)
    if (
      descriptionMatch == null ||
      descriptionMatch[1] == null ||
      descriptionMatch[1].trim().length === 0
    ) {
      errors.push('Changeset must have a description')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Create a changeset generator with default configuration.
 */
export function createChangesetGenerator(config?: Partial<ChangesetConfig>): ChangesetGenerator {
  return new ChangesetGenerator(config)
}
