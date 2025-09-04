/**
 * Preset discovery and installation system for semantic-release configurations.
 *
 * This module provides utilities for discovering, installing, and managing
 * semantic-release presets from various sources including npm registry,
 * local filesystem, and git repositories.
 */

import type {GlobalConfig} from '../types/core.js'
import {promises as fs} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Preset source type.
 */
export type PresetSource = 'npm' | 'local' | 'git' | 'inline'

/**
 * Preset discovery result.
 */
export interface PresetDiscoveryResult {
  /**
   * Discovered presets.
   */
  presets: DiscoveredPreset[]

  /**
   * Total number of presets found.
   */
  total: number

  /**
   * Discovery metadata.
   */
  metadata: {
    /**
     * Time taken for discovery (ms).
     */
    duration: number

    /**
     * Sources that were searched.
     */
    sources: PresetSource[]

    /**
     * Any errors encountered during discovery.
     */
    errors?: string[]
  }
}

/**
 * Discovered preset information.
 */
export interface DiscoveredPreset {
  /**
   * Preset identifier.
   */
  id: string

  /**
   * Display name.
   */
  name: string

  /**
   * Preset description.
   */
  description?: string

  /**
   * Preset version.
   */
  version: string

  /**
   * Source where preset was found.
   */
  source: PresetSource

  /**
   * Source-specific location information.
   */
  location: {
    /**
     * For npm: package name
     * For local: file path
     * For git: repository URL
     * For inline: configuration object
     */
    path: string

    /**
     * Additional metadata about the location.
     */
    metadata?: Record<string, unknown>
  }

  /**
   * Whether the preset is currently installed.
   */
  installed: boolean

  /**
   * Installation status and information.
   */
  installation?: {
    /**
     * Installation method used.
     */
    method: 'npm' | 'copy' | 'clone' | 'inline'

    /**
     * When it was installed.
     */
    installedAt: Date

    /**
     * Installation path.
     */
    installedPath?: string
  }

  /**
   * Preset configuration if available.
   */
  config?: GlobalConfig

  /**
   * Author information.
   */
  author?: string

  /**
   * License information.
   */
  license?: string

  /**
   * Keywords associated with preset.
   */
  keywords?: string[]

  /**
   * Homepage or documentation URL.
   */
  homepage?: string

  /**
   * Repository URL.
   */
  repository?: string

  /**
   * Last update date.
   */
  lastUpdated?: Date
}

/**
 * Preset installation options.
 */
export interface PresetInstallOptions {
  /**
   * Installation method preference.
   */
  method?: 'npm' | 'copy' | 'clone' | 'inline'

  /**
   * Target directory for installation.
   */
  targetDir?: string

  /**
   * Whether to overwrite existing installation.
   */
  overwrite?: boolean

  /**
   * Package manager to use for npm installations.
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm'

  /**
   * Additional options for specific installation methods.
   */
  options?: Record<string, unknown>
}

/**
 * Preset installation result.
 */
export interface PresetInstallResult {
  /**
   * Whether installation was successful.
   */
  success: boolean

  /**
   * Installed preset information.
   */
  preset?: DiscoveredPreset

  /**
   * Installation path.
   */
  installedPath?: string

  /**
   * Installation method used.
   */
  method?: string

  /**
   * Any warnings generated during installation.
   */
  warnings?: string[]

  /**
   * Error message if installation failed.
   */
  error?: string
}

/**
 * Preset discovery options.
 */
export interface PresetDiscoveryOptions {
  /**
   * Sources to search.
   */
  sources?: PresetSource[]

  /**
   * Search paths for local presets.
   */
  searchPaths?: string[]

  /**
   * NPM registry to search.
   */
  npmRegistry?: string

  /**
   * Search patterns for preset names.
   */
  namePatterns?: string[]

  /**
   * Whether to include development/beta presets.
   */
  includeDevelopment?: boolean

  /**
   * Maximum number of results to return.
   */
  maxResults?: number

  /**
   * Timeout for network operations (ms).
   */
  timeout?: number
}

/**
 * Preset discovery and installation service.
 */
export class PresetDiscoveryService {
  private readonly options: Required<PresetDiscoveryOptions>

