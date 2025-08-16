import type {Result, TemplateMetadata, TemplateSource} from '../types.js'
import {existsSync} from 'node:fs'
import {cp, mkdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {consola} from 'consola'
import {downloadTemplate} from 'giget'

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
    const cacheKey = this.getCacheKey('url', source)
    const cachedPath = await this.getFromCache(cacheKey)

    if (cachedPath !== null) {
      await this.copyToTarget(cachedPath, targetDir)
      return targetDir
    }

    // Download using giget
    const tempDir = await this.createTempDir()
    await downloadTemplate(source.location, {
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
   * Fetch template from local directory.
   */
  private async fetchLocal(source: TemplateSource, targetDir: string): Promise<string> {
    if (!existsSync(source.location)) {
      throw new Error(`Local template directory does not exist: ${source.location}`)
    }

    await this.copyToTarget(source.location, targetDir)
    return targetDir
  }

  /**
   * Fetch built-in template.
   */
  private async fetchBuiltin(source: TemplateSource, targetDir: string): Promise<string> {
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const builtinPath = path.join(currentDir, '..', 'templates', source.location)

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
    const metadataPath = path.join(templatePath, 'template.json')

    // Default metadata
    const defaultMetadata: TemplateMetadata = {
      name: 'Unknown',
      description: 'Template description not available',
      version: '1.0.0',
    }

    if (!existsSync(metadataPath)) {
      return defaultMetadata
    }

    try {
      const content = await readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(content) as TemplateMetadata

      // Validate required fields
      return {
        ...defaultMetadata,
        ...metadata,
        name: metadata.name || defaultMetadata.name,
        description: metadata.description || defaultMetadata.description,
        version: metadata.version || defaultMetadata.version,
      }
    } catch (error) {
      consola.warn('Failed to load template metadata, using defaults:', error)
      return defaultMetadata
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
   * Create temporary directory for template processing.
   */
  private async createTempDir(): Promise<string> {
    const {mkdtemp} = await import('node:fs/promises')
    const {tmpdir} = await import('node:os')

    return mkdtemp(path.join(tmpdir(), 'bfra-me-create-'))
  }
}

/**
 * Default template fetcher instance.
 */
export const templateFetcher = new TemplateFetcher()
