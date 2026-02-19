import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {
  CONFIG_FILE_NAMES,
  defineConfig,
  findConfigFile,
  loadConfig,
  loadConfigFile,
} from '../../src/config/loader'
import {getDefaultMergedConfig, mergeConfig} from '../../src/config/merger'
import {cleanupTempWorkspace, createTempWorkspace} from '../utils/test-workspace'

describe('configuration-validation', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('config-validation-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('defineConfig', () => {
    it('should pass through configuration object unchanged', () => {
      const config = defineConfig({
        minSeverity: 'warning',
        categories: ['dependency', 'architecture'],
      })

      expect(config.minSeverity).toBe('warning')
      expect(config.categories).toEqual(['dependency', 'architecture'])
    })

    it('should accept partial configuration', () => {
      const config = defineConfig({
        cache: true,
      })

      expect(config.cache).toBe(true)
      expect(config.minSeverity).toBeUndefined()
    })

    it('should accept analyzer-specific options', () => {
      const config = defineConfig({
        analyzers: {
          'circular-import': {enabled: true},
          'unused-dependency': {enabled: false},
        },
      })

      expect(config.analyzers?.['circular-import']?.enabled).toBe(true)
      expect(config.analyzers?.['unused-dependency']?.enabled).toBe(false)
    })

    it('should accept architectural rules', () => {
      const config = defineConfig({
        architecture: {
          layers: [
            {name: 'domain', patterns: ['**/domain/**'], allowedImports: []},
            {name: 'app', patterns: ['**/app/**'], allowedImports: ['domain']},
          ],
          allowBarrelExports: false,
          enforcePublicApi: true,
        },
      })

      expect(config.architecture?.layers).toHaveLength(2)
      expect(config.architecture?.allowBarrelExports).toBe(false)
      expect(config.architecture?.enforcePublicApi).toBe(true)
    })
  })

  describe('findConfigFile', () => {
    it('should find workspace-analyzer.config.ts in root directory', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.ts')
      await fs.writeFile(configPath, 'export default {}')

      const foundPath = await findConfigFile(tempDir)

      expect(foundPath).toBe(configPath)
    })

    it('should find config file with alternative extensions', async () => {
      for (const fileName of CONFIG_FILE_NAMES) {
        const testDir = await createTempWorkspace()
        try {
          const configPath = path.join(testDir, fileName)
          await fs.writeFile(configPath, 'export default {}')

          const foundPath = await findConfigFile(testDir)

          expect(foundPath).toBe(configPath)
        } finally {
          await cleanupTempWorkspace(testDir)
        }
      }
    })

    it('should return undefined when no config file exists', async () => {
      const foundPath = await findConfigFile(tempDir)

      expect(foundPath).toBeUndefined()
    })

    it('should find config file in parent directories', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.ts')
      await fs.writeFile(configPath, 'export default {}')

      const nestedDir = path.join(tempDir, 'deeply', 'nested', 'directory')
      await fs.mkdir(nestedDir, {recursive: true})

      const foundPath = await findConfigFile(nestedDir, tempDir)

      expect(foundPath).toBe(configPath)
    })

    it('should respect stopAt boundary', async () => {
      const parentConfig = path.join(tempDir, 'workspace-analyzer.config.ts')
      await fs.writeFile(parentConfig, 'export default {}')

      const stopDir = path.join(tempDir, 'stop-here')
      const searchDir = path.join(stopDir, 'search-from')
      await fs.mkdir(searchDir, {recursive: true})

      const foundPath = await findConfigFile(searchDir, stopDir)

      expect(foundPath).toBeUndefined()
    })
  })

  describe('loadConfigFile', () => {
    it('should load valid JavaScript config file', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'warning',
          cache: true,
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.config.minSeverity).toBe('warning')
      expect(data?.config.cache).toBe(true)
      expect(data?.filePath).toBe(configPath)
    })

    it('should return error for non-existent file', async () => {
      const configPath = path.join(tempDir, 'non-existent.config.ts')

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('FILE_NOT_FOUND')
    })

    it('should return error for invalid JavaScript', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(configPath, 'this is not valid javascript {{{')

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('IMPORT_ERROR')
    })

    it('should return error for invalid configuration shape', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'invalid-severity-level',
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('loadConfig', () => {
    it('should use explicit config path when provided', async () => {
      const explicitPath = path.join(tempDir, 'custom-config.mjs')
      await fs.writeFile(
        explicitPath,
        `export default {
          cache: false,
        }`,
      )

      const result = await loadConfig(tempDir, explicitPath)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.filePath).toBe(explicitPath)
    })

    it('should auto-discover config when no explicit path provided', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(configPath, 'export default { cache: true }')

      const result = await loadConfig(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.filePath).toBe(configPath)
    })

    it('should return undefined when no config file found', async () => {
      const result = await loadConfig(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : undefined
      expect(data).toBeUndefined()
    })
  })

  describe('mergeConfig', () => {
    it('should merge programmatic options with defaults when no file config', () => {
      const programmaticOptions = {
        minSeverity: 'error' as const,
        categories: ['dependency' as const],
      }

      const merged = mergeConfig(undefined, programmaticOptions)

      expect(merged.minSeverity).toBe('error')
      expect(merged.categories).toContain('dependency')
      expect(merged.cache).toBe(true)
    })

    it('should apply defaults when no config provided', () => {
      const defaults = getDefaultMergedConfig()
      const merged = mergeConfig(undefined, undefined)

      expect(merged.concurrency).toBe(defaults.concurrency)
      expect(merged.cacheDir).toBe(defaults.cacheDir)
    })

    it('should merge analyzer configurations from programmatic options', () => {
      const programmaticOptions = {
        analyzers: {
          'circular-import': {enabled: true, options: {maxCycleLength: 5}},
          'unused-dependency': {enabled: true},
        },
      }

      const merged = mergeConfig(undefined, programmaticOptions)

      expect(merged.analyzers['circular-import']?.enabled).toBe(true)
      expect(merged.analyzers['circular-import']?.options?.maxCycleLength).toBe(5)
      expect(merged.analyzers['unused-dependency']?.enabled).toBe(true)
    })
  })

  describe('configuration validation', () => {
    it('should validate severity levels', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'invalid-level',
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should validate category names', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          categories: ['invalid-category'],
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should accept valid categories', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          categories: ['configuration', 'dependency', 'architecture', 'performance', 'circular-import'],
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.config.categories).toHaveLength(5)
    })

    it('should validate hash algorithm values', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          hashAlgorithm: 'sha512',
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
    })

    it('should accept valid hash algorithms', async () => {
      for (const algo of ['sha256', 'md5']) {
        const configPath = path.join(tempDir, `workspace-analyzer-${algo}.config.mjs`)
        await fs.writeFile(
          configPath,
          `export default {
            hashAlgorithm: '${algo}',
          }`,
        )

        const result = await loadConfigFile(configPath)

        expect(result.success).toBe(true)
      }
    })
  })
})
