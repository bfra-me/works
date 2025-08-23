import type {ValidationResult} from '../types.js'
import {existsSync, readdirSync} from 'node:fs'
import path from 'node:path'

/**
 * Input validation and sanitization utilities.
 */
export const ValidationUtils = {
  /**
   * Validate project name according to npm package naming rules.
   */
  validateProjectName(name: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check basic requirements
    if (!name || name.trim().length === 0) {
      errors.push('Project name is required')
      return {valid: false, errors}
    }

    const trimmedName = name.trim()

    // Length validation
    if (trimmedName.length > 214) {
      errors.push('Project name must be 214 characters or less')
    }

    // Must be lowercase
    if (trimmedName !== trimmedName.toLowerCase()) {
      warnings.push('Project name should be lowercase')
    }

    // Cannot start with dot or underscore
    if (trimmedName.startsWith('.') || trimmedName.startsWith('_')) {
      errors.push('Project name cannot start with a dot or underscore')
    }

    // Cannot contain uppercase letters, spaces, or special characters
    if (!/^[a-z\d](?:[a-z\d._-]*[a-z\d])?$/.test(trimmedName)) {
      errors.push(
        'Project name can only contain lowercase letters, numbers, hyphens, dots, and underscores',
      )
    }

    // Cannot be reserved names
    const reservedNames = [
      'node_modules',
      'favicon.ico',
      'package.json',
      'readme.md',
      'changelog.md',
      'license',
      'mit',
      'apache',
      'gpl',
      'bsd',
    ]
    if (reservedNames.includes(trimmedName.toLowerCase())) {
      errors.push(`Project name "${trimmedName}" is reserved`)
    }

    // Cannot match built-in Node.js modules
    const builtinModules = [
      'assert',
      'buffer',
      'child_process',
      'cluster',
      'crypto',
      'dgram',
      'dns',
      'domain',
      'events',
      'fs',
      'http',
      'https',
      'net',
      'os',
      'path',
      'punycode',
      'querystring',
      'readline',
      'stream',
      'string_decoder',
      'timers',
      'tls',
      'tty',
      'url',
      'util',
      'v8',
      'vm',
      'zlib',
    ]
    if (builtinModules.includes(trimmedName)) {
      errors.push(`Project name "${trimmedName}" conflicts with a built-in Node.js module`)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  },

  /**
   * Validate directory path for project creation.
   */
  validateOutputDirectory(dirPath: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!dirPath || dirPath.trim().length === 0) {
      errors.push('Output directory is required')
      return {valid: false, errors}
    }

    const resolvedPath = path.resolve(dirPath.trim())

    // Check if path exists and is not empty
    if (existsSync(resolvedPath)) {
      try {
        const contents = readdirSync(resolvedPath)
        if (contents.length > 0) {
          warnings.push('Directory is not empty - existing files may be overwritten')
        }
      } catch {
        errors.push('Cannot access directory - permission denied')
      }
    }

    // Check for invalid path characters
    const invalidChars = /[<>:"|?*]/
    if (invalidChars.test(resolvedPath)) {
      errors.push('Directory path contains invalid characters')
    }

    // Check path length (Windows limitation)
    if (resolvedPath.length > 260) {
      warnings.push('Directory path is very long and may cause issues on Windows')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  },

  /**
   * Validate template identifier.
   */
  validateTemplateId(template: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!template || template.trim().length === 0) {
      errors.push('Template identifier is required')
      return {valid: false, errors}
    }

    const trimmedTemplate = template.trim()

    // Check for suspicious characters that might indicate injection
    const suspiciousPatterns = [
      /[;&|`$(){}]/, // Shell injection
      /<script/i, // XSS
      /javascript:/i, // JavaScript protocol
      /data:/i, // Data protocol
      /\.\.\/.*\.\./, // Path traversal
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedTemplate)) {
        errors.push('Template identifier contains potentially dangerous characters')
        break
      }
    }

    // Validate GitHub repository format if it looks like one
    if (trimmedTemplate.includes('/') && !trimmedTemplate.includes('://')) {
      const parts = trimmedTemplate.split('/')
      if (parts.length >= 2) {
        const [owner, repo] = parts
        if (owner === '' || repo === '') {
          errors.push('Invalid GitHub repository format')
        } else if (!/^[\w.-]+$/.test(owner ?? '') || !/^[\w.-]+$/.test(repo ?? '')) {
          errors.push('GitHub repository name contains invalid characters')
        }
      }
    }

    // Validate URL format if it looks like one
    if (trimmedTemplate.includes('://')) {
      try {
        const url = new URL(trimmedTemplate)
        if (!['http:', 'https:', 'git:', 'ssh:'].includes(url.protocol)) {
          warnings.push('URL protocol may not be supported')
        }
      } catch {
        errors.push('Invalid URL format')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  },

  /**
   * Validate email address format.
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = []

    if (!email || email.trim().length === 0) {
      return {valid: true} // Email is optional
    }

    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email address format')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  /**
   * Validate semantic version string.
   */
  validateVersion(version: string): ValidationResult {
    const errors: string[] = []

    if (!version || version.trim().length === 0) {
      return {valid: true} // Version is optional, will use default
    }

    // Basic semver pattern
    const semverRegex =
      /^\d+\.\d+\.\d+(?:-(?:[0-9A-Z-]+\.)*[0-9A-Z-]+)?(?:\+(?:[0-9A-Z-]+\.)*[0-9A-Z-]+)?$/i
    if (!semverRegex.test(version.trim())) {
      errors.push('Version must follow semantic versioning format (e.g., 1.0.0)')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  /**
   * Sanitize string input by removing/escaping dangerous characters.
   */
  sanitizeString(input: string): string {
    if (!input) return ''

    return (
      input
        .trim()
        // Remove null bytes
        .replaceAll('\0', '')
        // Remove control characters except tab, newline, carriage return
        // eslint-disable-next-line no-control-regex
        .replaceAll(/[\u0001-\u0008\v\f\u000E-\u001F\u007F]/g, '')
        // Normalize whitespace
        .replaceAll(/\s+/g, ' ')
    )
  },

  /**
   * Sanitize file path to prevent directory traversal.
   */
  sanitizePath(filePath: string): string {
    if (!filePath) return ''

    return (
      path
        .normalize(filePath)
        // Remove dangerous path components
        .replaceAll('..', '')
        .replace(/^\/+/, '')
        // Remove null bytes and control characters
        // eslint-disable-next-line no-control-regex
        .replaceAll(/[\u0001-\u001F\u007F]/g, '')
    )
  },

  /**
   * Validate and sanitize template variable value.
   */
  validateTemplateVariable(
    name: string,
    value: unknown,
    type: 'string' | 'boolean' | 'number' | 'select',
    options?: {
      required?: boolean
      pattern?: string
      selectOptions?: string[]
    },
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required
    if (options && options.required && (value === undefined || value === null || value === '')) {
      errors.push(`Variable '${name}' is required`)
      return {valid: false, errors}
    }

    // Skip validation for optional empty values
    if (value === undefined || value === null || value === '') {
      return {valid: true}
    }

    // Type validation
    switch (type) {
      case 'string':
        if (typeof value === 'string') {
          // Pattern validation
          if (typeof options?.pattern === 'string' && options.pattern !== '') {
            try {
              const regex = new RegExp(options.pattern)
              if (!regex.test(value)) {
                errors.push(`Variable '${name}' does not match the required pattern`)
              }
            } catch {
              warnings.push(`Invalid pattern for variable '${name}'`)
            }
          }
        } else {
          errors.push(`Variable '${name}' must be a string`)
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Variable '${name}' must be a boolean`)
        }
        break

      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          errors.push(`Variable '${name}' must be a valid number`)
        }
        break

      case 'select':
        if (options && options.selectOptions) {
          if (!options.selectOptions.includes(String(value))) {
            errors.push(`Variable '${name}' must be one of: ${options.selectOptions.join(', ')}`)
          }
        } else {
          warnings.push(`No options defined for select variable '${name}'`)
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  },

  /**
   * Comprehensive validation for create command options.
   */
  validateCreateOptions(options: {
    name?: string
    template?: string
    outputDir?: string
    version?: string
    author?: string
    description?: string
    force?: boolean
    dryRun?: boolean
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate project name
    if (options.name != null && options.name !== '') {
      const nameValidation = this.validateProjectName(options.name)
      if (nameValidation.errors) errors.push(...nameValidation.errors)
      if (nameValidation.warnings) warnings.push(...nameValidation.warnings)
    }

    // Validate template
    if (options.template != null && options.template !== '') {
      const templateValidation = this.validateTemplateId(options.template)
      if (templateValidation.errors) errors.push(...templateValidation.errors)
      if (templateValidation.warnings) warnings.push(...templateValidation.warnings)
    }

    // Validate output directory
    if (options.outputDir != null && options.outputDir !== '') {
      const dirValidation = this.validateOutputDirectory(options.outputDir)
      if (dirValidation.errors) errors.push(...dirValidation.errors)
      if (dirValidation.warnings) warnings.push(...dirValidation.warnings)

      // Convert directory non-empty warning to error if force is false (skip in dry run mode)
      if (
        !options.force &&
        options.dryRun !== true &&
        dirValidation.warnings?.some(w => w.includes('Directory is not empty'))
      ) {
        errors.push('Target directory already exists and is not empty. Use --force to overwrite.')
      }
    }

    // Validate version
    if (options.version != null && options.version !== '') {
      const versionValidation = this.validateVersion(options.version)
      if (versionValidation.errors) errors.push(...versionValidation.errors)
      if (versionValidation.warnings) warnings.push(...versionValidation.warnings)
    }

    // Validate author email if it looks like an email
    if (typeof options.author === 'string' && options.author.includes('@')) {
      const emailValidation = this.validateEmail(options.author)
      if (emailValidation.errors) errors.push(...emailValidation.errors)
      if (emailValidation.warnings) warnings.push(...emailValidation.warnings)
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  },
}
