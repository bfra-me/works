import {describe, expect, it} from 'vitest'

import {noop, noopAsync} from '../../src/functional/noop'

describe('@bfra.me/es/functional - noop()', () => {
  describe('basic behavior', () => {
    it.concurrent('should return undefined', () => {
      const result = noop()

      expect(result).toBeUndefined()
    })

    it.concurrent('should be callable multiple times', () => {
      expect(() => {
        noop()
        noop()
        noop()
      }).not.toThrow()
    })

    it.concurrent('should not throw errors', () => {
      expect(() => noop()).not.toThrow()
    })
  })

  describe('use as callback', () => {
    it.concurrent('should work as an event handler', () => {
      const handlers = {
        onClick: noop,
        onHover: noop,
      }

      expect(handlers.onClick()).toBeUndefined()
      expect(handlers.onHover()).toBeUndefined()
    })

    it.concurrent('should work as a default callback', () => {
      const createComponent = (callback: () => void = noop) => {
        callback()
        return 'component created'
      }

      expect(createComponent()).toBe('component created')
      expect(createComponent(noop)).toBe('component created')
    })

    it.concurrent('should work with Array.forEach', () => {
      const results = [1, 2, 3].map(() => noop())

      results.forEach(result => {
        expect(result).toBeUndefined()
      })
    })
  })

  describe('type safety', () => {
    it.concurrent('should have void return type', () => {
      const result: void = noop()

      expect(result).toBeUndefined()
    })

    it.concurrent('should be assignable to () => void', () => {
      const fn: () => void = noop

      expect(fn()).toBeUndefined()
    })
  })
})

describe('@bfra.me/es/functional - noopAsync()', () => {
  describe('basic behavior', () => {
    it.concurrent('should return a Promise', () => {
      const result = noopAsync()

      expect(result).toBeInstanceOf(Promise)
    })

    it.concurrent('should resolve to undefined', async () => {
      const result = await noopAsync()

      expect(result).toBeUndefined()
    })

    it.concurrent('should be awaitable multiple times', async () => {
      const result1 = await noopAsync()
      const result2 = await noopAsync()
      const result3 = await noopAsync()

      expect(result1).toBeUndefined()
      expect(result2).toBeUndefined()
      expect(result3).toBeUndefined()
    })

    it.concurrent('should not reject', async () => {
      await expect(noopAsync()).resolves.toBeUndefined()
    })
  })

  describe('use as async callback', () => {
    it.concurrent('should work as an async event handler', async () => {
      const handlers = {
        onLoad: noopAsync,
        onSave: noopAsync,
      }

      await expect(handlers.onLoad()).resolves.toBeUndefined()
      await expect(handlers.onSave()).resolves.toBeUndefined()
    })

    it.concurrent('should work as a default async callback', async () => {
      const createAsyncComponent = async (callback: () => Promise<void> = noopAsync) => {
        await callback()
        return 'async component created'
      }

      await expect(createAsyncComponent()).resolves.toBe('async component created')
      await expect(createAsyncComponent(noopAsync)).resolves.toBe('async component created')
    })

    it.concurrent('should work with Promise.all', async () => {
      const results = await Promise.all([noopAsync(), noopAsync(), noopAsync()])

      expect(results).toEqual([undefined, undefined, undefined])
    })

    it.concurrent('should work with Promise.allSettled', async () => {
      const results = await Promise.allSettled([noopAsync(), noopAsync()])

      expect(results).toEqual([
        {status: 'fulfilled', value: undefined},
        {status: 'fulfilled', value: undefined},
      ])
    })
  })

  describe('type safety', () => {
    it.concurrent('should have Promise<void> return type', async () => {
      const result: Promise<void> = noopAsync()

      expect(await result).toBeUndefined()
    })

    it.concurrent('should be assignable to () => Promise<void>', async () => {
      const fn: () => Promise<void> = noopAsync

      expect(await fn()).toBeUndefined()
    })
  })

  describe('in async contexts', () => {
    it.concurrent('should work in async/await', async () => {
      const asyncFunction = async () => {
        await noopAsync()
        return 'completed'
      }

      expect(await asyncFunction()).toBe('completed')
    })

    it.concurrent('should work in Promise chains', async () => {
      const result = await noopAsync()
        .then(() => 'first')
        .then(val => `${val}-second`)

      expect(result).toBe('first-second')
    })

    it.concurrent('should work as a placeholder in conditional async logic', async () => {
      const shouldExecute = false
      const action = shouldExecute
        ? async () => 'executed'
        : async () => {
            await noopAsync()
            return 'skipped'
          }

      expect(await action()).toBe('skipped')
    })
  })
})

describe('noop and noopAsync comparison', () => {
  it.concurrent('noop should be synchronous', () => {
    const result = noop()

    expect(result).not.toBeInstanceOf(Promise)
    expect(result).toBeUndefined()
  })

  it.concurrent('noopAsync should be asynchronous', async () => {
    const result = noopAsync()

    expect(result).toBeInstanceOf(Promise)
    expect(await result).toBeUndefined()
  })

  it.concurrent('both should be usable as placeholders', async () => {
    const syncCallbacks = [noop, noop, noop]
    const asyncCallbacks = [noopAsync, noopAsync, noopAsync]

    const syncResults = syncCallbacks.map(cb => cb())
    const asyncResults = await Promise.all(asyncCallbacks.map(async cb => cb()))

    expect(syncResults).toEqual([undefined, undefined, undefined])
    expect(asyncResults).toEqual([undefined, undefined, undefined])
  })
})
