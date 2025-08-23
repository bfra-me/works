import type {Result, TemplateMetadata, TemplateSource} from '../types.js'
import {existsSync, statSync} from 'node:fs'
import {cp, mkdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {consola} from 'consola'
import {downloadTemplate} from 'giget'
import {glob} from 'glob'
import {templateMetadataManager} from './metadata.js'
import {templateResolver} from './resolver.js'

/**
 * Cache configuration for template fetching.
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean
  /** Cache directory */
  dir: string
  /** Cache TTL in seconds */
  ttl: number
}

/**
 * Template fetcher using giget for downloading and caching templates.
 */
export class TemplateFetcher {
  private readonly cacheConfig: CacheConfig

  constructor(cacheConfig?: Partial<CacheConfig>) {
    const defaultCacheDir = path.join(
      process.env.XDG_CACHE_HOME ?? path.join(process.env.HOME ?? process.cwd(), '.cache'),
      'bfra-me-create',
    )

    this.cacheConfig = {
      enabled: true,
      dir: defaultCacheDir,
      ttl: 3600, // 1 hour
      ...cacheConfig,
    }
  }

  /**
   * Fetch a template from the specified source.
   *
   * @param source - Template source to fetch
   * @param targetDir - Target directory to extract template to
   * @returns Result with template path and metadata
   *
   * @example
   * ```typescript
   * const fetcher = new TemplateFetcher()
   * const result = await fetcher.fetch(
   *   { type: 'github', location: 'user/repo' },
   *   './output'
   * )
   *
   * if (result.success) {
   *   console.log('Template fetched to:', result.data.path)
   *   console.log('Template metadata:', result.data.metadata)
   * }
   * ```
   */
  async fetch(
    source: TemplateSource,
    targetDir: string,
  ): Promise<
    Result<{
      path: string
      metadata: TemplateMetadata
    }>
  > {
    try {
      let templatePath: string

      switch (source.type) {
        case 'github':
          templatePath = await this.fetchGitHub(source, targetDir)
          break

        case 'url':
          templatePath = await this.fetchUrl(source, targetDir)
          break

        case 'local':
          templatePath = await this.fetchLocal(source, targetDir)
          break

        case 'builtin':
          templatePath = await this.fetchBuiltin(source, targetDir)
          break

        default:
          throw new Error(
            `Unsupported template source type: ${String((source as {type?: string}).type)}`,
          )
      }

      // Load template metadata
      const metadata = await this.loadMetadata(templatePath)

      return {
        success: true,
        data: {
          path: templatePath,
          metadata,
        },
      }
    } catch (error) {
      consola.error('Failed to fetch template:', error)
      return {
        success: false,
        error: error as Error,
      }
    }
  }

  /**
   * Clear the template cache.
   */
  async clearCache(): Promise<void> {
    if (!this.cacheConfig.enabled) {
      return
    }

    try {
      const {rm} = await import('node:fs/promises')
      if (existsSync(this.cacheConfig.dir)) {
        await rm(this.cacheConfig.dir, {recursive: true, force: true})
      }
      consola.info('Template cache cleared')
    } catch (error) {
      consola.warn('Failed to clear cache:', error)
    }
  }

  /**
   * Get cache statistics.
   */
  async getCacheInfo(): Promise<{
    size: number
    entries: number
    location: string
  }> {
    const info = {
      size: 0,
      entries: 0,
      location: this.cacheConfig.dir,
    }

    if (!this.cacheConfig.enabled || !existsSync(this.cacheConfig.dir)) {
      return info
    }

    try {
      const {readdir, stat} = await import('node:fs/promises')
      const entries = await readdir(this.cacheConfig.dir)
      info.entries = entries.length

      for (const entry of entries) {
        const entryPath = path.join(this.cacheConfig.dir, entry)
        const stats = await stat(entryPath)
        info.size += stats.size
      }
    } catch {
      // Ignore errors for cache info
    }

    return info
  }

