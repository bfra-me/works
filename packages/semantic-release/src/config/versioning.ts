/**
 * Preset versioning and migration utilities for semantic-release configurations.
 *
 * This module provides utilities for managing preset versions, detecting compatibility,
 * and migrating configurations between different preset versions.
 */

import type {GlobalConfig} from '../types/core.js'

/**
 * Preset version information.
 */
export interface PresetVersion {
  /**
   * The version identifier (e.g., '1.0.0', '2.1.0').
   */
  version: string

  /**
   * When this version was released.
   */
  releaseDate: Date

  /**
   * Whether this version contains breaking changes.
   */
  breaking: boolean

  /**
   * Description of changes in this version.
   */
  description: string

  /**
   * Migration path from previous versions.
   */
  migrations?: PresetMigration[]

  /**
   * Compatibility information.
   */
  compatibility: {
    /**
     * Minimum semantic-release version required.
     */
    semanticRelease: string

    /**
     * Node.js version requirements.
     */
    node: string

    /**
     * Compatible preset versions that can be mixed.
     */
    presets?: string[]
  }
}

/**
 * Preset migration definition.
 */
export interface PresetMigration {
  /**
   * Source version range this migration applies to.
   */
  from: string

  /**
   * Target version this migration produces.
   */
  to: string

  /**
   * Whether this migration has breaking changes.
   */
  breaking: boolean

  /**
   * Description of the migration.
   */
  description: string

  /**
   * Migration transform function.
   */
  transform: (config: GlobalConfig) => GlobalConfig

  /**
   * Validation function to check if migration is needed.
   */
  isApplicable?: (config: GlobalConfig) => boolean

  /**
   * Post-migration validation.
   */
  validate?: (config: GlobalConfig) => {valid: boolean; errors?: string[]}
}

/**
 * Preset registry with version information.
 */
export interface PresetRegistry {
  /**
   * Registry of available preset versions.
   */
  presets: Record<string, PresetVersion[]>

  /**
   * Currently active versions.
   */
  current: Record<string, string>

  /**
   * Migration paths between versions.
   */
  migrations: Record<string, PresetMigration[]>
}

/**
 * Configuration migration result.
 */
export interface MigrationResult {
  /**
   * Whether migration was successful.
   */
  success: boolean

  /**
   * Migrated configuration (if successful).
   */
  config?: GlobalConfig

  /**
   * Version after migration.
   */
  version?: string

  /**
   * Migration steps that were applied.
   */
  appliedMigrations?: string[]

  /**
   * Warnings encountered during migration.
   */
  warnings?: string[]

  /**
   * Errors that prevented migration.
   */
  errors?: string[]
}

/**
 * Version compatibility check result.
 */
export interface CompatibilityResult {
  /**
   * Whether versions are compatible.
   */
  compatible: boolean

  /**
   * Compatibility issues found.
   */
  issues?: CompatibilityIssue[]

  /**
   * Suggested actions to resolve issues.
   */
  suggestions?: string[]
}

/**
 * Compatibility issue information.
 */
export interface CompatibilityIssue {
  /**
   * Type of compatibility issue.
   */
  type: 'version-mismatch' | 'breaking-change' | 'dependency-conflict' | 'feature-removed'

  /**
   * Affected component or feature.
   */
  component: string

  /**
   * Description of the issue.
   */
  description: string

  /**
   * Severity of the issue.
   */
  severity: 'error' | 'warning' | 'info'

  /**
   * Suggested resolution.
   */
  resolution?: string
}

/**
 * Default preset registry with version information.
 */
