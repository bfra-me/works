import {describe, expect, it} from 'vitest'

import {pAll, pLimit} from '../../src/async'
import {isErr, isOk, unwrap} from '../../src/result'

describe('@bfra.me/es/async - pLimit()', () => {
  describe('basic functionality', () => {
    it.concurrent('should execute function and return result', async () => {
      const limit = pLimit(1)
      const result = await limit(async () => 'success')

      expect(result).toBe('success')
    })

    it.concurrent('should respect concurrency limit', async () => {
      const limit = pLimit(2)
      const running: number[] = []
      let maxConcurrent = 0

      const task = async (id: number): Promise<number> => {
        running.push(id)
        maxConcurrent = Math.max(maxConcurrent, running.length)
        await new Promise(resolve => setTimeout(resolve, 50))
        running.splice(running.indexOf(id), 1)
        return id
      }

      const tasks = [1, 2, 3, 4, 5].map(async id => limit(async () => task(id)))
      await Promise.all(tasks)

      expect(maxConcurrent).toBeLessThanOrEqual(2)
    })

    it.concurrent('should queue tasks beyond concurrency limit', async () => {
      const limit = pLimit(1)
      const order: number[] = []

      const task = async (id: number): Promise<void> => {
        order.push(id)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      await Promise.all([
        limit(async () => task(1)),
        limit(async () => task(2)),
        limit(async () => task(3)),
      ])

      expect(order).toEqual([1, 2, 3])
    })

    it.concurrent('should propagate errors from tasks', async () => {
      const limit = pLimit(1)

      await expect(
        limit(async () => {
          throw new Error('task failed')
        }),
      ).rejects.toThrow('task failed')
    })

    it.concurrent('should throw for invalid concurrency value', () => {
      expect(() => pLimit(0)).toThrow('Concurrency must be at least 1')
      expect(() => pLimit(-1)).toThrow('Concurrency must be at least 1')
    })
  })

  describe('concurrent execution', () => {
    it.concurrent('should run tasks in parallel up to limit', async () => {
      const limit = pLimit(3)
      const startTimes: number[] = []
      const start = Date.now()

      const task = async (): Promise<void> => {
        startTimes.push(Date.now() - start)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await Promise.all([1, 2, 3, 4, 5].map(async () => limit(task)))

      // First 3 should start near-simultaneously
      expect(startTimes.slice(0, 3).every(t => t < 20)).toBe(true)
      // 4th and 5th should start after first batch
      expect(startTimes[3]).toBeGreaterThan(30)
    })
  })
})

describe('@bfra.me/es/async - pAll()', () => {
  describe('successful operations', () => {
    it.concurrent('should resolve all tasks and return Ok result', async () => {
      const tasks = [async () => 1, async () => 2, async () => 3]

      const result = await pAll(tasks)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toEqual([1, 2, 3])
    })

    it.concurrent('should maintain order of results', async () => {
      const tasks = [
        async () => {
          await new Promise(resolve => setTimeout(resolve, 30))
          return 'slow'
        },
        async () => 'fast',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return 'medium'
        },
      ]

      const result = await pAll(tasks)

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toEqual(['slow', 'fast', 'medium'])
    })

    it.concurrent('should handle empty task array', async () => {
      const result = await pAll([])

      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toEqual([])
    })
  })

  describe('error handling', () => {
    it.concurrent('should return Err on first error', async () => {
      const tasks = [
        async () => 1,
        async () => Promise.reject(new Error('task 2 failed')),
        async () => 3,
      ]

      const result = await pAll(tasks)

      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(isErr(result) && result.error.message).toBe('task 2 failed')
    })

    it.concurrent('should convert non-Error rejections to Error', async () => {
      const tasks = [
        async () => 1,
        async () => {
          throw new Error('string error')
        },
      ]

      const result = await pAll(tasks)

      expect(isErr(result)).toBe(true)
      expect(result.success).toBe(false)
      expect(isErr(result) && result.error).toBeInstanceOf(Error)
      expect(isErr(result) && result.error.message).toBe('string error')
    })
  })

  describe('concurrency options', () => {
    it.concurrent('should run with unlimited concurrency by default', async () => {
      const startTimes: number[] = []
      const start = Date.now()

      const tasks = [1, 2, 3, 4, 5].map(() => async () => {
        startTimes.push(Date.now() - start)
        await new Promise(resolve => setTimeout(resolve, 30))
      })

      await pAll(tasks)

      // All tasks should start near-simultaneously
      expect(startTimes.every(t => t < 20)).toBe(true)
    })

    it.concurrent('should respect concurrency option', async () => {
      const running: number[] = []
      let maxConcurrent = 0

      const tasks = [1, 2, 3, 4, 5].map(id => async () => {
        running.push(id)
        maxConcurrent = Math.max(maxConcurrent, running.length)
        await new Promise(resolve => setTimeout(resolve, 30))
        running.splice(running.indexOf(id), 1)
        return id
      })

      const result = await pAll(tasks, {concurrency: 2})

      expect(isOk(result)).toBe(true)
      expect(maxConcurrent).toBeLessThanOrEqual(2)
    })
  })
})