  /**
   * Fetch template from GitHub repository.
   */
  private async fetchGitHub(source: TemplateSource, targetDir: string): Promise<string> {
    const cacheKey = this.getCacheKey('github', source)
    const cachedPath = await this.getFromCache(cacheKey)

    if (cachedPath !== null) {
      await this.copyToTarget(cachedPath, targetDir)
      return targetDir
    }

    // Build GitHub URL
    let githubUrl = `https://github.com/${source.location}`
    if (source.ref !== undefined) {
      githubUrl += `#${source.ref}`
    }
    if (source.subdir !== undefined) {
      githubUrl += `/${source.subdir}`
    }

    // Download using giget
    const tempDir = await this.createTempDir()
    await downloadTemplate(githubUrl, {
      dir: tempDir,
      offline: false,
      force: true,
    })

    // Cache the template
    await this.saveToCache(cacheKey, tempDir)

    // Copy to target
    await this.copyToTarget(tempDir, targetDir)

    return targetDir
  }

  /**
   * Fetch template from URL.
   */
  private async fetchUrl(source: TemplateSource, targetDir: string): Promise<string> {
    // Validate URL format and supported types
    this.validateUrl(source.location)

    const cacheKey = this.getCacheKey('url', source)
    const cachedPath = await this.getFromCache(cacheKey)

    if (cachedPath !== null) {
      await this.copyToTarget(cachedPath, targetDir)
      return targetDir
    }

    // Download using giget
    const tempDir = await this.createTempDir()

    try {
      await downloadTemplate(source.location, {
        dir: tempDir,
        offline: false,
        force: true,
      })
    } catch (error) {
      throw new Error(
        `Failed to fetch template from URL: ${source.location}. ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }

    // Cache the template
    await this.saveToCache(cacheKey, tempDir)

    // Copy to target
    await this.copyToTarget(tempDir, targetDir)

    return targetDir
  }

  /**
   * Fetch template from local directory.
   */
  private async fetchLocal(source: TemplateSource, targetDir: string): Promise<string> {
    if (!existsSync(source.location)) {
      throw new Error(`Local template directory does not exist: ${source.location}`)
    }

    const stats = statSync(source.location)
    if (!stats.isDirectory()) {
      throw new Error(`Local template path is not a directory: ${source.location}`)
    }

    // Use filtered copying for local templates to exclude unwanted files
    await this.copyFiltered(source.location, targetDir)
    return targetDir
  }

  /**
   * Fetch built-in template.
   */
  private async fetchBuiltin(source: TemplateSource, targetDir: string): Promise<string> {
    const builtinPath = templateResolver.getBuiltinTemplatePath(source.location)

    if (!existsSync(builtinPath)) {
      throw new Error(`Built-in template does not exist: ${source.location}`)
    }

    await this.copyToTarget(builtinPath, targetDir)
    return targetDir
  }

  /**
   * Load template metadata from template.json file.
   */
  private async loadMetadata(templatePath: string): Promise<TemplateMetadata> {
    const result = await templateMetadataManager.load(templatePath)

    if (result.success) {
      return result.data
    } else {
      // Return default metadata if loading fails
      consola.warn('Failed to load template metadata, using defaults:', result.error)
      return {
        name: 'Unknown',
        description: 'Template description not available',
        version: '1.0.0',
      }
    }
  }

  /**
   * Generate cache key for a template source.
   */
  private getCacheKey(type: string, source: TemplateSource): string {
    const parts = [type, source.location]
    if (source.ref !== undefined) parts.push(source.ref)
    if (source.subdir !== undefined) parts.push(source.subdir)

    return parts.join('-').replaceAll(/[^\w-]/g, '_')
  }

  /**
   * Get template from cache if available and not expired.
   */
  private async getFromCache(cacheKey: string): Promise<string | null> {
    if (!this.cacheConfig.enabled) {
      return null
    }

    const cachePath = path.join(this.cacheConfig.dir, cacheKey)
    const metaPath = path.join(cachePath, '.cache-meta.json')

    if (!existsSync(cachePath) || !existsSync(metaPath)) {
      return null
    }

    try {
      const metaContent = await readFile(metaPath, 'utf-8')
      const meta: {timestamp: number} = JSON.parse(metaContent) as {timestamp: number}
      const now = Date.now()

      if (now - meta.timestamp > this.cacheConfig.ttl * 1000) {
        // Cache expired
        return null
      }

      return cachePath
    } catch {
      // Invalid cache metadata
      return null
    }
  }

  /**
   * Save template to cache.
   */
  private async saveToCache(cacheKey: string, templatePath: string): Promise<void> {
    if (!this.cacheConfig.enabled) {
      return
    }

    try {
      const cachePath = path.join(this.cacheConfig.dir, cacheKey)
      await mkdir(this.cacheConfig.dir, {recursive: true})

      // Copy template to cache
      await cp(templatePath, cachePath, {recursive: true, force: true})

      // Save cache metadata
      const metaPath = path.join(cachePath, '.cache-meta.json')
      const meta = {
        timestamp: Date.now(),
        ttl: this.cacheConfig.ttl,
      }

      await import('node:fs/promises').then(async fs =>
        fs.writeFile(metaPath, JSON.stringify(meta, null, 2)),
      )
    } catch (error) {
      consola.warn('Failed to cache template:', error)
    }
  }

  /**
   * Copy template to target directory.
   */
  private async copyToTarget(sourcePath: string, targetPath: string): Promise<void> {
    await mkdir(path.dirname(targetPath), {recursive: true})
    await cp(sourcePath, targetPath, {recursive: true, force: true})
  }

  /**
   * Copy template files with filtering to exclude unwanted files and directories.
   */
  private async copyFiltered(sourcePath: string, targetPath: string): Promise<void> {
    const ignorePatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/lib/**',
      '**/build/**',
      '**/*.log',
      '**/template.json',
      '**/.cache-meta.json',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/.env',
      '**/.env.local',
    ]

    // Create target directory
    await mkdir(targetPath, {recursive: true})

    // Get all files in source directory
    const files = await glob(['**/*'], {
      cwd: sourcePath,
      dot: true,
      ignore: ignorePatterns,
    })

    // Copy each file
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file)
      const targetFile = path.join(targetPath, file)

      const stats = statSync(sourceFile)
      if (stats.isDirectory()) {
        await mkdir(targetFile, {recursive: true})
      } else if (stats.isFile()) {
        // Ensure parent directory exists
        await mkdir(path.dirname(targetFile), {recursive: true})
        // Copy file
        await cp(sourceFile, targetFile)
      }
    }
  }

  /**
   * Create temporary directory for template processing.
   */
  private async createTempDir(): Promise<string> {
    const {mkdtemp} = await import('node:fs/promises')
    const {tmpdir} = await import('node:os')

    return mkdtemp(path.join(tmpdir(), 'bfra-me-create-'))
  }

  /**
   * Validate URL format and supported types.
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url)
      const protocol = parsedUrl.protocol.toLowerCase()

      // Check supported protocols
      const supportedProtocols = ['https:', 'http:']
      if (!supportedProtocols.includes(protocol)) {
        throw new Error(
          `Unsupported protocol: ${protocol}. Supported protocols: ${supportedProtocols.join(', ')}`,
        )
      }

      // Check for common archive formats or direct download URLs
      const pathname = parsedUrl.pathname.toLowerCase()
      const supportedExtensions = ['.zip', '.tar.gz', '.tgz', '.tar']
      const isArchive = supportedExtensions.some(ext => pathname.endsWith(ext))
      const isGitHub =
        parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'raw.githubusercontent.com'
      const isGenericUrl = pathname === '/' || pathname.includes('/')

      if (!isArchive && !isGitHub && !isGenericUrl) {
        consola.warn(`URL does not appear to be a supported template source: ${url}`)
      }
    } catch {
      throw new Error(`Invalid URL format: ${url}`)
    }
  }
}

/**
 * Default template fetcher instance.
 */
export const templateFetcher = new TemplateFetcher()
