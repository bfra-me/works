import type {TemplateMetadata, TemplateSource, ValidationResult} from '../types.js'
import {existsSync, statSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'
import {templateMetadataManager} from './metadata.js'
import {templateResolver} from './resolver.js'

/**
 * Template validation system for structure and metadata verification.
 */
export class TemplateValidator {
  /**
   * Validate a template source.
   *
   * @param source - Template source to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const validator = new TemplateValidator()
   * const result = await validator.validateSource({
   *   type: 'github',
   *   location: 'user/repo'
   * })
   *
   * if (!result.valid) {
   *   console.error('Validation errors:', result.errors)
   * }
   * ```
   */
  async validateSource(source: TemplateSource): Promise<ValidationResult> {
    return templateResolver.validate(source)
  }

  /**
   * Validate a template directory structure and metadata.
   *
   * @param templatePath - Path to the template directory
   * @returns Validation result with detailed feedback
   */
  async validateTemplate(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check if template directory exists
      if (!existsSync(templatePath)) {
        errors.push(`Template directory does not exist: ${templatePath}`)
        return {valid: false, errors}
      }

      const stats = statSync(templatePath)
      if (!stats.isDirectory()) {
        errors.push(`Template path is not a directory: ${templatePath}`)
        return {valid: false, errors}
      }

      // Validate template metadata
      const metadataResult = await this.validateMetadata(templatePath)
      if (metadataResult.errors) {
        errors.push(...metadataResult.errors)
      }
      if (metadataResult.warnings) {
        warnings.push(...metadataResult.warnings)
      }

      // Validate template structure
      const structureResult = await this.validateStructure(templatePath)
      if (structureResult.errors) {
        errors.push(...structureResult.errors)
      }
      if (structureResult.warnings) {
        warnings.push(...structureResult.warnings)
      }

      // Validate template files
      const filesResult = await this.validateFiles(templatePath)
      if (filesResult.errors) {
        errors.push(...filesResult.errors)
      }
      if (filesResult.warnings) {
        warnings.push(...filesResult.warnings)
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      consola.error('Error during template validation:', error)
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
      }
    }
  }

  /**
   * Validate template metadata.
   */
  async validateMetadata(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const metadataResult = await templateMetadataManager.load(templatePath)

      if (!metadataResult.success) {
        errors.push(`Failed to load template metadata: ${metadataResult.error?.message}`)
        return {valid: false, errors}
      }

      // Validate metadata using the metadata manager
      const validation = templateMetadataManager.validate(metadataResult.data)
      if (validation.errors) {
        errors.push(...validation.errors)
      }
      if (validation.warnings) {
        warnings.push(...validation.warnings)
      }

      // Additional metadata checks
      await this.validateMetadataConsistency(templatePath, metadataResult.data, warnings)

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Metadata validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      }
    }
  }

  /**
   * Validate template directory structure.
   */
  async validateStructure(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const entries = await readdir(templatePath, {withFileTypes: true})

      // Check for essential files
      const hasFiles = entries.some(entry => entry.isFile())
      if (!hasFiles) {
        warnings.push('Template directory appears to be empty or contains only subdirectories')
      }

      // Check for common template files
      const entryNames = entries.map(entry => entry.name.toLowerCase())

      // Check for package.json (common for Node.js templates)
      if (entryNames.includes('package.json')) {
        await this.validatePackageJson(path.join(templatePath, 'package.json'), warnings)
      }

      // Check for README files
      const hasReadme = entryNames.some(name => name.startsWith('readme'))
      if (!hasReadme) {
        warnings.push('Template does not contain a README file')
      }

      // Check for gitignore
      const hasGitignore = entryNames.includes('.gitignore')
      if (!hasGitignore) {
        warnings.push('Template does not contain a .gitignore file')
      }

      // Check for potentially problematic files
      const problematicFiles = [
        'node_modules',
        '.git',
        'dist',
        'lib',
        'build',
        '.env',
        '.env.local',
      ]

      problematicFiles.forEach(file => {
        if (entryNames.includes(file)) {
          warnings.push(`Template contains potentially problematic file/directory: ${file}`)
        }
      })

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Structure validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      }
    }
  }

  /**
   * Validate template files for common issues.
   */
  async validateFiles(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const entries = await readdir(templatePath, {withFileTypes: true, recursive: true})

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(templatePath, entry.name)

          // Check file permissions
          try {
            const stats = statSync(filePath)
            if (!stats.isFile()) {
              continue
            }
          } catch {
            warnings.push(`Cannot access file: ${entry.name}`)
            continue
          }

          // Check for very large files
          try {
            const stats = statSync(filePath)
            const maxSize = 10 * 1024 * 1024 // 10MB
            if (stats.size > maxSize) {
              warnings.push(
                `Large file detected (${Math.round(stats.size / 1024 / 1024)}MB): ${entry.name}`,
              )
            }
          } catch {
            // Ignore size check errors
          }

          // Check for binary files that might not be template files
          if (this.isBinaryFile(entry.name)) {
            const suspiciousExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin']
            if (suspiciousExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
              warnings.push(`Suspicious binary file: ${entry.name}`)
            }
          }

          // Check for template syntax in text files
          if (this.isTextFile(entry.name)) {
            await this.validateTemplateFile(filePath, entry.name, warnings)
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [
          `File validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      }
    }
  }

  /**
   * Validate metadata consistency with template contents.
   */
  private async validateMetadataConsistency(
    templatePath: string,
    metadata: TemplateMetadata,
    warnings: string[],
  ): Promise<void> {
    // Check if metadata variables are actually used in template
    if (metadata.variables && metadata.variables.length > 0) {
      const templateFiles = await this.getTemplateFiles(templatePath)
      const usedVariables = new Set<string>()

      for (const file of templateFiles) {
        try {
          const content = await readFile(file, 'utf-8')
          // Look for ETA template variables (<%...%>)
          const variableRegex = /<%\s*([\w$]+)\s*%>/g
          let match = variableRegex.exec(content)
          while (match !== null) {
            if (match[1] !== undefined && match[1] !== null && match[1] !== '') {
              usedVariables.add(match[1])
            }
            match = variableRegex.exec(content)
          }
        } catch {
          // Ignore files that can't be read as text
        }
      }

      // Check for declared but unused variables
      metadata.variables.forEach(variable => {
        if (!usedVariables.has(variable.name)) {
          warnings.push(`Variable '${variable.name}' is declared but not used in template`)
        }
      })
    }

    // Check if dependencies are consistent with package.json
    const packageJsonPath = path.join(templatePath, 'package.json')
    if (existsSync(packageJsonPath) && metadata.dependencies) {
      try {
        const packageContent = await readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageContent) as {
          dependencies?: Record<string, string>
          devDependencies?: Record<string, string>
        }

        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        }

        metadata.dependencies.forEach(dep => {
          if (!(dep in allDeps)) {
            warnings.push(`Dependency '${dep}' is listed in metadata but not in package.json`)
          }
        })
      } catch {
        // Ignore package.json parsing errors
      }
    }
  }

  /**
   * Validate package.json file.
   */
  private async validatePackageJson(packageJsonPath: string, warnings: string[]): Promise<void> {
    try {
      const content = await readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content) as {
        name?: string
        version?: string
        description?: string
        scripts?: Record<string, string>
      }

      // Check for template variables in package.json
      const contentStr = JSON.stringify(packageJson, null, 2)
      if (!contentStr.includes('<%') && !contentStr.includes('%>')) {
        warnings.push('package.json does not appear to contain template variables')
      }

      // Check for placeholder values
      if (packageJson.name === 'template-name' || packageJson.name === 'my-template') {
        warnings.push('package.json contains placeholder name that should be templated')
      }

      if (
        packageJson.description === 'Template description' ||
        packageJson.description === 'My template'
      ) {
        warnings.push('package.json contains placeholder description that should be templated')
      }
    } catch (error) {
      warnings.push(
        `Invalid package.json: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Validate individual template file.
   */
  private async validateTemplateFile(
    filePath: string,
    fileName: string,
    warnings: string[],
  ): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8')

      // Check for unmatched template delimiters
      const openDelimiters = (content.match(/<%/g) || []).length
      const closeDelimiters = (content.match(/%>/g) || []).length

      if (openDelimiters !== closeDelimiters) {
        warnings.push(`Unmatched template delimiters in ${fileName}`)
      }

      // Check for common template syntax errors
      if (content.includes('<% <%') || content.includes('%> %>')) {
        warnings.push(`Potential nested delimiter issue in ${fileName}`)
      }

      // Check for placeholder text that should be templated
      const placeholders = [
        'YOUR_NAME',
        'YOUR_EMAIL',
        'PROJECT_NAME',
        'DESCRIPTION',
        'TODO:',
        'FIXME:',
        'XXX:',
      ]

      placeholders.forEach(placeholder => {
        if (content.includes(placeholder)) {
          warnings.push(
            `File ${fileName} contains placeholder '${placeholder}' that might need templating`,
          )
        }
      })
    } catch {
      // Ignore files that can't be read as text
    }
  }

  /**
   * Get list of template files for processing.
   */
  private async getTemplateFiles(templatePath: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await readdir(templatePath, {withFileTypes: true, recursive: true})

      for (const entry of entries) {
        if (entry.isFile() && this.isTextFile(entry.name)) {
          files.push(path.join(templatePath, entry.name))
        }
      }
    } catch {
      // Return empty array if reading fails
    }

    return files
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
      '.py',
      '.rb',
      '.php',
      '.java',
      '.c',
      '.cpp',
      '.h',
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
    return textExtensions.includes(ext)
  }

  /**
   * Check if a file is a binary file.
   */
  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.svg',
      '.pdf',
      '.zip',
      '.tar',
      '.gz',
      '.rar',
      '.7z',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.bin',
      '.woff',
      '.woff2',
      '.ttf',
      '.otf',
      '.eot',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.wmv',
    ]

    const ext = path.extname(filePath).toLowerCase()
    return binaryExtensions.includes(ext)
  }
}

/**
 * Default template validator instance.
 */
export const templateValidator = new TemplateValidator()
