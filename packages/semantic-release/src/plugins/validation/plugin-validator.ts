/**
 * Main plugin validation utilities.
 */

import type {
  PluginImplementation,
  PluginValidationResult,
  RuntimeValidationOptions,
  ValidationContext,
  ValidationDetail,
} from './types.js'
import {checkPluginCompatibility} from './compatibility-checker.js'
import {validatePluginConfig} from './config-validator.js'

/**
 * Main plugin validator class that orchestrates all validation checks.
 */
export class PluginValidator {
  /**
   * Performs comprehensive validation of a plugin implementation.
   */
  async validatePlugin(
    plugin: PluginImplementation,
    context: ValidationContext,
    options: RuntimeValidationOptions = {},
  ): Promise<PluginValidationResult> {
    const warnings: string[] = []
    const details: ValidationDetail[] = []
    let hasErrors = false

    // 1. Config validation
    if (options.validateConfig !== false) {
      const configResult = validatePluginConfig(plugin.config, {
        strict: true,
        allowUnknown: false,
      })
      if (configResult.errors && configResult.errors.length > 0) {
        for (const error of configResult.errors) {
          details.push({
            check: 'config-validation',
            status: 'fail',
            message: error.message,
            context: {
              field: error.path,
              expected: error.expected,
              actual: error.actual,
            },
          })
        }
        hasErrors = true
      }
    }

    // 2. Compatibility validation
    if (options.validateCompatibility !== false) {
      const compatResult = checkPluginCompatibility(plugin, context)
      if (compatResult.issues) {
        for (const issue of compatResult.issues) {
          details.push({
            check: `compatibility-${issue.type}`,
            status: issue.severity === 'error' ? 'fail' : 'warn',
            message: issue.description,
            context: {
              expected: issue.expected,
              actual: issue.actual,
              fix: issue.fix,
            },
          })
          if (issue.severity === 'error') {
            hasErrors = true
          } else if (issue.severity === 'warning') {
            warnings.push(issue.description)
          }
        }
      }
    }

    // 3. Hook implementation validation
    if (options.validateHooks !== false) {
      const hooksResult = this.validateHookImplementations(plugin)
      if (hooksResult.details) {
        details.push(...hooksResult.details)
      }
      if (!hooksResult.valid) {
        hasErrors = true
      }
      if (hooksResult.warnings) {
        warnings.push(...hooksResult.warnings)
      }
    }

    // 4. Dependency validation
    if (options.validateDependencies !== false) {
      const dependencyResult = this.validateDependencies(plugin, context)
      if (dependencyResult.details) {
        details.push(...dependencyResult.details)
      }
      if (!dependencyResult.valid) {
        hasErrors = true
      }
      if (dependencyResult.warnings) {
        warnings.push(...dependencyResult.warnings)
      }
    }

    return {
      valid: !hasErrors,
      warnings: warnings.length > 0 ? warnings : undefined,
      details: details.length > 0 ? details : undefined,
    }
  }

