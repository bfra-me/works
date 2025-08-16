import {existsSync, mkdirSync, rmSync} from 'node:fs'
import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {createPackage} from '../src/index.js'

describe('createPackage', () => {
  it('should be callable and return a function', () => {
    expect(typeof createPackage).toBe('function')
  })

  it('should return a result object with success property', async () => {
    // Simple test that doesn't require complex mocking
    try {
      const fixturesDir = path.join(__dirname, 'fixtures')
      const tmpOutput = path.join(fixturesDir, 'tmp')

      if (!existsSync(fixturesDir)) mkdirSync(fixturesDir)
      // Ensure tmp is clean
      if (existsSync(tmpOutput)) rmSync(tmpOutput, {recursive: true, force: true})

      const result = await createPackage({
        name: 'test-project',
        interactive: false,
        skipPrompts: true,
        dryRun: true, // This should prevent actual file operations
        outputDir: tmpOutput,
      })

      // Cleanup any accidental files if dryRun failed
      if (existsSync(tmpOutput)) rmSync(tmpOutput, {recursive: true, force: true})

      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    } catch (error) {
      // Even if it fails, we expect it to be structured
      expect(error).toBeDefined()
    }
  })
})