const DEFAULT_PRESET_REGISTRY: PresetRegistry = {
  presets: {
    npm: [
      {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        breaking: false,
        description: 'Initial npm preset with conventional commits and GitHub integration',
        compatibility: {
          semanticRelease: '>=21.0.0',
          node: '>=18.0.0',
        },
      },
      {
        version: '2.0.0',
        releaseDate: new Date('2024-06-01'),
        breaking: true,
        description: 'Enhanced npm preset with improved changelog generation and validation',
        migrations: [
          {
            from: '^1.0.0',
            to: '2.0.0',
            breaking: true,
            description: 'Migrate from v1 changelog format to v2 with improved templates',
            transform: (config: GlobalConfig) => {
              // Migration logic for npm preset v1 -> v2
              return {
                ...config,
                plugins: config.plugins?.map(plugin => {
                  if (typeof plugin === 'string' && plugin === '@semantic-release/changelog') {
                    return ['@semantic-release/changelog', {changelogTitle: '# Changelog\n\n'}]
                  }
                  if (Array.isArray(plugin) && plugin[0] === '@semantic-release/changelog') {
                    return [
                      plugin[0],
                      {
                        ...(plugin[1] as Record<string, unknown> | undefined),
                        changelogTitle:
                          (plugin[1] as Record<string, unknown> | undefined)?.changelogTitle ??
                          '# Changelog\n\n',
                      },
                    ]
                  }
                  return plugin
                }),
              }
            },
          },
        ],
        compatibility: {
          semanticRelease: '>=23.0.0',
          node: '>=18.0.0',
        },
      },
    ],
    github: [
      {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        breaking: false,
        description: 'Initial GitHub-only preset for projects without npm publishing',
        compatibility: {
          semanticRelease: '>=21.0.0',
          node: '>=18.0.0',
        },
      },
    ],
    monorepo: [
      {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        breaking: false,
        description: 'Initial monorepo preset with basic package-aware configuration',
        compatibility: {
          semanticRelease: '>=21.0.0',
          node: '>=18.0.0',
        },
      },
      {
        version: '2.0.0',
        releaseDate: new Date('2024-12-01'),
        breaking: true,
        description:
          'Enhanced monorepo preset with changesets integration and improved package handling',
        migrations: [
          {
            from: '^1.0.0',
            to: '2.0.0',
            breaking: true,
            description: 'Add changesets integration and update package handling',
            transform: (config: GlobalConfig) => {
              // Migration logic would be added here
              return config
            },
          },
        ],
        compatibility: {
          semanticRelease: '>=23.0.0',
          node: '>=18.0.0',
        },
      },
    ],
  },
  current: {
    npm: '2.0.0',
    github: '1.0.0',
    monorepo: '2.0.0',
  },
  migrations: {},
}

/**
 * Preset versioning manager.
 */
export class PresetVersionManager {
  private readonly registry: PresetRegistry

  constructor(registry: PresetRegistry = DEFAULT_PRESET_REGISTRY) {
    this.registry = registry
  }

  /**
   * Get available versions for a preset.
   */
  getAvailableVersions(presetName: string): PresetVersion[] {
    return this.registry.presets[presetName] ?? []
  }

  /**
   * Get current version for a preset.
   */
  getCurrentVersion(presetName: string): string | undefined {
    return this.registry.current[presetName]
  }

  /**
   * Get version information for a specific preset version.
   */
  getVersionInfo(presetName: string, version: string): PresetVersion | undefined {
    const versions = this.getAvailableVersions(presetName)
    return versions.find(v => v.version === version)
  }

  /**
   * Check compatibility between preset versions.
   */
  checkCompatibility(
    presetName: string,
    fromVersion: string,
    toVersion: string,
  ): CompatibilityResult {
    const fromInfo = this.getVersionInfo(presetName, fromVersion)
    const toInfo = this.getVersionInfo(presetName, toVersion)

    if (fromInfo === undefined) {
      return {
        compatible: false,
        issues: [
          {
            type: 'version-mismatch',
            component: presetName,
            description: `Source version ${fromVersion} not found`,
            severity: 'error',
          },
        ],
      }
    }

    if (toInfo === undefined) {
      return {
        compatible: false,
        issues: [
          {
            type: 'version-mismatch',
            component: presetName,
            description: `Target version ${toVersion} not found`,
            severity: 'error',
          },
        ],
      }
    }

    const issues: CompatibilityIssue[] = []
    const suggestions: string[] = []

    // Check for breaking changes
    if (toInfo.breaking && this.compareVersions(fromVersion, toVersion) < 0) {
      issues.push({
        type: 'breaking-change',
        component: presetName,
        description: `Version ${toVersion} contains breaking changes`,
        severity: 'warning',
        resolution: 'Review migration guide and test thoroughly',
      })
      suggestions.push(`Review breaking changes in ${presetName} v${toVersion}`)
    }

    // Check semantic-release compatibility
    if (
      !this.isVersionCompatible(
        fromInfo.compatibility.semanticRelease,
        toInfo.compatibility.semanticRelease,
      )
    ) {
      issues.push({
        type: 'dependency-conflict',
        component: 'semantic-release',
        description: 'semantic-release version requirement changed',
        severity: 'error',
        resolution: `Update semantic-release to ${toInfo.compatibility.semanticRelease}`,
      })
    }

    return {
      compatible: issues.filter(i => i.severity === 'error').length === 0,
      issues: issues.length > 0 ? issues : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    }
  }

