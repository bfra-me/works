/**
 * Plugin dependency resolution and compatibility checking.
 */

import type {
  PluginDependencyConflict,
  PluginDependencyResult,
  PluginRegistryEntry,
  PluginRegistryValidationContext,
} from './types.js'

/**
 * Service for resolving and validating plugin dependencies.
 */
export class PluginDependencyResolver {
  /**
   * Resolve plugin dependencies and check for conflicts.
   */
  async resolve(
    plugins: PluginRegistryEntry[],
    context: PluginRegistryValidationContext,
  ): Promise<PluginDependencyResult> {
    const missing: string[] = []
    const conflicts: PluginDependencyConflict[] = []
    const suggestions: string[] = []

    // Check each plugin's dependencies
    for (const plugin of plugins) {
      // Check semantic-release version compatibility
      if (!this.isSemanticReleaseCompatible(plugin, context)) {
        missing.push(
          `semantic-release version compatible with ${plugin.semanticReleaseVersions.join(', ')}`,
        )
        suggestions.push(
          `Update semantic-release to version ${plugin.semanticReleaseVersions[0] ?? '>=23.0.0'}`,
        )
      }

      // Check plugin dependencies
      if (plugin.dependencies !== undefined) {
        for (const [depName, depVersion] of Object.entries(plugin.dependencies)) {
          if (!this.isDependencyInstalled(depName)) {
            missing.push(`${depName}@${depVersion}`)
            suggestions.push(`Install dependency: npm install ${depName}@${depVersion}`)
          }
        }
      }

      // Check peer dependencies
      if (plugin.peerDependencies !== undefined) {
        for (const [depName, depVersion] of Object.entries(plugin.peerDependencies)) {
          if (!this.isDependencyInstalled(depName)) {
            missing.push(`${depName}@${depVersion} (peer dependency)`)
            suggestions.push(`Install peer dependency: npm install ${depName}@${depVersion}`)
          }
        }
      }

      // Check for hook conflicts
      const hookConflicts = this.checkHookConflicts(plugin, plugins, context)
      conflicts.push(...hookConflicts)
    }

    return {
      resolved: missing.length === 0 && conflicts.length === 0,
      missing: missing.length > 0 ? missing : undefined,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    }
  }

  /**
   * Check if semantic-release version is compatible with plugin.
   */
  private isSemanticReleaseCompatible(
    plugin: PluginRegistryEntry,
    context: PluginRegistryValidationContext,
  ): boolean {
    const currentVersion = context.semanticReleaseVersion

    return plugin.semanticReleaseVersions.some(requiredVersion => {
      return this.satisfiesVersionRange(currentVersion, requiredVersion)
    })
  }

  /**
   * Check if a dependency is installed.
   */
  private isDependencyInstalled(packageName: string): boolean {
    try {
      require.resolve(packageName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check for hook conflicts between plugins.
   */
  private checkHookConflicts(
    plugin: PluginRegistryEntry,
    allPlugins: PluginRegistryEntry[],
    context: PluginRegistryValidationContext,
  ): PluginDependencyConflict[] {
    const conflicts: PluginDependencyConflict[] = []

    // Check for required hooks that are missing
    if (context.requiredHooks !== undefined) {
      for (const requiredHook of context.requiredHooks) {
        const hasRequiredHook = allPlugins.some(p => p.hooks.includes(requiredHook))
        if (!hasRequiredHook) {
          conflicts.push({
            dependency: `${requiredHook} hook implementation`,
            required: 'present',
            installed: 'missing',
            conflictingPlugins: [plugin.name],
          })
        }
      }
    }

    // Check for forbidden hooks
    if (context.forbiddenHooks !== undefined) {
      for (const forbiddenHook of context.forbiddenHooks) {
        if (plugin.hooks.includes(forbiddenHook)) {
          conflicts.push({
            dependency: `${forbiddenHook} hook implementation`,
            required: 'absent',
            installed: 'present',
            conflictingPlugins: [plugin.name],
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Check if a version satisfies a version range.
   */
  private satisfiesVersionRange(version: string, range: string): boolean {
    // This is a simplified version check
    // In a real implementation, you would use a proper semver library like 'semver'

    // Handle basic range patterns
    if (range.startsWith('>=')) {
      const minVersion = range.slice(2)
      return this.compareVersions(version, minVersion) >= 0
    }

    if (range.startsWith('>')) {
      const minVersion = range.slice(1)
      return this.compareVersions(version, minVersion) > 0
    }

    if (range.startsWith('<=')) {
      const maxVersion = range.slice(2)
      return this.compareVersions(version, maxVersion) <= 0
    }

    if (range.startsWith('<')) {
      const maxVersion = range.slice(1)
      return this.compareVersions(version, maxVersion) < 0
    }

    if (range.startsWith('^')) {
      const baseVersion = range.slice(1)
      return this.isCompatibleCaretRange(version, baseVersion)
    }

    if (range.startsWith('~')) {
      const baseVersion = range.slice(1)
      return this.isCompatibleTildeRange(version, baseVersion)
    }

    // Exact match
    return version === range
  }

  /**
   * Compare two version strings.
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    const maxLength = Math.max(aParts.length, bParts.length)

    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] ?? 0
      const bPart = bParts[i] ?? 0
      if (aPart !== bPart) {
        return aPart - bPart
      }
    }

    return 0
  }

  /**
   * Check if version satisfies caret range (^1.2.3).
   */
  private isCompatibleCaretRange(version: string, baseVersion: string): boolean {
    const versionParts = version.split('.').map(Number)
    const baseParts = baseVersion.split('.').map(Number)

    // Major version must match
    if (versionParts[0] !== baseParts[0]) {
      return false
    }

    // Version must be >= base version
    return this.compareVersions(version, baseVersion) >= 0
  }

  /**
   * Check if version satisfies tilde range (~1.2.3).
   */
  private isCompatibleTildeRange(version: string, baseVersion: string): boolean {
    const versionParts = version.split('.').map(Number)
    const baseParts = baseVersion.split('.').map(Number)

    // Major and minor versions must match
    if (versionParts[0] !== baseParts[0] || versionParts[1] !== baseParts[1]) {
      return false
    }

    // Patch version must be >= base patch version
    return (versionParts[2] ?? 0) >= (baseParts[2] ?? 0)
  }
}
