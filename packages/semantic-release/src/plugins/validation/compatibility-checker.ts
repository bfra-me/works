/**
 * Plugin compatibility checking utilities.
 */

import type {
  CompatibilityIssue,
  CompatibilityResult,
  PluginImplementation,
  PluginLifecycleHook,
  PluginMetadata,
  ValidationContext,
} from './types.js'

/**
 * Semantic-release version ranges and their supported features.
 */
const SEMANTIC_RELEASE_FEATURES: Record<
  string,
  {
    hooks: PluginLifecycleHook[]
    minVersion: string
    features: string[]
  }
> = {
  v21: {
    minVersion: '21.0.0',
    hooks: [
      'verifyConditions',
      'analyzeCommits',
      'verifyRelease',
      'generateNotes',
      'prepare',
      'publish',
      'success',
      'fail',
    ],
    features: ['modern-context', 'async-hooks', 'plugin-config-validation'],
  },
  v22: {
    minVersion: '22.0.0',
    hooks: [
      'verifyConditions',
      'analyzeCommits',
      'verifyRelease',
      'generateNotes',
      'prepare',
      'publish',
      'success',
      'fail',
    ],
    features: [
      'modern-context',
      'async-hooks',
      'plugin-config-validation',
      'enhanced-error-handling',
    ],
  },
  v23: {
    minVersion: '23.0.0',
    hooks: [
      'verifyConditions',
      'analyzeCommits',
      'verifyRelease',
      'generateNotes',
      'prepare',
      'publish',
      'success',
      'fail',
    ],
    features: [
      'modern-context',
      'async-hooks',
      'plugin-config-validation',
      'enhanced-error-handling',
      'improved-git-support',
    ],
  },
  v24: {
    minVersion: '24.0.0',
    hooks: [
      'verifyConditions',
      'analyzeCommits',
      'verifyRelease',
      'generateNotes',
      'prepare',
      'publish',
      'success',
      'fail',
    ],
    features: [
      'modern-context',
      'async-hooks',
      'plugin-config-validation',
      'enhanced-error-handling',
      'improved-git-support',
      'typescript-support',
    ],
  },
}

/**
 * Plugin compatibility checker class.
 */
export class PluginCompatibilityChecker {
  /**
   * Check plugin compatibility with semantic-release version.
   *
   * @param plugin - Plugin implementation to check
   * @param context - Validation context
   * @returns Compatibility result
   */
  checkCompatibility(
    plugin: PluginImplementation,
    context: ValidationContext,
  ): CompatibilityResult {
    const issues: CompatibilityIssue[] = []

    // Check semantic-release version compatibility
    const versionIssues = this.checkVersionCompatibility(
      plugin.metadata,
      context.semanticReleaseVersion,
    )
    issues.push(...versionIssues)

    // Check hook implementation compatibility
    const hookIssues = this.checkHookCompatibility(
      plugin.metadata,
      plugin.exports,
      context.semanticReleaseVersion,
    )
    issues.push(...hookIssues)

    // Check dependency compatibility
    const dependencyIssues = this.checkDependencyCompatibility(plugin.metadata, context)
    issues.push(...dependencyIssues)

    // Check configuration compatibility
    const configIssues = this.checkConfigCompatibility(plugin.metadata, plugin.config)
    issues.push(...configIssues)

    // Determine overall compatibility
    const hasErrors = issues.some(issue => issue.severity === 'error')
    const hasWarnings = issues.some(issue => issue.severity === 'warning')

    let level: 'full' | 'partial' | 'none'
    if (hasErrors) {
      level = 'none'
    } else if (hasWarnings) {
      level = 'partial'
    } else {
      level = 'full'
    }

    return {
      compatible: !hasErrors,
      level,
      issues: issues.length > 0 ? issues : undefined,
      recommendations: this.generateRecommendations(issues),
    }
  }

  /**
   * Check if plugin is compatible with specific semantic-release version.
   *
   * @param metadata - Plugin metadata
   * @param version - Semantic-release version to check
   * @returns Array of compatibility issues
   */
  private checkVersionCompatibility(
    metadata: PluginMetadata,
    version: string,
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []

    if (metadata.semanticReleaseVersions?.length === 0) {
      issues.push({
        type: 'version',
        severity: 'warning',
        description: 'Plugin does not specify supported semantic-release versions',
        expected: 'Specified version ranges',
        actual: 'undefined',
        fix: 'Add semanticReleaseVersions to plugin metadata',
      })
      return issues
    }

    const isCompatible = metadata.semanticReleaseVersions.some(supportedVersion =>
      this.isVersionCompatible(version, supportedVersion),
    )

    if (!isCompatible) {
      issues.push({
        type: 'version',
        severity: 'error',
        description: `Plugin is not compatible with semantic-release version ${version}`,
        expected: metadata.semanticReleaseVersions.join(' || '),
        actual: version,
        fix: 'Update plugin to support current semantic-release version or downgrade semantic-release',
      })
    }

    return issues
  }

