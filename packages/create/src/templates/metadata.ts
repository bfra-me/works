import type {Result, TemplateMetadata, TemplateVariable} from '../types.js'
import {existsSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'

/**
 * Template metadata manager for handling template.json configuration files.
 */
export class TemplateMetadataManager {
  /**
   * Load template metadata from template.json file.
   *
   * @param templatePath - Path to the template directory
   * @returns Result with template metadata
   *
   * @example
   * ```typescript
   * const manager = new TemplateMetadataManager()
   * const result = await manager.load('./my-template')
   *
   * if (result.success) {
   *   console.log('Template name:', result.data.name)
   *   console.log('Required variables:', result.data.variables)
   * }
   * ```
   */
  async load(templatePath: string): Promise<Result<TemplateMetadata>> {
    const metadataPath = path.join(templatePath, 'template.json')

    // Default metadata
    const defaultMetadata: TemplateMetadata = {
      name: path.basename(templatePath),
      description: 'Template description not available',
      version: '1.0.0',
    }

    if (!existsSync(metadataPath)) {
      consola.debug(`No template.json found at ${metadataPath}, using defaults`)
      return {
        success: true,
        data: defaultMetadata,
      }
    }

    try {
      const content = await readFile(metadataPath, 'utf-8')
      const rawMetadata = JSON.parse(content) as Partial<TemplateMetadata>

      // Validate and merge with defaults
      const metadata = await this.validateAndNormalize(rawMetadata, defaultMetadata)

      return {
        success: true,
        data: metadata,
      }
    } catch (error) {
      consola.warn(`Failed to load template metadata from ${metadataPath}:`, error)
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  /**
   * Save template metadata to template.json file.
   *
   * @param templatePath - Path to the template directory
   * @param metadata - Template metadata to save
   * @returns Result indicating success or failure
   */
  async save(templatePath: string, metadata: TemplateMetadata): Promise<Result<void>> {
    const metadataPath = path.join(templatePath, 'template.json')

    try {
      // Validate metadata before saving
      const validationResult = this.validate(metadata)
      if (!validationResult.valid) {
        throw new Error(`Invalid metadata: ${validationResult.errors?.join(', ')}`)
      }

      // Sort keys for consistent output
      const sortedMetadata = this.sortMetadataKeys(metadata)
      const content = `${JSON.stringify(sortedMetadata, null, 2)}\n`

      await writeFile(metadataPath, content, 'utf-8')

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      consola.error(`Failed to save template metadata to ${metadataPath}:`, error)
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  /**
   * Validate template metadata.
   *
   * @param metadata - Template metadata to validate
   * @returns Validation result with errors and warnings
   */
  validate(metadata: Partial<TemplateMetadata>): {
    valid: boolean
    errors?: string[]
    warnings?: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (
      metadata.name === undefined ||
      metadata.name === null ||
      typeof metadata.name !== 'string' ||
      metadata.name.trim() === ''
    ) {
      errors.push('Template name is required and must be a non-empty string')
    }

    if (
      metadata.description === undefined ||
      metadata.description === null ||
      typeof metadata.description !== 'string'
    ) {
      errors.push('Template description is required and must be a string')
    }

    if (
      metadata.version === undefined ||
      metadata.version === null ||
      typeof metadata.version !== 'string'
    ) {
      errors.push('Template version is required and must be a string')
    } else if (!this.isValidSemver(metadata.version)) {
      warnings.push(`Template version "${metadata.version}" is not a valid semver`)
    }

    // Optional fields validation
    if (metadata.author !== undefined && typeof metadata.author !== 'string') {
      errors.push('Template author must be a string')
    }

    if (metadata.tags !== undefined) {
      if (!Array.isArray(metadata.tags)) {
        errors.push('Template tags must be an array')
      } else if (!metadata.tags.every(tag => typeof tag === 'string')) {
        errors.push('All template tags must be strings')
      }
    }

    if (metadata.dependencies !== undefined) {
      if (!Array.isArray(metadata.dependencies)) {
        errors.push('Template dependencies must be an array')
      } else if (!metadata.dependencies.every(dep => typeof dep === 'string')) {
        errors.push('All template dependencies must be strings')
      }
    }

    if (metadata.nodeVersion !== undefined && typeof metadata.nodeVersion !== 'string') {
      errors.push('Template nodeVersion must be a string')
    }

    // Validate variables
    if (metadata.variables !== undefined) {
      if (Array.isArray(metadata.variables)) {
        const variableErrors = this.validateVariables(metadata.variables)
        errors.push(...variableErrors)
      } else {
        errors.push('Template variables must be an array')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Create a template.json file with default metadata.
   *
   * @param templatePath - Path to the template directory
   * @param options - Options for the template metadata
   * @param options.name - Template name
   * @param options.description - Template description
   * @param options.author - Template author
   * @param options.tags - Template tags
   * @returns Result indicating success or failure
   */
  async create(
    templatePath: string,
    options: {
      name?: string
      description?: string
      author?: string
      tags?: string[]
    } = {},
  ): Promise<Result<TemplateMetadata>> {
    const metadata: TemplateMetadata = {
      name: options.name ?? path.basename(templatePath),
      description: options.description ?? `Template for ${path.basename(templatePath)}`,
      version: '1.0.0',
      author: options.author,
      tags: options.tags,
      variables: [],
    }

    const saveResult = await this.save(templatePath, metadata)
    if (!saveResult.success) {
      return saveResult as Result<TemplateMetadata>
    }

    return {
      success: true,
      data: metadata,
    }
  }

  /**
   * Validate and normalize template metadata by merging with defaults.
   */
  private async validateAndNormalize(
    rawMetadata: Partial<TemplateMetadata>,
    defaultMetadata: TemplateMetadata,
  ): Promise<TemplateMetadata> {
    // Validate the metadata
    const validationResult = this.validate(rawMetadata)

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => consola.warn(warning))
    }

    if (!validationResult.valid) {
      throw new Error(`Invalid template metadata: ${validationResult.errors?.join(', ')}`)
    }

    // Merge with defaults
    return {
      ...defaultMetadata,
      ...rawMetadata,
      name: rawMetadata.name ?? defaultMetadata.name,
      description: rawMetadata.description ?? defaultMetadata.description,
      version: rawMetadata.version ?? defaultMetadata.version,
    }
  }

  /**
   * Validate template variables array.
   */
  private validateVariables(variables: unknown[]): string[] {
    const errors: string[] = []

    variables.forEach((variable, index) => {
      if (typeof variable !== 'object' || variable === null) {
        errors.push(`Variable at index ${index} must be an object`)
        return
      }

      const v = variable as Partial<TemplateVariable>

      if (v.name === undefined || v.name === null || typeof v.name !== 'string') {
        errors.push(`Variable at index ${index} must have a valid name`)
      }

      if (
        v.description === undefined ||
        v.description === null ||
        typeof v.description !== 'string'
      ) {
        errors.push(`Variable at index ${index} must have a valid description`)
      }

      if (!v.type || !['string', 'boolean', 'number', 'select'].includes(v.type)) {
        errors.push(
          `Variable at index ${index} must have a valid type (string, boolean, number, select)`,
        )
      }

      if (v.type === 'select' && (!v.options || !Array.isArray(v.options))) {
        errors.push(`Variable at index ${index} with type 'select' must have options array`)
      }

      if (v.pattern !== undefined && typeof v.pattern !== 'string') {
        errors.push(`Variable at index ${index} pattern must be a string`)
      }
    })

    return errors
  }

  /**
   * Check if a string is a valid semver version.
   */
  private isValidSemver(version: string): boolean {
    // Simplified semver regex to avoid ESLint complexity warnings
    const semverRegex = /^\d+\.\d+\.\d+/
    return semverRegex.test(version)
  }

  /**
   * Sort metadata keys for consistent output.
   */
  private sortMetadataKeys(metadata: TemplateMetadata): TemplateMetadata {
    // Create a new object with sorted keys
    const {
      name,
      description,
      version,
      author,
      tags,
      variables,
      dependencies,
      nodeVersion,
      ...rest
    } = metadata

    const sorted: TemplateMetadata = {
      name,
      description,
      version,
    }

    // Add optional fields in order if they exist
    if (author !== undefined) sorted.author = author
    if (tags !== undefined) sorted.tags = tags
    if (variables !== undefined) sorted.variables = variables
    if (dependencies !== undefined) sorted.dependencies = dependencies
    if (nodeVersion !== undefined) sorted.nodeVersion = nodeVersion

    // Add any additional properties
    Object.assign(sorted, rest)

    return sorted
  }
}

/**
 * Default template metadata manager instance.
 */
export const templateMetadataManager = new TemplateMetadataManager()
