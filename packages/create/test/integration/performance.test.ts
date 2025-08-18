import type {CreateCommandOptions} from '../../src/types.js'
import {existsSync, rmSync} from 'node:fs'
import {readdir, stat} from 'node:fs/promises'
import path from 'node:path'
import {performance} from 'node:perf_hooks'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {createPackage} from '../../src/index.js'
import {testUtils} from '../test-utils.js'

interface PerformanceMetrics {
  duration: number
  memoryUsage: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  fileCount: number
  totalSize: number
}

async function measurePerformance<T>(
  operation: () => Promise<T>,
): Promise<{result: T; metrics: PerformanceMetrics}> {
  // Force garbage collection if available
  if (globalThis.gc) {
    globalThis.gc()
  }

  const startTime = performance.now()
  const startMemory = process.memoryUsage()

  const result = await operation()

  const endTime = performance.now()
  const endMemory = process.memoryUsage()

  return {
    result,
    metrics: {
      duration: endTime - startTime,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
      },
      fileCount: 0, // Will be filled by caller
      totalSize: 0, // Will be filled by caller
    },
  }
}

async function getDirectoryStats(dirPath: string): Promise<{fileCount: number; totalSize: number}> {
  if (!existsSync(dirPath)) {
    return {fileCount: 0, totalSize: 0}
  }

  let fileCount = 0
  let totalSize = 0

  async function processDirectory(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath)

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry)
      const stats = await stat(fullPath)

      if (stats.isDirectory()) {
        await processDirectory(fullPath)
      } else {
        fileCount++
        totalSize += stats.size
      }
    }
  }

  await processDirectory(dirPath)
  return {fileCount, totalSize}
}