  /**
   * Migrate a configuration to a newer preset version.
   */
  migrateConfig(
    config: GlobalConfig,
    presetName: string,
    fromVersion: string,
    toVersion: string,
  ): MigrationResult {
    const compatibility = this.checkCompatibility(presetName, fromVersion, toVersion)

    if (!compatibility.compatible) {
      return {
        success: false,
        errors: compatibility.issues?.map(i => i.description) ?? ['Unknown compatibility error'],
      }
    }

    const migrations = this.findMigrationPath(presetName, fromVersion, toVersion)
    if (migrations.length === 0) {
      // No migration needed or available
      return {
        success: true,
        config,
        version: toVersion,
        appliedMigrations: [],
      }
    }

    const warnings: string[] = []
    const appliedMigrations: string[] = []
    let currentConfig = config

    try {
      for (const migration of migrations) {
        if (migration.isApplicable?.(currentConfig) === false) {
          continue
        }

        currentConfig = migration.transform(currentConfig)
        appliedMigrations.push(`${migration.from} -> ${migration.to}`)

        if (migration.breaking) {
          warnings.push(`Applied breaking migration: ${migration.description}`)
        }

        // Validate migration result
        if (migration.validate != null) {
          const validation = migration.validate(currentConfig)
          if (!validation.valid) {
            return {
              success: false,
              errors: validation.errors ?? ['Migration validation failed'],
              appliedMigrations,
            }
          }
        }
      }

      return {
        success: true,
        config: currentConfig,
        version: toVersion,
        appliedMigrations,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Migration failed: ${String(error)}`],
        appliedMigrations,
      }
    }
  }

  /**
   * Find migration path between two versions.
   */
  private findMigrationPath(
    presetName: string,
    fromVersion: string,
    toVersion: string,
  ): PresetMigration[] {
    const versions = this.getAvailableVersions(presetName)
    const fromInfo = versions.find(v => v.version === fromVersion)
    const toInfo = versions.find(v => v.version === toVersion)

    if (fromInfo === undefined || toInfo === undefined) {
      return []
    }

    // For now, implement direct migration lookup
    // In a more sophisticated implementation, this would find the optimal path
    const allMigrations = versions.flatMap(v => v.migrations ?? [])
    return allMigrations.filter(
      m => this.isVersionInRange(fromVersion, m.from) && this.compareVersions(m.to, toVersion) <= 0,
    )
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
   * Check if a version is compatible with a requirement range.
   */
  private isVersionCompatible(current: string, required: string): boolean {
    // Simplified version compatibility check
    // In a real implementation, you would use a proper semver library
    if (required.startsWith('>=')) {
      const minVersion = required.slice(2)
      return this.compareVersions(current, minVersion) >= 0
    }

    return current === required
  }

  /**
   * Check if a version is in a given range.
   */
  private isVersionInRange(version: string, range: string): boolean {
    // Simplified range checking
    if (range.startsWith('^')) {
      const baseVersion = range.slice(1)
      const versionParts = version.split('.').map(Number)
      const baseParts = baseVersion.split('.').map(Number)

      // Major version must match for caret range
      return versionParts[0] === baseParts[0] && this.compareVersions(version, baseVersion) >= 0
    }

    return version === range
  }
}

/**
 * Create a new preset version manager.
 */
export function createVersionManager(registry?: PresetRegistry): PresetVersionManager {
  return new PresetVersionManager(registry)
}

/**
 * Default preset version manager instance.
 */
export const defaultVersionManager = new PresetVersionManager()

/**
 * Check compatibility between preset versions.
 */
export function checkPresetCompatibility(
  presetName: string,
  fromVersion: string,
  toVersion: string,
): CompatibilityResult {
  return defaultVersionManager.checkCompatibility(presetName, fromVersion, toVersion)
}

/**
 * Migrate a configuration to a newer preset version.
 */
export function migratePresetConfig(
  config: GlobalConfig,
  presetName: string,
  fromVersion: string,
  toVersion: string,
): MigrationResult {
  return defaultVersionManager.migrateConfig(config, presetName, fromVersion, toVersion)
}

/**
 * Get available versions for a preset.
 */
export function getPresetVersions(presetName: string): PresetVersion[] {
  return defaultVersionManager.getAvailableVersions(presetName)
}

/**
 * Get current version for a preset.
 */
export function getCurrentPresetVersion(presetName: string): string | undefined {
  return defaultVersionManager.getCurrentVersion(presetName)
}