  /**
   * Check hook implementation compatibility.
   *
   * @param metadata - Plugin metadata
   * @param exports - Plugin exports
   * @param version - Semantic-release version
   * @returns Array of compatibility issues
   */
  private checkHookCompatibility(
    metadata: PluginMetadata,
    exports: Record<string, unknown>,
    version: string,
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []

    // Get supported hooks for the version
    const versionKey = this.getVersionKey(version)
    const supportedHooks = SEMANTIC_RELEASE_FEATURES[versionKey]?.hooks ?? []

    // Check if declared hooks are supported
    for (const hook of metadata.hooks) {
      if (!supportedHooks.includes(hook)) {
        issues.push({
          type: 'hook',
          severity: 'error',
          description: `Hook '${hook}' is not supported in semantic-release ${version}`,
          expected: supportedHooks.join(', '),
          actual: hook,
          fix: `Remove unsupported hook or upgrade semantic-release`,
        })
      }

      // Check if hook is implemented
      const hookExport = exports[hook as keyof typeof exports]
      if (hookExport === undefined) {
        issues.push({
          type: 'hook',
          severity: 'error',
          description: `Hook '${hook}' is declared but not implemented`,
          expected: 'Function implementation',
          actual: 'undefined',
          fix: `Implement the ${hook} function or remove from metadata`,
        })
      } else if (typeof hookExport !== 'function') {
        issues.push({
          type: 'hook',
          severity: 'error',
          description: `Hook '${hook}' must be a function`,
          expected: 'function',
          actual: typeof hookExport,
          fix: `Export ${hook} as a function`,
        })
      }
    }

    // Check for implemented but undeclared hooks
    for (const [exportName, exportValue] of Object.entries(exports)) {
      const isFunction = typeof exportValue === 'function'
      const isSupportedHook = supportedHooks.includes(exportName as PluginLifecycleHook)
      const isDeclared = metadata.hooks.includes(exportName as PluginLifecycleHook)

      if (isFunction && isSupportedHook && !isDeclared) {
        issues.push({
          type: 'hook',
          severity: 'warning',
          description: `Hook '${exportName}' is implemented but not declared in metadata`,
          expected: 'Declared in metadata.hooks',
          actual: 'Not declared',
          fix: `Add '${exportName}' to metadata.hooks array`,
        })
      }
    }

    return issues
  }

  /**
   * Check dependency compatibility.
   *
   * @param metadata - Plugin metadata
   * @param context - Validation context
   * @returns Array of compatibility issues
   */
  private checkDependencyCompatibility(
    metadata: PluginMetadata,
    context: ValidationContext,
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []

    // Check peer dependencies
    if (metadata.peerDependencies) {
      for (const [dep, version] of Object.entries(metadata.peerDependencies)) {
        if (dep === 'semantic-release') {
          const isCompatible = this.isVersionCompatible(context.semanticReleaseVersion, version)
          if (!isCompatible) {
            issues.push({
              type: 'dependency',
              severity: 'error',
              description: `Plugin requires semantic-release ${version} but ${context.semanticReleaseVersion} is installed`,
              expected: version,
              actual: context.semanticReleaseVersion,
              fix: 'Install compatible semantic-release version',
            })
          }
        }
      }
    }

    return issues
  }

  /**
   * Check configuration compatibility.
   *
   * @param metadata - Plugin metadata
   * @param config - Plugin configuration
   * @returns Array of compatibility issues
   */
  private checkConfigCompatibility(
    metadata: PluginMetadata,
    config: unknown,
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = []

    if (
      metadata.configSchema !== undefined &&
      config !== undefined && // Basic type checking - in a real implementation this would use a schema validator
      (typeof config !== 'object' || config === null)
    ) {
      issues.push({
        type: 'config',
        severity: 'error',
        description: 'Plugin configuration must be an object',
        expected: 'object',
        actual: typeof config,
        fix: 'Provide configuration as an object',
      })
    }

    return issues
  }

  /**
   * Generate recommendations based on compatibility issues.
   *
   * @param issues - Array of compatibility issues
   * @returns Array of recommendations
   */
  private generateRecommendations(issues: CompatibilityIssue[]): string[] {
    const recommendations: string[] = []
    const seenFixes = new Set<string>()

    for (const issue of issues) {
      if (issue.fix !== undefined && issue.fix.length > 0 && !seenFixes.has(issue.fix)) {
        recommendations.push(issue.fix)
        seenFixes.add(issue.fix)
      }
    }

    return recommendations
  }

  /**
   * Check if version satisfies version range.
   *
   * @param version - Actual version
   * @param range - Version range to check against
   * @returns Whether version is compatible
   */
  private isVersionCompatible(version: string, range: string): boolean {
    // Simplified version checking - in a real implementation this would use semver
    const cleanVersion = version.replace(/^v/, '')
    const cleanRange = range.replace(/^v/, '').replace(/^\^|^~|^>=|^>|^<=|^</, '')

    // Basic major version matching
    const [actualMajor] = cleanVersion.split('.')
    const [expectedMajor] = cleanRange.split('.')

    return actualMajor === expectedMajor
  }

  /**
   * Get version key for feature lookup.
   *
   * @param version - Semantic-release version
   * @returns Version key
   */
  private getVersionKey(version: string): string {
    const cleanVersion = version.replace(/^v/, '')
    const [major] = cleanVersion.split('.')
    return `v${major}`
  }
}

/**
 * Create a new plugin compatibility checker.
 *
 * @returns Plugin compatibility checker instance
 */
export function createCompatibilityChecker(): PluginCompatibilityChecker {
  return new PluginCompatibilityChecker()
}

/**
 * Check plugin compatibility with semantic-release.
 *
 * @param plugin - Plugin implementation to check
 * @param context - Validation context
 * @returns Compatibility result
 */
export function checkPluginCompatibility(
  plugin: PluginImplementation,
  context: ValidationContext,
): CompatibilityResult {
  const checker = createCompatibilityChecker()
  return checker.checkCompatibility(plugin, context)
}