describe('performance tests', () => {
  let tempOutputDir: string

  beforeEach(() => {
    testUtils.setup()
    tempOutputDir = testUtils.createTempDir(
      `performance-test-${Math.random().toString(36).slice(2)}`,
    )
  })

  afterEach(() => {
    if (existsSync(tempOutputDir)) {
      rmSync(tempOutputDir, {recursive: true, force: true})
    }
  })

  describe('template processing performance', () => {
    it('processes small templates efficiently', async () => {
      const projectName = 'small-test-project'
      const projectPath = path.join(tempOutputDir, projectName)

      const options: CreateCommandOptions = {
        name: projectName,
        template: 'default',
        outputDir: projectPath,
        skipPrompts: true,
        verbose: false,
      }

      const {result, metrics} = await measurePerformance(async () => {
        return createPackage(options)
      })

      // Update metrics with file stats
      const stats = await getDirectoryStats(projectPath)
      metrics.fileCount = stats.fileCount
      metrics.totalSize = stats.totalSize

      // Verify the operation succeeded
      expect(result.success).toBe(true)
      if (result.success) {
        expect(existsSync(result.data.projectPath)).toBe(true)
      }

      // Performance assertions for small templates
      expect(metrics.duration).toBeLessThan(5000) // Less than 5 seconds
      expect(metrics.fileCount).toBeGreaterThan(0) // Should create some files
      expect(metrics.totalSize).toBeGreaterThan(0) // Should have content
    })

    it('processes TypeScript library templates efficiently', async () => {
      const projectName = 'library-test-project'
      const projectPath = path.join(tempOutputDir, projectName)

      const options: CreateCommandOptions = {
        name: projectName,
        template: 'library',
        outputDir: projectPath,
        skipPrompts: true,
        verbose: false,
      }

      const {result, metrics} = await measurePerformance(async () => {
        return createPackage(options)
      })

      // Update metrics with file stats
      const stats = await getDirectoryStats(projectPath)
      metrics.fileCount = stats.fileCount
      metrics.totalSize = stats.totalSize

      // Verify the operation succeeded
      expect(result.success).toBe(true)
      if (result.success) {
        expect(existsSync(result.data.projectPath)).toBe(true)
      }

      // Performance assertions for library templates
      expect(metrics.duration).toBeLessThan(10000) // Less than 10 seconds
      expect(metrics.fileCount).toBeGreaterThan(5) // Should create multiple files
      expect(metrics.totalSize).toBeGreaterThan(1000) // Should have substantial content

      console.log(`Library template performance:`, {
        duration: `${Math.round(metrics.duration)}ms`,
        files: metrics.fileCount,
        size: `${Math.round(metrics.totalSize / 1024)}KB`,
        memory: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      })
    })

    it('handles template processing with many variables efficiently', async () => {
      const projectName = 'variable-heavy-project'
      const projectPath = path.join(tempOutputDir, projectName)

      // Create options with many template variables
      const options: CreateCommandOptions = {
        name: projectName,
        template: 'library',
        outputDir: projectPath,
        skipPrompts: true,
        verbose: false,
        author: 'Test Author',
        description: 'A test project with many variables',
        version: '1.0.0',
      }

      const {result, metrics} = await measurePerformance(async () => {
        return createPackage(options)
      })

      // Update metrics with file stats
      const stats = await getDirectoryStats(projectPath)
      metrics.fileCount = stats.fileCount
      metrics.totalSize = stats.totalSize

      // Verify the operation succeeded
      expect(result.success).toBe(true)

      // Performance assertions for variable-heavy processing
      expect(metrics.duration).toBeLessThan(15000) // Less than 15 seconds
      expect(metrics.fileCount).toBeGreaterThan(0)

      console.log(`Variable-heavy template performance:`, {
        duration: `${Math.round(metrics.duration)}ms`,
        files: metrics.fileCount,
        size: `${Math.round(metrics.totalSize / 1024)}KB`,
        memory: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      })
    })
  })

  describe('memory usage', () => {
    it('maintains reasonable memory usage during template processing', async () => {
      const projectName = 'memory-test-project'
      const projectPath = path.join(tempOutputDir, projectName)

      const options: CreateCommandOptions = {
        name: projectName,
        template: 'default',
        outputDir: projectPath,
        skipPrompts: true,
        verbose: false,
      }

      const {result, metrics} = await measurePerformance(async () => {
        return createPackage(options)
      })

      // Verify the operation succeeded
      expect(result.success).toBe(true)

      // Memory usage assertions (reasonable limits for template processing)
      const heapUsedMB = metrics.memoryUsage.heapUsed / 1024 / 1024
      expect(heapUsedMB).toBeLessThan(100) // Less than 100MB heap growth

      console.log(`Memory usage:`, {
        heapUsed: `${Math.round(heapUsedMB)}MB`,
        rss: `${Math.round(metrics.memoryUsage.rss / 1024 / 1024)}MB`,
      })
    })

    it('handles multiple sequential template operations without memory leaks', async () => {
      const baselineMemory = process.memoryUsage()

      // Perform multiple template operations
      for (let i = 0; i < 3; i++) {
        const projectName = `sequential-project-${i}`
        const projectPath = path.join(tempOutputDir, projectName)

        const options: CreateCommandOptions = {
          name: projectName,
          template: 'default',
          outputDir: projectPath,
          skipPrompts: true,
          verbose: false,
        }

        const result = await createPackage(options)
        expect(result.success).toBe(true)

        // Force garbage collection if available
        if (globalThis.gc) {
          globalThis.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryGrowth = finalMemory.heapUsed - baselineMemory.heapUsed
      const memoryGrowthMB = memoryGrowth / 1024 / 1024

      // Memory growth should be reasonable for multiple operations
      expect(memoryGrowthMB).toBeLessThan(50) // Less than 50MB total growth

      console.log(`Sequential operations memory growth: ${Math.round(memoryGrowthMB)}MB`)
    })
  })

  describe('concurrent operations', () => {
    it('handles concurrent template processing efficiently', async () => {
      const concurrentOps = 3
      const operations = []

      for (let i = 0; i < concurrentOps; i++) {
        const projectName = `concurrent-project-${i}`
        const projectPath = path.join(tempOutputDir, projectName)

        const options: CreateCommandOptions = {
          name: projectName,
          template: 'default',
          outputDir: projectPath,
          skipPrompts: true,
          verbose: false,
        }

        operations.push(createPackage(options))
      }

      const startTime = performance.now()
      const results = await Promise.all(operations)
      const endTime = performance.now()

      const totalDuration = endTime - startTime

      // Verify all operations succeeded
      for (const result of results) {
        expect(result.success).toBe(true)
      }

      // Concurrent operations should complete reasonably quickly
      expect(totalDuration).toBeLessThan(20000) // Less than 20 seconds for 3 concurrent ops

      console.log(`Concurrent operations (${concurrentOps}): ${Math.round(totalDuration)}ms`)
    })
  })

  describe('large repository handling', () => {
    it('processes built-in templates efficiently regardless of size', async () => {
      const templates = ['default', 'library', 'node', 'react', 'cli']
      const results = []

      for (const template of templates) {
        const projectName = `${template}-size-test`
        const projectPath = path.join(tempOutputDir, projectName)

        const options: CreateCommandOptions = {
          name: projectName,
          template,
          outputDir: projectPath,
          skipPrompts: true,
          verbose: false,
        }

        const {result, metrics} = await measurePerformance(async () => {
          return createPackage(options)
        })

        // Update metrics with file stats
        const stats = await getDirectoryStats(projectPath)
        metrics.fileCount = stats.fileCount
        metrics.totalSize = stats.totalSize

        results.push({
          template,
          success: result.success,
          duration: metrics.duration,
          fileCount: metrics.fileCount,
          sizeKB: Math.round(metrics.totalSize / 1024),
        })

        // Verify the operation succeeded
        expect(result.success).toBe(true)

        // Each template should process in reasonable time
        expect(metrics.duration).toBeLessThan(15000) // Less than 15 seconds per template
      }

      // Verify we tested all templates
      expect(results).toHaveLength(templates.length)
      expect(results.every(r => r.success)).toBe(true)
    })
  })
})