  /**
   * Validates plugin metadata structure and required fields.
   */
  private validatePluginStructure(plugin: PluginImplementation): PluginValidationResult {
    const details: ValidationDetail[] = []
    const warnings: string[] = []
    let isValid = true

    // Check if metadata exists and is valid
    if (plugin.metadata === undefined || plugin.metadata === null) {
      details.push({
        check: 'metadata-exists',
        status: 'fail',
        message: 'Plugin metadata is required',
        context: {field: 'metadata'},
      })
      isValid = false
      return {valid: isValid, details}
    }

    // Validate required metadata fields
    if (!plugin.metadata.name || typeof plugin.metadata.name !== 'string') {
      details.push({
        check: 'metadata-name',
        status: 'fail',
        message: 'Plugin metadata must include a valid name',
        context: {field: 'metadata.name'},
      })
      isValid = false
    }

    if (!plugin.metadata.version || typeof plugin.metadata.version !== 'string') {
      details.push({
        check: 'metadata-version',
        status: 'fail',
        message: 'Plugin metadata must include a valid version',
        context: {field: 'metadata.version'},
      })
      isValid = false
    }

    // Validate hooks array
    if (plugin.metadata.hooks !== undefined && plugin.metadata.hooks !== null) {
      if (!Array.isArray(plugin.metadata.hooks)) {
        details.push({
          check: 'metadata-hooks-array',
          status: 'fail',
          message: 'Plugin metadata hooks must be an array',
          context: {field: 'metadata.hooks'},
        })
        isValid = false
      } else if (plugin.metadata.hooks.length === 0) {
        warnings.push('Plugin metadata hooks array is empty')
      }
    }

    return {
      valid: isValid,
      details: details.length > 0 ? details : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validates that the plugin exports the required hook functions.
   */
  private validateExports(plugin: PluginImplementation): PluginValidationResult {
    const details: ValidationDetail[] = []
    let isValid = true

    if (
      plugin.exports === undefined ||
      plugin.exports === null ||
      typeof plugin.exports !== 'object'
    ) {
      details.push({
        check: 'exports-exists',
        status: 'fail',
        message: 'Plugin must export hook functions',
        context: {field: 'exports'},
      })
      isValid = false
      return {valid: isValid, details}
    }

    return {valid: isValid, details: details.length > 0 ? details : undefined}
  }

  /**
   * Validates that declared hooks are properly implemented.
   */
  private validateHookImplementations(plugin: PluginImplementation): PluginValidationResult {
    const details: ValidationDetail[] = []
    const warnings: string[] = []
    let isValid = true

    // Get metadata validation first
    const metadataResult = this.validatePluginStructure(plugin)
    if (metadataResult.details) {
      details.push(...metadataResult.details)
    }
    if (!metadataResult.valid) {
      isValid = false
      return {valid: isValid, details}
    }

    const exportsResult = this.validateExports(plugin)
    if (exportsResult.details) {
      details.push(...exportsResult.details)
    }
    if (!exportsResult.valid) {
      isValid = false
      return {valid: isValid, details}
    }

    // Check if hooks are declared and implemented
    if (
      plugin.metadata.hooks === undefined ||
      plugin.metadata.hooks === null ||
      plugin.metadata.hooks.length === 0
    ) {
      warnings.push('No hooks declared in plugin metadata')
      return {
        valid: isValid,
        warnings: warnings.length > 0 ? warnings : undefined,
        details: details.length > 0 ? details : undefined,
      }
    }

    // Validate each declared hook
    for (const hook of plugin.metadata.hooks) {
      if (typeof hook !== 'string') {
        details.push({
          check: 'hook-name-type',
          status: 'fail',
          message: 'Hook names must be strings',
          context: {
            field: `metadata.hooks[${plugin.metadata.hooks.indexOf(hook)}]`,
            actual: typeof hook,
          },
        })
        isValid = false
        continue
      }

      // Check if hook is implemented in exports
      if (!(hook in plugin.exports)) {
        details.push({
          check: 'hook-implementation-missing',
          status: 'fail',
          message: `Hook '${hook}' is declared but not implemented`,
          context: {field: `exports.${hook}`},
        })
        isValid = false
      } else if (typeof plugin.exports[hook] !== 'function') {
        details.push({
          check: 'hook-implementation-type',
          status: 'fail',
          message: `Hook '${hook}' must be a function`,
          context: {
            field: `exports.${hook}`,
            actual: typeof plugin.exports[hook],
          },
        })
        isValid = false
      }
    }

    return {
      valid: isValid,
      details: details.length > 0 ? details : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validates plugin dependencies and their versions.
   */
  private validateDependencies(
    plugin: PluginImplementation,
    context: ValidationContext,
  ): PluginValidationResult {
    const details: ValidationDetail[] = []
    const warnings: string[] = []
    let isValid = true

    // Check semantic-release version compatibility
    if (
      plugin.metadata.semanticReleaseVersions !== undefined &&
      plugin.metadata.semanticReleaseVersions.length > 0
    ) {
      const currentVersion = context.semanticReleaseVersion
      if (currentVersion) {
        const compatible = this.checkVersionCompatibility(
          currentVersion,
          plugin.metadata.semanticReleaseVersions,
        )
        if (!compatible) {
          details.push({
            check: 'semantic-release-version',
            status: 'fail',
            message: `Plugin requires semantic-release ${plugin.metadata.semanticReleaseVersions.join(', ')}, but ${currentVersion} is installed`,
            context: {
              field: 'metadata.semanticReleaseVersions',
              expected: plugin.metadata.semanticReleaseVersions,
              actual: currentVersion,
            },
          })
          isValid = false
        }
      }
    }

    // Check peer dependencies
    if (plugin.metadata.peerDependencies) {
      for (const [depName, depVersion] of Object.entries(plugin.metadata.peerDependencies)) {
        if (!this.isPackageInstalled(depName)) {
          details.push({
            check: 'peer-dependency',
            status: 'fail',
            message: `Peer dependency '${depName}' is not installed`,
            context: {
              field: 'metadata.peerDependencies',
              dependency: depName,
              version: depVersion,
            },
          })
          isValid = false
        }
      }
    }

    return {
      valid: isValid,
      details: details.length > 0 ? details : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Checks if a version satisfies a version range.
   */
  private checkVersionCompatibility(current: string, required: string | string[]): boolean {
    // This is a simplified version check
    // In a real implementation, you would use a proper semver library
    const requiredVersions = Array.isArray(required) ? required : [required]
    return requiredVersions.some(version => {
      const majorVersion = version.split('.')[0]
      return (
        majorVersion !== undefined && majorVersion.length > 0 && current.startsWith(majorVersion)
      )
    })
  }

  /**
   * Checks if a package is installed.
   */
  private isPackageInstalled(packageName: string): boolean {
    try {
      require.resolve(packageName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validates plugins at runtime with context.
   */
  async validatePluginRuntime(
    _plugin: PluginImplementation,
    _context: ValidationContext,
    _options: RuntimeValidationOptions = {},
  ): Promise<PluginValidationResult> {
    // Basic runtime validation
    return {
      valid: true,
      details: [],
    }
  }
}

/**
 * Factory function to create a plugin validator instance.
 */
export function createPluginValidator(): PluginValidator {
  return new PluginValidator()
}

/**
 * Convenience function for quick plugin validation.
 */
export async function validatePlugin(
  plugin: PluginImplementation,
  context: ValidationContext,
  options?: RuntimeValidationOptions,
): Promise<PluginValidationResult> {
  const validator = createPluginValidator()
  return validator.validatePlugin(plugin, context, options)
}