  constructor(options: PresetDiscoveryOptions = {}) {
    this.options = {
      sources: options.sources ?? ['npm', 'local'],
      searchPaths: options.searchPaths ?? ['./presets', './configs', './semantic-release'],
      npmRegistry: options.npmRegistry ?? 'https://registry.npmjs.org',
      namePatterns: options.namePatterns ?? [
        'semantic-release-preset-*',
        'semantic-release-config-*',
        '@*/semantic-release-preset',
        '@*/semantic-release-config',
      ],
      includeDevelopment: options.includeDevelopment ?? false,
      maxResults: options.maxResults ?? 50,
      timeout: options.timeout ?? 10000,
    }
  }

  /**
   * Discover available presets from configured sources.
   */
  async discoverPresets(options?: Partial<PresetDiscoveryOptions>): Promise<PresetDiscoveryResult> {
    const startTime = Date.now()
    const searchOptions = {...this.options, ...options}
    const presets: DiscoveredPreset[] = []
    const errors: string[] = []

    for (const source of searchOptions.sources) {
      try {
        const sourcePresets = await this.discoverFromSource(source, searchOptions)
        presets.push(...sourcePresets)
      } catch (error) {
        errors.push(`Error discovering from ${source}: ${String(error)}`)
      }
    }

    // Remove duplicates and apply limits
    const uniquePresets = this.deduplicatePresets(presets)
    const limitedPresets =
      searchOptions.maxResults > 0
        ? uniquePresets.slice(0, searchOptions.maxResults)
        : uniquePresets

    const duration = Date.now() - startTime

    return {
      presets: limitedPresets,
      total: limitedPresets.length,
      metadata: {
        duration,
        sources: searchOptions.sources,
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  }

  /**
   * Install a discovered preset.
   */
  async installPreset(
    preset: DiscoveredPreset,
    options: PresetInstallOptions = {},
  ): Promise<PresetInstallResult> {
    try {
      const method = options.method ?? this.getDefaultInstallMethod(preset)

      switch (method) {
        case 'npm':
          return await this.installFromNpm(preset, options)
        case 'copy':
          return await this.installFromLocal(preset, options)
        case 'clone':
          return await this.installFromGit(preset, options)
        case 'inline':
          return await this.installInline(preset, options)
        case undefined:
          return {
            success: false,
            error: 'No installation method specified',
          }
        default: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const _exhaustiveCheck: never = method
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          _exhaustiveCheck
          return {
            success: false,
            error: `Unsupported installation method: ${String(method)}`,
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Installation failed: ${String(error)}`,
      }
    }
  }

  /**
   * Uninstall a preset.
   */
  async uninstallPreset(preset: DiscoveredPreset): Promise<{success: boolean; error?: string}> {
    try {
      if (!preset.installation) {
        return {success: false, error: 'Preset is not installed'}
      }

      switch (preset.installation.method) {
        case 'npm':
          // For npm packages, we can't uninstall automatically
          return {
            success: false,
            error: 'NPM packages must be uninstalled manually using your package manager',
          }
        case 'copy':
        case 'clone':
          if (
            preset.installation.installedPath != null &&
            preset.installation.installedPath.length > 0
          ) {
            await fs.rm(preset.installation.installedPath, {recursive: true, force: true})
          }
          return {success: true}
        case 'inline':
          // Inline presets don't need uninstallation
          return {success: true}
        default:
          return {success: false, error: 'Unknown installation method'}
      }
    } catch (error) {
      return {success: false, error: String(error)}
    }
  }

  /**
   * Get installed presets.
   */
  async getInstalledPresets(): Promise<DiscoveredPreset[]> {
    const result = await this.discoverPresets()
    return result.presets.filter(p => p.installed)
  }

  /**
   * Search for presets by name or keywords.
   */
  async searchPresets(
    query: string,
    options?: PresetDiscoveryOptions,
  ): Promise<PresetDiscoveryResult> {
    const searchOptions = {
      ...options,
      namePatterns: [`*${query}*`],
    }

    const result = await this.discoverPresets(searchOptions)

    // Filter results by relevance to query
    const filteredPresets = result.presets.filter(
      preset =>
        preset.name.toLowerCase().includes(query.toLowerCase()) ||
        preset.description?.toLowerCase().includes(query.toLowerCase()) ||
        preset.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase())),
    )

    return {
      ...result,
      presets: filteredPresets,
      total: filteredPresets.length,
    }
  }

  /**
   * Discover presets from a specific source.
   */
  private async discoverFromSource(
    source: PresetSource,
    options: Required<PresetDiscoveryOptions>,
  ): Promise<DiscoveredPreset[]> {
    switch (source) {
      case 'npm':
        return this.discoverFromNpm(options)
      case 'local':
        return this.discoverFromLocal(options)
      case 'git':
        return this.discoverFromGit(options)
      case 'inline':
        return this.discoverInlinePresets(options)
      default:
        return []
    }
  }

  /**
   * Discover presets from npm registry.
   */
  private async discoverFromNpm(
    options: Required<PresetDiscoveryOptions>,
  ): Promise<DiscoveredPreset[]> {
    // This is a simplified implementation
    // In a real implementation, you would query the npm registry API
    const presets: DiscoveredPreset[] = []

    // Example known presets that might be found
    const knownPresets = [
      {
        name: '@semantic-release/preset-conventionalcommits',
        version: '1.0.0',
        description: 'Conventional commits preset for semantic-release',
      },
      {
        name: 'semantic-release-preset-github',
        version: '2.1.0',
        description: 'GitHub-optimized preset for semantic-release',
      },
    ]

    for (const preset of knownPresets) {
      presets.push({
        id: preset.name,
        name: preset.name,
        description: preset.description,
        version: preset.version,
        source: 'npm',
        location: {
          path: preset.name,
          metadata: {
            registry: options.npmRegistry,
          },
        },
        installed: await this.isNpmPackageInstalled(preset.name),
        lastUpdated: new Date(),
      })
    }

    return presets
  }

  /**
   * Discover presets from local filesystem.
   */
  private async discoverFromLocal(
    options: Required<PresetDiscoveryOptions>,
  ): Promise<DiscoveredPreset[]> {
    const presets: DiscoveredPreset[] = []

    for (const searchPath of options.searchPaths) {
      try {
        const absolutePath = path.isAbsolute(searchPath)
          ? searchPath
          : path.resolve(process.cwd(), searchPath)

        const pathPresets = await this.scanDirectoryForPresets(absolutePath)
        presets.push(...pathPresets)
      } catch {
        // Directory doesn't exist or is not accessible, skip
      }
    }

    return presets
  }

  /**
   * Discover presets from git repositories.
   */
  private async discoverFromGit(
    _options: Required<PresetDiscoveryOptions>,
  ): Promise<DiscoveredPreset[]> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Search GitHub/GitLab for semantic-release preset repositories
    // 2. Clone and analyze repositories for preset configurations
    // 3. Return discovered presets with git source information
    return []
  }

  /**
   * Discover inline preset configurations.
   */
  private async discoverInlinePresets(
    _options: Required<PresetDiscoveryOptions>,
  ): Promise<DiscoveredPreset[]> {
    // This would discover presets defined inline in configuration files
    // For now, return empty array
    return []
  }

  /**
   * Scan directory for preset files.
   */
  private async scanDirectoryForPresets(dirPath: string): Promise<DiscoveredPreset[]> {
    const presets: DiscoveredPreset[] = []

    try {
      const entries = await fs.readdir(dirPath, {withFileTypes: true})

      for (const entry of entries) {
        if (entry.isFile() && this.isPresetFile(entry.name)) {
          const filePath = path.join(dirPath, entry.name)
          const preset = await this.loadPresetFromFile(filePath)
          if (preset) {
            presets.push(preset)
          }
        }
      }
    } catch {
      // Directory read failed, return empty array
    }

    return presets
  }

  /**
   * Check if a file is a preset configuration file.
   */
  private isPresetFile(filename: string): boolean {
    const presetPatterns = [
      /^semantic-release\.preset\./,
      /^preset\./,
      /\.preset\.(js|ts|json|mjs|cjs)$/,
      /^release\.config\./,
    ]

    return presetPatterns.some(pattern => pattern.test(filename))
  }

  /**
   * Load preset from a file.
   */
  private async loadPresetFromFile(filePath: string): Promise<DiscoveredPreset | undefined> {
    try {
      const stats = await fs.stat(filePath)
      const content = await fs.readFile(filePath, 'utf8')

      let config: GlobalConfig | undefined
      let name = path.basename(filePath, path.extname(filePath))
      let description: string | undefined

      // Try to parse as JSON first
      if (filePath.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content) as Record<string, unknown>
          config = (parsed.config ?? parsed) as GlobalConfig
          name = (parsed.name as string) ?? name
          description = parsed.description as string | undefined
        } catch {
          return undefined
        }
      }

      return {
        id: `local:${filePath}`,
        name,
        description,
        version: '1.0.0', // Default version for local presets
        source: 'local',
        location: {
          path: filePath,
        },
        installed: true, // Local files are considered "installed"
        config,
        lastUpdated: stats.mtime,
      }
    } catch {
      return undefined
    }
  }

  /**
   * Check if an npm package is installed.
   */
  private async isNpmPackageInstalled(packageName: string): Promise<boolean> {
    try {
      require.resolve(packageName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Install preset from npm.
   */
  private async installFromNpm(
    preset: DiscoveredPreset,
    _options: PresetInstallOptions,
  ): Promise<PresetInstallResult> {
    // This is a simplified implementation
    // In a real implementation, you would execute npm/yarn/pnpm commands
    return {
      success: false,
      error: `NPM installation not implemented - use your package manager to install: ${preset.location.path}`,
    }
  }

  /**
   * Install preset from local source.
   */
  private async installFromLocal(
    preset: DiscoveredPreset,
    options: PresetInstallOptions,
  ): Promise<PresetInstallResult> {
    const targetDir = options.targetDir ?? './semantic-release-presets'
    const targetPath = path.join(targetDir, `${preset.name}.preset.json`)

    try {
      await fs.mkdir(targetDir, {recursive: true})

      if (!options.overwrite && (await this.fileExists(targetPath))) {
        return {
          success: false,
          error: 'Preset already exists. Use overwrite option to replace.',
        }
      }

      const content = JSON.stringify(
        {
          name: preset.name,
          description: preset.description,
          version: preset.version,
          config: preset.config,
          source: preset.source,
          installedAt: new Date().toISOString(),
        },
        null,
        2,
      )

      await fs.writeFile(targetPath, content)

      return {
        success: true,
        preset: {
          ...preset,
          installation: {
            method: 'copy',
            installedAt: new Date(),
            installedPath: targetPath,
          },
        },
        installedPath: targetPath,
        method: 'copy',
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      }
    }
  }

  /**
   * Install preset from git repository.
   */
  private async installFromGit(
    _preset: DiscoveredPreset,
    _options: PresetInstallOptions,
  ): Promise<PresetInstallResult> {
    return {
      success: false,
      error: 'Git installation not implemented',
    }
  }

  /**
   * Install inline preset.
   */
  private async installInline(
    preset: DiscoveredPreset,
    _options: PresetInstallOptions,
  ): Promise<PresetInstallResult> {
    return {
      success: true,
      preset: {
        ...preset,
        installation: {
          method: 'inline',
          installedAt: new Date(),
        },
      },
      method: 'inline',
    }
  }

  /**
   * Get default installation method for a preset.
   */
  private getDefaultInstallMethod(preset: DiscoveredPreset): PresetInstallOptions['method'] {
    switch (preset.source) {
      case 'npm':
        return 'npm'
      case 'local':
        return 'copy'
      case 'git':
        return 'clone'
      case 'inline':
        return 'inline'
      default:
        return 'copy'
    }
  }

  /**
   * Remove duplicate presets based on ID.
   */
  private deduplicatePresets(presets: DiscoveredPreset[]): DiscoveredPreset[] {
    const seen = new Set<string>()
    const unique: DiscoveredPreset[] = []

    for (const preset of presets) {
      if (!seen.has(preset.id)) {
        seen.add(preset.id)
        unique.push(preset)
      }
    }

    return unique
  }

  /**
   * Check if a file exists.
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create a new preset discovery service.
 */
export function createPresetDiscoveryService(
  options?: PresetDiscoveryOptions,
): PresetDiscoveryService {
  return new PresetDiscoveryService(options)
}

/**
 * Default preset discovery service instance.
 */
export const defaultDiscoveryService = new PresetDiscoveryService()

/**
 * Discover available presets.
 */
export async function discoverPresets(
  options?: PresetDiscoveryOptions,
): Promise<PresetDiscoveryResult> {
  return defaultDiscoveryService.discoverPresets(options)
}

/**
 * Install a preset.
 */
export async function installPreset(
  preset: DiscoveredPreset,
  options?: PresetInstallOptions,
): Promise<PresetInstallResult> {
  return defaultDiscoveryService.installPreset(preset, options)
}

/**
 * Search for presets.
 */
export async function searchPresets(
  query: string,
  options?: PresetDiscoveryOptions,
): Promise<PresetDiscoveryResult> {
  return defaultDiscoveryService.searchPresets(query, options)
}

/**
 * Get installed presets.
 */
export async function getInstalledPresets(): Promise<DiscoveredPreset[]> {
  return defaultDiscoveryService.getInstalledPresets()
}
