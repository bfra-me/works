import fs from 'node:fs/promises'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {loadConfig, loadConfigFile} from '../../src/config/loader'
import {
  cleanupTempWorkspace,
  createMonorepoStructure,
  createTempWorkspace,
} from '../utils/test-workspace'

describe('error-scenarios', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempWorkspace('error-scenarios-test-')
  })

  afterEach(async () => {
    await cleanupTempWorkspace(tempDir)
  })

  describe('configuration errors', () => {
    it('should handle malformed JavaScript in config file', async () => {
      await createMonorepoStructure(tempDir, [
        {name: '@test/pkg', files: {'index.ts': `export const x = 1`}},
      ])

      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(configPath, 'this is not { valid javascript')

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('IMPORT_ERROR')
    })

    it('should handle config file with invalid export', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `
        const config = { minSeverity: 'warning' }
        export default null
      `,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with invalid severity value', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          minSeverity: 'invalid-severity'
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with invalid category value', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          categories: ['invalid-category']
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle config file with wrong type for option', async () => {
      const configPath = path.join(tempDir, 'workspace-analyzer.config.mjs')
      await fs.writeFile(
        configPath,
        `export default {
          concurrency: 'not-a-number'
        }`,
      )

      const result = await loadConfigFile(configPath)

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error?.code).toBe('VALIDATION_ERROR')
    })

    it('should return undefined when no config file exists', async () => {
      const result = await loadConfig(tempDir)

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data).toBeUndefined()
    })
  })
})
